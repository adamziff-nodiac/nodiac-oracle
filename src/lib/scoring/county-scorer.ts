import type { CountyScore, CriterionKey, WeightedCountyScore } from '@/types/regional-hubs'

export type ScoringMode = 'arithmetic' | 'geometric'

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
  }
  return map[key]
}

/**
 * Compute a weighted arithmetic mean composite score for a county.
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
 * Compute a weighted geometric mean composite score for a county.
 * Uses log-space summation: exp(Σ(w_i * ln(v_i + ε)) / Σw_i) * 10
 * Geometric mean penalises counties that score near-zero on any criterion,
 * even if other scores are high — rewarding balanced performance.
 */
function computeGeometricScore(
  county: CountyScore,
  weights: Record<CriterionKey, number>
): number {
  const epsilon = 0.001
  let weightedLogSum = 0
  let totalWeight = 0

  for (const key of Object.keys(weights) as CriterionKey[]) {
    const w = weights[key]
    if (w <= 0) continue
    const v = getCriterionValue(county, key)
    weightedLogSum += w * Math.log(v + epsilon)
    totalWeight += w
  }

  if (totalWeight === 0) return 0
  return Math.exp(weightedLogSum / totalWeight) * 10
}

/**
 * Compute a weighted composite score for a county using the selected mode.
 */
export function computeCompositeScore(
  county: CountyScore,
  weights: Record<CriterionKey, number>,
  mode: ScoringMode = 'arithmetic'
): number {
  return mode === 'geometric'
    ? computeGeometricScore(county, weights)
    : computeArithmeticScore(county, weights)
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
