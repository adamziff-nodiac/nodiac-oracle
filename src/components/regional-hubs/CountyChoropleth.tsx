'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { QuantileBreaks } from '@/hooks/useWeightedScores'

// Color ramp stops (gray → navy → orchid purple)
// Orchid is the brand hero — best counties glow orchid.
const COLOR_LOW      = '#1e1e24'   // neutral dark gray — lowest scores
const COLOR_MID_LOW  = '#1a2040'   // dark navy — emerging color
const COLOR_MID      = '#2a3060'   // navy — mid-range
const COLOR_HIGH     = '#6b1f5a'   // deep purple — approaching top
const COLOR_ORCHID   = '#c77dba'   // bright orchid — top tier glow
const COLOR_PEAK     = '#dbb0d4'   // lightest orchid — absolute peak
const COLOR_NULL     = '#1a1a20'   // no data — neutral dark

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
  plain?: boolean
  isDark?: boolean
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
  plain = false,
  isDark = true,
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
    if (plain) {
      const baseFill = isDark ? 'rgba(15, 15, 26, 0.3)' : 'rgba(0, 0, 0, 0.03)'
      const hoverFill = isDark ? 'rgba(199, 125, 186, 0.15)' : 'rgba(199, 125, 186, 0.12)'
      if (!hoveredFips) return baseFill
      return [
        'case',
        ['==', ['get', 'FIPS'], hoveredFips],
        hoverFill,
        baseFill,
      ] as unknown as string
    }

    if (colorMode === 'percentile' && quantileBreaks) {
      // Percentile-based: gray → navy → orchid purple.
      // Bottom 40% stays dark gray. Navy emerges p40-p60. Purple builds p60-p80.
      // Top ~10% glows bright orchid — the brand hero color.
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
          quantileBreaks.p40,  COLOR_LOW,       // bottom 40%: dark gray
          quantileBreaks.p60,  COLOR_MID,       // p40-p60: navy
          quantileBreaks.p80,  COLOR_HIGH,      // p60-p80: deep purple
          p90,                 COLOR_ORCHID,    // p80-p90: bright orchid
          quantileBreaks.max,  COLOR_PEAK,      // top: lightest orchid
        ],
      ] as unknown as string
    }

    // Absolute-score: fixed 0–10 scale with threshold-based orchid transition
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
  }, [colorMode, quantileBreaks, highlightThreshold, plain, hoveredFips, isDark])

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
          'line-color': plain
            ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)')
            : 'rgba(255, 255, 255, 0.06)',
          'line-width': plain ? 0.75 : 0.5,
        }}
      />
    </Source>
  )
}

export { COLOR_LOW, COLOR_MID_LOW, COLOR_MID, COLOR_HIGH, COLOR_ORCHID, COLOR_PEAK, COLOR_NULL }
