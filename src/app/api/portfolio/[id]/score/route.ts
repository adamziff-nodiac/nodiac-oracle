import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { lookupFips } from '@/lib/geo/fips-lookup'
import { scoreSite, buildSiteBreakdown } from '@/lib/scoring/site-scorer'
import type { SiteScoreBreakdown } from '@/types/screening'
import type { Json } from '@/types/database'

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

  const results: Array<{
    id: string
    site_name: string
    fips_code: string | null
    county: string | null
    state: string | null
    site_score: number | null
    tier: string | null
    score_breakdown: SiteScoreBreakdown
  }> = []

  for (const site of sites) {
    let fips_code = site.fips_code
    let county = site.county
    let state = site.state

    // FIPS lookup if we have coordinates but no FIPS
    if (!fips_code && site.latitude && site.longitude) {
      const fipsResult = await lookupFips(
        Number(site.latitude),
        Number(site.longitude)
      )
      if (fipsResult) {
        fips_code = fipsResult.fips
        county = fipsResult.county_name
        state = fipsResult.state_name
      }
    }

    // Look up county scores
    let countyScores = null
    if (fips_code) {
      const { data } = await supabase
        .from('county_scores')
        .select('coop_density_score, grid_reliability_score, clipped_curtailed_score, permitting_score, labor_score, fiber_score')
        .eq('fips_code', fips_code)
        .single()

      countyScores = data
    }

    const breakdown = buildSiteBreakdown(countyScores)
    const { score, tier } = scoreSite(breakdown)

    // Update the site in the database
    await supabase
      .from('portfolio_sites')
      .update({
        fips_code,
        county,
        state,
        site_score: score,
        tier,
        score_breakdown: breakdown as unknown as Json,
      })
      .eq('id', site.id)

    results.push({
      id: site.id,
      site_name: site.site_name,
      fips_code,
      county,
      state,
      site_score: score,
      tier,
      score_breakdown: breakdown,
    })
  }

  return NextResponse.json({ scored: results.length, results })
}
