'use client'

import { useMemo, useEffect, useState, useCallback, useRef } from 'react'
import { Source, Layer, Popup, useMap } from 'react-map-gl/mapbox'
import { googleDataCenters, type GoogleDataCenter } from '@/data/googleDataCenters'
import { GoogleGIcon } from './GoogleGIcon'

export type GoogleDCDisplayMode = 'logo' | 'logo-label'

interface GoogleDataCentersLayerProps {
  visible?: boolean
  displayMode?: GoogleDCDisplayMode
  selectedDC?: GoogleDataCenter | null
  onDCClick?: (dc: GoogleDataCenter) => void
}

/**
 * Renders Google data center locations as "G" markers on the map.
 * Supports clustering on zoom-out and optional name labels.
 * In logo-label mode, cluster labels list all member DC names.
 */
export function GoogleDataCentersLayer({
  visible = true,
  displayMode = 'logo',
  selectedDC,
  onDCClick,
}: GoogleDataCentersLayerProps) {
  const { current: map } = useMap()
  const [hovered, setHovered] = useState<{ dc: GoogleDataCenter; lngLat: [number, number] } | null>(null)
  const [clusterLabelsGeojson, setClusterLabelsGeojson] = useState<GeoJSON.FeatureCollection | null>(null)
  const pendingRef = useRef(0) // track in-flight updates to avoid stale writes

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
      if (!m.isStyleLoaded() || !m.getLayer('google-dc-points')) {
        setTimeout(attach, 200)
        return
      }
      m.on('mouseenter', 'google-dc-points', handleEnter)
      m.on('mouseleave', 'google-dc-points', handleLeave)
    }
    attach()

    return () => {
      try {
        if (m.getLayer('google-dc-points')) {
          m.off('mouseenter', 'google-dc-points', handleEnter)
          m.off('mouseleave', 'google-dc-points', handleLeave)
        }
      } catch { /* style may be undefined during cleanup */ }
    }
  }, [map])

  // Click handler — open DC proximity panel
  const onDCClickRef = useRef(onDCClick)
  onDCClickRef.current = onDCClick

  useEffect(() => {
    if (!map) return
    const m = map.getMap()

    const handleClick = (e: mapboxgl.MapLayerMouseEvent) => {
      if (!e.features?.length || !onDCClickRef.current) return
      const f = e.features[0]
      const props = f.properties as Record<string, string>
      if (!props.name) return

      // Find the DC in our data array
      const dc = googleDataCenters.find(d => d.name === props.name)
      if (dc) {
        e.originalEvent.stopPropagation()
        onDCClickRef.current(dc)
      }
    }

    const attach = () => {
      if (!m.isStyleLoaded() || !m.getLayer('google-dc-points')) {
        setTimeout(attach, 200)
        return
      }
      m.on('click', 'google-dc-points', handleClick)
    }
    attach()

    return () => {
      try {
        if (m.getLayer('google-dc-points')) {
          m.off('click', 'google-dc-points', handleClick)
        }
      } catch { /* style may be undefined during cleanup */ }
    }
  }, [map])

  // Build cluster labels: for each visible cluster, fetch member names
  const updateClusterLabels = useCallback(() => {
    if (!map) return
    const m = map.getMap()
    if (!m.isStyleLoaded() || !m.getLayer('google-dc-clusters')) return

    const { width, height } = m.getCanvas()
    const clusters = m.queryRenderedFeatures([[0, 0], [width, height]], { layers: ['google-dc-clusters'] })
    if (clusters.length === 0) {
      setClusterLabelsGeojson(null)
      return
    }

    const source = m.getSource('google-dc-source') as mapboxgl.GeoJSONSource | undefined
    if (!source || !('getClusterLeaves' in source)) return

    const batchId = ++pendingRef.current

    // Fetch leaves for each cluster in parallel
    Promise.all(
      clusters.map(
        (cluster) =>
          new Promise<GeoJSON.Feature | null>((resolve) => {
            const clusterId = cluster.properties?.cluster_id
            const count = cluster.properties?.point_count ?? 0
            if (clusterId == null) { resolve(null); return }

            source.getClusterLeaves(clusterId, count, 0, (err, leaves) => {
              if (err || !leaves) { resolve(null); return }
              const names = leaves
                .map((l) => (l.properties as Record<string, string>)?.name)
                .filter(Boolean)
                .sort()
              const coords = (cluster.geometry as GeoJSON.Point).coordinates
              resolve({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: coords },
                properties: { label: names.join('\n') },
              })
            })
          })
      )
    ).then((features) => {
      // Only update if this is still the latest batch
      if (batchId !== pendingRef.current) return
      const valid = features.filter(Boolean) as GeoJSON.Feature[]
      if (valid.length > 0) {
        setClusterLabelsGeojson({ type: 'FeatureCollection', features: valid })
      } else {
        setClusterLabelsGeojson(null)
      }
    })
  }, [map])

  useEffect(() => {
    if (!map) return
    const m = map.getMap()

    const handler = () => updateClusterLabels()
    // Update on zoom/pan and when source data finishes loading
    m.on('moveend', handler)
    m.on('sourcedata', handler)

    return () => {
      m.off('moveend', handler)
      m.off('sourcedata', handler)
    }
  }, [map, updateClusterLabels])

  return (
    <>
      <GoogleGIcon />
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

      {/* Cluster name labels (logo-label mode) — separate source from cluster leaves */}
      {clusterLabelsGeojson && showLabels && (
        <Source id="google-dc-cluster-labels-source" type="geojson" data={clusterLabelsGeojson}>
          <Layer
            id="google-dc-cluster-labels"
            type="symbol"
            layout={{
              'text-field': ['get', 'label'],
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
              'text-size': 11,
              'text-offset': [0, 1.8],
              'text-anchor': 'top',
              'text-max-width': 14,
              'text-allow-overlap': true,
            }}
            paint={{
              'text-color': '#d1d5db',
              'text-halo-color': 'rgba(0,0,0,0.7)',
              'text-halo-width': 1.5,
            }}
          />
        </Source>
      )}

      {/* Hover popup */}
      {hovered && visible && (
        <Popup
          longitude={hovered.lngLat[0]}
          latitude={hovered.lngLat[1]}
          closeButton={false}
          closeOnClick={false}
          offset={20}
          className="[&_.mapboxgl-popup-content]:!bg-gray-900 [&_.mapboxgl-popup-content]:!rounded-lg [&_.mapboxgl-popup-content]:!shadow-xl [&_.mapboxgl-popup-content]:!p-3 [&_.mapboxgl-popup-content]:!border [&_.mapboxgl-popup-content]:!border-white/10 [&_.mapboxgl-popup-tip]:!border-t-gray-900 [&_.mapboxgl-popup-tip]:!border-b-gray-900"
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
