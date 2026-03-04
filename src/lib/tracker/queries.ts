import { createClient } from '@/lib/supabase/server'
import type { TrackerSiteOverview, TrackerHub, TrackerPartner, TrackerPartnerWithCounts, TrackerActivity } from './types'

export async function getTrackerSites(): Promise<TrackerSiteOverview[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tracker_site_overview')
    .select('*')
    .order('priority')
    .order('name')

  if (error) throw error
  return (data ?? []) as TrackerSiteOverview[]
}

export async function getTrackerSite(id: string): Promise<TrackerSiteOverview | null> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tracker_site_overview')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as TrackerSiteOverview | null
}

export async function getTrackerHubs(): Promise<TrackerHub[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tracker_regional_hubs')
    .select('*')
    .order('name')

  if (error) throw error
  return (data ?? []) as TrackerHub[]
}

export async function getTrackerPartners(): Promise<TrackerPartner[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tracker_power_partners')
    .select('*')
    .order('name')

  if (error) throw error
  return (data ?? []) as TrackerPartner[]
}

export async function getPartnersWithSiteCounts(): Promise<TrackerPartnerWithCounts[]> {
  const supabase = await createClient()

  // Fetch partners and sites in parallel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [partnersResult, sitesResult, hubLinksResult] = await Promise.all([
    (supabase as any).from('tracker_power_partners').select('*').order('name'),
    (supabase as any).from('tracker_sites').select('id, utility_id, asset_owner_id'),
    (supabase as any).from('tracker_partner_hubs').select('partner_id, hub_id'),
  ])

  if (partnersResult.error) throw partnersResult.error
  const partners = (partnersResult.data ?? []) as TrackerPartner[]
  const sites = (sitesResult.data ?? []) as Array<{ id: string; utility_id: string | null; asset_owner_id: string | null }>
  const hubLinks = (hubLinksResult.data ?? []) as Array<{ partner_id: string; hub_id: string }>

  // Fetch hub names for mapping
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hubsResult = await (supabase as any).from('tracker_regional_hubs').select('id, name')
  const hubMap = new Map<string, string>()
  for (const h of (hubsResult.data ?? []) as Array<{ id: string; name: string }>) {
    hubMap.set(h.id, h.name)
  }

  // Count sites per partner (as utility or asset_owner)
  const siteCountMap = new Map<string, number>()
  for (const s of sites) {
    if (s.utility_id) siteCountMap.set(s.utility_id, (siteCountMap.get(s.utility_id) ?? 0) + 1)
    if (s.asset_owner_id) siteCountMap.set(s.asset_owner_id, (siteCountMap.get(s.asset_owner_id) ?? 0) + 1)
  }

  // Map hub names per partner
  const partnerHubMap = new Map<string, string[]>()
  for (const link of hubLinks) {
    const names = partnerHubMap.get(link.partner_id) ?? []
    const hubName = hubMap.get(link.hub_id)
    if (hubName) names.push(hubName)
    partnerHubMap.set(link.partner_id, names)
  }

  return partners.map(p => ({
    ...p,
    site_count: siteCountMap.get(p.id) ?? 0,
    hub_names: partnerHubMap.get(p.id) ?? [],
  }))
}

export async function getPartnerSites(partnerId: string): Promise<TrackerSiteOverview[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tracker_site_overview')
    .select('*')
    .or(`utility_id.eq.${partnerId},asset_owner_id.eq.${partnerId}`)
    .order('name')

  if (error) throw error
  return (data ?? []) as TrackerSiteOverview[]
}

export async function getSiteActivity(siteId: string, limit = 20): Promise<TrackerActivity[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tracker_activity_log')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as TrackerActivity[]
}

export async function getDepositSites(): Promise<TrackerSiteOverview[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tracker_site_overview')
    .select('*')
    .order('name')

  if (error) throw error

  // Filter to sites with any financial checkpoint data
  return ((data ?? []) as TrackerSiteOverview[]).filter((site: TrackerSiteOverview) =>
    site['power_deposit_amount'] || site['permit_approved_amount'] ||
    site['fiber_secured_amount'] || site['eng_equip_ordered_amount'] ||
    site['power_deposit_status'] !== 'Not Started' ||
    site['permit_approved_status'] !== 'Not Started' ||
    site['fiber_secured_status'] !== 'Not Started' ||
    site['eng_equip_ordered_status'] !== 'Not Started'
  )
}
