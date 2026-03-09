// Checkpoint definitions — the source of truth for UI rendering
export const PHASES = [
  { key: 'site_control', label: 'Site Control', abbrev: 'Control' },
  { key: 'power', label: 'Power', abbrev: 'Power' },
  { key: 'permitting', label: 'Permitting', abbrev: 'Permit' },
  { key: 'fiber', label: 'Fiber', abbrev: 'Fiber' },
  { key: 'engineering', label: 'Eng & Procurement', abbrev: 'Eng' },
  { key: 'construction', label: 'Construction', abbrev: 'Build' },
] as const

export type PhaseKey = typeof PHASES[number]['key']

/** Status of each development phase — derived from PHASES constant */
export type PhaseStatuses = Record<PhaseKey, string | null>

/** Column names for phase statuses in the tracker_site_overview view */
export const PHASE_VIEW_COLUMNS = PHASES.map(p => `${p.key}_phase`) as readonly string[]

export interface Checkpoint {
  prefix: string
  label: string
  gridLabel: string
  phase: PhaseKey
  financial: boolean
}

export const CHECKPOINTS: Checkpoint[] = [
  { prefix: 'control_engaged', label: 'Site Control Engaged', gridLabel: 'Engaged', phase: 'site_control', financial: false },
  { prefix: 'control_secured', label: 'Site Control Secured', gridLabel: 'Secured', phase: 'site_control', financial: false },
  { prefix: 'power_capacity_check', label: 'Capacity Check Submitted', gridLabel: 'Cap Check', phase: 'power', financial: false },
  { prefix: 'power_capacity_indication', label: 'Capacity Indication Received', gridLabel: 'Cap Ind', phase: 'power', financial: false },
  { prefix: 'power_service_request', label: 'Service Request Submitted', gridLabel: 'Svc Req', phase: 'power', financial: false },
  { prefix: 'power_deposit', label: 'Deposit Paid', gridLabel: 'Deposit', phase: 'power', financial: true },
  { prefix: 'power_utility_design', label: 'Utility Design Complete', gridLabel: 'Util Design', phase: 'power', financial: false },
  { prefix: 'power_connection', label: 'Connection Agreement Signed', gridLabel: 'Connected', phase: 'power', financial: false },
  { prefix: 'permit_requirements', label: 'Permitting Requirements Assessed', gridLabel: 'Assessed', phase: 'permitting', financial: false },
  { prefix: 'permit_approved', label: 'Permits Approved', gridLabel: 'Approved', phase: 'permitting', financial: true },
  { prefix: 'fiber_identified', label: 'Fiber Identified', gridLabel: 'Identified', phase: 'fiber', financial: false },
  { prefix: 'fiber_capacity', label: 'Fiber Capacity Confirmed', gridLabel: 'Confirmed', phase: 'fiber', financial: false },
  { prefix: 'fiber_secured', label: 'Fiber Secured', gridLabel: 'Secured', phase: 'fiber', financial: true },
  { prefix: 'eng_design', label: 'Engineering Design Complete', gridLabel: 'Design', phase: 'engineering', financial: false },
  { prefix: 'eng_equip_ordered', label: 'Equipment Ordered', gridLabel: 'Ordered', phase: 'engineering', financial: true },
  { prefix: 'construction_equip_delivered', label: 'Equipment Delivered', gridLabel: 'Delivered', phase: 'construction', financial: false },
  { prefix: 'construction_complete', label: 'Construction Complete', gridLabel: 'Built', phase: 'construction', financial: false },
  { prefix: 'construction_energized', label: 'Energized', gridLabel: 'Energized', phase: 'construction', financial: false },
  { prefix: 'construction_commissioned', label: 'Commissioning Complete', gridLabel: "Comm'd", phase: 'construction', financial: false },
]

// These arrays mirror the Postgres enums — used for UI dropdowns.
// After `supabase gen types`, you can also use Database['public']['Enums']['checkpoint_status'] etc.
export const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Complete', 'Waiting', 'N/A'] as const
export type CheckpointStatus = typeof STATUS_OPTIONS[number]

export const AMOUNT_STATUS_OPTIONS = ['Estimated', 'Quoted', 'Approved', 'Paid'] as const
export type AmountStatus = typeof AMOUNT_STATUS_OPTIONS[number]

export const PRIORITY_OPTIONS = ['Lead', 'Active', 'Pipeline', 'On Hold', 'Deprioritized'] as const
export type Priority = typeof PRIORITY_OPTIONS[number]

/** Priority colors — single source of truth for all UI surfaces.
 *  dot: Tailwind class for solid dot/indicator (matches PriorityIndicator component)
 *  text: Tailwind class for label text
 *  badge: Tailwind classes for pill/badge (bg + text) used in lists and panels
 */
export const PRIORITY_COLORS: Record<Priority, { dot: string; text: string; badge: string }> = {
  'Lead':           { dot: 'bg-nodiac-secondary',  text: 'text-nodiac-secondary',                badge: 'bg-nodiac-secondary/20 text-nodiac-secondary' },
  'Active':         { dot: 'bg-emerald-500',        text: 'text-emerald-500 dark:text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400' },
  'Pipeline':       { dot: 'bg-zinc-400',           text: 'text-zinc-500 dark:text-zinc-400',       badge: 'bg-zinc-500/20 text-zinc-400' },
  'On Hold':        { dot: 'bg-amber-500',          text: 'text-amber-500 dark:text-amber-400',     badge: 'bg-amber-500/20 text-amber-400' },
  'Deprioritized':  { dot: 'bg-zinc-400',           text: 'text-zinc-400 dark:text-zinc-500',       badge: 'bg-zinc-500/20 text-zinc-500' },
}

export const OWNER_OPTIONS = ['Eric', 'Josh', 'Stratton', 'Evan', 'Ziff', 'Sara', 'Ken'] as const

export const PARTNER_TYPE_OPTIONS = ['Distribution Co-op', 'G&T Co-op', 'Municipal Utility', 'IOU', 'IPP'] as const
export type PartnerType = typeof PARTNER_TYPE_OPTIONS[number]

export const RELATIONSHIP_STAGE_OPTIONS = ['Identified', 'Initial Contact', 'Capacity Discussion', 'Under Contract'] as const
export type RelationshipStage = typeof RELATIONSHIP_STAGE_OPTIONS[number]

export const HUB_STATUS_OPTIONS = ['Planning', 'Active Development', 'Operational'] as const
export type HubStatus = typeof HUB_STATUS_OPTIONS[number]

// Phase status -> color mapping for the grid
export const PHASE_COLORS: Record<string, string> = {
  'Not Started': 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  'In Progress': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'Complete': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  'Waiting': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
}

// Helper: get checkpoint value from a site row
export function getCheckpointValue(site: Record<string, unknown>, prefix: string, suffix: string): unknown {
  return site[`${prefix}_${suffix}`]
}

// Helper: group checkpoints by phase (cached)
const _checkpointsByPhase = new Map<PhaseKey, Checkpoint[]>()
export function getCheckpointsByPhase(phase: PhaseKey): Checkpoint[] {
  let cached = _checkpointsByPhase.get(phase)
  if (!cached) {
    cached = CHECKPOINTS.filter(c => c.phase === phase)
    _checkpointsByPhase.set(phase, cached)
  }
  return cached
}

// Sub-step granularity: identify the current checkpoint within a phase
export interface SubStepInfo {
  checkpoint: Checkpoint | null
  status: CheckpointStatus
  ordinal: number  // position in the phase's checkpoint list (for sorting)
}

export function getCurrentSubStep(phase: PhaseKey, site: Record<string, unknown>): SubStepInfo {
  const checkpoints = getCheckpointsByPhase(phase)

  for (let i = 0; i < checkpoints.length; i++) {
    const cp = checkpoints[i]
    const status = (getCheckpointValue(site, cp.prefix, 'status') as CheckpointStatus) ?? 'Not Started'
    if (status !== 'Complete' && status !== 'N/A') {
      return { checkpoint: cp, status, ordinal: i }
    }
  }

  // All checkpoints are Complete or N/A
  return { checkpoint: null, status: 'Complete', ordinal: checkpoints.length }
}

// Check if any checkpoint in a phase has Waiting status (for the red flag indicator)
export function phaseHasWaiting(phase: PhaseKey, site: Record<string, unknown>): boolean {
  const checkpoints = getCheckpointsByPhase(phase)
  return checkpoints.some(cp => {
    const status = getCheckpointValue(site, cp.prefix, 'status') as string
    return status === 'Waiting'
  })
}
