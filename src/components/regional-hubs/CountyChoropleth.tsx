'use client'

import { useMemo, useState, useEffect } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'

const COUNTIES_GEOJSON_URL = '/data/us-counties.json'

// Purple scale: transparent dark (low) → mid purple → Nodiac purple (high)
// Most desirable locations glow in Nodiac purple
const COLOR_LOW = '#1a1520'     // near-invisible, blends with dark map
const COLOR_MID = '#4d2445'     // mid-range purple
const COLOR_HIGH = '#8b3578'    // bright Nodiac purple (visible on dark bg)
const COLOR_PEAK = '#b48fc1'    // soft orchid for top scores — max pop

interface CountyChoroplethProps {
  scoreLookup: Map<string, number>
  scoreRange: readonly [number, number]
  hoveredFips: string | null
}

export function CountyChoropleth({
  scoreLookup,
  scoreRange,
  hoveredFips,
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
    if (!hoveredFips) return 0.85
    return [
      'case',
      ['==', ['get', 'FIPS'], hoveredFips],
      1,
      0.85,
    ] as mapboxgl.Expression
  }, [hoveredFips])

  if (!scoredGeojson) return null

  const [minScore, maxScore] = scoreRange
  const midScore = (minScore + maxScore) / 2

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
          'fill-color': [
            'case',
            ['==', ['get', 'compositeScore'], null],
            'rgba(25, 22, 30, 0.3)',
            [
              'interpolate',
              ['linear'],
              ['get', 'compositeScore'],
              minScore, COLOR_LOW,
              midScore, COLOR_MID,
              maxScore * 0.8, COLOR_HIGH,
              maxScore, COLOR_PEAK,
            ],
          ] as unknown as string,
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
