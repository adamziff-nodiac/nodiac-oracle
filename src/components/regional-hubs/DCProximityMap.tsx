'use client'

import { useMemo, useRef, useEffect } from 'react'
import Map, { Source, Layer, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { SelectedDCRadiusLayer } from './SelectedDCRadiusLayer'
import type { GoogleDataCenter } from '@/data/googleDataCenters'
import type { ProximitySite } from '@/hooks/useDCProximity'
import { useIsDark } from '@/hooks/useIsDark'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const TYPE_COLORS: Record<string, string> = {
  solar: '#FFB800',
  wind: '#00B4D8',
  storage: '#7B2FBE',
  hydro: '#0EA5E9',
  other: '#9CA3AF',
  substation: '#22C55E',
}

interface DCProximityMapProps {
  dc: GoogleDataCenter
  radiusMiles: number
  sites: ProximitySite[]
}

export function DCProximityMap({ dc, radiusMiles, sites }: DCProximityMapProps) {
  const mapRef = useRef<MapRef>(null)
  const isDark = useIsDark()

  // Build GeoJSON for sites
  const sitesGeojson = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: sites.map((site, i) => ({
      type: 'Feature' as const,
      id: i,
      geometry: {
        type: 'Point' as const,
        coordinates: [site.lng, site.lat],
      },
      properties: {
        name: site.name,
        type: site.type,
        distanceMi: site.distanceMi,
      },
    })),
  }), [sites])

  // GeoJSON for DC marker
  const dcGeojson = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature' as const,
      id: 0,
      geometry: {
        type: 'Point' as const,
        coordinates: dc.coordinates,
      },
      properties: { name: dc.name },
    }],
  }), [dc])

  // Fit bounds to radius circle on mount or radius change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Approximate bounding box from radius
    const latRad = (dc.coordinates[1] * Math.PI) / 180
    const radiusKm = radiusMiles * 1.60934
    const dLat = radiusKm / 111.32
    const dLng = radiusKm / (111.32 * Math.cos(latRad))

    map.fitBounds(
      [
        [dc.coordinates[0] - dLng * 1.15, dc.coordinates[1] - dLat * 1.15],
        [dc.coordinates[0] + dLng * 1.15, dc.coordinates[1] + dLat * 1.15],
      ],
      { duration: 500, padding: 20 }
    )
  }, [dc, radiusMiles])

  // Color expression for site type dots
  const circleColor: mapboxgl.Expression = [
    'match',
    ['get', 'type'],
    'solar', TYPE_COLORS.solar,
    'wind', TYPE_COLORS.wind,
    'storage', TYPE_COLORS.storage,
    'hydro', TYPE_COLORS.hydro,
    'substation', TYPE_COLORS.substation,
    TYPE_COLORS.other,
  ]

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: dc.coordinates[0],
        latitude: dc.coordinates[1],
        zoom: 7,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'}
      attributionControl={false}
    >
      <SelectedDCRadiusLayer dc={dc} radiusMiles={radiusMiles} />

      {/* Site markers */}
      <Source id="dc-sites-source" type="geojson" data={sitesGeojson}>
        <Layer
          id="dc-sites-dots"
          type="circle"
          paint={{
            'circle-radius': 3.5,
            'circle-color': circleColor as unknown as string,
            'circle-opacity': 0.7,
            'circle-stroke-width': 0.5,
            'circle-stroke-color': isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
          }}
        />
      </Source>

      {/* DC marker — rendered last to appear on top */}
      <Source id="dc-marker-source" type="geojson" data={dcGeojson}>
        <Layer
          id="dc-marker-circle"
          type="circle"
          paint={{
            'circle-radius': 8,
            'circle-color': '#4285F4',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          }}
        />
        <Layer
          id="dc-marker-label"
          type="symbol"
          layout={{
            'text-field': 'G',
            'text-size': 10,
            'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
            'text-allow-overlap': true,
          }}
          paint={{
            'text-color': '#ffffff',
          }}
        />
      </Source>
    </Map>
  )
}
