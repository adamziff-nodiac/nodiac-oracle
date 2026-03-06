import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerSites } from '@/lib/tracker/queries'
import type { TrackerPartner } from '@/lib/tracker/types'
import { PartnerDetailPage } from '@/components/tracker/PartnerDetailPage'

interface PartnerDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PartnerDetailRoute({ params }: PartnerDetailPageProps) {
  const { id } = await params

  const supabase = await createClient()

  // Fetch partner
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: partner, error } = await (supabase as any)
    .from('tracker_power_partners')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !partner) {
    notFound()
  }

  const typedPartner = partner as TrackerPartner

  // Fetch linked hub names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hubLinks } = await (supabase as any)
    .from('tracker_partner_hubs')
    .select('hub_id')
    .eq('partner_id', id)

  const hubIds = ((hubLinks ?? []) as Array<{ hub_id: string }>).map(l => l.hub_id)
  let hubNames: string[] = []
  if (hubIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: hubs } = await (supabase as any)
      .from('tracker_regional_hubs')
      .select('id, name')
      .in('id', hubIds)
    hubNames = ((hubs ?? []) as Array<{ id: string; name: string }>).map(h => h.name)
  }

  // Fetch tracker sites linked to this partner (as utility or asset_owner)
  const trackerSites = await getPartnerSites(id)

  // Count screening sites from tracker_sites (sites with screening_score linked to this partner)
  let screeningSiteCount = 0
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from('tracker_sites')
      .select('id', { count: 'exact', head: true })
      .not('screening_score', 'is', null)
      .or(`ipp_id.eq.${id},utility_id.eq.${id},asset_owner_id.eq.${id}`)
    screeningSiteCount = count ?? 0
  } catch {
    // Non-critical — screening count is best-effort
  }

  return (
    <PartnerDetailPage
      partner={typedPartner}
      hubNames={hubNames}
      initialSites={trackerSites}
      screeningSiteCount={screeningSiteCount}
    />
  )
}
