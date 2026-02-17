'use client'

import { useMemo } from 'react'
import { computeCentroids } from '@/lib/geo/compute-centroids'
import { clusterHubs, type HubCluster, type ClusterOptions } from '@/lib/geo/cluster-hubs'

export interface ClusterGeoData {
  hullsGeojson: GeoJSON.FeatureCollection
  labelsGeojson: GeoJSON.FeatureCollection
  clusters: HubCluster[]
}

/**
 * Hook: centroids + scoreLookup → cluster GeoJSON + labels.
 * Returns hull polygons for fill/line layers and label points for symbol layer.
 */
export function useHubClusters(
  geojson: GeoJSON.FeatureCollection | null,
  scoreLookup: Map<string, number>,
  clusterOptions?: ClusterOptions
): ClusterGeoData | null {
  const centroids = useMemo(() => {
    if (!geojson) return null
    return computeCentroids(geojson)
  }, [geojson])

  return useMemo(() => {
    if (!centroids || scoreLookup.size === 0) return null

    const clusters = clusterHubs(centroids, scoreLookup, clusterOptions)
    if (clusters.length === 0) return null

    // Hull polygons
    const hullFeatures: GeoJSON.Feature[] = clusters.map(c => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          // Close the polygon ring
          [...c.hull, c.hull[0]],
        ],
      },
      properties: {
        id: c.id,
        name: c.name,
        avgScore: c.avgScore,
        countyCount: c.countyCount,
      },
    }))

    // Label points at cluster centroids
    const labelFeatures: GeoJSON.Feature[] = clusters.map(c => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [c.centroid.lng, c.centroid.lat],
      },
      properties: {
        name: c.name,
        subtitle: `${c.countyCount} counties · ${c.avgScore.toFixed(1)} avg`,
      },
    }))

    return {
      hullsGeojson: { type: 'FeatureCollection' as const, features: hullFeatures },
      labelsGeojson: { type: 'FeatureCollection' as const, features: labelFeatures },
      clusters,
    }
  }, [centroids, scoreLookup, clusterOptions])
}
