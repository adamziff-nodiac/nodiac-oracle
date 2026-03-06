import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const uploadId = request.nextUrl.searchParams.get('upload_id')
  if (!uploadId) {
    return NextResponse.json({ error: 'upload_id required' }, { status: 400 })
  }

  try {
    // Get portfolio site IDs for this upload
    const { data: portfolioSites, error: psError } = await supabase
      .from('portfolio_sites')
      .select('id')
      .eq('upload_id', uploadId)

    if (psError) throw psError
    const psIds = (portfolioSites ?? []).map(s => s.id)
    if (psIds.length === 0) {
      return NextResponse.json({ promoted: {} })
    }

    // Find tracker sites that reference these portfolio sites
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: trackerSites, error: tsError } = await (supabase as any)
      .from('tracker_sites')
      .select('id, portfolio_site_id')
      .in('portfolio_site_id', psIds)

    if (tsError) throw tsError

    const promoted: Record<string, string> = {}
    for (const ts of (trackerSites ?? []) as Array<{ id: string; portfolio_site_id: string }>) {
      promoted[ts.portfolio_site_id] = ts.id
    }

    return NextResponse.json({ promoted })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to check promoted sites' },
      { status: 500 }
    )
  }
}
