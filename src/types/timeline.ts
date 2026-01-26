// Timeline types for the project timeline builder

export type Timeline = {
  id: string
  userId: string
  title: string
  startYear: number
  endYear: number
  createdAt: Date
  updatedAt: Date
}

export type TimelineRow = {
  id: string
  timelineId: string
  label: string
  color: string
  startDate: Date
  endDate: Date
  position: number
  createdAt: Date
  updatedAt: Date
}

export type TimelineMilestone = {
  id: string
  rowId: string
  label: string
  date: Date
  position: number
  createdAt: Date
  updatedAt: Date
}

export type TimelinePhase = {
  id: string
  timelineId: string
  label: string
  date: Date
  position: number
  createdAt: Date
  updatedAt: Date
}

export type TimelineAnnotation = {
  id: string
  rowId: string
  label: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

// Row with nested milestones and annotations
export type TimelineRowWithData = TimelineRow & {
  milestones: TimelineMilestone[]
  annotations: TimelineAnnotation[]
}

// Full timeline with all nested data
export type TimelineWithData = Timeline & {
  rows: TimelineRowWithData[]
  phases: TimelinePhase[]
}

// For creating new entities
export type CreateTimeline = Pick<Timeline, 'title' | 'startYear' | 'endYear'>
export type CreateTimelineRow = Pick<TimelineRow, 'label' | 'color' | 'startDate' | 'endDate'>
export type CreateTimelineMilestone = Pick<TimelineMilestone, 'label' | 'date'>
export type CreateTimelinePhase = Pick<TimelinePhase, 'label' | 'date'>
export type CreateTimelineAnnotation = Pick<TimelineAnnotation, 'label' | 'date'>

// For updates
export type UpdateTimeline = Partial<CreateTimeline>
export type UpdateTimelineRow = Partial<CreateTimelineRow & { position: number }>
export type UpdateTimelineMilestone = Partial<CreateTimelineMilestone & { position: number }>
export type UpdateTimelinePhase = Partial<CreateTimelinePhase & { position: number }>
export type UpdateTimelineAnnotation = Partial<CreateTimelineAnnotation>

// Quarter helper type
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

// Predefined colors for timeline rows
export const TIMELINE_ROW_COLORS = [
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
] as const

// Utility functions for date/quarter handling
export function dateToQuarter(date: Date): { year: number; quarter: Quarter } {
  const month = date.getMonth()
  const year = date.getFullYear()
  const quarter: Quarter = month < 3 ? 'Q1' : month < 6 ? 'Q2' : month < 9 ? 'Q3' : 'Q4'
  return { year, quarter }
}

export function quarterToDate(year: number, quarter: Quarter): Date {
  const monthMap: Record<Quarter, number> = { Q1: 0, Q2: 3, Q3: 6, Q4: 9 }
  return new Date(year, monthMap[quarter], 1)
}

export function formatQuarter(date: Date): string {
  const { year, quarter } = dateToQuarter(date)
  return `${quarter} ${year}`
}

// Calculate position as percentage of total timeline width (supports half-quarter positions)
export function dateToPosition(date: Date, startYear: number, endYear: number): number {
  const totalQuarters = (endYear - startYear + 1) * 4
  const { year, quarter } = dateToQuarter(date)
  const quarterIndex = (year - startYear) * 4 + ['Q1', 'Q2', 'Q3', 'Q4'].indexOf(quarter)

  // Check if mid-quarter (day >= 10 indicates mid-quarter)
  const isMidQuarter = date.getDate() >= 10
  const halfQuarterIndex = quarterIndex * 2 + (isMidQuarter ? 1 : 0)

  const totalHalfQuarters = totalQuarters * 2
  return (halfQuarterIndex / totalHalfQuarters) * 100
}

// Convert position percentage back to date (supports half-quarter positions)
export function positionToDate(position: number, startYear: number, endYear: number): Date {
  const totalQuarters = (endYear - startYear + 1) * 4
  // Calculate in half-quarter units
  const totalHalfQuarters = totalQuarters * 2
  const halfQuarterIndex = Math.round((position / 100) * totalHalfQuarters)

  const quarterIndex = Math.floor(halfQuarterIndex / 2)
  const isMidQuarter = halfQuarterIndex % 2 === 1

  const year = startYear + Math.floor(quarterIndex / 4)
  const quarterNum = quarterIndex % 4
  const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4']
  const monthMap: Record<Quarter, number> = { Q1: 0, Q2: 3, Q3: 6, Q4: 9 }

  // Use day 1 for quarter start, day 15 for mid-quarter
  return new Date(year, monthMap[quarters[quarterNum]], isMidQuarter ? 15 : 1)
}
