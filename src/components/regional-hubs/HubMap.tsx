'use client'

import { useRef, useCallback, useState, useMemo } from 'react'
import Map, { type MapRef, type MapMouseEvent, Source, Layer } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { CountyChoropleth } from './CountyChoropleth'
import type { ColorMode } from './CountyChoropleth'
import { HubRegionOverlay } from './HubRegionOverlay'
import { HeatmapLayer } from './HeatmapLayer'
import { TopCountiesLayer } from './TopCountiesLayer'
import { ScoreDotsLayer } from './ScoreDotsLayer'
import { HubClustersLayer } from './HubClustersLayer'
import { useIsDark } from '@/hooks/useIsDark'
import { useCountyGeoJson } from '@/hooks/useCountyGeoJson'
import { useHeatmapData } from '@/hooks/useHeatmapData'
import { useHubClusters } from '@/hooks/useHubClusters'
import { useHexGridData } from '@/hooks/useHexGridData'
import type { HubRegion } from '@/types/regional-hubs'
import type { QuantileBreaks } from '@/hooks/useWeightedScores'

export type ViewMode = 'county' | 'hub' | 'top-counties' | 'clusters' | 'dots' | 'hex' | 'contours'

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
}: HubMapProps) {
  const internalRef = useRef<MapRef>(null)
  const ref = externalRef || internalRef
  const [hoveredFips, setHoveredFips] = useState<string | null>(null)
  const isDark = useIsDark()

  const { geojson: baseGeojson } = useCountyGeoJson()
  const heatmapData = useHeatmapData(baseGeojson, scoreLookup)
  const clusterData = useHubClusters(baseGeojson, scoreLookup)
  const hexData = useHexGridData(baseGeojson, scoreLookup)

  const isCountyMode = viewMode === 'county'
  // Overlay modes need county-boundaries source but not the scored fill
  const needsDarkBase = viewMode === 'top-counties' || viewMode === 'contours'

  // Compute p80 threshold for top-counties mode
  const topCountyThreshold = useMemo(() => {
    if (scoreLookup.size === 0) return 7
    const scores = [...scoreLookup.values()].sort((a, b) => a - b)
    return scores[Math.floor(scores.length * 0.8)]
  }, [scoreLookup])

  // Contour band thresholds (4 nested levels)
  const contourThresholds = useMemo(() => {
    if (scoreLookup.size === 0) return [5, 6, 7, 8]
    const scores = [...scoreLookup.values()].sort((a, b) => a - b)
    return [
      scores[Math.floor(scores.length * 0.5)],  // p50
      scores[Math.floor(scores.length * 0.65)],  // p65
      scores[Math.floor(scores.length * 0.8)],   // p80
      scores[Math.floor(scores.length * 0.92)],  // p92
    ]
  }, [scoreLookup])

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

      {/* Contour Bands: 4 nested fill layers for topographic effect */}
      {(['contour-band-0', 'contour-band-1', 'contour-band-2', 'contour-band-3'] as const).map((id, i) => (
        <Layer
          key={id}
          id={id}
          source="county-boundaries"
          type="fill"
          layout={{ visibility: viewMode === 'contours' ? 'visible' : 'none' }}
          filter={['>=', ['get', 'compositeScore'], contourThresholds[i]]}
          paint={{
            'fill-color': ['#3d2255', '#6b3580', '#b48fc1', '#4de2e4'][i],
            'fill-opacity': [0.35, 0.4, 0.5, 0.7][i],
          }}
        />
      ))}

      {heatmapData && (
        <HeatmapLayer data={heatmapData} visible={viewMode === 'hub'} />
      )}

      {/* Score Dots: proportional circles at county centroids */}
      <ScoreDotsLayer
        geojson={baseGeojson}
        scoreLookup={scoreLookup}
        visible={viewMode === 'dots'}
      />

      {/* Hub Clusters: convex hull boundaries + labels */}
      {clusterData && (
        <HubClustersLayer data={clusterData} visible={viewMode === 'clusters'} />
      )}

      {/* Hex Grid: regular hexagonal tiles */}
      {hexData && (
        <Source id="hex-grid-source" type="geojson" data={hexData}>
          <Layer
            id="hex-grid-fill"
            type="fill"
            layout={{ visibility: viewMode === 'hex' ? 'visible' : 'none' }}
            paint={{
              'fill-color': [
                'interpolate', ['linear'], ['get', 'avgScore'],
                0, '#1a1520',
                3, '#2d2233',
                5, '#5c2d55',
                7, '#8b3578',
                8, '#b48fc1',
                9, '#4de2e4',
              ],
              'fill-opacity': 0.75,
            }}
          />
          <Layer
            id="hex-grid-outline"
            type="line"
            layout={{ visibility: viewMode === 'hex' ? 'visible' : 'none' }}
            paint={{
              'line-color': 'rgba(255, 255, 255, 0.1)',
              'line-width': 0.5,
            }}
          />
        </Source>
      )}

      {regions.length > 0 && <HubRegionOverlay regions={regions} />}
    </Map>
  )
}
