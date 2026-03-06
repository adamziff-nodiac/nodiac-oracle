export type SiteTier = 'good' | 'okay' | 'bad'

export interface SiteScoreBreakdown {
  coop_density: number | null
  grid_reliability: number | null
  clipped_curtailed: number | null
  permitting: number | null
  labor: number | null
  fiber: number | null
  queue_pressure: number | null
}

export interface PortfolioUpload {
  id: string
  user_id: string
  name: string
  site_count: number
  created_at: string
  updated_at: string
}

export interface PortfolioSite {
  id: string
  upload_id: string
  site_name: string
  latitude: number | null
  longitude: number | null
  county: string | null
  state: string | null
  fips_code: string | null
  raw_data: Record<string, unknown>
  site_score: number | null
  tier: SiteTier | null
  score_breakdown: SiteScoreBreakdown | null
  utility_type: string | null
}

export interface ParsedSite {
  site_name: string
  latitude: number | null
  longitude: number | null
  utility_name: string | null
  utility_type: string | null
  zoning: string | null
  zoning_rank: string | null
  fiber: string | null
  grid_capacity_mw: number | null
  load_hosting_capacity_mw: number | null
  proposed_dc_capacity_mw: number | null
  net_useable_area_acres: number | null
  raw_data: Record<string, string>
}

export interface FipsLookupResult {
  fips: string
  county_name: string
  state_code: string
  state_name: string
}

export const TIER_COLORS: Record<SiteTier, string> = {
  good: '#c77dba',    // bright orchid — matches regional hub tier 1
  okay: '#6b1f5a',    // deep purple — matches regional hub tier 2
  bad: '#2a3060',     // navy — matches regional hub tier 3
}

export const TIER_LABELS: Record<SiteTier, string> = {
  good: 'Strong Fit',
  okay: 'Moderate Fit',
  bad: 'Weak Fit',
}

// Text-safe colors for badges/labels (readable on both light and dark backgrounds)
export const TIER_TEXT_COLORS: Record<SiteTier, string> = {
  good: '#c77dba',    // bright orchid — readable on both
  okay: '#9b4d8e',    // lighter purple variant for text readability
  bad: '#5b6294',     // lighter navy variant for text readability
}
