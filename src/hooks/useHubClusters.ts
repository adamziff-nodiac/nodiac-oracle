'use client'

import { useMemo } from 'react'
import { computeCentroids } from '@/lib/geo/compute-centroids'
import { clusterHubs, convexHull, type HubCluster, type ClusterOptions } from '@/lib/geo/cluster-hubs'

export interface ClusterGeoData {
  hullsGeojson: GeoJSON.FeatureCollection
  labelsGeojson: GeoJSON.FeatureCollection
  regionsGeojson: GeoJSON.FeatureCollection
  clusters: HubCluster[]
}

// --- Point-in-polygon (ray casting) ---

function pointInPolygon(x: number, y: number, polygon: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/**
 * Hook: centroids + scoreLookup → cluster GeoJSON + labels + regions.
 * Returns hull polygons, label points, and a county-level GeoJSON with
 * cluster membership baked into each feature's properties.
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
    if (!centroids || scoreLookup.size === 0 || !geojson) return null

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

    // --- Regions GeoJSON: county-level cluster membership ---

    // Build member FIPS lookup: fips → clusterId
    const memberFips = new Map<string, number>()
    for (const cluster of clusters) {
      for (const c of cluster.counties) {
        memberFips.set(c.fips, cluster.id)
      }
    }

    // Compute unbuffered convex hulls for containment check
    const clusterHulls = clusters.map(c => {
      const points: [number, number][] = c.counties.map(m => [m.lng, m.lat])
      return { id: c.id, hull: convexHull(points) }
    })

    // Build centroid lookup for fast access
    const centroidMap = new Map<string, { lng: number; lat: number }>()
    for (const c of centroids) {
      centroidMap.set(c.fips, { lng: c.lng, lat: c.lat })
    }

    // Process each county feature
    // clusterStatus: 0 = not in cluster, 1 = fill (in hull, below threshold), 2 = member
    const regionFeatures: GeoJSON.Feature[] = geojson.features.map(feature => {
      const fips = feature.properties?.FIPS as string | undefined
      if (!fips) {
        return { ...feature, properties: { ...feature.properties, clusterStatus: 0, clusterId: -1 } }
      }

      // Check if member (top N% county in a cluster)
      if (memberFips.has(fips)) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            clusterStatus: 2,
            clusterId: memberFips.get(fips),
          },
        }
      }

      // Check if fill (centroid falls within any cluster's hull)
      const centroid = centroidMap.get(fips)
      if (centroid) {
        for (const { id, hull } of clusterHulls) {
          if (hull.length >= 3 && pointInPolygon(centroid.lng, centroid.lat, hull)) {
            return {
              ...feature,
              properties: {
                ...feature.properties,
                clusterStatus: 1,
                clusterId: id,
              },
            }
          }
        }
      }

      return { ...feature, properties: { ...feature.properties, clusterStatus: 0, clusterId: -1 } }
    })

    return {
      hullsGeojson: { type: 'FeatureCollection' as const, features: hullFeatures },
      labelsGeojson: { type: 'FeatureCollection' as const, features: labelFeatures },
      regionsGeojson: { type: 'FeatureCollection' as const, features: regionFeatures },
      clusters,
    }
  }, [centroids, scoreLookup, clusterOptions, geojson])
}
