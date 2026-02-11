import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { batchLookupFips } from '@/lib/geo/fips-lookup'
import { scoreSite, buildSiteBreakdown } from '@/lib/scoring/site-scorer'
import type { SiteScoreBreakdown } from '@/types/screening'
import type { Json } from '@/types/database'

type CountyScoreRow = {
  fips_code: string
  county_name: string
  state_abbr: string
  coop_density_score: number
  grid_reliability_score: number
  clipped_curtailed_score: number
  permitting_score: number
  labor_score: number
  fiber_score: number
}

/** Detect utility type from raw_data and return a classification. */
function classifyUtilityType(rawData: Record<string, unknown>): {
  utilityType: string | null
  coopOverride: number | null
} {
  // Try common CSV column names
  const keys = [
    'Electric Infrastructure Owner & Operator',
    'electric infrastructure owner & operator',
    'utility type',
    'Utility Type',
    'utility_type',
  ]

  let value: string | null = null
  for (const key of keys) {
    if (rawData[key] && typeof rawData[key] === 'string') {
      value = (rawData[key] as string).trim()
      break
    }
  }

  if (!value) return { utilityType: null, coopOverride: null }

  const lower = value.toLowerCase()

  // Co-op detection
  if (
    lower.includes('coop') ||
    lower.includes('cooperative') ||
    lower.includes('co-op') ||
    lower.includes('electric cooperative')
  ) {
    return { utilityType: 'Co-op', coopOverride: 1.0 }
  }

  // IOU detection
  if (
    lower.includes('investor') ||
    lower === 'iou' ||
    lower.includes('investor-owned')
  ) {
    return { utilityType: 'IOU', coopOverride: 0.2 }
  }

  // Municipal detection
  if (
    lower.includes('municipal') ||
    lower.includes('muni') ||
    lower.includes('city of') ||
    lower.includes('public power')
  ) {
    return { utilityType: 'Municipal', coopOverride: 0.6 }
  }

  return { utilityType: value, coopOverride: null }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch sites for this upload
  const { data: sites, error: sitesError } = await supabase
    .from('portfolio_sites')
    .select('*')
    .eq('upload_id', id)

  if (sitesError || !sites) {
    return NextResponse.json({ error: 'Failed to load sites' }, { status: 500 })
  }

  // Step 1: Fetch ALL county_scores in a single query (~3,200 rows)
  const { data: allCountyScores } = await supabase
    .from('county_scores')
    .select('fips_code, county_name, state_abbr, coop_density_score, grid_reliability_score, clipped_curtailed_score, permitting_score, labor_score, fiber_score')

  // Build lookup maps
  const scoresByFips = new Map<string, CountyScoreRow>()
  const fipsByCountyState = new Map<string, string>()

  if (allCountyScores) {
    for (const row of allCountyScores as CountyScoreRow[]) {
      scoresByFips.set(row.fips_code, row)
      // Normalize: lowercase county + "|" + lowercase state abbreviation
      const key = `${row.county_name.toLowerCase()}|${row.state_abbr.toLowerCase()}`
      fipsByCountyState.set(key, row.fips_code)
    }
  }

  // Step 2: Resolve FIPS for each site — try county/state match first, then batch FCC API
  type SiteResolution = {
    site: typeof sites[number]
    fips_code: string | null
    county: string | null
    state: string | null
  }

  const resolved: SiteResolution[] = []
  const needsFccLookup: Array<{ lat: number; lon: number; index: number }> = []

  for (let i = 0; i < sites.length; i++) {
    const site = sites[i]
    let fips_code = site.fips_code
    let county = site.county
    let state = site.state

    // Try county+state name matching from the data we already have
    if (!fips_code && county && state) {
      const key = `${county.toLowerCase()}|${state.toLowerCase()}`
      const matched = fipsByCountyState.get(key)
      if (matched) {
        fips_code = matched
      }
    }

    // If still no FIPS, queue for FCC API batch lookup
    if (!fips_code && site.latitude && site.longitude) {
      needsFccLookup.push({
        lat: Number(site.latitude),
        lon: Number(site.longitude),
        index: i,
      })
    }

    resolved.push({ site, fips_code, county, state })
  }

  // Step 3: Batch FCC API lookup for unmatched sites
  if (needsFccLookup.length > 0) {
    const fccResults = await batchLookupFips(needsFccLookup, 5)

    for (const [idx, result] of fccResults) {
      const r = resolved[idx]
      r.fips_code = result.fips
      if (!r.county) r.county = result.county_name
      if (!r.state) r.state = result.state_name
    }
  }

  // Step 4: Score each site with utility type blending
  const updates: Array<{
    id: string
    upload_id: string
    site_name: string
    fips_code: string | null
    county: string | null
    state: string | null
    site_score: number | null
    tier: string | null
    score_breakdown: Json
    utility_type: string | null
  }> = []

  const results: Array<{
    id: string
    site_name: string
    fips_code: string | null
    county: string | null
    state: string | null
    site_score: number | null
    tier: string | null
    score_breakdown: SiteScoreBreakdown
    utility_type: string | null
  }> = []

  for (const { site, fips_code, county, state } of resolved) {
    const countyScores = fips_code ? scoresByFips.get(fips_code) ?? null : null
    const breakdown = buildSiteBreakdown(countyScores)

    // Utility type blending: override coop_density with site-level knowledge
    const rawData = (site.raw_data ?? {}) as Record<string, unknown>
    const { utilityType, coopOverride } = classifyUtilityType(rawData)
    if (coopOverride !== null) {
      breakdown.coop_density = coopOverride
    }

    const { score, tier } = scoreSite(breakdown)

    updates.push({
      id: site.id,
      upload_id: site.upload_id,
      site_name: site.site_name,
      fips_code,
      county,
      state,
      site_score: score,
      tier,
      score_breakdown: breakdown as unknown as Json,
      utility_type: utilityType,
    })

    results.push({
      id: site.id,
      site_name: site.site_name,
      fips_code,
      county,
      state,
      site_score: score,
      tier,
      score_breakdown: breakdown,
      utility_type: utilityType,
    })
  }

  // Step 5: Batch update all sites in one call
  if (updates.length > 0) {
    const { error: updateError } = await supabase
      .from('portfolio_sites')
      .upsert(updates, { onConflict: 'id' })

    if (updateError) {
      console.error('Batch update error:', updateError)
      return NextResponse.json({ error: 'Failed to update site scores' }, { status: 500 })
    }
  }

  return NextResponse.json({ scored: results.length, results })
}
