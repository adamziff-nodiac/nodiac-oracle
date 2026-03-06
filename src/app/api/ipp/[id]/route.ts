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

    // Get portfolio uploads linked via name matching
    const { data: uploads } = await supabase
      .from('portfolio_uploads')
      .select('*')
      .order('created_at', { ascending: false })

    const partnerName = (partner as { name: string }).name.toLowerCase()
    const matchedUploads = ((uploads ?? []) as Array<{ name: string; [key: string]: unknown }>)
      .filter(u => u.name.toLowerCase().includes(partnerName))

    // Get tracker sites for this partner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sites } = await (supabase as any)
      .from('tracker_site_overview')
      .select('*')
      .or(`utility_id.eq.${id},asset_owner_id.eq.${id}`)
      .order('name')

    return NextResponse.json({
      partner,
      portfolios: matchedUploads,
      sites: sites ?? [],
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load partner' }, { status: 500 })
  }
}
