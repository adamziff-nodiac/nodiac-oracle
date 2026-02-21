import type { SiteScoreBreakdown, SiteTier } from '@/types/screening'
import type { CriterionKey, ScoringMode } from '@/types/regional-hubs'
import { computeWeightedMean } from './weighted-mean'

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
 * Used server-side for initial scoring at upload time.
 * Tier is a placeholder — client-side re-scoring assigns percentile-based tiers.
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

  // Placeholder tier — overridden by percentile tiers client-side
  return { score, tier: 'okay' }
}

/**
 * Score a site using weighted criteria and scoring mode.
 * Returns only the score — tier assignment is done by assignPercentileTiers()
 * after all sites in the portfolio have been scored.
 */
export function scoreSiteWeighted(
  breakdown: SiteScoreBreakdown,
  weights: Record<CriterionKey, number>,
  mode: ScoringMode = 'arithmetic'
): number {
  const entries = buildEntries(breakdown, weights)
  if (entries.length === 0) return 0

  const raw = computeWeightedMean(entries, mode)
  return Math.round(raw * 10) / 10 // 1 decimal
}

/**
 * Assign tiers based on percentile rank within the portfolio.
 * Top ~33% = Strong Fit, middle ~34% = Moderate Fit, bottom ~33% = Weak Fit.
 *
 * This mirrors the county map's percentile-based color scale — tiers are
 * relative to the portfolio, not pegged to fixed score thresholds. Changing
 * weights or scoring mode re-ranks the portfolio and tiers shift accordingly.
 */
export function assignPercentileTiers<T extends { site_score: number | null }>(
  sites: T[]
): (T & { tier: SiteTier })[] {
  const scoredSites = sites.filter(s => s.site_score != null)
  if (scoredSites.length === 0) {
    return sites.map(s => ({ ...s, tier: 'bad' as SiteTier }))
  }

  // Sort descending by score to find percentile cutoffs
  const sorted = scoredSites
    .map(s => s.site_score!)
    .sort((a, b) => b - a)

  const p33 = sorted[Math.floor(sorted.length * 0.33)] ?? sorted[sorted.length - 1]
  const p66 = sorted[Math.floor(sorted.length * 0.66)] ?? sorted[sorted.length - 1]

  return sites.map(s => {
    if (s.site_score == null) return { ...s, tier: 'bad' as SiteTier }

    const tier: SiteTier =
      s.site_score >= p33 ? 'good'
        : s.site_score >= p66 ? 'okay'
          : 'bad'

    return { ...s, tier }
  })
}

/**
 * Build a SiteScoreBreakdown from county scores, matching by FIPS.
 */
export function buildSiteBreakdown(countyScores: {
  coop_density_score: number
  grid_reliability_score: number
  clipped_curtailed_score: number
  permitting_score: number
  tax_incentives_score?: number
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
      tax_incentives: null,
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
    tax_incentives: countyScores.tax_incentives_score ?? countyScores.permitting_score,
    labor: countyScores.labor_score,
    fiber: countyScores.fiber_score,
    queue_pressure: countyScores.queue_pressure_score,
  }
}
