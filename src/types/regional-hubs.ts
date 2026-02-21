export type CriterionKey =
  | 'coop_density'
  | 'grid_reliability'
  | 'clipped_curtailed'
  | 'permitting'
  | 'tax_incentives'
  | 'labor'
  | 'fiber'
  | 'queue_pressure'

export type ScoringMode = 'arithmetic' | 'geometric'

export const CRITERION_LABELS: Record<CriterionKey, string> = {
  coop_density: 'Co-op Density',
  grid_reliability: 'Grid Reliability',
  clipped_curtailed: 'Curtailment Opportunity',
  permitting: 'Permitting',
  tax_incentives: 'Tax & Incentives',
  labor: 'Skilled IT Labor',
  fiber: 'Fiber Availability',
  queue_pressure: 'Queue Pressure',
}

export const CRITERION_DESCRIPTIONS: Record<CriterionKey, string> = {
  coop_density: 'Share of county served by electric cooperatives',
  grid_reliability: 'Grid uptime based on multi-year SAIDI averages (2013-2024)',
  clipped_curtailed: 'Renewable curtailment, inverter clipping, negative pricing, and congestion indicating excess capacity',
  permitting: 'Local permitting friendliness for data centers (zoning, ordinances, moratoria)',
  tax_incentives: 'State and local tax incentives, abatements, and enterprise zones for data centers',
  labor: 'Tech business density per capita (proxy for available talent)',
  fiber: 'Household broadband adoption (proxy for fiber infrastructure)',
  queue_pressure: 'Interconnection queue congestion from LBNL Queued Up data',
}

export interface PermittingCitation {
  title: string
  url: string
  relevance: string
  type: 'state_policy' | 'incentive' | 'regulatory' | 'opposition' | 'moratorium'
}

export interface CountyScoreData {
  permitting_citation_registry: PermittingCitation[]
  counties: CountyScore[]
}

export interface QueueTypeBreakdown {
  solar: number
  wind: number
  storage: number
  gas: number
}

export interface CountyScore {
  fips_code: string
  state_fips: string
  county_name: string
  state_abbr: string
  coop_density_score: number
  grid_reliability_score: number
  clipped_curtailed_score: number
  permitting_score: number
  tax_incentives_score?: number
  labor_score: number
  fiber_score: number
  queue_pressure_score: number
  data_sources: Record<string, string>
  last_permitting_update: string | null
  permitting_citation_ids?: number[]
  grid_reliability_years?: number
  grid_reliability_data_range?: string
  grid_reliability_avg_saidi?: number
  no_zoning?: boolean
  queue_type_breakdown?: QueueTypeBreakdown
}

export interface WeightProfile {
  id: string
  name: string
  description: string
  weights: Record<CriterionKey, number>
}

export interface WeightedCountyScore extends CountyScore {
  composite_score: number
}

export const ALL_CRITERIA: CriterionKey[] = [
  'coop_density',
  'grid_reliability',
  'clipped_curtailed',
  'permitting',
  'tax_incentives',
  'labor',
  'fiber',
  'queue_pressure',
]
