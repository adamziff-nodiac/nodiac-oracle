import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Group tracker_sites by partner (ipp_id) to create virtual portfolio entries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: sites, error } = await sb
    .from('tracker_sites')
    .select('ipp_id, name, screening_score, created_at')
    .not('screening_score', 'is', null)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get partner names for IPP IDs
  const ippIds = [...new Set(((sites ?? []) as Array<Record<string, unknown>>)
    .map(s => s.ipp_id)
    .filter(Boolean))] as string[]

  let partnerNames: Record<string, string> = {}
  if (ippIds.length > 0) {
    const { data: partners } = await sb
      .from('tracker_ipps')
      .select('id, name')
      .in('id', ippIds)

    if (partners) {
      partnerNames = Object.fromEntries(
        (partners as Array<{ id: string; name: string }>).map(p => [p.id, p.name])
      )
    }
  }

  // Group by partner
  const grouped = new Map<string | null, Array<Record<string, unknown>>>()
  for (const site of (sites ?? []) as Array<Record<string, unknown>>) {
    const key = (site.ipp_id as string) ?? null
    const arr = grouped.get(key) ?? []
    arr.push(site)
    grouped.set(key, arr)
  }

  // Build virtual upload records
  const portfolios = Array.from(grouped.entries()).map(([ippId, groupSites]) => ({
    id: ippId ?? 'unlinked',
    user_id: user.id,
    name: ippId ? (partnerNames[ippId] ?? 'Unknown Partner') : 'Unlinked Sites',
    site_count: groupSites.length,
    created_at: groupSites[0]?.created_at,
    updated_at: groupSites[0]?.created_at,
  }))

  return NextResponse.json(portfolios)
}
