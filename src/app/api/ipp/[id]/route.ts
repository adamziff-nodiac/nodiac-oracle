import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get partner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: partner, error: partnerError } = await (supabase as any)
      .from('tracker_power_partners')
      .select('*')
      .eq('id', id)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Get tracker sites for this partner (screened sites are now in tracker_sites)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sites } = await (supabase as any)
      .from('tracker_site_overview')
      .select('*')
      .or(`utility_id.eq.${id},asset_owner_id.eq.${id}`)
      .order('name')

    return NextResponse.json({
      partner,
      sites: sites ?? [],
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load partner' }, { status: 500 })
  }
}
