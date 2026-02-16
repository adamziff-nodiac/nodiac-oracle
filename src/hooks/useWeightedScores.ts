'use client'

import { useMemo } from 'react'
import type { CountyScore, CriterionKey, WeightedCountyScore } from '@/types/regional-hubs'
import { scoreAllCounties, buildScoreLookup } from '@/lib/scoring/county-scorer'
import type { ScoringMode } from '@/lib/scoring/county-scorer'

export interface QuantileBreaks {
  min: number
  p20: number
  p40: number
  p60: number
  p80: number
  p95: number
  max: number
}

/**
 * Compute a percentile value from a sorted array using linear interpolation.
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

/**
 * Given raw county scores and a weight profile, returns:
 * - weightedScores: counties with composite_score attached
 * - scoreLookup: FIPS → composite score map for fast choropleth
 * - scoreRange: [min, max] of composite scores for legend scaling
 * - quantileBreaks: percentile breakpoints for quantile-based coloring
 *
 * All computation is client-side via useMemo — no API call on weight change.
 */
export function useWeightedScores(
  scores: CountyScore[],
  weights: Record<CriterionKey, number>,
  scoringMode: ScoringMode = 'arithmetic'
) {
  const weightedScores = useMemo(
    () => scoreAllCounties(scores, weights, scoringMode),
    [scores, weights, scoringMode]
  )

  const scoreLookup = useMemo(
    () => buildScoreLookup(scores, weights, scoringMode),
    [scores, weights, scoringMode]
  )

  const scoreRange = useMemo(() => {
    if (weightedScores.length === 0) return [0, 10] as const
    const composites = weightedScores.map(s => s.composite_score)
    return [Math.min(...composites), Math.max(...composites)] as const
  }, [weightedScores])

  const quantileBreaks = useMemo<QuantileBreaks | null>(() => {
    if (weightedScores.length === 0) return null
    const sorted = weightedScores
      .map(s => s.composite_score)
      .sort((a, b) => a - b)
    return {
      min: sorted[0],
      p20: percentile(sorted, 20),
      p40: percentile(sorted, 40),
      p60: percentile(sorted, 60),
      p80: percentile(sorted, 80),
      p95: percentile(sorted, 95),
      max: sorted[sorted.length - 1],
    }
  }, [weightedScores])

  return { weightedScores, scoreLookup, scoreRange, quantileBreaks }
}
