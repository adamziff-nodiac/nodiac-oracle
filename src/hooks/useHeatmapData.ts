'use client'

import { useMemo } from 'react'
import { computeCentroids } from '@/lib/geo/compute-centroids'
import type { CountyCentroid } from '@/lib/geo/compute-centroids'

/**
 * Build a GeoJSON Point FeatureCollection from county centroids + scoreLookup.
 * Each point's `weight` property is the area-dampened normalized score (0–1).
 *
 * Area dampening: small Eastern counties contribute less weight to prevent
 * artificial density hotspots. Formula: weight = score * min(1, sqrt(area / medianArea))
 */
export function useHeatmapData(
  geojson: GeoJSON.FeatureCollection | null,
  scoreLookup: Map<string, number>
): GeoJSON.FeatureCollection | null {
  const centroids = useMemo(() => {
    if (!geojson) return null
    return computeCentroids(geojson)
  }, [geojson])

  return useMemo(() => {
    if (!centroids || scoreLookup.size === 0) return null

    // Compute median area for dampening
    const areas = centroids.map(c => c.area).sort((a, b) => a - b)
    const medianArea = areas[Math.floor(areas.length / 2)]

    // Find score range for normalization
    let minScore = Infinity
    let maxScore = -Infinity
    for (const score of scoreLookup.values()) {
      if (score < minScore) minScore = score
      if (score > maxScore) maxScore = score
    }
    const scoreSpan = maxScore - minScore || 1

    const features: GeoJSON.Feature[] = []
    for (const c of centroids) {
      const rawScore = scoreLookup.get(c.fips)
      if (rawScore == null) continue

      // Normalize score to 0–1
      const normalizedScore = (rawScore - minScore) / scoreSpan

      // Area dampening: small counties contribute less
      const areaDampening = Math.min(1, Math.sqrt(c.area / medianArea))
      const weight = normalizedScore * areaDampening

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
        properties: { weight, score: rawScore, fips: c.fips },
      })
    }

    return { type: 'FeatureCollection' as const, features }
  }, [centroids, scoreLookup])
}
