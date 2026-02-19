'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { QuantileBreaks } from '@/hooks/useWeightedScores'

// Color ramp stops (dark purple → bright purple → neon teal)
const COLOR_LOW      = '#1a1520'   // very dark purple — lowest scores
const COLOR_MID_LOW  = '#2d2233'   // dark purple
const COLOR_MID      = '#5c2d55'   // medium purple
const COLOR_HIGH     = '#8b3578'   // bright purple
const COLOR_ORCHID   = '#b48fc1'   // soft orchid — at threshold
const COLOR_PEAK     = '#4de2e4'   // NEON TEAL — above threshold / top percentile
const COLOR_NULL     = '#221d28'   // counties with no data

export type ColorMode = 'percentile' | 'absolute'

interface CountyChoroplethProps {
  baseGeojson: GeoJSON.FeatureCollection
  scoreLookup: Map<string, number>
  scoreRange: readonly [number, number]
  hoveredFips: string | null
  highlightThreshold?: number
  colorMode?: ColorMode
  quantileBreaks?: QuantileBreaks | null
  visible?: boolean
}

export function CountyChoropleth({
  baseGeojson,
  scoreLookup,
  scoreRange,
  hoveredFips,
  highlightThreshold = 6.5,
  colorMode = 'percentile',
  quantileBreaks,
  visible = true,
}: CountyChoroplethProps) {
  // Inject composite scores directly into GeoJSON feature properties.
  // This avoids the Mapbox match-expression size limit (~3k entries).
  const scoredGeojson = useMemo(() => {
    if (scoreLookup.size === 0) return baseGeojson

    return {
      ...baseGeojson,
      features: baseGeojson.features.map(feature => {
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
  }, [baseGeojson, scoreLookup])

  // Hover highlight expression
  const fillOpacityExpression = useMemo(() => {
    if (!hoveredFips) return 0.9
    return [
      'case',
      ['==', ['get', 'FIPS'], hoveredFips],
      1,
      0.85,
    ] as mapboxgl.Expression
  }, [hoveredFips])

  // Color expression depends on mode
  const fillColorExpression = useMemo(() => {
    if (colorMode === 'percentile' && quantileBreaks) {
      // Percentile-based: bottom 40% dark, then ramps through purple → orchid → teal.
      // Orchid at p80, teal from p90 onward so top ~10% clearly glows.
      // Midpoint between p80 and p95 used to start teal transition earlier.
      const p90 = (quantileBreaks.p80 + quantileBreaks.p95) / 2
      return [
        'case',
        ['==', ['get', 'compositeScore'], null],
        COLOR_NULL,
        [
          'interpolate',
          ['linear'],
          ['get', 'compositeScore'],
          quantileBreaks.min,  COLOR_LOW,
          quantileBreaks.p40,  COLOR_LOW,       // bottom 40% stays very dark
          quantileBreaks.p60,  COLOR_MID,       // p40-p60: medium purple
          quantileBreaks.p80,  COLOR_ORCHID,    // p60-p80: orchid
          p90,                 COLOR_PEAK,      // top ~10%: neon teal
        ],
      ] as unknown as string
    }

    // Absolute-score: fixed 0–10 scale with threshold-based teal transition
    const t = highlightThreshold
    return [
      'case',
      ['==', ['get', 'compositeScore'], null],
      COLOR_NULL,
      [
        'interpolate',
        ['linear'],
        ['get', 'compositeScore'],
        0,           COLOR_LOW,
        t * 0.4,     COLOR_MID_LOW,
        t * 0.7,     COLOR_MID,
        t * 0.9,     COLOR_HIGH,
        t,           COLOR_ORCHID,
        Math.min(t + 0.5, 10), COLOR_PEAK,
      ],
    ] as unknown as string
  }, [colorMode, quantileBreaks, highlightThreshold])

  const visibility = visible ? 'visible' : 'none'

  return (
    <Source
      id="county-boundaries"
      type="geojson"
      data={scoredGeojson}
    >
      <Layer
        id="county-fill"
        type="fill"
        layout={{ visibility }}
        paint={{
          'fill-color': fillColorExpression,
          'fill-opacity': fillOpacityExpression as number,
        }}
      />
      <Layer
        id="county-outline"
        type="line"
        layout={{ visibility }}
        paint={{
          'line-color': 'rgba(255, 255, 255, 0.06)',
          'line-width': 0.5,
        }}
      />
    </Source>
  )
}

export { COLOR_LOW, COLOR_MID_LOW, COLOR_MID, COLOR_HIGH, COLOR_ORCHID, COLOR_PEAK, COLOR_NULL }
