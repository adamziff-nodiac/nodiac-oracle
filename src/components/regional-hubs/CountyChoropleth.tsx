'use client'

import { useMemo, useState, useEffect } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'

const COUNTIES_GEOJSON_URL = '/data/us-counties.json'

// Absolute-score color ramp (0–10 scale):
// Smooth purple gradient from 0 up to the highlight threshold,
// then transitions to neon teal above the threshold.
const COLOR_LOW      = '#1a1520'   // very dark purple — lowest scores
const COLOR_MID_LOW  = '#2d2233'   // dark purple
const COLOR_MID      = '#5c2d55'   // medium purple
const COLOR_HIGH     = '#8b3578'   // bright purple
const COLOR_ORCHID   = '#b48fc1'   // soft orchid — at threshold
const COLOR_PEAK     = '#4de2e4'   // NEON TEAL — above threshold
const COLOR_NULL     = '#221d28'   // counties with no data

interface CountyChoroplethProps {
  scoreLookup: Map<string, number>
  scoreRange: readonly [number, number]
  hoveredFips: string | null
  highlightThreshold?: number
}

export function CountyChoropleth({
  scoreLookup,
  scoreRange,
  hoveredFips,
  highlightThreshold = 6.5,
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

  // Absolute-score color expression: fixed 0–10 scale with threshold-based teal transition
  const fillColorExpression = useMemo(() => {
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
  }, [highlightThreshold])

  if (!scoredGeojson) return null

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

export { COLOR_LOW, COLOR_MID_LOW, COLOR_MID, COLOR_HIGH, COLOR_ORCHID, COLOR_PEAK, COLOR_NULL }
