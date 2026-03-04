import type { Tables } from '@/types/database'
import type { CheckpointStatus, AmountStatus } from './constants'

// Core row types from generated database types
export type TrackerSite = Tables<'tracker_sites'>
export type TrackerHub = Tables<'tracker_regional_hubs'>
export type TrackerPartner = Tables<'tracker_power_partners'>
export type TrackerActivity = Tables<'tracker_activity_log'>

// The view type (extended site with computed columns)
// After types are regenerated, this should come from Tables<'tracker_site_overview'>
// Until then, define manually:
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
