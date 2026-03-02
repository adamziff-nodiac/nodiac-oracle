'use client'

import { useRef, useCallback, useState, useMemo, useEffect } from 'react'
import Map, { type MapRef, type MapMouseEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { CountyChoropleth } from './CountyChoropleth'
import type { ColorMode } from './CountyChoropleth'
import { ClusterRegionsLayer } from './ClusterRegionsLayer'
import { ClusterLabelsLayer } from './ClusterLabelsLayer'
import { OutlineHullsLayer } from './OutlineHullsLayer'
import { GradientHubsLayer } from './GradientHubsLayer'
import { TierHubsLayer } from './TierHubsLayer'
import { PortfolioOverlay } from './PortfolioOverlay'
import { GoogleDataCentersLayer, type GoogleDCDisplayMode } from './GoogleDataCentersLayer'
import { RadiusCirclesLayer } from './RadiusCirclesLayer'
import { ProspectiveSitesLayer } from './ProspectiveSitesLayer'
import { useIsDark } from '@/hooks/useIsDark'
import { useCountyGeoJson } from '@/hooks/useCountyGeoJson'
import { useHubClusters } from '@/hooks/useHubClusters'
import type { ClusterOptions, HubCluster } from '@/lib/geo/cluster-hubs'
import type { QuantileBreaks } from '@/hooks/useWeightedScores'
import type { ProspectiveSiteProperties } from '@/types/prospective-sites'

export type ViewMode = 'county' | 'regions' | 'outline' | 'gradient' | 'tiers'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

interface HubMapProps {
  scoreLookup: Map<string, number>
  scoreRange: readonly [number, number]
  onCountyClick?: (fips: string) => void
  onCountyHover?: (fips: string | null) => void
  mapRef?: React.RefObject<MapRef | null>
  highlightThreshold?: number
  colorMode?: ColorMode
  quantileBreaks?: QuantileBreaks | null
  viewMode?: ViewMode
  clusterOptions?: ClusterOptions
  onClusterCount?: (count: number) => void
  showPortfolio?: boolean
  portfolioSites?: { latitude: number | null; longitude: number | null; fips_code: string | null; site_name: string; site_score: number | null }[]
  showLabels?: boolean
  showGoogleDC?: boolean
  googleDCDisplayMode?: GoogleDCDisplayMode
  nameOverrides?: Record<number, string>
  positionOverrides?: Record<number, { lng: number; lat: number }>
  onPositionOverride?: (clusterId: number, pos: { lng: number; lat: number }) => void
  onClusters?: (clusters: HubCluster[]) => void
  showProspectiveSites?: boolean
  prospectiveSitesGeojson?: GeoJSON.FeatureCollection<GeoJSON.Point, ProspectiveSiteProperties> | null
  prospectiveRadius?: number
}

export function HubMap({
  scoreLookup,
  scoreRange,
  onCountyClick,
  onCountyHover,
  mapRef: externalRef,
  highlightThreshold,
  colorMode,
  quantileBreaks,
  viewMode = 'county',
  clusterOptions,
  onClusterCount,
  showPortfolio = false,
  portfolioSites = [],
  showLabels = true,
  showGoogleDC = false,
  googleDCDisplayMode = 'logo',
  nameOverrides,
  positionOverrides,
  onPositionOverride,
  onClusters,
  showProspectiveSites = false,
  prospectiveSitesGeojson = null,
  prospectiveRadius = 100,
}: HubMapProps) {
  const internalRef = useRef<MapRef>(null)
  const ref = externalRef || internalRef
  const [hoveredFips, setHoveredFips] = useState<string | null>(null)
  const isDark = useIsDark()
  const [isDragging, setIsDragging] = useState(false)
  const onPositionOverrideRef = useRef(onPositionOverride)
  onPositionOverrideRef.current = onPositionOverride

  const { geojson: baseGeojson } = useCountyGeoJson()
  const clusterData = useHubClusters(baseGeojson, scoreLookup, clusterOptions)

  useEffect(() => {
    onClusterCount?.(clusterData?.clusters.length ?? 0)
    onClusters?.(clusterData?.clusters ?? [])
  }, [clusterData, onClusterCount, onClusters])

  // Build FIPS → clusterId lookup from all cluster counties (member + fill)
  const fipsToClusterId = useMemo(() => {
    if (!clusterData) return null
    const lookup: Record<string, number> = {}
    for (const feature of clusterData.regionsGeojson.features) {
      const fips = feature.properties?.FIPS as string | undefined
      const clusterId = feature.properties?.clusterId as number
      const status = feature.properties?.clusterStatus as number
      if (fips && status > 0 && clusterId >= 0) {
        lookup[fips] = clusterId
      }
    }
    return lookup
  }, [clusterData])

  // Compute which cluster IDs contain at least one portfolio site + per-cluster site counts
  const { populatedClusterIds, clusterSiteCounts } = useMemo(() => {
    if (!fipsToClusterId || !showPortfolio || portfolioSites.length === 0)
      return { populatedClusterIds: null, clusterSiteCounts: null }
    const ids = new Set<number>()
    const counts: Record<number, number> = {}
    for (const site of portfolioSites) {
      if (!site.fips_code) continue
      const clusterId = fipsToClusterId[site.fips_code]
      if (clusterId != null) {
        ids.add(clusterId)
        counts[clusterId] = (counts[clusterId] ?? 0) + 1
      }
    }
    return { populatedClusterIds: ids, clusterSiteCounts: counts }
  }, [fipsToClusterId, showPortfolio, portfolioSites])

  const isCountyMode = viewMode === 'county'

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      if (!isCountyMode) return
      const feature = e.features?.[0]
      if (feature?.properties?.FIPS) {
        onCountyClick?.(feature.properties.FIPS)
      }
    },
    [onCountyClick, isCountyMode]
  )

  const handleHover = useCallback(
    (e: MapMouseEvent) => {
      if (!isCountyMode) {
        setHoveredFips(null)
        onCountyHover?.(null)
        return
      }
      const feature = e.features?.[0]
      const fips = feature?.properties?.FIPS || null
      setHoveredFips(fips)
      onCountyHover?.(fips)
    },
    [onCountyHover, isCountyMode]
  )

  const handleMouseLeave = useCallback(() => {
    setHoveredFips(null)
    onCountyHover?.(null)
  }, [onCountyHover])

  const handleStyleLoad = useCallback(() => {
    const map = (ref as React.RefObject<MapRef>).current?.getMap()
    if (!map) return

    // Tame scroll zoom: enable smooth animation and reduce wheel sensitivity
    const scrollZoom = map.scrollZoom
    scrollZoom.setWheelZoomRate(1 / 200)
    scrollZoom.setZoomRate(1 / 200)

    const addStateBorders = () => {
      // Wait for either county-fill or hub-heatmap layer to exist
      if (!map.getLayer('county-fill') && !map.getLayer('hub-heatmap')) {
        setTimeout(addStateBorders, 200)
        return
      }
      try {
        if (map.getLayer('state-borders-bg')) map.removeLayer('state-borders-bg')
        if (map.getLayer('state-borders')) map.removeLayer('state-borders')

        map.addLayer({
          id: 'state-borders-bg',
          type: 'line',
          source: 'composite',
          'source-layer': 'admin',
          filter: [
            'all',
            ['==', ['get', 'admin_level'], 1],
            ['==', ['get', 'maritime'], 'false'],
          ],
          paint: {
            'line-color': 'rgba(255, 255, 255, 0.2)',
            'line-width': [
              'interpolate', ['linear'], ['zoom'],
              3, 4,
              6, 7,
              8, 8,
            ],
            'line-blur': 2,
          },
        })

        map.addLayer({
          id: 'state-borders',
          type: 'line',
          source: 'composite',
          'source-layer': 'admin',
          filter: [
            'all',
            ['==', ['get', 'admin_level'], 1],
            ['==', ['get', 'maritime'], 'false'],
          ],
          paint: {
            'line-color': 'rgba(255, 255, 255, 0.7)',
            'line-width': [
              'interpolate', ['linear'], ['zoom'],
              3, 1.5,
              6, 2.5,
              8, 3,
            ],
          },
        })
      } catch (err) {
        console.error('[HubMap] Failed to add state borders:', err)
      }
    }
    addStateBorders()

    // Label dragging
    const dragState: { clusterId: number | null } = { clusterId: null }

    map.on('mousedown', (e) => {
      if (!map.getLayer('cluster-regions-labels')) return
      const features = map.queryRenderedFeatures(e.point, { layers: ['cluster-regions-labels'] })
      if (!features.length) return
      const clusterId = features[0].properties?.id
      if (clusterId == null) return
      e.preventDefault()
      dragState.clusterId = clusterId
      map.dragPan.disable()
      setIsDragging(true)
    })

    map.on('mousemove', (e) => {
      if (dragState.clusterId == null) return
      onPositionOverrideRef.current?.(dragState.clusterId, { lng: e.lngLat.lng, lat: e.lngLat.lat })
    })

    map.on('mouseup', () => {
      if (dragState.clusterId == null) return
      dragState.clusterId = null
      map.dragPan.enable()
      setIsDragging(false)
    })

    map.on('mouseout', () => {
      if (dragState.clusterId == null) return
      dragState.clusterId = null
      map.dragPan.enable()
      setIsDragging(false)
    })
  }, [ref])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-nodiac-dark/50 text-gray-500 dark:text-gray-400">
        <p>Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the map</p>
      </div>
    )
  }

  return (
    <Map
      ref={ref}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: -98,
        latitude: 39,
        zoom: 3.5,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'}
      preserveDrawingBuffer={true}
      interactiveLayerIds={isCountyMode ? ['county-fill'] : []}
      onClick={handleClick}
      onMouseMove={handleHover}
      onMouseLeave={handleMouseLeave}
      cursor={isDragging ? 'grabbing' : isCountyMode && hoveredFips ? 'pointer' : 'grab'}
      onLoad={handleStyleLoad}
    >
      {/* Always render CountyChoropleth to keep county-boundaries source alive */}
      {baseGeojson && (
        <CountyChoropleth
          baseGeojson={baseGeojson}
          scoreLookup={scoreLookup}
          scoreRange={scoreRange}
          hoveredFips={hoveredFips}
          highlightThreshold={highlightThreshold}
          colorMode={colorMode}
          quantileBreaks={quantileBreaks}
          visible={isCountyMode}
        />
      )}

      {/* Cluster Regions: county-level cluster membership */}
      {clusterData && (
        <ClusterRegionsLayer
          regionsGeojson={clusterData.regionsGeojson}
          visible={viewMode === 'regions'}
          populatedClusterIds={populatedClusterIds}
        />
      )}

      {/* Outline view: muted county background + hull outlines with glow */}
      {clusterData && (
        <OutlineHullsLayer
          hullsGeojson={clusterData.hullsGeojson}
          regionsGeojson={clusterData.regionsGeojson}
          visible={viewMode === 'outline'}
        />
      )}

      {/* Gradient Hubs: score-based gradient within hub regions */}
      {clusterData && (
        <GradientHubsLayer
          regionsGeojson={clusterData.regionsGeojson}
          scoreLookup={scoreLookup}
          quantileBreaks={quantileBreaks ?? null}
          visible={viewMode === 'gradient'}
        />
      )}

      {/* Tier Hubs: 4-tier percentile bands within hub regions */}
      {clusterData && (
        <TierHubsLayer
          regionsGeojson={clusterData.regionsGeojson}
          scoreLookup={scoreLookup}
          visible={viewMode === 'tiers'}
        />
      )}

      {/* Portfolio sites overlay */}
      {showPortfolio && clusterData && portfolioSites.length > 0 && (
        <PortfolioOverlay
          sites={portfolioSites}
          fipsClusterStatus={clusterData.fipsClusterStatus}
          scoreLookup={scoreLookup}
          visible={showPortfolio}
          viewMode={viewMode}
        />
      )}

      {/* Hub labels — rendered AFTER portfolio dots so they appear on top */}
      {clusterData && (
        <ClusterLabelsLayer
          labelsGeojson={clusterData.labelsGeojson}
          visible={viewMode !== 'county' && showLabels}
          nameOverrides={nameOverrides}
          positionOverrides={positionOverrides}
          siteCounts={clusterSiteCounts}
        />
      )}

      {/* Prospective sites: radius circles behind points, always mounted for stable z-order */}
      <RadiusCirclesLayer radiusMiles={prospectiveRadius} visible={showProspectiveSites} />
      <ProspectiveSitesLayer geojson={prospectiveSitesGeojson} visible={showProspectiveSites} />

      {/* Google data center overlay — rendered last so logos appear above prospective dots */}
      <GoogleDataCentersLayer
        visible={showGoogleDC}
        displayMode={googleDCDisplayMode}
      />
    </Map>
  )
}
