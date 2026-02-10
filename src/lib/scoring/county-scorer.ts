import type { CountyScore, CriterionKey, WeightedCountyScore } from '@/types/regional-hubs'

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
 * Compute a weighted composite score for a county.
 * Each criterion score (0-1) is multiplied by its weight,
 * then divided by the sum of weights to produce a 0-1 composite.
 * Final output is scaled to 0-10 for display.
 */
export function computeCompositeScore(
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
 * Score all counties with the given weight profile.
 * Returns a new array with composite_score attached.
 */
export function scoreAllCounties(
  counties: CountyScore[],
  weights: Record<CriterionKey, number>
): WeightedCountyScore[] {
  return counties.map(county => ({
    ...county,
    composite_score: computeCompositeScore(county, weights),
  }))
}

/**
 * Build a FIPS → composite score lookup map for fast choropleth rendering.
 */
export function buildScoreLookup(
  counties: CountyScore[],
  weights: Record<CriterionKey, number>
): Map<string, number> {
  const map = new Map<string, number>()
  for (const county of counties) {
    map.set(county.fips_code, computeCompositeScore(county, weights))
  }
  return map
}
