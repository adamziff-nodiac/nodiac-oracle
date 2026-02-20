'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { QuantileBreaks } from '@/hooks/useWeightedScores'

// Own color constants — same gradient as county view (gray → navy → orchid)
const GRADIENT_LOW = '#1e1e24'
const GRADIENT_MID_LOW = '#1a2040'
const GRADIENT_MID = '#2a3060'
const GRADIENT_HIGH = '#6b1f5a'
const GRADIENT_ORCHID = '#c77dba'
const GRADIENT_PEAK = '#dbb0d4'
const GRADIENT_NULL = '#1a1a20'
const OUTSIDE_COLOR = '#0d0b12'

interface GradientHubsLayerProps {
  regionsGeojson: GeoJSON.FeatureCollection
  scoreLookup: Map<string, number>
  quantileBreaks: QuantileBreaks | null
  visible?: boolean
}

/**
 * Gradient Hubs View: counties inside hub regions are colored by their
 * composite score using the dark purple -> orchid -> teal gradient.
 * Counties OUTSIDE hub regions are rendered very dark (nearly black).
 * Hub region boundaries are subtly visible via thin county borders.
 */
export function GradientHubsLayer({
  regionsGeojson,
  scoreLookup,
  quantileBreaks,
  visible = true,
}: GradientHubsLayerProps) {
  const visibility = visible ? 'visible' : 'none'

  // Inject composite scores into the regions geojson features
  const scoredRegionsGeojson = useMemo(() => {
    if (scoreLookup.size === 0) return regionsGeojson

    return {
      ...regionsGeojson,
      features: regionsGeojson.features.map(feature => {
        const fips = feature.properties?.FIPS as string | undefined
        const score = fips ? scoreLookup.get(fips) ?? null : null
        return {
          ...feature,
          properties: {
            ...feature.properties,
            compositeScore: score,
          },
        }
      }),
    }
  }, [regionsGeojson, scoreLookup])

  // Build fill-color expression:
  // - Counties outside hubs (clusterStatus === 0): very dark
  // - Counties inside hubs: score-based gradient (same as county view)
  const fillColorExpression = useMemo(() => {
    if (!quantileBreaks) {
      return [
        'case',
        ['==', ['get', 'clusterStatus'], 0], OUTSIDE_COLOR,
        ['==', ['get', 'compositeScore'], null], GRADIENT_NULL,
        GRADIENT_MID,
      ] as unknown as string
    }

    return [
      'case',
      ['==', ['get', 'clusterStatus'], 0], OUTSIDE_COLOR,
      ['==', ['get', 'compositeScore'], null], GRADIENT_NULL,
      [
        'interpolate',
        ['linear'],
        ['get', 'compositeScore'],
        quantileBreaks.min, GRADIENT_LOW,
        quantileBreaks.p40, GRADIENT_MID_LOW,
        quantileBreaks.p60, GRADIENT_MID,
        quantileBreaks.p80, GRADIENT_HIGH,
        quantileBreaks.p95, GRADIENT_ORCHID,
        quantileBreaks.max, GRADIENT_PEAK,
      ],
    ] as unknown as string
  }, [quantileBreaks])

  const fillOpacityExpression = useMemo(() => {
    return [
      'case',
      ['==', ['get', 'clusterStatus'], 0], 0.92,
      0.9,
    ] as unknown as number
  }, [])

  return (
    <Source id="gradient-hubs-source" type="geojson" data={scoredRegionsGeojson}>
      <Layer
        id="gradient-hubs-fill"
        type="fill"
        layout={{ visibility }}
        paint={{
          'fill-color': fillColorExpression,
          'fill-opacity': fillOpacityExpression,
        }}
      />
      <Layer
        id="gradient-hubs-borders"
        type="line"
        layout={{ visibility }}
        paint={{
          'line-color': [
            'case',
            ['>', ['get', 'clusterStatus'], 0],
            'rgba(255, 255, 255, 0.12)',
            'rgba(255, 255, 255, 0.03)',
          ] as unknown as string,
          'line-width': [
            'case',
            ['>', ['get', 'clusterStatus'], 0],
            0.8,
            0.3,
          ] as unknown as number,
        }}
      />
      <Layer
        id="gradient-hubs-boundary"
        type="line"
        layout={{ visibility }}
        filter={['==', ['get', 'clusterStatus'], 2]}
        paint={{
          'line-color': 'rgba(199, 125, 186, 0.4)',
          'line-width': 1.5,
        }}
      />
    </Source>
  )
}
