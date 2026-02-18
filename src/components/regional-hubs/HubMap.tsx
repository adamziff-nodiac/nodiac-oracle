'use client'

import { useRef, useCallback, useState, useMemo, useEffect } from 'react'
import Map, { type MapRef, type MapMouseEvent, Layer } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { CountyChoropleth } from './CountyChoropleth'
import type { ColorMode } from './CountyChoropleth'
import { HubRegionOverlay } from './HubRegionOverlay'
import { HeatmapLayer } from './HeatmapLayer'
import { TopCountiesLayer } from './TopCountiesLayer'
import { HubClustersLayer } from './HubClustersLayer'
import { ClusterRegionsLayer } from './ClusterRegionsLayer'
import { PortfolioOverlay } from './PortfolioOverlay'
import { useIsDark } from '@/hooks/useIsDark'
import { useCountyGeoJson } from '@/hooks/useCountyGeoJson'
import { useHeatmapData } from '@/hooks/useHeatmapData'
import { useHubClusters } from '@/hooks/useHubClusters'
import type { ClusterOptions } from '@/lib/geo/cluster-hubs'
import type { HubRegion } from '@/types/regional-hubs'
import type { QuantileBreaks } from '@/hooks/useWeightedScores'

export type ViewMode = 'county' | 'hub' | 'top-counties' | 'clusters' | 'regions'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

interface HubMapProps {
  scoreLookup: Map<string, number>
  scoreRange: readonly [number, number]
  regions: HubRegion[]
  onCountyClick?: (fips: string) => void
  onCountyHover?: (fips: string | null) => void
  mapRef?: React.RefObject<MapRef | null>
  highlightThreshold?: number
  colorMode?: ColorMode
  quantileBreaks?: QuantileBreaks | null
  viewMode?: ViewMode
  topPercent?: number
  clusterOptions?: ClusterOptions
  onClusterCount?: (count: number) => void
  showPortfolio?: boolean
  portfolioSites?: { latitude: number | null; longitude: number | null; fips_code: string | null; site_name: string; site_score: number | null }[]
}

export function HubMap({
  scoreLookup,
  scoreRange,
  regions,
  onCountyClick,
  onCountyHover,
  mapRef: externalRef,
  highlightThreshold,
  colorMode,
  quantileBreaks,
  viewMode = 'county',
  topPercent = 20,
  clusterOptions,
  onClusterCount,
  showPortfolio = false,
  portfolioSites = [],
}: HubMapProps) {
  const internalRef = useRef<MapRef>(null)
  const ref = externalRef || internalRef
  const [hoveredFips, setHoveredFips] = useState<string | null>(null)
  const isDark = useIsDark()

  const { geojson: baseGeojson } = useCountyGeoJson()
  const heatmapData = useHeatmapData(baseGeojson, scoreLookup)
  const clusterData = useHubClusters(baseGeojson, scoreLookup, clusterOptions)

  useEffect(() => {
    onClusterCount?.(clusterData?.clusters.length ?? 0)
  }, [clusterData, onClusterCount])

  const isCountyMode = viewMode === 'county'
  const needsDarkBase = viewMode === 'top-counties'

  // Compute threshold for top-counties mode based on configurable percent
  const topCountyThreshold = useMemo(() => {
    if (scoreLookup.size === 0) return 7
    const scores = [...scoreLookup.values()].sort((a, b) => a - b)
    return scores[Math.floor(scores.length * (1 - topPercent / 100))]
  }, [scoreLookup, topPercent])

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
      cursor={isCountyMode && hoveredFips ? 'pointer' : 'grab'}
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

      {/* Dark base fill for overlay modes (top-counties, contours) */}
      <Layer
        id="dark-base-fill"
        source="county-boundaries"
        type="fill"
        layout={{ visibility: needsDarkBase ? 'visible' : 'none' }}
        paint={{
          'fill-color': '#1a1520',
          'fill-opacity': 0.9,
        }}
      />

      {/* Top Counties: teal overlay on qualifying counties */}
      <TopCountiesLayer
        threshold={topCountyThreshold}
        visible={viewMode === 'top-counties'}
      />

      {heatmapData && (
        <HeatmapLayer data={heatmapData} visible={viewMode === 'hub'} />
      )}

      {/* Hub Clusters: convex hull boundaries + labels */}
      {clusterData && (
        <HubClustersLayer data={clusterData} visible={viewMode === 'clusters'} />
      )}

      {/* Cluster Regions: county-level cluster membership */}
      {clusterData && (
        <ClusterRegionsLayer
          regionsGeojson={clusterData.regionsGeojson}
          labelsGeojson={clusterData.labelsGeojson}
          visible={viewMode === 'regions'}
        />
      )}

      {/* Portfolio sites overlay */}
      {showPortfolio && clusterData && portfolioSites.length > 0 && (
        <PortfolioOverlay
          sites={portfolioSites}
          fipsClusterStatus={clusterData.fipsClusterStatus}
          scoreLookup={scoreLookup}
          visible={showPortfolio && (viewMode === 'regions' || viewMode === 'clusters')}
        />
      )}

      {regions.length > 0 && <HubRegionOverlay regions={regions} />}
    </Map>
  )
}
