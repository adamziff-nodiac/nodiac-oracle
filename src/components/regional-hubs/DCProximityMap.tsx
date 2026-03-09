'use client'

import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import Map, { Source, Layer, Popup, type MapRef, type MapMouseEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { SelectedDCRadiusLayer } from './SelectedDCRadiusLayer'
import { GoogleGIcon } from './GoogleGIcon'
import { SitePopupContent, POPUP_CLASS, type SitePopupData } from './SitePopupContent'
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

const LAYER_ID = 'dc-sites-dots'

interface DCProximityMapProps {
  dc: GoogleDataCenter
  radiusMiles: number
  sites: ProximitySite[]
}

export function DCProximityMap({ dc, radiusMiles, sites }: DCProximityMapProps) {
  const mapRef = useRef<MapRef>(null)
  const isDark = useIsDark()
  const [hovered, setHovered] = useState<{
    site: SitePopupData
    lngLat: [number, number]
  } | null>(null)

  // Build GeoJSON for sites — include all properties for popups
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
        state: site.state,
        distanceMi: site.distanceMi,
        voltage: site.voltage,
        owner: site.owner,
        utility: site.utility,
        utilityType: site.utilityType,
        holdingCompany: site.holdingCompany,
        city: site.city,
        county: site.county,
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

  const str = (v: string | number | null | undefined) =>
    v != null && String(v) !== '' && String(v) !== 'null' ? String(v) : null
  const num = (v: string | number | null | undefined) =>
    v != null && String(v) !== '' && String(v) !== 'null' ? Number(v) : null

  const onMouseEnter = useCallback((e: MapMouseEvent) => {
    if (!e.features?.length) return
    const f = e.features[0]
    if (f.geometry.type !== 'Point') return

    const coords = f.geometry.coordinates as [number, number]
    const p = f.properties as Record<string, string | number | null>

    setHovered({
      site: {
        name: String(p.name || ''),
        siteType: String(p.type || 'other') as SitePopupData['siteType'],
        state: String(p.state || ''),
        voltage: num(p.voltage),
        distanceMi: Number(p.distanceMi || 0),
        owner: str(p.owner),
        utility: str(p.utility),
        utilityType: str(p.utilityType),
        holdingCompany: str(p.holdingCompany),
        city: str(p.city),
        county: str(p.county),
      },
      lngLat: coords,
    })
  }, [])

  const onMouseLeave = useCallback(() => {
    setHovered(null)
  }, [])

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
      interactiveLayerIds={[LAYER_ID]}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      cursor={hovered ? 'pointer' : undefined}
    >
      <GoogleGIcon />
      <SelectedDCRadiusLayer dc={dc} radiusMiles={radiusMiles} />

      {/* Site markers */}
      <Source id="dc-sites-source" type="geojson" data={sitesGeojson}>
        <Layer
          id={LAYER_ID}
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

      {/* DC marker — Google G icon */}
      <Source id="dc-marker-source" type="geojson" data={dcGeojson}>
        <Layer
          id="dc-marker-icon"
          type="symbol"
          layout={{
            'icon-image': 'google-g-icon',
            'icon-size': 1,
            'icon-allow-overlap': true,
          }}
        />
      </Source>

      {/* Hover popup */}
      {hovered && (
        <Popup
          longitude={hovered.lngLat[0]}
          latitude={hovered.lngLat[1]}
          closeButton={false}
          closeOnClick={false}
          offset={12}
          className={POPUP_CLASS}
        >
          <SitePopupContent site={hovered.site} />
        </Popup>
      )}
    </Map>
  )
}
