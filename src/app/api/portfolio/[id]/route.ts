import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Query tracker_sites filtered by partner (id is a partner UUID)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Try to interpret `id` as a partner UUID
  const { data: sites, error: sitesError } = await sb
    .from('tracker_sites')
    .select('*')
    .or(`ipp_id.eq.${id},utility_id.eq.${id},asset_owner_id.eq.${id}`)
    .not('screening_score', 'is', null)
    .order('name')

  if (sitesError) {
    return NextResponse.json({ error: sitesError.message }, { status: 500 })
  }

  // Map tracker_sites rows to PortfolioSite-compatible shape for the client
  const mappedSites = ((sites ?? []) as Array<Record<string, unknown>>).map(s => ({
    id: s.id,
    upload_id: id,
    site_name: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
    county: null,
    state: null,
    fips_code: s.fips_code,
    raw_data: {},
    site_score: s.screening_score,
    tier: s.screening_tier,
    score_breakdown: s.score_breakdown,
    utility_type: null,
  }))

  // Build a virtual upload record
  const upload = {
    id,
    user_id: user.id,
    name: `Partner Portfolio`,
    site_count: mappedSites.length,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return NextResponse.json({ upload, sites: mappedSites })
}
