import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { batchLookupFips } from '@/lib/geo/fips-lookup'
import { batchCheckCoopTerritory } from '@/lib/geo/coop-territory-lookup'
import { scoreSite, buildSiteBreakdown, assignPercentileTiers } from '@/lib/scoring/site-scorer'
import { classifyUtilityType } from '@/lib/scoring/utility-classifier'
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
  queue_pressure_score: number
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

  // Step 4: Batch check co-op territory for all sites with coordinates
  const coordsForCoopCheck: Array<{ lat: number; lon: number; index: number }> = []
  for (let i = 0; i < resolved.length; i++) {
    const site = resolved[i].site
    if (site.latitude && site.longitude) {
      coordsForCoopCheck.push({
        lat: Number(site.latitude),
        lon: Number(site.longitude),
        index: i,
      })
    }
  }

  const coopResults = coordsForCoopCheck.length > 0
    ? await batchCheckCoopTerritory(coordsForCoopCheck, 5)
    : new Map()

  // Step 5: Score each site — binary co-op territory check replaces keyword matching
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

  for (let i = 0; i < resolved.length; i++) {
    const { site, fips_code, county, state } = resolved[i]
    const countyScores = fips_code ? scoresByFips.get(fips_code) ?? null : null
    const breakdown = buildSiteBreakdown(countyScores)

    // Co-op territory: binary spatial check (1.0 if inside co-op/public power territory, 0.0 if not)
    const coopCheck = coopResults.get(i)
    let utilityType: string | null = null

    if (coopCheck) {
      breakdown.coop_density = coopCheck.inCoopTerritory ? 1.0 : 0.0
      if (coopCheck.inCoopTerritory) {
        utilityType = coopCheck.utilityName ? `Co-op: ${coopCheck.utilityName}` : 'Co-op'
      }
    } else {
      // No coordinates — fall back to CSV keyword classification
      const rawData = (site.raw_data ?? {}) as Record<string, unknown>
      const classified = classifyUtilityType(rawData)
      utilityType = classified.utilityType
      if (classified.coopOverride !== null) {
        breakdown.coop_density = classified.coopOverride
      }
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

  // Step 6: Assign percentile-based tiers across the portfolio
  // (scoreSite only assigns placeholder tiers — real tiers are relative to the portfolio)
  const tieredUpdates = assignPercentileTiers(updates)
  const tieredResults = assignPercentileTiers(results)

  // Copy tiers back so DB gets the real tier values
  for (let i = 0; i < tieredUpdates.length; i++) {
    updates[i].tier = tieredUpdates[i].tier
    results[i].tier = tieredResults[i].tier
  }

  // Step 7: Batch update all sites in one call
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
