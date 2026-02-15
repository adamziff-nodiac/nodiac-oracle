'use client'

import { useMemo } from 'react'
import type { CountyScore, CriterionKey, ScoringMode, WeightedCountyScore } from '@/types/regional-hubs'
import { scoreAllCounties, buildScoreLookup } from '@/lib/scoring/county-scorer'

export interface QuantileBreaks {
  p20: number
  p40: number
  p60: number
  p80: number
  p95: number
  min: number
  max: number
}

/**
 * Given raw county scores and a weight profile, returns:
 * - weightedScores: counties with composite_score attached
 * - scoreLookup: FIPS → composite score map for fast choropleth
 * - scoreRange: [min, max] of composite scores for legend scaling
 * - quantileBreaks: percentile breakpoints (P20/P40/P60/P80/P95) for quantile-based color classification
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
    const values = weightedScores
      .map(s => s.composite_score)
      .filter(v => v !== null && v !== undefined)
      .sort((a, b) => a - b)

    if (values.length === 0) return null

    const percentile = (arr: number[], p: number) => {
      const idx = (p / 100) * (arr.length - 1)
      const lo = Math.floor(idx)
      const hi = Math.ceil(idx)
      return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo)
    }

    return {
      p20: percentile(values, 20),
      p40: percentile(values, 40),
      p60: percentile(values, 60),
      p80: percentile(values, 80),
      p95: percentile(values, 95),
      min: values[0],
      max: values[values.length - 1],
    }
  }, [weightedScores])

  return { weightedScores, scoreLookup, scoreRange, quantileBreaks }
}
