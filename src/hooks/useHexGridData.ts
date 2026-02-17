'use client'

import { useMemo } from 'react'
import { computeCentroids } from '@/lib/geo/compute-centroids'
import { generateHexGrid } from '@/lib/geo/hex-grid'

/**
 * Hook: centroids + scoreLookup → hex grid GeoJSON.
 * Each hex is colored by average score of counties whose centroids fall within it.
 */
export function useHexGridData(
  geojson: GeoJSON.FeatureCollection | null,
  scoreLookup: Map<string, number>
): GeoJSON.FeatureCollection | null {
  const centroids = useMemo(() => {
    if (!geojson) return null
    return computeCentroids(geojson)
  }, [geojson])

  return useMemo(() => {
    if (!centroids || scoreLookup.size === 0) return null
    return generateHexGrid(centroids, scoreLookup)
  }, [centroids, scoreLookup])
}
