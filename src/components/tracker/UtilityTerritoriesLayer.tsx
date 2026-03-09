'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Source, Layer, Popup, useMap } from 'react-map-gl/mapbox'

interface UtilityPopupInfo {
  name: string
  state: string
  type: string
  customers: number | null
  lng: number
  lat: number
}

// Deterministic color from utility name — consistent across renders
function hashColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 55%, 50%)`
}

interface UtilityTerritoriesLayerProps {
  visible?: boolean
}

export function UtilityTerritoriesLayer({ visible = true }: UtilityTerritoriesLayerProps) {
  const { current: mapRef } = useMap()
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null)
  const [popup, setPopup] = useState<UtilityPopupInfo | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastBboxRef = useRef<string>('')

  const fetchTerritories = useCallback(async () => {
    if (!mapRef) return
    const map = mapRef.getMap()
    const bounds = map.getBounds()
    if (!bounds) return

    const bbox = `${bounds.getWest().toFixed(4)},${bounds.getSouth().toFixed(4)},${bounds.getEast().toFixed(4)},${bounds.getNorth().toFixed(4)}`

    // Skip if bbox hasn't changed meaningfully
    if (bbox === lastBboxRef.current) return
    lastBboxRef.current = bbox

    // Abort previous request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`/api/utilities/territories?bbox=${bbox}`, {
        signal: controller.signal,
      })
      if (res.ok) {
        const data = await res.json()
        // Inject fill color into each feature for deterministic coloring
        if (data.features) {
          for (const f of data.features) {
            f.properties._fillColor = hashColor(f.properties.NAME || '')
          }
        }
        setGeojson(data)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.warn('Failed to fetch utility territories:', e)
      }
    }
  }, [mapRef])

  // Fetch on mount and on map move
  useEffect(() => {
    if (!visible || !mapRef) return

    fetchTerritories()

    const map = mapRef.getMap()
    const onMoveEnd = () => fetchTerritories()
    map.on('moveend', onMoveEnd)

    return () => {
      map.off('moveend', onMoveEnd)
      abortRef.current?.abort()
    }
  }, [visible, mapRef, fetchTerritories])

  // Handle clicks on territory polygons
  useEffect(() => {
    if (!visible || !mapRef) return

    const map = mapRef.getMap()

    const onClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['utility-territory-fill'] })
      if (features.length > 0) {
        const props = features[0].properties
        if (props) {
          setPopup({
            name: props.NAME,
            state: props.STATE,
            type: props.TYPE,
            customers: props.CUSTOMERS === -999999 ? null : props.CUSTOMERS,
            lng: e.lngLat.lng,
            lat: e.lngLat.lat,
          })
        }
      }
    }

    const onMouseEnter = () => { map.getCanvas().style.cursor = 'pointer' }
    const onMouseLeave = () => { map.getCanvas().style.cursor = '' }

    map.on('click', 'utility-territory-fill', onClick)
    map.on('mouseenter', 'utility-territory-fill', onMouseEnter)
    map.on('mouseleave', 'utility-territory-fill', onMouseLeave)

    return () => {
      map.off('click', 'utility-territory-fill', onClick)
      map.off('mouseenter', 'utility-territory-fill', onMouseEnter)
      map.off('mouseleave', 'utility-territory-fill', onMouseLeave)
    }
  }, [visible, mapRef])

  const emptyGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: [],
  }), [])

  if (!visible) return null

  return (
    <>
      <Source
        id="utility-territories"
        type="geojson"
        data={geojson ?? emptyGeoJSON}
      >
        <Layer
          id="utility-territory-fill"
          type="fill"
          paint={{
            'fill-color': ['get', '_fillColor'],
            'fill-opacity': 0.15,
          }}
          beforeId={undefined}
        />
        <Layer
          id="utility-territory-outline"
          type="line"
          paint={{
            'line-color': ['get', '_fillColor'],
            'line-width': 1.5,
            'line-opacity': 0.5,
          }}
        />
        <Layer
          id="utility-territory-label"
          type="symbol"
          layout={{
            'text-field': ['get', 'NAME'],
            'text-size': 10,
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-max-width': 8,
            'text-allow-overlap': false,
          }}
          paint={{
            'text-color': 'rgba(255, 255, 255, 0.6)',
            'text-halo-color': 'rgba(0, 0, 0, 0.5)',
            'text-halo-width': 1,
          }}
        />
      </Source>

      {popup && (
        <Popup
          longitude={popup.lng}
          latitude={popup.lat}
          offset={8}
          closeButton={true}
          closeOnClick={false}
          onClose={() => setPopup(null)}
          className="site-status-tooltip"
          maxWidth="260px"
        >
          <div className="px-2 py-1.5 text-xs">
            <p className="font-semibold text-gray-900 text-sm">{popup.name}</p>
            <p className="text-gray-500">{popup.state}</p>
            {popup.type && popup.type !== 'NOT AVAILABLE' && (
              <p className="text-gray-500 mt-0.5">{popup.type}</p>
            )}
            {popup.customers != null && (
              <p className="text-gray-400 mt-0.5">
                {popup.customers.toLocaleString()} customers
              </p>
            )}
          </div>
        </Popup>
      )}
    </>
  )
}
