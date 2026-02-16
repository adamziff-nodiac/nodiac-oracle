import type { ScoringMode } from '@/types/regional-hubs'

/**
 * Core weighted mean computation shared by county-scorer and site-scorer.
 * Takes an array of {value, weight} pairs and returns a 0–10 composite score.
 *
 * This is the single source of truth for scoring math — both county-level
 * analysis and site-level screening use this function.
 */
export function computeWeightedMean(
  entries: Array<{ value: number; weight: number }>,
  mode: ScoringMode = 'arithmetic'
): number {
  if (entries.length === 0) return 0

  if (mode === 'geometric') {
    return computeGeometric(entries)
  }
  return computeArithmetic(entries)
}

function computeArithmetic(entries: Array<{ value: number; weight: number }>): number {
  let weightedSum = 0
  let totalWeight = 0

  for (const { value, weight } of entries) {
    weightedSum += value * weight
    totalWeight += weight
  }

  if (totalWeight === 0) return 0
  return (weightedSum / totalWeight) * 10
}

function computeGeometric(entries: Array<{ value: number; weight: number }>): number {
  const epsilon = 0.001
  let weightedLogSum = 0
  let totalWeight = 0

  for (const { value, weight } of entries) {
    weightedLogSum += weight * Math.log(value + epsilon)
    totalWeight += weight
  }

  if (totalWeight === 0) return 0
  return Math.exp(weightedLogSum / totalWeight) * 10
}
