import { describe, it, expect } from 'vitest'
import { computeCompositeScore, scoreAllCounties, buildScoreLookup } from './county-scorer'
import type { CountyScore, CriterionKey } from '@/types/regional-hubs'

function makeCounty(overrides: Partial<CountyScore> = {}): CountyScore {
  return {
    fips_code: '27145',
    state_fips: '27',
    county_name: 'Stearns',
    state_abbr: 'MN',
    coop_density_score: 0.8,
    grid_reliability_score: 0.7,
    clipped_curtailed_score: 0.5,
    permitting_score: 0.6,
    labor_score: 0.4,
    fiber_score: 0.9,
    data_sources: {},
    last_permitting_update: null,
    ...overrides,
  }
}

const equalWeights: Record<CriterionKey, number> = {
  coop_density: 1,
  grid_reliability: 1,
  clipped_curtailed: 1,
  permitting: 1,
  labor: 1,
  fiber: 1,
}

describe('computeCompositeScore', () => {
  it('returns weighted average scaled to 0-10 with equal weights', () => {
    const county = makeCounty()
    const score = computeCompositeScore(county, equalWeights)
    // (0.8 + 0.7 + 0.5 + 0.6 + 0.4 + 0.9) / 6 * 10 = 6.5
    expect(score).toBeCloseTo(6.5, 1)
  })

  it('respects custom weights', () => {
    const county = makeCounty()
    const weights: Record<CriterionKey, number> = {
      coop_density: 3,
      grid_reliability: 0,
      clipped_curtailed: 0,
      permitting: 0,
      labor: 0,
      fiber: 0,
    }
    const score = computeCompositeScore(county, weights)
    // Only coop_density matters: 0.8 * 10 = 8.0
    expect(score).toBeCloseTo(8.0, 1)
  })

  it('returns 0 when all weights are 0', () => {
    const county = makeCounty()
    const weights: Record<CriterionKey, number> = {
      coop_density: 0,
      grid_reliability: 0,
      clipped_curtailed: 0,
      permitting: 0,
      labor: 0,
      fiber: 0,
    }
    expect(computeCompositeScore(county, weights)).toBe(0)
  })

  it('handles perfect scores', () => {
    const county = makeCounty({
      coop_density_score: 1,
      grid_reliability_score: 1,
      clipped_curtailed_score: 1,
      permitting_score: 1,
      labor_score: 1,
      fiber_score: 1,
    })
    expect(computeCompositeScore(county, equalWeights)).toBeCloseTo(10, 1)
  })

  it('handles zero scores', () => {
    const county = makeCounty({
      coop_density_score: 0,
      grid_reliability_score: 0,
      clipped_curtailed_score: 0,
      permitting_score: 0,
      labor_score: 0,
      fiber_score: 0,
    })
    expect(computeCompositeScore(county, equalWeights)).toBe(0)
  })
})

describe('scoreAllCounties', () => {
  it('attaches composite_score to each county', () => {
    const counties = [makeCounty(), makeCounty({ fips_code: '27001', coop_density_score: 0.2 })]
    const result = scoreAllCounties(counties, equalWeights)
    expect(result).toHaveLength(2)
    expect(result[0].composite_score).toBeCloseTo(6.5, 1)
    expect(result[1].composite_score).toBeDefined()
    expect(result[1].composite_score).toBeLessThan(result[0].composite_score)
  })
})

describe('buildScoreLookup', () => {
  it('returns a Map keyed by FIPS with composite scores', () => {
    const counties = [makeCounty(), makeCounty({ fips_code: '27001' })]
    const lookup = buildScoreLookup(counties, equalWeights)
    expect(lookup.size).toBe(2)
    expect(lookup.get('27145')).toBeCloseTo(6.5, 1)
    expect(lookup.get('27001')).toBeCloseTo(6.5, 1)
  })
})
