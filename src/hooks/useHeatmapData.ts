'use client'

import { useMemo } from 'react'
import { computeCentroids } from '@/lib/geo/compute-centroids'
import type { CountyCentroid } from '@/lib/geo/compute-centroids'

/**
 * Build a GeoJSON Point FeatureCollection from county centroids + scoreLookup.
 * Each point's `weight` property is tuned to highlight only top-scoring regions:
 *
 * 1. Scores below the median (p50) are zeroed out (no heat contribution)
 * 2. Remaining scores are re-normalized to 0–1 within the top-50% band
 * 3. A power-1.5 curve favors high scores while keeping upper-quartile counties
 *    visible enough to blend regionally (p75 ≈ 0.08, p90 ≈ 0.21, p95 ≈ 0.34)
 * 4. Area dampening prevents small Eastern counties from creating false density
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

    // Compute score percentiles for thresholding
    const allScores = [...scoreLookup.values()].sort((a, b) => a - b)
    const p50 = allScores[Math.floor(allScores.length * 0.50)]
    const maxScore = allScores[allScores.length - 1]
    const topBand = maxScore - p50 || 1

    const features: GeoJSON.Feature[] = []
    for (const c of centroids) {
      const rawScore = scoreLookup.get(c.fips)
      if (rawScore == null) continue

      // Zero out bottom half — only top 50% contributes heat
      if (rawScore <= p50) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
          properties: { weight: 0, score: rawScore, fips: c.fips },
        })
        continue
      }

      // Normalize within the top band (p50 → max) to 0–1
      const bandScore = (rawScore - p50) / topBand

      // Power-1.5 curve: favors high scores while keeping upper-quartile
      // counties visible enough to blend into regional gradients
      const curved = Math.pow(bandScore, 1.5)

      // Area dampening: small counties contribute less
      const areaDampening = Math.min(1, Math.sqrt(c.area / medianArea))
      const weight = curved * areaDampening

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
        properties: { weight, score: rawScore, fips: c.fips },
      })
    }

    return { type: 'FeatureCollection' as const, features }
  }, [centroids, scoreLookup])
}
