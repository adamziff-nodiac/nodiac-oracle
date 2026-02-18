'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'

interface ClusterRegionsLayerProps {
  regionsGeojson: GeoJSON.FeatureCollection
  visible?: boolean
  /** When set, clusters NOT in this set are visually muted */
  populatedClusterIds?: Set<number> | null
}

/**
 * County-level cluster visualization.
 * Colors every county by cluster membership:
 *  - Dark gray: not in any cluster
 *  - Purple: in cluster hull but below score threshold (fill)
 *  - Teal: top-scoring county in a cluster (member)
 * When populatedClusterIds is provided, all cluster counties are muted
 * so portfolio dots pop, and clusters without sites are muted further.
 */
export function ClusterRegionsLayer({ regionsGeojson, visible = true, populatedClusterIds }: ClusterRegionsLayerProps) {
  const visibility = visible ? 'visible' : 'none'

  // Enrich features with populated flag when portfolio overlay is active
  const processedGeojson = useMemo(() => {
    if (!populatedClusterIds) return regionsGeojson
    return {
      ...regionsGeojson,
      features: regionsGeojson.features.map(f => {
        const clusterId = f.properties?.clusterId as number
        const clusterStatus = f.properties?.clusterStatus as number
        const populated = clusterStatus > 0 && populatedClusterIds.has(clusterId) ? 1 : 0
        return {
          ...f,
          properties: { ...f.properties, populated },
        }
      }),
    }
  }, [regionsGeojson, populatedClusterIds])

  // When populatedClusterIds is active, use populated-aware expressions
  const hasMuting = populatedClusterIds != null

  return (
    <Source id="cluster-regions-source" type="geojson" data={processedGeojson}>
      {/* County fills: 3-tier color by clusterStatus, muted when portfolio is active */}
      <Layer
        id="cluster-regions-fill"
        type="fill"
        layout={{ visibility }}
        paint={{
          'fill-color': hasMuting
            ? [
                'case',
                // Outside cluster
                ['==', ['get', 'clusterStatus'], 0], '#0d0b12',
                // In cluster but not populated → heavily muted
                ['==', ['get', 'populated'], 0], '#1a1128',
                // Populated cluster: desaturated member vs fill
                ['==', ['get', 'clusterStatus'], 2], '#2a8a8c',
                '#3a1d50',
              ] as unknown as string
            : [
                'match', ['get', 'clusterStatus'],
                2, '#4de2e4',
                1, '#4a2565',
                '#0d0b12',
              ] as unknown as string,
          'fill-opacity': hasMuting
            ? [
                'case',
                ['==', ['get', 'clusterStatus'], 0], 0.92,
                ['==', ['get', 'populated'], 0], 0.4,
                ['==', ['get', 'clusterStatus'], 2], 0.5,
                0.4,
              ] as unknown as number
            : [
                'match', ['get', 'clusterStatus'],
                2, 0.75,
                1, 0.55,
                0.92,
              ] as unknown as number,
        }}
      />
      {/* County borders within clusters */}
      <Layer
        id="cluster-regions-borders"
        type="line"
        layout={{ visibility }}
        filter={['>', ['get', 'clusterStatus'], 0]}
        paint={{
          'line-color': hasMuting
            ? [
                'case',
                ['==', ['get', 'populated'], 0], 'rgba(255, 255, 255, 0.05)',
                'rgba(255, 255, 255, 0.12)',
              ] as unknown as string
            : 'rgba(255, 255, 255, 0.2)',
          'line-width': 0.8,
        }}
      />
    </Source>
  )
}
