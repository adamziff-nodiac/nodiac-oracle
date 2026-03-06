import type { CheckpointStatus, AmountStatus } from './constants'

// IPP entity
export interface TrackerIPP {
  id: string
  name: string
  contact_name: string | null
  contact_email: string | null
  notes: string | null
  attio_link: string | null
  created_at: string
  updated_at: string
}

// Base tracker_sites row type
// TODO: Replace with Tables<'tracker_sites'> after `supabase gen types` includes tracker tables
export interface TrackerSite {
  id: string
  name: string
  hub_id: string | null
  utility_id: string | null
  asset_owner_id: string | null
  mw_current: number | null
  mw_target: number | null
  priority: string
  site_notes: Record<string, unknown> | null
  checkpoint_notes: Record<string, unknown> | null
  archived_at: string | null
  archived_reason: string | null
  created_at: string
  updated_at: string
  // IPP pipeline columns
  portfolio_site_id: string | null
  latitude: number | null
  longitude: number | null
  fips_code: string | null
  screening_score: number | null
  screening_tier: string | null
  ipp_id: string | null
  // Checkpoint columns: each prefix has _status, _forecast, _completed, _owner
  // Financial checkpoints also have _amount and _amount_status
  [key: string]: unknown
}

// TODO: Replace with Tables<'tracker_regional_hubs'> after types regenerated
export interface TrackerHub {
  id: string
  name: string
  target_mw: number | null
  status: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Extended hub type with computed fields for the list view
export interface TrackerHubWithCounts extends TrackerHub {
  partner_count: number
  site_count: number
}

// TODO: Replace with Tables<'tracker_power_partners'> after types regenerated
export interface TrackerPartner {
  id: string
  name: string
  type: string | null
  relationship_stage: string | null
  loi_signed: boolean | null
  parent_gt_id: string | null
  ix_process_notes: string | null
  rate_structure: string | null
  available_capacity: string | null
  attio_link: string | null
  notes: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// Extended partner type with computed fields for the list view
export interface TrackerPartnerWithCounts extends TrackerPartner {
  site_count: number
  hub_names: string[]
}

// TODO: Replace with Tables<'tracker_activity_log'> after types regenerated
export interface TrackerActivity {
  id: string
  site_id: string
  title: string
  summary: string | null
  source: string | null
  created_at: string
}

// The view type (extended site with computed columns)
export interface TrackerSiteOverview extends TrackerSite {
  hub_name: string | null
  utility_name: string | null
  asset_owner_name: string | null
  ipp_name: string | null
  site_qualification_phase: string
  site_control_phase: string
  power_phase: string
  permitting_phase: string
  fiber_phase: string
  engineering_phase: string
  construction_phase: string
  construction_ready: boolean
  construction_ready_date: string | null
  total_capex: number
  capex_per_mw: number | null
  next_step: string | null
  days_to_ix: number | null
  days_to_construction_ready: number | null
  days_to_cod: number | null
  is_archived: boolean
}

// Site notes JSONB shape
export interface SiteNotes {
  summary?: string
  next_steps?: string[]
  blockers?: Array<{
    issue: string
    contact?: string
    since?: string
  }>
  waiting_on?: Array<{
    who: string
    what: string
    since?: string
  }>
  updated_at?: string
}

// Checkpoint notes JSONB shape
export interface CheckpointNote {
  note: string
  updated: string
}
export type CheckpointNotes = Record<string, CheckpointNote>
