import { describe, it, expect } from 'vitest'
import { scoreSite, scoreSiteWeighted, assignPercentileTiers, buildSiteBreakdown } from './site-scorer'
import type { SiteScoreBreakdown } from '@/types/screening'

describe('scoreSite', () => {
  it('scores a fully populated breakdown', () => {
    const breakdown: SiteScoreBreakdown = {
      coop_density: 0.8,
      grid_reliability: 0.7,
      clipped_curtailed: 0.5,
      permitting: 0.6,
      labor: 0.4,
      fiber: 0.9,
      queue_pressure: 0.6,
    }
    const { score } = scoreSite(breakdown)
    // avg = (0.8+0.7+0.5+0.6+0.4+0.9+0.6)/7 ≈ 0.643 → 6.4
    expect(score).toBeCloseTo(6.4, 1)
  })

  it('returns score 0 for all-null breakdown', () => {
    const breakdown: SiteScoreBreakdown = {
      coop_density: null,
      grid_reliability: null,
      clipped_curtailed: null,
      permitting: null,
      labor: null,
      fiber: null,
      queue_pressure: null,
    }
    const { score, tier } = scoreSite(breakdown)
    expect(score).toBe(0)
    expect(tier).toBe('bad')
  })

  it('handles null values by averaging only available scores', () => {
    const breakdown: SiteScoreBreakdown = {
      coop_density: 0.8,
      grid_reliability: null,
      clipped_curtailed: null,
      permitting: 0.8,
      labor: null,
      fiber: 0.8,
      queue_pressure: null,
    }
    const { score } = scoreSite(breakdown)
    // avg = (0.8+0.8+0.8)/3 = 0.8 → 8.0
    expect(score).toBeCloseTo(8.0, 1)
  })
})

describe('scoreSiteWeighted', () => {
  const breakdown: SiteScoreBreakdown = {
    coop_density: 0.8,
    grid_reliability: 0.7,
    clipped_curtailed: 0.5,
    permitting: 0.6,
    labor: 0.4,
    fiber: 0.9,
    queue_pressure: 0.6,
  }

  const balancedWeights = {
    coop_density: 1,
    grid_reliability: 1,
    clipped_curtailed: 1,
    permitting: 1,
    labor: 1,
    fiber: 1,
    queue_pressure: 1,
  }

  it('returns a number (score only)', () => {
    const score = scoreSiteWeighted(breakdown, balancedWeights)
    expect(typeof score).toBe('number')
    expect(score).toBeCloseTo(6.4, 1)
  })

  it('returns 0 for empty breakdown', () => {
    const empty: SiteScoreBreakdown = {
      coop_density: null, grid_reliability: null, clipped_curtailed: null,
      permitting: null, labor: null, fiber: null, queue_pressure: null,
    }
    expect(scoreSiteWeighted(empty, balancedWeights)).toBe(0)
  })

  it('geometric mode produces lower scores than arithmetic', () => {
    const arith = scoreSiteWeighted(breakdown, balancedWeights, 'arithmetic')
    const geo = scoreSiteWeighted(breakdown, balancedWeights, 'geometric')
    expect(geo).toBeLessThan(arith)
  })
})

describe('assignPercentileTiers', () => {
  it('assigns tiers by percentile rank', () => {
    const sites = [
      { id: '1', site_score: 9.0 },
      { id: '2', site_score: 8.0 },
      { id: '3', site_score: 7.0 },
      { id: '4', site_score: 5.0 },
      { id: '5', site_score: 4.0 },
      { id: '6', site_score: 3.0 },
      { id: '7', site_score: 2.0 },
      { id: '8', site_score: 1.0 },
      { id: '9', site_score: 0.5 },
    ]
    const result = assignPercentileTiers(sites)
    // Top 33% (indices 0-2) = good, middle (3-5) = okay, bottom (6-8) = bad
    expect(result[0].tier).toBe('good')
    expect(result[1].tier).toBe('good')
    expect(result[2].tier).toBe('good')
    expect(result[5].tier).toBe('okay')
    expect(result[8].tier).toBe('bad')
  })

  it('handles all-null scores', () => {
    const sites = [
      { id: '1', site_score: null },
      { id: '2', site_score: null },
    ]
    const result = assignPercentileTiers(sites)
    expect(result[0].tier).toBe('bad')
    expect(result[1].tier).toBe('bad')
  })

  it('handles single site', () => {
    const sites = [{ id: '1', site_score: 5.0 }]
    const result = assignPercentileTiers(sites)
    // Single site is top 100% — good
    expect(result[0].tier).toBe('good')
  })
})

describe('buildSiteBreakdown', () => {
  it('maps county scores to breakdown', () => {
    const countyScores = {
      coop_density_score: 0.8,
      grid_reliability_score: 0.7,
      clipped_curtailed_score: 0.5,
      permitting_score: 0.6,
      labor_score: 0.4,
      fiber_score: 0.9,
      queue_pressure_score: 0.6,
    }
    const breakdown = buildSiteBreakdown(countyScores)
    expect(breakdown.coop_density).toBe(0.8)
    expect(breakdown.fiber).toBe(0.9)
  })

  it('returns all nulls for null input', () => {
    const breakdown = buildSiteBreakdown(null)
    expect(Object.values(breakdown).every(v => v === null)).toBe(true)
  })
})
