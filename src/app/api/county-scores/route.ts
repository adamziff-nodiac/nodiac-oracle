import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('county_scores')
    .select('fips_code, state_fips, county_name, state_abbr, coop_density_score, grid_reliability_score, clipped_curtailed_score, permitting_score, labor_score, fiber_score, data_sources, last_permitting_update')
    .order('state_abbr')
    .order('county_name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
