import type { SiteScoreBreakdown, SiteTier } from '@/types/screening'
import type { CriterionKey, ScoringMode } from '@/types/regional-hubs'
import { computeWeightedMean } from './weighted-mean'

const TIER_THRESHOLDS = {
  good: 6.5,
  okay: 4.0,
} as const

function assignTier(score: number): SiteTier {
  return score >= TIER_THRESHOLDS.good
    ? 'good'
    : score >= TIER_THRESHOLDS.okay
      ? 'okay'
      : 'bad'
}

/**
 * Build {value, weight} entries from a breakdown + weights,
 * skipping null/undefined values and zero-weight criteria.
 */
function buildEntries(
  breakdown: SiteScoreBreakdown,
  weights: Record<CriterionKey, number>
): Array<{ value: number; weight: number }> {
  const entries: Array<{ value: number; weight: number }> = []
  for (const key of Object.keys(weights) as CriterionKey[]) {
    const w = weights[key]
    if (w <= 0) continue
    const value = breakdown[key]
    if (value === null || value === undefined) continue
    entries.push({ value, weight: w })
  }
  return entries
}

/**
 * Score a site based on its criterion breakdown (simple average).
 * Each criterion is 0-1; we average available scores and scale to 0-10.
 * Used server-side for default (Balanced) scoring.
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

  return { score, tier: assignTier(score) }
}

/**
 * Score a site using weighted criteria and scoring mode.
 * Delegates to the shared computeWeightedMean — same math as county scoring.
 *
 * The only difference from county scoring is that site breakdowns can have
 * null values (e.g. when a county has no data for a criterion), which are
 * skipped rather than treated as zero.
 */
export function scoreSiteWeighted(
  breakdown: SiteScoreBreakdown,
  weights: Record<CriterionKey, number>,
  mode: ScoringMode = 'arithmetic'
): { score: number; tier: SiteTier } {
  const entries = buildEntries(breakdown, weights)
  if (entries.length === 0) return { score: 0, tier: 'bad' }

  const raw = computeWeightedMean(entries, mode)
  const score = Math.round(raw * 10) / 10 // 1 decimal

  return { score, tier: assignTier(score) }
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
  queue_pressure_score: number
} | null): SiteScoreBreakdown {
  if (!countyScores) {
    return {
      coop_density: null,
      grid_reliability: null,
      clipped_curtailed: null,
      permitting: null,
      labor: null,
      fiber: null,
      queue_pressure: null,
    }
  }

  return {
    coop_density: countyScores.coop_density_score,
    grid_reliability: countyScores.grid_reliability_score,
    clipped_curtailed: countyScores.clipped_curtailed_score,
    permitting: countyScores.permitting_score,
    labor: countyScores.labor_score,
    fiber: countyScores.fiber_score,
    queue_pressure: countyScores.queue_pressure_score,
  }
}
