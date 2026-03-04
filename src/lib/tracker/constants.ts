// Checkpoint definitions — the source of truth for UI rendering
export const PHASES = [
  { key: 'site_qualification', label: 'Site Qualification', abbrev: 'Qualify' },
  { key: 'site_control', label: 'Site Control', abbrev: 'Control' },
  { key: 'power', label: 'Power', abbrev: 'Power' },
  { key: 'permitting', label: 'Permitting', abbrev: 'Permit' },
  { key: 'fiber', label: 'Fiber', abbrev: 'Fiber' },
  { key: 'engineering', label: 'Eng & Procurement', abbrev: 'Eng' },
  { key: 'construction', label: 'Construction', abbrev: 'Build' },
] as const

export type PhaseKey = typeof PHASES[number]['key']

export interface Checkpoint {
  prefix: string
  label: string
  phase: PhaseKey
  financial: boolean
}

export const CHECKPOINTS: Checkpoint[] = [
  { prefix: 'site_identified', label: 'Site Identified', phase: 'site_qualification', financial: false },
  { prefix: 'site_qualified', label: 'Site Qualified', phase: 'site_qualification', financial: false },
  { prefix: 'control_engaged', label: 'Site Control Engaged', phase: 'site_control', financial: false },
  { prefix: 'control_secured', label: 'Site Control Secured', phase: 'site_control', financial: false },
  { prefix: 'power_capacity_check', label: 'Capacity Check Submitted', phase: 'power', financial: false },
  { prefix: 'power_capacity_indication', label: 'Capacity Indication Received', phase: 'power', financial: false },
  { prefix: 'power_service_request', label: 'Service Request Submitted', phase: 'power', financial: false },
  { prefix: 'power_deposit', label: 'Deposit Paid', phase: 'power', financial: true },
  { prefix: 'power_utility_design', label: 'Utility Design Complete', phase: 'power', financial: false },
  { prefix: 'power_connection', label: 'Connection Agreement Signed', phase: 'power', financial: false },
  { prefix: 'permit_requirements', label: 'Permitting Requirements Assessed', phase: 'permitting', financial: false },
  { prefix: 'permit_approved', label: 'Permits Approved', phase: 'permitting', financial: true },
  { prefix: 'fiber_identified', label: 'Fiber Identified', phase: 'fiber', financial: false },
  { prefix: 'fiber_capacity', label: 'Fiber Capacity Confirmed', phase: 'fiber', financial: false },
  { prefix: 'fiber_secured', label: 'Fiber Secured', phase: 'fiber', financial: true },
  { prefix: 'eng_design', label: 'Engineering Design Complete', phase: 'engineering', financial: false },
  { prefix: 'eng_equip_ordered', label: 'Equipment Ordered', phase: 'engineering', financial: true },
  { prefix: 'construction_equip_delivered', label: 'Equipment Delivered', phase: 'construction', financial: false },
  { prefix: 'construction_complete', label: 'Construction Complete', phase: 'construction', financial: false },
  { prefix: 'construction_energized', label: 'Energized', phase: 'construction', financial: false },
  { prefix: 'construction_commissioned', label: 'Commissioning Complete', phase: 'construction', financial: false },
]

// These arrays mirror the Postgres enums — used for UI dropdowns.
// After `supabase gen types`, you can also use Database['public']['Enums']['checkpoint_status'] etc.
export const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Complete', 'Blocked', 'N/A'] as const
export type CheckpointStatus = typeof STATUS_OPTIONS[number]

export const AMOUNT_STATUS_OPTIONS = ['Estimated', 'Quoted', 'Approved', 'Paid'] as const
export type AmountStatus = typeof AMOUNT_STATUS_OPTIONS[number]

export const PRIORITY_OPTIONS = ['Lead', 'Active', 'Pipeline', 'On Hold', 'Deprioritized'] as const
export type Priority = typeof PRIORITY_OPTIONS[number]

export const OWNER_OPTIONS = ['Eric', 'Josh', 'Stratton', 'Evan', 'Ziff', 'Sara', 'Ken'] as const

// Phase status -> color mapping for the grid
export const PHASE_COLORS: Record<string, string> = {
  'Not Started': 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  'In Progress': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'Complete': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  'Blocked': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
}

// Helper: get checkpoint value from a site row
export function getCheckpointValue(site: Record<string, unknown>, prefix: string, suffix: string): unknown {
  return site[`${prefix}_${suffix}`]
}

// Helper: group checkpoints by phase
export function getCheckpointsByPhase(phase: PhaseKey): Checkpoint[] {
  return CHECKPOINTS.filter(c => c.phase === phase)
}
