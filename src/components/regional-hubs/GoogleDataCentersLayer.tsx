'use client'

import { useMemo, useEffect, useState } from 'react'
import { Source, Layer, Popup, useMap } from 'react-map-gl/mapbox'
import { googleDataCenters, type GoogleDataCenter } from '@/data/googleDataCenters'

export type GoogleDCDisplayMode = 'logo' | 'logo-label'

interface GoogleDataCentersLayerProps {
  visible?: boolean
  displayMode?: GoogleDCDisplayMode
}

/**
 * Renders Google data center locations as "G" markers on the map.
 * Supports clustering on zoom-out and optional name labels.
 */
export function GoogleDataCentersLayer({
  visible = true,
  displayMode = 'logo',
}: GoogleDataCentersLayerProps) {
  const { current: map } = useMap()
  const [hovered, setHovered] = useState<{ dc: GoogleDataCenter; lngLat: [number, number] } | null>(null)

  const geojson = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = googleDataCenters.map((dc, i) => ({
      type: 'Feature',
      id: i,
      geometry: {
        type: 'Point',
        coordinates: dc.coordinates,
      },
      properties: {
        name: dc.name,
        region: dc.region,
        status: dc.status,
      },
    }))

    return { type: 'FeatureCollection', features }
  }, [])

  const visibility = visible ? ('visible' as const) : ('none' as const)
  const showLabels = visible && displayMode === 'logo-label'

  // Register custom icon images on the map
  useMemo(() => {
    if (!map) return
    const m = map.getMap()
    if (m.hasImage('google-g-icon')) return

    const dpr = 2

    // Individual point icon: white circle + blue G
    const size = 32
    const canvas = document.createElement('canvas')
    canvas.width = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.font = `bold ${size * 0.55}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#4285F4'
    ctx.fillText('G', size / 2, size / 2 + 1)
    const imgData = ctx.getImageData(0, 0, size * dpr, size * dpr)
    m.addImage('google-g-icon', { width: size * dpr, height: size * dpr, data: new Uint8Array(imgData.data) }, { pixelRatio: dpr })

    // Cluster icon: blue circle + white G
    const cSize = 40
    const cCanvas = document.createElement('canvas')
    cCanvas.width = cSize * dpr
    cCanvas.height = cSize * dpr
    const cCtx = cCanvas.getContext('2d')!
    cCtx.scale(dpr, dpr)
    cCtx.beginPath()
    cCtx.arc(cSize / 2, cSize / 2, cSize / 2 - 1, 0, Math.PI * 2)
    cCtx.fillStyle = '#4285F4'
    cCtx.fill()
    cCtx.strokeStyle = '#ffffff'
    cCtx.lineWidth = 2
    cCtx.stroke()
    cCtx.font = `bold ${cSize * 0.5}px Arial, sans-serif`
    cCtx.textAlign = 'center'
    cCtx.textBaseline = 'middle'
    cCtx.fillStyle = '#ffffff'
    cCtx.fillText('G', cSize / 2, cSize / 2 + 1)
    const cImgData = cCtx.getImageData(0, 0, cSize * dpr, cSize * dpr)
    m.addImage('google-g-cluster', { width: cSize * dpr, height: cSize * dpr, data: new Uint8Array(cImgData.data) }, { pixelRatio: dpr })
  }, [map])

  // Register hover events on the map instance
  useEffect(() => {
    if (!map) return
    const m = map.getMap()

    const handleEnter = (e: mapboxgl.MapLayerMouseEvent) => {
      m.getCanvas().style.cursor = 'pointer'
      if (!e.features?.length) return
      const f = e.features[0]
      if ('coordinates' in f.geometry && Array.isArray(f.geometry.coordinates)) {
        const coords = f.geometry.coordinates as [number, number]
        const props = f.properties as Record<string, string>
        setHovered({
          dc: {
            name: props.name,
            region: props.region as GoogleDataCenter['region'],
            status: props.status as GoogleDataCenter['status'],
            coordinates: coords,
          },
          lngLat: coords,
        })
      }
    }

    const handleLeave = () => {
      m.getCanvas().style.cursor = ''
      setHovered(null)
    }

    // Wait for layer to exist before attaching
    const attach = () => {
      if (!m.getLayer('google-dc-points')) {
        setTimeout(attach, 200)
        return
      }
      m.on('mouseenter', 'google-dc-points', handleEnter)
      m.on('mouseleave', 'google-dc-points', handleLeave)
    }
    attach()

    return () => {
      if (m.getLayer('google-dc-points')) {
        m.off('mouseenter', 'google-dc-points', handleEnter)
        m.off('mouseleave', 'google-dc-points', handleLeave)
      }
    }
  }, [map])

  return (
    <>
      <Source
        id="google-dc-source"
        type="geojson"
        data={geojson}
        cluster={true}
        clusterMaxZoom={8}
        clusterRadius={50}
      >
        {/* Cluster icons */}
        <Layer
          id="google-dc-clusters"
          type="symbol"
          filter={['has', 'point_count']}
          layout={{
            visibility,
            'icon-image': 'google-g-cluster',
            'icon-size': 1,
            'icon-allow-overlap': true,
          }}
        />
        {/* Cluster count */}
        <Layer
          id="google-dc-cluster-count"
          type="symbol"
          filter={['has', 'point_count']}
          layout={{
            visibility,
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 11,
            'text-offset': [0, 1.4],
            'text-allow-overlap': true,
          }}
          paint={{
            'text-color': '#4285F4',
          }}
        />
        {/* Individual point icons */}
        <Layer
          id="google-dc-points"
          type="symbol"
          filter={['!', ['has', 'point_count']]}
          layout={{
            visibility,
            'icon-image': 'google-g-icon',
            'icon-size': 1,
            'icon-allow-overlap': true,
          }}
        />
        {/* Name labels (logo-label mode only) */}
        <Layer
          id="google-dc-labels"
          type="symbol"
          filter={['!', ['has', 'point_count']]}
          layout={{
            visibility: showLabels ? 'visible' : 'none',
            'text-field': ['get', 'name'],
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-size': 11,
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
            'text-max-width': 10,
            'text-allow-overlap': false,
          }}
          paint={{
            'text-color': '#d1d5db',
            'text-halo-color': 'rgba(0,0,0,0.7)',
            'text-halo-width': 1.5,
          }}
        />
      </Source>

      {/* Hover popup */}
      {hovered && visible && (
        <Popup
          longitude={hovered.lngLat[0]}
          latitude={hovered.lngLat[1]}
          closeButton={false}
          closeOnClick={false}
          anchor="bottom"
          offset={20}
          className="[&_.mapboxgl-popup-content]:!bg-gray-900 [&_.mapboxgl-popup-content]:!rounded-lg [&_.mapboxgl-popup-content]:!shadow-xl [&_.mapboxgl-popup-content]:!p-3 [&_.mapboxgl-popup-content]:!border [&_.mapboxgl-popup-content]:!border-white/10 [&_.mapboxgl-popup-tip]:!border-t-gray-900"
        >
          <div className="text-xs text-gray-200 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#4285F4]">G</span>
              <span className="font-semibold text-white">Google Data Center</span>
            </div>
            <div><span className="text-gray-400">Location:</span> {hovered.dc.name}</div>
            <div><span className="text-gray-400">Region:</span> {hovered.dc.region}</div>
            <div>
              {hovered.dc.status === 'in_development' ? (
                <span className="inline-block bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px]">In Development</span>
              ) : (
                <span className="inline-block bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px]">Active</span>
              )}
            </div>
          </div>
        </Popup>
      )}
    </>
  )
}
