'use client'

import { Source, Layer } from 'react-map-gl/mapbox'
import type { ClusterGeoData } from '@/hooks/useHubClusters'

interface HubClustersLayerProps {
  data: ClusterGeoData
  visible?: boolean
}

/**
 * Renders cluster hulls (fill + line) and labels (symbol layer).
 * Hull color encodes average cluster score.
 */
export function HubClustersLayer({ data, visible = true }: HubClustersLayerProps) {
  const visibility = visible ? 'visible' : 'none'

  return (
    <>
      {/* Hull fills */}
      <Source id="cluster-hulls-source" type="geojson" data={data.hullsGeojson}>
        <Layer
          id="cluster-hull-fill"
          type="fill"
          layout={{ visibility }}
          paint={{
            'fill-color': [
              'interpolate', ['linear'], ['get', 'avgScore'],
              5, '#5c2d55',
              7, '#8b3578',
              8, '#b48fc1',
              9, '#4de2e4',
            ],
            'fill-opacity': 0.25,
          }}
        />
        <Layer
          id="cluster-hull-outline"
          type="line"
          layout={{ visibility }}
          paint={{
            'line-color': [
              'interpolate', ['linear'], ['get', 'avgScore'],
              5, '#8b3578',
              7, '#b48fc1',
              9, '#4de2e4',
            ],
            'line-width': 2,
            'line-opacity': 0.8,
          }}
        />
      </Source>

      {/* Labels at cluster centroids */}
      <Source id="cluster-labels-source" type="geojson" data={data.labelsGeojson}>
        <Layer
          id="cluster-labels"
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
          id="cluster-subtitles"
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
