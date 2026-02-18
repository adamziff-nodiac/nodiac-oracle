'use client'

import { Source, Layer } from 'react-map-gl/mapbox'

interface ClusterRegionsLayerProps {
  regionsGeojson: GeoJSON.FeatureCollection
  labelsGeojson: GeoJSON.FeatureCollection
  visible?: boolean
}

/**
 * County-level cluster visualization.
 * Colors every county by cluster membership:
 *  - Dark gray: not in any cluster
 *  - Purple: in cluster hull but below score threshold (fill)
 *  - Teal: top-scoring county in a cluster (member)
 * Shows cluster name labels at centroids.
 */
export function ClusterRegionsLayer({ regionsGeojson, labelsGeojson, visible = true }: ClusterRegionsLayerProps) {
  const visibility = visible ? 'visible' : 'none'

  return (
    <>
      <Source id="cluster-regions-source" type="geojson" data={regionsGeojson}>
        {/* County fills: 3-tier color by clusterStatus */}
        <Layer
          id="cluster-regions-fill"
          type="fill"
          layout={{ visibility }}
          paint={{
            'fill-color': [
              'match', ['get', 'clusterStatus'],
              2, '#4de2e4',   // member: teal
              1, '#4a2565',   // fill: visible purple
              '#0d0b12',      // outside: very dark
            ],
            'fill-opacity': [
              'match', ['get', 'clusterStatus'],
              2, 0.75,
              1, 0.55,
              0.92,
            ],
          }}
        />
        {/* County borders within clusters */}
        <Layer
          id="cluster-regions-borders"
          type="line"
          layout={{ visibility }}
          filter={['>', ['get', 'clusterStatus'], 0]}
          paint={{
            'line-color': 'rgba(255, 255, 255, 0.2)',
            'line-width': 0.8,
          }}
        />
      </Source>

      {/* Labels at cluster centroids */}
      <Source id="cluster-regions-labels-source" type="geojson" data={labelsGeojson}>
        <Layer
          id="cluster-regions-labels"
          type="symbol"
          layout={{
            visibility,
            'text-field': ['get', 'name'],
            'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
            'text-size': 14,
            'text-anchor': 'bottom',
            'text-offset': [0, -0.5],
            'text-allow-overlap': true,
          }}
          paint={{
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(0, 0, 0, 0.7)',
            'text-halo-width': 1.5,
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
            'text-offset': [0, 0.3],
            'text-allow-overlap': true,
          }}
          paint={{
            'text-color': 'rgba(255, 255, 255, 0.7)',
            'text-halo-color': 'rgba(0, 0, 0, 0.5)',
            'text-halo-width': 1,
          }}
        />
      </Source>
    </>
  )
}
