import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { portfolio_site_ids, ipp_id, hub_id, priority } = body as {
      portfolio_site_ids: string[]
      ipp_id?: string
      hub_id?: string
      priority?: string
    }

    if (!portfolio_site_ids?.length) {
      return NextResponse.json({ error: 'No sites selected' }, { status: 400 })
    }

    // Fetch portfolio sites
    const { data: portfolioSites, error: fetchError } = await supabase
      .from('portfolio_sites')
      .select('id, site_name, latitude, longitude, fips_code, site_score, tier')
      .in('id', portfolio_site_ids)

    if (fetchError) throw fetchError
    if (!portfolioSites?.length) {
      return NextResponse.json({ error: 'No matching portfolio sites found' }, { status: 404 })
    }

    // Check for already-promoted sites
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('tracker_sites')
      .select('portfolio_site_id')
      .in('portfolio_site_id', portfolio_site_ids)

    const alreadyPromoted = new Set(
      ((existing ?? []) as Array<{ portfolio_site_id: string }>).map(e => e.portfolio_site_id)
    )

    const toPromote = portfolioSites.filter(s => !alreadyPromoted.has(s.id))
    if (toPromote.length === 0) {
      return NextResponse.json({ error: 'All selected sites are already in the pipeline' }, { status: 409 })
    }

    // Create tracker_sites rows
    const trackerRows = toPromote.map(site => ({
      name: site.site_name,
      portfolio_site_id: site.id,
      latitude: site.latitude,
      longitude: site.longitude,
      fips_code: site.fips_code,
      screening_score: site.site_score,
      screening_tier: site.tier,
      ipp_id: ipp_id || null,
      regional_hub_id: hub_id || null,
      priority: priority || 'Pipeline',
      site_identified_status: 'Complete',
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created, error: insertError } = await (supabase as any)
      .from('tracker_sites')
      .insert(trackerRows)
      .select('id, portfolio_site_id')

    if (insertError) throw insertError

    return NextResponse.json({
      promoted: (created ?? []).length,
      skipped: alreadyPromoted.size,
      sites: created ?? [],
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Promotion failed' },
      { status: 500 }
    )
  }
}
