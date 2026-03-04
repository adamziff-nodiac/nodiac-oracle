import { createClient } from '@/lib/supabase/server'
import type { TrackerSiteOverview, TrackerHub, TrackerPartner, TrackerActivity } from './types'

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
