'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import { computeCentroids } from '@/lib/geo/compute-centroids'

interface ScoreDotsLayerProps {
  geojson: GeoJSON.FeatureCollection | null
  scoreLookup: Map<string, number>
  visible?: boolean
}

/**
 * Proportional circles at county centroids.
 * Radius and color intensity encode score.
 * Only counties above median are shown.
 */
export function ScoreDotsLayer({ geojson, scoreLookup, visible = true }: ScoreDotsLayerProps) {
  const dotsGeojson = useMemo(() => {
    if (!geojson || scoreLookup.size === 0) return null

    const centroids = computeCentroids(geojson)

    // Compute median score
    const allScores = [...scoreLookup.values()].sort((a, b) => a - b)
    const median = allScores[Math.floor(allScores.length / 2)]

    const features: GeoJSON.Feature[] = []
    for (const c of centroids) {
      const score = scoreLookup.get(c.fips)
      if (score == null || score < median) continue

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
        properties: { score, fips: c.fips },
      })
    }

    return { type: 'FeatureCollection' as const, features }
  }, [geojson, scoreLookup])

  if (!dotsGeojson) return null

  const visibility = visible ? 'visible' : 'none'

  return (
    <Source id="score-dots-source" type="geojson" data={dotsGeojson}>
      <Layer
        id="score-dots"
        type="circle"
        layout={{ visibility }}
        paint={{
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'score'],
            3, 2,
            5, 4,
            7, 6,
            9, 10,
            10, 14,
          ],
          'circle-color': [
            'interpolate', ['linear'], ['get', 'score'],
            3, '#2d2233',
            5, '#5c2d55',
            7, '#8b3578',
            8, '#b48fc1',
            9, '#4de2e4',
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 0.5,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.15)',
        }}
      />
    </Source>
  )
}
