'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'

interface ClusterRegionsLayerProps {
  regionsGeojson: GeoJSON.FeatureCollection
  labelsGeojson: GeoJSON.FeatureCollection
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
 * When populatedClusterIds is provided, clusters without portfolio sites are dimmed.
 */
export function ClusterRegionsLayer({ regionsGeojson, labelsGeojson, visible = true, populatedClusterIds }: ClusterRegionsLayerProps) {
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
    <>
      <Source id="cluster-regions-source" type="geojson" data={processedGeojson}>
        {/* County fills: 3-tier color by clusterStatus, dimmed for empty clusters */}
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
                  // In cluster but not populated → muted
                  ['==', ['get', 'populated'], 0], '#1a1128',
                  // Populated cluster: member vs fill
                  ['==', ['get', 'clusterStatus'], 2], '#4de2e4',
                  '#4a2565',
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
                  ['==', ['get', 'populated'], 0], 0.45,
                  ['==', ['get', 'clusterStatus'], 2], 0.75,
                  0.55,
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
                  ['==', ['get', 'populated'], 0], 'rgba(255, 255, 255, 0.08)',
                  'rgba(255, 255, 255, 0.2)',
                ] as unknown as string
              : 'rgba(255, 255, 255, 0.2)',
            'line-width': 0.8,
          }}
        />
      </Source>

      {/* Labels at cluster centroids — offset well above centroid to avoid portfolio dots */}
      <Source id="cluster-regions-labels-source" type="geojson" data={labelsGeojson}>
        <Layer
          id="cluster-regions-labels"
          type="symbol"
          layout={{
            visibility,
            'text-field': ['get', 'name'],
            'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
            'text-size': 15,
            'text-anchor': 'bottom',
            'text-offset': [0, -1.2] as [number, number],
            'text-allow-overlap': false,
            'text-padding': 4,
          }}
          paint={{
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(0, 0, 0, 0.85)',
            'text-halo-width': 2,
          }}
        />
        <Layer
          id="cluster-regions-subtitles"
          type="symbol"
          layout={{
            visibility,
            'text-field': ['get', 'subtitle'],
            'text-font': ['DIN Pro Regular', 'Arial Unicode MS Regular'],
            'text-size': 11,
            'text-anchor': 'top',
            'text-offset': [0, -0.8] as [number, number],
            'text-allow-overlap': false,
            'text-padding': 2,
          }}
          paint={{
            'text-color': 'rgba(255, 255, 255, 0.75)',
            'text-halo-color': 'rgba(0, 0, 0, 0.7)',
            'text-halo-width': 1.5,
          }}
        />
      </Source>
    </>
  )
}
