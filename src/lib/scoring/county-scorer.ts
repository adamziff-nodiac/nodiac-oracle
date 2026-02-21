import type { CountyScore, CriterionKey, WeightedCountyScore, ScoringMode } from '@/types/regional-hubs'
import { computeWeightedMean } from './weighted-mean'

// Re-export ScoringMode for existing consumers
export type { ScoringMode }

/**
 * Extract the score value for a given criterion from a CountyScore record.
 */
function getCriterionValue(county: CountyScore, key: CriterionKey): number {
  const map: Record<CriterionKey, number> = {
    coop_density: county.coop_density_score,
    grid_reliability: county.grid_reliability_score,
    clipped_curtailed: county.clipped_curtailed_score,
    permitting: county.permitting_score,
    tax_incentives: county.tax_incentives_score ?? county.permitting_score,
    labor: county.labor_score,
    fiber: county.fiber_score,
    queue_pressure: county.queue_pressure_score,
  }
  return map[key]
}

/**
 * Compute a weighted composite score for a county using the selected mode.
 * Delegates to the shared computeWeightedMean function.
 */
export function computeCompositeScore(
  county: CountyScore,
  weights: Record<CriterionKey, number>,
  mode: ScoringMode = 'arithmetic'
): number {
  const entries: Array<{ value: number; weight: number }> = []
  for (const key of Object.keys(weights) as CriterionKey[]) {
    const w = weights[key]
    if (w <= 0) continue
    entries.push({ value: getCriterionValue(county, key), weight: w })
  }
  return computeWeightedMean(entries, mode)
}

/**
 * Score all counties with the given weight profile.
 * Returns a new array with composite_score attached.
 */
export function scoreAllCounties(
  counties: CountyScore[],
  weights: Record<CriterionKey, number>,
  mode: ScoringMode = 'arithmetic'
): WeightedCountyScore[] {
  return counties.map(county => ({
    ...county,
    composite_score: computeCompositeScore(county, weights, mode),
  }))
}

/**
 * Build a FIPS → composite score lookup map for fast choropleth rendering.
 */
export function buildScoreLookup(
  counties: CountyScore[],
  weights: Record<CriterionKey, number>,
  mode: ScoringMode = 'arithmetic'
): Map<string, number> {
  const map = new Map<string, number>()
  for (const county of counties) {
    map.set(county.fips_code, computeCompositeScore(county, weights, mode))
  }
  return map
}
