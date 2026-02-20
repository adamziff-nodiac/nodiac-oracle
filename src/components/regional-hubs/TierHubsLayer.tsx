'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'

// Tier color constants — orchid hero, fading through purple → navy → gray
export const TIER_1_COLOR = '#c77dba' // Top 10%: bright orchid (brand hero)
export const TIER_2_COLOR = '#6b1f5a' // Top 25%: deep purple
export const TIER_3_COLOR = '#2a3060' // Top 50%: navy
export const TIER_4_COLOR = '#1e1e24' // Other (bottom 50%): dark gray
export const TIER_OUTSIDE_COLOR = '#0d0b12' // Outside hubs: very dark
export const TIER_NULL_COLOR = '#1a1a20' // No data

export interface TierBreaks {
  p50: number
  p75: number
  p90: number
}

/**
 * Compute tier percentile breaks from all county scores.
 * Returns { p50, p75, p90 } thresholds.
 */
export function computeTierBreaks(scoreLookup: Map<string, number>): TierBreaks | null {
  if (scoreLookup.size === 0) return null

  const sorted = Array.from(scoreLookup.values()).sort((a, b) => a - b)
  const n = sorted.length

  const percentile = (p: number) => {
    const idx = (p / 100) * (n - 1)
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    if (lo === hi) return sorted[lo]
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
  }

  return {
    p50: percentile(50),
    p75: percentile(75),
    p90: percentile(90),
  }
}

/**
 * Get the tier (1-4) for a given score based on the tier breaks.
 */
export function getTier(score: number, tierBreaks: TierBreaks): number {
  if (score >= tierBreaks.p90) return 1
  if (score >= tierBreaks.p75) return 2
  if (score >= tierBreaks.p50) return 3
  return 4
}

/**
 * Get the tier color for a given tier number.
 */
export function getTierColor(tier: number): string {
  switch (tier) {
    case 1: return TIER_1_COLOR
    case 2: return TIER_2_COLOR
    case 3: return TIER_3_COLOR
    case 4: return TIER_4_COLOR
    default: return TIER_NULL_COLOR
  }
}

interface TierHubsLayerProps {
  regionsGeojson: GeoJSON.FeatureCollection
  scoreLookup: Map<string, number>
  visible?: boolean
}

/**
 * Tiers Hubs View: counties in hubs are categorized into 4 tiers
 * based on their percentile ranking across ALL counties.
 * Counties OUTSIDE hubs are rendered very dark.
 */
export function TierHubsLayer({
  regionsGeojson,
  scoreLookup,
  visible = true,
}: TierHubsLayerProps) {
  const visibility = visible ? 'visible' : 'none'

  const tierBreaks = useMemo(() => computeTierBreaks(scoreLookup), [scoreLookup])

  const tieredGeojson = useMemo(() => {
    if (!tierBreaks) return regionsGeojson

    return {
      ...regionsGeojson,
      features: regionsGeojson.features.map(feature => {
        const fips = feature.properties?.FIPS as string | undefined
        const clusterStatus = feature.properties?.clusterStatus as number
        const score = fips ? scoreLookup.get(fips) ?? null : null

        let tier: number | null = null
        if (clusterStatus > 0 && score != null) {
          tier = getTier(score, tierBreaks)
        }

        return {
          ...feature,
          properties: {
            ...feature.properties,
            tier,
          },
        }
      }),
    }
  }, [regionsGeojson, scoreLookup, tierBreaks])

  const fillColorExpression = useMemo(() => {
    return [
      'case',
      ['==', ['get', 'clusterStatus'], 0], TIER_OUTSIDE_COLOR,
      ['==', ['get', 'tier'], null], TIER_NULL_COLOR,
      ['==', ['get', 'tier'], 1], TIER_1_COLOR,
      ['==', ['get', 'tier'], 2], TIER_2_COLOR,
      ['==', ['get', 'tier'], 3], TIER_3_COLOR,
      ['==', ['get', 'tier'], 4], TIER_4_COLOR,
      TIER_NULL_COLOR,
    ] as unknown as string
  }, [])

  const fillOpacityExpression = useMemo(() => {
    return [
      'case',
      ['==', ['get', 'clusterStatus'], 0], 0.92,
      ['==', ['get', 'tier'], 1], 0.85,
      ['==', ['get', 'tier'], 2], 0.8,
      ['==', ['get', 'tier'], 3], 0.7,
      0.6,
    ] as unknown as number
  }, [])

  return (
    <Source id="tier-hubs-source" type="geojson" data={tieredGeojson}>
      <Layer
        id="tier-hubs-fill"
        type="fill"
        layout={{ visibility }}
        paint={{
          'fill-color': fillColorExpression,
          'fill-opacity': fillOpacityExpression,
        }}
      />
      <Layer
        id="tier-hubs-borders"
        type="line"
        layout={{ visibility }}
        paint={{
          'line-color': [
            'case',
            ['>', ['get', 'clusterStatus'], 0],
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.03)',
          ] as unknown as string,
          'line-width': [
            'case',
            ['>', ['get', 'clusterStatus'], 0],
            0.7,
            0.3,
          ] as unknown as number,
        }}
      />
    </Source>
  )
}
