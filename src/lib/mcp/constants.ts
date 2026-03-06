/**
 * Mirrors src/lib/tracker/constants.ts — enum values and checkpoint definitions
 * used for input validation in MCP tools.
 */

export const CHECKPOINT_PREFIXES = [
  'site_identified', 'site_qualified',
  'control_engaged', 'control_secured',
  'power_capacity_check', 'power_capacity_indication', 'power_service_request',
  'power_deposit', 'power_utility_design', 'power_connection',
  'permit_requirements', 'permit_approved',
  'fiber_identified', 'fiber_capacity', 'fiber_secured',
  'eng_design', 'eng_equip_ordered',
  'construction_equip_delivered', 'construction_complete',
  'construction_energized', 'construction_commissioned',
] as const

export const FINANCIAL_CHECKPOINTS = [
  'power_deposit', 'permit_approved', 'fiber_secured', 'eng_equip_ordered',
] as const

export const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Complete', 'Waiting', 'N/A'] as const
export const AMOUNT_STATUS_OPTIONS = ['Estimated', 'Quoted', 'Approved', 'Paid'] as const
export const PRIORITY_OPTIONS = ['Lead', 'Active', 'Pipeline', 'On Hold', 'Deprioritized'] as const
export const SITE_TYPE_OPTIONS = ['Solar', 'Wind', 'Solar + BESS', 'Substation', 'Other'] as const
export const OWNER_OPTIONS = ['Eric', 'Josh', 'Stratton', 'Evan', 'Ziff', 'Sara', 'Ken'] as const
export const PARTNER_TYPE_OPTIONS = ['Distribution Co-op', 'G&T Co-op', 'Municipal Utility', 'IOU', 'IPP'] as const
export const RELATIONSHIP_STAGE_OPTIONS = ['Identified', 'Initial Contact', 'Capacity Discussion', 'Under Contract'] as const
export const HUB_STATUS_OPTIONS = ['Planning', 'Active Development', 'Operational'] as const
export const ACTIVITY_SOURCE_OPTIONS = ['call', 'email', 'slack', 'meeting', 'manual', 'other'] as const
export const LANDOWNER_PROXIMITY_OPTIONS = ['Collocated', 'Adjacent'] as const
export const LANDOWNER_PURPOSE_OPTIONS = ['DC Location', 'Fiber Route', 'Access Easement', 'Utility Easement'] as const
export const LEASE_STATUS_OPTIONS = ['No Contact', 'Engaged', 'Amendment In Progress', 'Signed'] as const
export const ACTION_ITEM_STATUS_OPTIONS = ['next', 'waiting', 'done'] as const
export const ACTION_ITEM_SOURCE_OPTIONS = ['manual', 'ai', 'call'] as const

export function isFinancialCheckpoint(prefix: string): boolean {
  return (FINANCIAL_CHECKPOINTS as readonly string[]).includes(prefix)
}
