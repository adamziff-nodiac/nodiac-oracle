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
  mw_potential: number | null
  priority: string
  site_notes: Record<string, unknown> | null
  checkpoint_notes: Record<string, unknown> | null
  archived_at: string | null
  archived_reason: string | null
  created_at: string
  updated_at: string
  // Location & geography
  latitude: number | null
  longitude: number | null
  coordinates: string | null
  address: string | null
  ahj: string | null
  fips_code: string | null
  // Site metadata
  site_type: 'Solar' | 'Wind' | 'Solar + BESS' | 'Substation' | 'Other' | 'Rooftop Solar' | null
  interconnection_voltage_kv: number | null
  interested_offtakers: string[] | null
  portfolio_site_id: string | null
  // Screening
  screening_score: number | null
  screening_tier: string | null
  score_breakdown: Record<string, unknown> | null
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
  attio_record_id: string | null
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
  site_control_phase: string
  power_phase: string
  permitting_phase: string
  fiber_phase: string
  engineering_phase: string
  construction_phase: string
  has_activity: boolean
  dev_start_date: string | null
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

// Site notes JSONB shape (action items now live in tracker_action_items table)
export interface SiteNotes {
  summary?: string
  updated_at?: string
}

// Team member (maps Supabase auth user to display name)
export interface TeamMember {
  id: string
  user_id: string | null
  display_name: string
  email: string | null
  avatar_url: string | null
  created_at: string
}

// Action item (GTD-inspired task tied to a site)
export interface ActionItem {
  id: string
  site_id: string
  title: string
  status: 'next' | 'waiting' | 'done'
  flagged: boolean
  assigned_to: string | null
  waiting_on: string | null
  waiting_since: string | null
  defer_until: string | null
  hard_deadline: string | null
  notes: string | null
  source: 'manual' | 'ai' | 'call'
  created_by: string | null
  created_at: string
  completed_at: string | null
}

// Action item with joined context from the view
export interface ActionItemWithContext extends ActionItem {
  site_name: string
  hub_name: string | null
  assigned_to_name: string | null
  created_by_name: string | null
}

// Checkpoint notes JSONB shape
export interface CheckpointNote {
  note: string
  updated: string
}
export type CheckpointNotes = Record<string, CheckpointNote>

// Attio CRM Summary types
export interface AttioContact {
  name: string
  title: string | null
  email: string | null
  connection_strength: string | null
  last_interaction: string | null
}

export interface AttioDeal {
  stage: string | null
  type: string | null
  owner: string | null
}

export interface AttioSummary {
  available: boolean
  company_name: string | null
  domain: string | null
  industry: string | null
  connection_strength: string | null
  strongest_connection_user: string | null
  last_interaction: string | null
  next_interaction: string | null
  contacts: AttioContact[]
  deal: AttioDeal | null
  next_steps: string | null
}
