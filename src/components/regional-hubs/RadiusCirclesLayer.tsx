'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import { googleDataCenters } from '@/data/googleDataCenters'
import { milesToKm } from '@/lib/geo/haversine'

interface RadiusCirclesLayerProps {
  radiusMiles: number
  visible?: boolean
}

// NA Google DCs only
const NA_DCS = googleDataCenters.filter((dc) => dc.region === 'North America')

/**
 * Generates a circle polygon of N points around a center (lng, lat)
 * at the given radius in km, accounting for latitude distortion.
 */
function makeCircle(lng: number, lat: number, radiusKm: number, numPoints = 64): [number, number][] {
  const coords: [number, number][] = []
  const latRad = (lat * Math.PI) / 180
  // 1 degree latitude ≈ 111.32 km
  const dLat = radiusKm / 111.32
  // 1 degree longitude shrinks by cos(lat)
  const dLng = radiusKm / (111.32 * Math.cos(latRad))

  for (let i = 0; i <= numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints
    coords.push([lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)])
  }
  return coords
}

export function RadiusCirclesLayer({ radiusMiles, visible = true }: RadiusCirclesLayerProps) {
  const geojson = useMemo<GeoJSON.FeatureCollection>(() => {
    const radiusKm = milesToKm(radiusMiles)
    const features: GeoJSON.Feature[] = NA_DCS.map((dc, i) => ({
      type: 'Feature',
      id: i,
      geometry: {
        type: 'Polygon',
        coordinates: [makeCircle(dc.coordinates[0], dc.coordinates[1], radiusKm)],
      },
      properties: { name: dc.name },
    }))
    return { type: 'FeatureCollection', features }
  }, [radiusMiles])

  const visibility = visible ? ('visible' as const) : ('none' as const)

  return (
    <Source id="radius-circles-source" type="geojson" data={geojson}>
      {/* Fill */}
      <Layer
        id="radius-circles-fill"
        type="fill"
        layout={{ visibility }}
        paint={{
          'fill-color': '#4285F4',
          'fill-opacity': 0.04,
        }}
      />
      {/* Stroke */}
      <Layer
        id="radius-circles-stroke"
        type="line"
        layout={{ visibility }}
        paint={{
          'line-color': '#4285F4',
          'line-opacity': 0.25,
          'line-width': 1,
          'line-dasharray': [4, 4],
        }}
      />
    </Source>
  )
}
