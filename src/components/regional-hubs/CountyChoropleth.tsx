'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'

const COUNTY_TILESET_URL = 'mapbox://mapbox.boundaries-adm2-v4'
const COUNTY_SOURCE_LAYER = 'boundaries_admin_2'

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
  // Build Mapbox match expression for fill color based on FIPS → score lookup
  const fillColorExpression = useMemo(() => {
    if (scoreLookup.size === 0) return 'rgba(50, 50, 60, 0.3)'

    const [minScore, maxScore] = scoreRange
    const range = maxScore - minScore || 1

    // Build a match expression: ['match', ['get', 'GEOID'], fips1, color1, fips2, color2, ..., defaultColor]
    const matchExpr: unknown[] = ['match', ['get', 'GEOID']]

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
      ['==', ['get', 'GEOID'], hoveredFips],
      1,
      0.75,
    ] as mapboxgl.Expression
  }, [hoveredFips])

  return (
    <Source
      id="county-boundaries"
      type="vector"
      url={COUNTY_TILESET_URL}
    >
      <Layer
        id="county-fill"
        type="fill"
        source-layer={COUNTY_SOURCE_LAYER}
        filter={['==', ['get', 'iso_3166_1'], 'US']}
        paint={{
          'fill-color': fillColorExpression as string,
          'fill-opacity': fillOpacityExpression as number,
        }}
      />
      <Layer
        id="county-outline"
        type="line"
        source-layer={COUNTY_SOURCE_LAYER}
        filter={['==', ['get', 'iso_3166_1'], 'US']}
        paint={{
          'line-color': 'rgba(255, 255, 255, 0.08)',
          'line-width': 0.5,
        }}
      />
    </Source>
  )
}

export { COLOR_LOW, COLOR_MID, COLOR_HIGH }
