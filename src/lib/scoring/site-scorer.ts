import type { SiteScoreBreakdown, SiteTier } from '@/types/screening'

const TIER_THRESHOLDS = {
  good: 6.5,
  okay: 4.0,
} as const

/**
 * Score a site based on its criterion breakdown.
 * Each criterion is 0-1; we average available scores and scale to 0-10.
 */
export function scoreSite(breakdown: SiteScoreBreakdown): { score: number; tier: SiteTier } {
  const values = Object.values(breakdown).filter(
    (v): v is number => v !== null && v !== undefined
  )

  if (values.length === 0) {
    return { score: 0, tier: 'bad' }
  }

  const avg = values.reduce((sum, v) => sum + v, 0) / values.length
  const score = Math.round(avg * 100) / 10 // 0-10 scale, 1 decimal

  const tier: SiteTier =
    score >= TIER_THRESHOLDS.good
      ? 'good'
      : score >= TIER_THRESHOLDS.okay
        ? 'okay'
        : 'bad'

  return { score, tier }
}

/**
 * Build a SiteScoreBreakdown from county scores, matching by FIPS.
 */
export function buildSiteBreakdown(countyScores: {
  coop_density_score: number
  grid_reliability_score: number
  clipped_curtailed_score: number
  permitting_score: number
  labor_score: number
  fiber_score: number
} | null): SiteScoreBreakdown {
  if (!countyScores) {
    return {
      coop_density: null,
      grid_reliability: null,
      clipped_curtailed: null,
      permitting: null,
      labor: null,
      fiber: null,
    }
  }

  return {
    coop_density: countyScores.coop_density_score,
    grid_reliability: countyScores.grid_reliability_score,
    clipped_curtailed: countyScores.clipped_curtailed_score,
    permitting: countyScores.permitting_score,
    labor: countyScores.labor_score,
    fiber: countyScores.fiber_score,
  }
}
