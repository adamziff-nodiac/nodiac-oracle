import type { CountyScore, CriterionKey, ScoringMode, WeightedCountyScore } from '@/types/regional-hubs'

/**
 * Extract the score value for a given criterion from a CountyScore record.
 */
function getCriterionValue(county: CountyScore, key: CriterionKey): number {
  const map: Record<CriterionKey, number> = {
    coop_density: county.coop_density_score,
    grid_reliability: county.grid_reliability_score,
    clipped_curtailed: county.clipped_curtailed_score,
    permitting: county.permitting_score,
    labor: county.labor_score,
    fiber: county.fiber_score,
    queue_pressure: county.queue_pressure_score,
  }
  return map[key]
}

/**
 * Compute a weighted composite score for a county using arithmetic mean.
 * Each criterion score (0-1) is multiplied by its weight,
 * then divided by the sum of weights to produce a 0-1 composite.
 * Final output is scaled to 0-10 for display.
 */
function computeArithmeticScore(
  county: CountyScore,
  weights: Record<CriterionKey, number>
): number {
  let weightedSum = 0
  let totalWeight = 0

  for (const key of Object.keys(weights) as CriterionKey[]) {
    const w = weights[key]
    if (w <= 0) continue
    weightedSum += getCriterionValue(county, key) * w
    totalWeight += w
  }

  if (totalWeight === 0) return 0
  return (weightedSum / totalWeight) * 10
}

/**
 * Compute a weighted composite score using geometric mean.
 * Geometric mean penalizes counties with near-zero scores in any criterion,
 * rewarding balanced performance across all dimensions.
 *
 * Formula: exp(sum(w_i * ln(score_i + epsilon)) / sum(w_i)) * 10
 * Epsilon (0.001) prevents ln(0) while preserving the penalty for zeros.
 */
function computeGeometricScore(
  county: CountyScore,
  weights: Record<CriterionKey, number>
): number {
  const EPSILON = 0.001
  let logSum = 0
  let totalWeight = 0

  for (const key of Object.keys(weights) as CriterionKey[]) {
    const w = weights[key]
    if (w <= 0) continue
    const val = getCriterionValue(county, key)
    logSum += w * Math.log(val + EPSILON)
    totalWeight += w
  }

  if (totalWeight === 0) return 0
  const geometricMean = Math.exp(logSum / totalWeight)
  return geometricMean * 10
}

/**
 * Compute a weighted composite score for a county.
 * Supports both arithmetic (default) and geometric mean scoring.
 */
export function computeCompositeScore(
  county: CountyScore,
  weights: Record<CriterionKey, number>,
  mode: ScoringMode = 'arithmetic'
): number {
  if (mode === 'geometric') {
    return computeGeometricScore(county, weights)
  }
  return computeArithmeticScore(county, weights)
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
