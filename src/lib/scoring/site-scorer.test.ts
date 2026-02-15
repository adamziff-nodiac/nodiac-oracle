import { describe, it, expect } from 'vitest'
import { scoreSite, buildSiteBreakdown } from './site-scorer'
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
    const { score, tier } = scoreSite(breakdown)
    // avg = (0.8+0.7+0.5+0.6+0.4+0.9+0.6)/7 ≈ 0.643 → 6.4
    expect(score).toBeCloseTo(6.4, 1)
    expect(tier).toBe('okay')
  })

  it('assigns "okay" tier for moderate scores', () => {
    const breakdown: SiteScoreBreakdown = {
      coop_density: 0.5,
      grid_reliability: 0.5,
      clipped_curtailed: 0.5,
      permitting: 0.5,
      labor: 0.5,
      fiber: 0.5,
      queue_pressure: 0.5,
    }
    const { score, tier } = scoreSite(breakdown)
    expect(score).toBeCloseTo(5.0, 1)
    expect(tier).toBe('okay')
  })

  it('assigns "bad" tier for low scores', () => {
    const breakdown: SiteScoreBreakdown = {
      coop_density: 0.2,
      grid_reliability: 0.1,
      clipped_curtailed: 0.3,
      permitting: 0.1,
      labor: 0.2,
      fiber: 0.1,
      queue_pressure: 0.1,
    }
    const { score, tier } = scoreSite(breakdown)
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
    const { score, tier } = scoreSite(breakdown)
    // avg = (0.8+0.8+0.8)/3 = 0.8 → 8.0
    expect(score).toBeCloseTo(8.0, 1)
    expect(tier).toBe('good')
  })

  it('returns score 0 and tier bad for all-null breakdown', () => {
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
