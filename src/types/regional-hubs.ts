export type CriterionKey =
  | 'coop_density'
  | 'grid_reliability'
  | 'clipped_curtailed'
  | 'permitting'
  | 'labor'
  | 'fiber'

export const CRITERION_LABELS: Record<CriterionKey, string> = {
  coop_density: 'Co-op Density',
  grid_reliability: 'Grid Reliability',
  clipped_curtailed: 'Clipped/Curtailed',
  permitting: 'Permitting',
  labor: 'Skilled IT Labor',
  fiber: 'Fiber Availability',
}

export const CRITERION_DESCRIPTIONS: Record<CriterionKey, string> = {
  coop_density: 'Share of county served by electric cooperatives',
  grid_reliability: 'Grid uptime based on SAIDI/SAIFI metrics',
  clipped_curtailed: 'Renewable curtailment indicating excess capacity',
  permitting: 'Local permitting friendliness for data centers',
  labor: 'IT and telecom workforce per capita',
  fiber: 'Fiber broadband availability by census block',
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

export interface CountyScore {
  fips_code: string
  state_fips: string
  county_name: string
  state_abbr: string
  coop_density_score: number
  grid_reliability_score: number
  clipped_curtailed_score: number
  permitting_score: number
  labor_score: number
  fiber_score: number
  data_sources: Record<string, string>
  last_permitting_update: string | null
  permitting_citation_ids?: number[]
}

export interface HubRegion {
  id: string
  name: string
  description: string | null
  geojson: GeoJSON.Feature | GeoJSON.FeatureCollection
  color: string
  priority_rank: number | null
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
  'labor',
  'fiber',
]
