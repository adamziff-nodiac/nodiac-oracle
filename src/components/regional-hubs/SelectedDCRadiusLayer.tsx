'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import { milesToKm } from '@/lib/geo/haversine'
import type { GoogleDataCenter } from '@/data/googleDataCenters'

interface SelectedDCRadiusLayerProps {
  dc: GoogleDataCenter | null
  radiusMiles: number
}

function makeCircle(lng: number, lat: number, radiusKm: number, numPoints = 64): [number, number][] {
  const coords: [number, number][] = []
  const latRad = (lat * Math.PI) / 180
  const dLat = radiusKm / 111.32
  const dLng = radiusKm / (111.32 * Math.cos(latRad))

  for (let i = 0; i <= numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints
    coords.push([lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)])
  }
  return coords
}

export function SelectedDCRadiusLayer({ dc, radiusMiles }: SelectedDCRadiusLayerProps) {
  const geojson = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!dc) return { type: 'FeatureCollection', features: [] }

    const radiusKm = milesToKm(radiusMiles)
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        id: 0,
        geometry: {
          type: 'Polygon',
          coordinates: [makeCircle(dc.coordinates[0], dc.coordinates[1], radiusKm)],
        },
        properties: { name: dc.name },
      }],
    }
  }, [dc, radiusMiles])

  if (!dc) return null

  return (
    <Source id="selected-dc-radius-source" type="geojson" data={geojson}>
      <Layer
        id="selected-dc-radius-fill"
        type="fill"
        paint={{
          'fill-color': '#4285F4',
          'fill-opacity': 0.08,
        }}
      />
      <Layer
        id="selected-dc-radius-stroke"
        type="line"
        paint={{
          'line-color': '#4285F4',
          'line-opacity': 0.5,
          'line-width': 2,
          'line-dasharray': [6, 3],
        }}
      />
    </Source>
  )
}
