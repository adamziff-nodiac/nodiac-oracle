import { createClient } from '@/lib/supabase/server'
import type { TrackerSiteOverview, TrackerHub, TrackerHubWithCounts, TrackerPartner, TrackerPartnerWithCounts, TrackerActivity, ActionItemWithContext, TeamMember } from './types'

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

export async function getHubsWithCounts(): Promise<TrackerHubWithCounts[]> {
  const supabase = await createClient()

  // Fetch hubs, partner-hub links, and sites in parallel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [hubsResult, hubLinksResult, sitesResult] = await Promise.all([
    (supabase as any).from('tracker_regional_hubs').select('*').order('name'),
    (supabase as any).from('tracker_partner_hubs').select('partner_id, hub_id'),
    (supabase as any).from('tracker_site_overview').select('id, hub_name'),
  ])

  if (hubsResult.error) throw hubsResult.error
  const hubs = (hubsResult.data ?? []) as TrackerHub[]
  const hubLinks = (hubLinksResult.data ?? []) as Array<{ partner_id: string; hub_id: string }>
  const sites = (sitesResult.data ?? []) as Array<{ id: string; hub_name: string | null }>

  // Count partners per hub
  const partnerCountMap = new Map<string, number>()
  for (const link of hubLinks) {
    partnerCountMap.set(link.hub_id, (partnerCountMap.get(link.hub_id) ?? 0) + 1)
  }

  // Count sites per hub (by hub name match from site_overview view)
  const siteCountMap = new Map<string, number>()
  for (const site of sites) {
    if (site.hub_name) {
      siteCountMap.set(site.hub_name, (siteCountMap.get(site.hub_name) ?? 0) + 1)
    }
  }

  return hubs.map(h => ({
    ...h,
    partner_count: partnerCountMap.get(h.id) ?? 0,
    site_count: siteCountMap.get(h.name) ?? 0,
  }))
}

export async function getHubSites(hubName: string): Promise<TrackerSiteOverview[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tracker_site_overview')
    .select('*')
    .eq('hub_name', hubName)
    .order('name')

  if (error) throw error
  return (data ?? []) as TrackerSiteOverview[]
}

export async function getHubPartners(hubId: string): Promise<TrackerPartner[]> {
  const supabase = await createClient()

  // Get partner IDs linked to this hub
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: links, error: linksError } = await (supabase as any)
    .from('tracker_partner_hubs')
    .select('partner_id')
    .eq('hub_id', hubId)

  if (linksError) throw linksError
  const partnerIds = ((links ?? []) as Array<{ partner_id: string }>).map(l => l.partner_id)

  if (partnerIds.length === 0) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tracker_power_partners')
    .select('*')
    .in('id', partnerIds)
    .order('name')

  if (error) throw error
  return (data ?? []) as TrackerPartner[]
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


export interface HubCentroid {
  id: string
  name: string
  status: string | null
  lat: number
  lng: number
  site_count: number
}

export async function getHubCentroids(): Promise<HubCentroid[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [hubsResult, sitesResult] = await Promise.all([
    (supabase as any).from('tracker_regional_hubs').select('id, name, status'),
    (supabase as any).from('tracker_sites').select('id, regional_hub_id, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null),
  ])

  if (hubsResult.error) throw hubsResult.error
  const hubs = (hubsResult.data ?? []) as Array<{ id: string; name: string; status: string | null }>
  const sites = (sitesResult.data ?? []) as Array<{ id: string; regional_hub_id: string | null; latitude: number; longitude: number }>

  return hubs.map(hub => {
    const hubSites = sites.filter(s => s.regional_hub_id === hub.id)
    if (hubSites.length === 0) return null

    const lat = hubSites.reduce((sum, s) => sum + Number(s.latitude), 0) / hubSites.length
    const lng = hubSites.reduce((sum, s) => sum + Number(s.longitude), 0) / hubSites.length

    return {
      id: hub.id,
      name: hub.name,
      status: hub.status,
      lat,
      lng,
      site_count: hubSites.length,
    }
  }).filter((h): h is HubCentroid => h !== null)
}

// ── Action Items ──────────────────────────────────────

export async function getActionItems(filters?: {
  assigned_to?: string
  status?: string[]
  site_id?: string
}): Promise<ActionItemWithContext[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('tracker_action_items_with_context')
    .select('*')
    .order('flagged', { ascending: false })
    .order('created_at', { ascending: true })

  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to)
  }
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }
  if (filters?.site_id) {
    query = query.eq('site_id', filters.site_id)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ActionItemWithContext[]
}

export async function getSiteActionItems(siteId: string): Promise<ActionItemWithContext[]> {
  return getActionItems({ site_id: siteId, status: ['next', 'waiting'] })
}

export async function getActionItemStats(assignedTo?: string): Promise<{
  next: number
  waiting: number
  stalled: number
  flaggedNext: ActionItemWithContext | null
}> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('tracker_action_items_with_context')
    .select('*')
    .in('status', ['next', 'waiting'])

  if (assignedTo) {
    query = query.eq('assigned_to', assignedTo)
  }

  const { data, error } = await query
  if (error) throw error

  const items = (data ?? []) as ActionItemWithContext[]
  const nextItems = items.filter(i => i.status === 'next')
  const waitingItems = items.filter(i => i.status === 'waiting')

  // Find stalled: items older than 14 days
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const stalled = items.filter(i => i.created_at < fourteenDaysAgo).length

  // Find first flagged next item
  const flaggedNext = nextItems.find(i => i.flagged) ?? nextItems[0] ?? null

  return {
    next: nextItems.length,
    waiting: waitingItems.length,
    stalled,
    flaggedNext,
  }
}

// ── Team Members ──────────────────────────────────────

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('team_members')
    .select('*')
    .order('display_name')

  if (error) throw error
  return (data ?? []) as TeamMember[]
}

export async function getTeamMemberByUserId(userId: string): Promise<TeamMember | null> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('team_members')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as TeamMember | null
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
