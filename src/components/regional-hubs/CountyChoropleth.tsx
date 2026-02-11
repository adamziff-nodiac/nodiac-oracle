'use client'

import { useMemo, useState, useEffect } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'

const COUNTIES_GEOJSON_URL = '/data/us-counties.json'

/**
 * Interpolate between two hex colors.
 */
function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
  }
  const [r1, g1, b1] = parse(a)
  const [r2, g2, b2] = parse(b)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const bl = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

// Color scale: dusty-lilac (low) → white (mid) → secondary/teal (high)
const COLOR_LOW = '#928a97'   // nodiac-dusty-lilac
const COLOR_MID = '#e5e5e7'   // near-white
const COLOR_HIGH = '#4de2e4'  // nodiac-secondary

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
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null)

  useEffect(() => {
    fetch(COUNTIES_GEOJSON_URL)
      .then(res => res.json())
      .then(data => setGeojson(data))
      .catch(err => console.error('Failed to load county boundaries:', err))
  }, [])

  // Build Mapbox match expression for fill color based on FIPS → score lookup
  const fillColorExpression = useMemo(() => {
    if (scoreLookup.size === 0) return 'rgba(50, 50, 60, 0.3)'

    const [minScore, maxScore] = scoreRange
    const range = maxScore - minScore || 1

    // Build a match expression: ['match', ['get', 'FIPS'], fips1, color1, fips2, color2, ..., defaultColor]
    const matchExpr: unknown[] = ['match', ['get', 'FIPS']]

    scoreLookup.forEach((score, fips) => {
      const t = (score - minScore) / range
      let color: string
      if (t <= 0.5) {
        color = lerpColor(COLOR_LOW, COLOR_MID, t * 2)
      } else {
        color = lerpColor(COLOR_MID, COLOR_HIGH, (t - 0.5) * 2)
      }
      matchExpr.push(fips, color)
    })

    matchExpr.push('rgba(30, 30, 40, 0.2)') // default for unscored counties
    return matchExpr as mapboxgl.Expression
  }, [scoreLookup, scoreRange])

  // Hover highlight expression
  const fillOpacityExpression = useMemo(() => {
    if (!hoveredFips) return 0.75
    return [
      'case',
      ['==', ['get', 'FIPS'], hoveredFips],
      1,
      0.75,
    ] as mapboxgl.Expression
  }, [hoveredFips])

  if (!geojson) return null

  return (
    <Source
      id="county-boundaries"
      type="geojson"
      data={geojson}
    >
      <Layer
        id="county-fill"
        type="fill"
        paint={{
          'fill-color': fillColorExpression as string,
          'fill-opacity': fillOpacityExpression as number,
        }}
      />
      <Layer
        id="county-outline"
        type="line"
        paint={{
          'line-color': 'rgba(255, 255, 255, 0.08)',
          'line-width': 0.5,
        }}
      />
    </Source>
  )
}

export { COLOR_LOW, COLOR_MID, COLOR_HIGH }
