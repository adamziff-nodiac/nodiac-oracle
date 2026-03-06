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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse site names from the request body, or score by partner
  let siteNames: string[] | null = null
  try {
    const body = await request.json()
    siteNames = body.site_names ?? null
  } catch {
    // No body — fall back to scoring by partner/upload context
  }

  // Fetch sites from tracker_sites
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  let query = sb.from('tracker_sites').select('*')

  if (siteNames && siteNames.length > 0) {
    query = query.in('name', siteNames)
  } else {
    // If no site_names, try to find by ipp_id from the id param (if it's a UUID)
    query = query.eq('ipp_id', id)
  }

  const { data: sites, error: sitesError } = await query
  if (sitesError || !sites || sites.length === 0) {
    // Fallback: score all unscored sites
    const { data: unscoredSites, error: unscoredError } = await sb
      .from('tracker_sites')
      .select('*')
      .is('screening_score', null)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (unscoredError || !unscoredSites || unscoredSites.length === 0) {
      return NextResponse.json({ scored: 0, results: [] })
    }

    return await scoreSites(supabase, unscoredSites)
  }

  return await scoreSites(supabase, sites)
}

async function scoreSites(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, sites: Array<Record<string, unknown>>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Step 1: Fetch ALL county_scores in a single query
  const { data: allCountyScores } = await sb
    .from('county_scores')
    .select('fips_code, county_name, state_abbr, coop_density_score, grid_reliability_score, clipped_curtailed_score, permitting_score, labor_score, fiber_score')

  const scoresByFips = new Map<string, CountyScoreRow>()
  const fipsByCountyState = new Map<string, string>()

  if (allCountyScores) {
    for (const row of allCountyScores as CountyScoreRow[]) {
      scoresByFips.set(row.fips_code, row)
      const key = `${row.county_name.toLowerCase()}|${row.state_abbr.toLowerCase()}`
      fipsByCountyState.set(key, row.fips_code)
    }
  }

  // Step 2: Resolve FIPS for each site
  type SiteResolution = {
    site: Record<string, unknown>
    fips_code: string | null
  }

  const resolved: SiteResolution[] = []
  const needsFccLookup: Array<{ lat: number; lon: number; index: number }> = []

  for (let i = 0; i < sites.length; i++) {
    const site = sites[i]
    let fips_code = site.fips_code as string | null

    if (!fips_code && site.latitude && site.longitude) {
      needsFccLookup.push({
        lat: Number(site.latitude),
        lon: Number(site.longitude),
        index: i,
      })
    }

    resolved.push({ site, fips_code })
  }

  // Step 3: Batch FCC API lookup for unmatched sites
  if (needsFccLookup.length > 0) {
    const fccResults = await batchLookupFips(needsFccLookup, 5)
    for (const [idx, result] of fccResults) {
      resolved[idx].fips_code = result.fips
    }
  }

  // Step 4: Batch check co-op territory
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

  // Step 5: Score each site
  const updates: Array<{
    id: string
    fips_code: string | null
    screening_score: number | null
    screening_tier: string | null
    score_breakdown: Json
  }> = []

  const results: Array<{
    id: string
    site_name: string
    fips_code: string | null
    site_score: number | null
    tier: string | null
    score_breakdown: SiteScoreBreakdown
  }> = []

  for (let i = 0; i < resolved.length; i++) {
    const { site, fips_code } = resolved[i]
    const countyScores = fips_code ? scoresByFips.get(fips_code) ?? null : null
    const breakdown = buildSiteBreakdown(countyScores)

    // Co-op territory check
    const coopCheck = coopResults.get(i)
    if (coopCheck) {
      breakdown.coop_density = coopCheck.inCoopTerritory ? 1.0 : 0.0
    } else {
      const classified = classifyUtilityType({})
      if (classified.coopOverride !== null) {
        breakdown.coop_density = classified.coopOverride
      }
    }

    const { score, tier } = scoreSite(breakdown)

    updates.push({
      id: site.id as string,
      fips_code,
      screening_score: score,
      screening_tier: tier,
      score_breakdown: breakdown as unknown as Json,
    })

    results.push({
      id: site.id as string,
      site_name: site.name as string,
      fips_code,
      site_score: score,
      tier,
      score_breakdown: breakdown,
    })
  }

  // Step 6: Assign percentile-based tiers
  const tieredUpdates = assignPercentileTiers(updates.map((u, i) => ({ ...u, site_score: u.screening_score, tier: u.screening_tier, site_name: results[i].site_name })))
  const tieredResults = assignPercentileTiers(results)

  for (let i = 0; i < updates.length; i++) {
    updates[i].screening_tier = tieredUpdates[i].tier
    results[i].tier = tieredResults[i].tier
  }

  // Step 7: Batch update tracker_sites
  if (updates.length > 0) {
    for (const update of updates) {
      const { error: updateError } = await sb
        .from('tracker_sites')
        .update({
          fips_code: update.fips_code,
          screening_score: update.screening_score,
          screening_tier: update.screening_tier,
          score_breakdown: update.score_breakdown,
        })
        .eq('id', update.id)

      if (updateError) {
        console.error('Update error for site:', update.id, updateError)
      }
    }
  }

  return NextResponse.json({ scored: results.length, results })
}
