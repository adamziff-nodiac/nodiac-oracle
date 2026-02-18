'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'

interface ClusterLabelsLayerProps {
  labelsGeojson: GeoJSON.FeatureCollection
  visible?: boolean
  nameOverrides?: Record<number, string>
}

/**
 * Hub name + subtitle labels rendered as a separate layer
 * so they can be ordered above portfolio dots in the layer stack.
 */
export function ClusterLabelsLayer({ labelsGeojson, visible = true, nameOverrides }: ClusterLabelsLayerProps) {
  const visibility = visible ? 'visible' : 'none'

  const processedLabels = useMemo(() => {
    if (!nameOverrides || Object.keys(nameOverrides).length === 0) return labelsGeojson
    return {
      ...labelsGeojson,
      features: labelsGeojson.features.map(f => {
        const clusterId = f.properties?.id as number
        const override = nameOverrides[clusterId]
        if (override == null) return f
        return { ...f, properties: { ...f.properties, name: override } }
      }),
    }
  }, [labelsGeojson, nameOverrides])

  return (
    <Source id="cluster-labels-source" type="geojson" data={processedLabels}>
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
          'text-allow-overlap': true,
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
          'text-allow-overlap': true,
          'text-padding': 2,
        }}
        paint={{
          'text-color': 'rgba(255, 255, 255, 0.75)',
          'text-halo-color': 'rgba(0, 0, 0, 0.7)',
          'text-halo-width': 1.5,
        }}
      />
    </Source>
  )
}
