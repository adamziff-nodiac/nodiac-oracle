'use client'

import { useMemo, useState, useEffect } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { QuantileBreaks } from '@/hooks/useWeightedScores'

const COUNTIES_GEOJSON_URL = '/data/us-counties.json'

// Quantile-based purple-to-teal color ramp:
// Each band holds ~equal number of counties, so the full gradient is visible.
// Top 5% glow neon teal (Nodiac brand secondary) to pop on dark maps.
const COLOR_P0   = '#1a1520'   // very dark purple — clearly below average
const COLOR_P20  = '#2d2233'   // dark purple — below average
const COLOR_P40  = '#5c2d55'   // medium purple — average
const COLOR_P60  = '#8b3578'   // bright purple — above average
const COLOR_P80  = '#b48fc1'   // soft orchid — strong
const COLOR_P95  = '#4de2e4'   // NEON TEAL — exceptional! Top 5%
const COLOR_NULL = '#221d28'   // counties with no data

// Legacy exports for backward compatibility (MapLegend uses these)
const COLOR_LOW = COLOR_P0
const COLOR_MID = COLOR_P40
const COLOR_HIGH = COLOR_P80
const COLOR_PEAK = COLOR_P95

interface CountyChoroplethProps {
  scoreLookup: Map<string, number>
  scoreRange: readonly [number, number]
  hoveredFips: string | null
  quantileBreaks?: QuantileBreaks | null
}

export function CountyChoropleth({
  scoreLookup,
  scoreRange,
  hoveredFips,
  quantileBreaks,
}: CountyChoroplethProps) {
  const [baseGeojson, setBaseGeojson] = useState<GeoJSON.FeatureCollection | null>(null)

  useEffect(() => {
    fetch(COUNTIES_GEOJSON_URL)
      .then(res => res.json())
      .then(data => setBaseGeojson(data))
      .catch(err => console.error('Failed to load county boundaries:', err))
  }, [])

  // Inject composite scores directly into GeoJSON feature properties.
  // This avoids the Mapbox match-expression size limit (~3k entries).
  const scoredGeojson = useMemo(() => {
    if (!baseGeojson || scoreLookup.size === 0) return baseGeojson

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

  if (!scoredGeojson) return null

  // Build the fill-color expression based on quantile breaks or fallback to linear range
  const fillColorExpression = useMemo(() => {
    if (quantileBreaks) {
      // Quantile-based 6-stop ramp: each color band contains ~equal number of counties
      return [
        'case',
        ['==', ['get', 'compositeScore'], null],
        COLOR_NULL,
        [
          'interpolate',
          ['linear'],
          ['get', 'compositeScore'],
          quantileBreaks.min, COLOR_P0,
          quantileBreaks.p20, COLOR_P20,
          quantileBreaks.p40, COLOR_P40,
          quantileBreaks.p60, COLOR_P60,
          quantileBreaks.p80, COLOR_P80,
          quantileBreaks.p95, COLOR_P95,
        ],
      ] as unknown as string
    }

    // Fallback: linear 4-stop ramp when quantile breaks aren't available yet
    const [minScore, maxScore] = scoreRange
    const midScore = (minScore + maxScore) / 2
    return [
      'case',
      ['==', ['get', 'compositeScore'], null],
      COLOR_NULL,
      [
        'interpolate',
        ['linear'],
        ['get', 'compositeScore'],
        minScore, COLOR_P0,
        midScore, COLOR_P40,
        maxScore * 0.8, COLOR_P80,
        maxScore, COLOR_P95,
      ],
    ] as unknown as string
  }, [quantileBreaks, scoreRange])

  return (
    <Source
      id="county-boundaries"
      type="geojson"
      data={scoredGeojson}
    >
      <Layer
        id="county-fill"
        type="fill"
        paint={{
          'fill-color': fillColorExpression,
          'fill-opacity': fillOpacityExpression as number,
        }}
      />
      <Layer
        id="county-outline"
        type="line"
        paint={{
          'line-color': 'rgba(255, 255, 255, 0.06)',
          'line-width': 0.5,
        }}
      />
    </Source>
  )
}

export { COLOR_LOW, COLOR_MID, COLOR_HIGH, COLOR_PEAK }
export { COLOR_P0, COLOR_P20, COLOR_P40, COLOR_P60, COLOR_P80, COLOR_P95, COLOR_NULL }
