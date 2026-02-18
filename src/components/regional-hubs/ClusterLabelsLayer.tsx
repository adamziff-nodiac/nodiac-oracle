'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'

interface ClusterLabelsLayerProps {
  labelsGeojson: GeoJSON.FeatureCollection
  visible?: boolean
  nameOverrides?: Record<number, string>
  positionOverrides?: Record<number, { lng: number; lat: number }>
}

/**
 * Hub name + subtitle labels rendered as a separate layer
 * so they can be ordered above portfolio dots in the layer stack.
 */
export function ClusterLabelsLayer({ labelsGeojson, visible = true, nameOverrides, positionOverrides }: ClusterLabelsLayerProps) {
  const visibility = visible ? 'visible' : 'none'

  const processedLabels = useMemo(() => {
    const hasNameOverrides = nameOverrides && Object.keys(nameOverrides).length > 0
    const hasPositionOverrides = positionOverrides && Object.keys(positionOverrides).length > 0
    if (!hasNameOverrides && !hasPositionOverrides) return labelsGeojson
    return {
      ...labelsGeojson,
      features: labelsGeojson.features.map(f => {
        const clusterId = f.properties?.id as number
        const nameOverride = nameOverrides?.[clusterId]
        const posOverride = positionOverrides?.[clusterId]
        if (nameOverride == null && !posOverride) return f
        return {
          ...f,
          ...(posOverride ? {
            geometry: { type: 'Point' as const, coordinates: [posOverride.lng, posOverride.lat] },
          } : {}),
          properties: {
            ...f.properties,
            ...(nameOverride != null ? { name: nameOverride } : {}),
          },
        }
      }),
    }
  }, [labelsGeojson, nameOverrides, positionOverrides])

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
