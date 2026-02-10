'use client'

import { useMemo } from 'react'
import type { CountyScore, CriterionKey, WeightedCountyScore } from '@/types/regional-hubs'
import { scoreAllCounties, buildScoreLookup } from '@/lib/scoring/county-scorer'

/**
 * Given raw county scores and a weight profile, returns:
 * - weightedScores: counties with composite_score attached
 * - scoreLookup: FIPS → composite score map for fast choropleth
 * - scoreRange: [min, max] of composite scores for legend scaling
 *
 * All computation is client-side via useMemo — no API call on weight change.
 */
export function useWeightedScores(
  scores: CountyScore[],
  weights: Record<CriterionKey, number>
) {
  const weightedScores = useMemo(
    () => scoreAllCounties(scores, weights),
    [scores, weights]
  )

  const scoreLookup = useMemo(
    () => buildScoreLookup(scores, weights),
    [scores, weights]
  )

  const scoreRange = useMemo(() => {
    if (weightedScores.length === 0) return [0, 10] as const
    const composites = weightedScores.map(s => s.composite_score)
    return [Math.min(...composites), Math.max(...composites)] as const
  }, [weightedScores])

  return { weightedScores, scoreLookup, scoreRange }
}
