import type { CheckpointStatus, AmountStatus } from './constants'

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
  // Checkpoint columns: each prefix has _status, _forecast, _completed, _owner
  // Financial checkpoints also have _amount and _amount_status
  [key: string]: unknown
}

// TODO: Replace with Tables<'tracker_regional_hubs'> after types regenerated
export interface TrackerHub {
  id: string
  name: string
  description: string | null
  created_at: string
}

// TODO: Replace with Tables<'tracker_power_partners'> after types regenerated
export interface TrackerPartner {
  id: string
  name: string
  partner_type: string | null
  hub_id: string | null
  parent_gt_id: string | null
  created_at: string
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
