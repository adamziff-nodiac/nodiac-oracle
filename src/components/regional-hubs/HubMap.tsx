'use client'

import { useRef, useCallback, useState } from 'react'
import Map, { type MapRef, type MapMouseEvent } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { CountyChoropleth } from './CountyChoropleth'
import { HubRegionOverlay } from './HubRegionOverlay'
import type { CriterionKey, HubRegion } from '@/types/regional-hubs'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

interface HubMapProps {
  scoreLookup: Map<string, number>
  scoreRange: readonly [number, number]
  regions: HubRegion[]
  onCountyClick?: (fips: string) => void
  onCountyHover?: (fips: string | null) => void
  mapRef?: React.RefObject<MapRef | null>
}

export function HubMap({
  scoreLookup,
  scoreRange,
  regions,
  onCountyClick,
  onCountyHover,
  mapRef: externalRef,
}: HubMapProps) {
  const internalRef = useRef<MapRef>(null)
  const ref = externalRef || internalRef
  const [hoveredFips, setHoveredFips] = useState<string | null>(null)

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      const feature = e.features?.[0]
      if (feature?.properties?.FIPS) {
        onCountyClick?.(feature.properties.FIPS)
      }
    },
    [onCountyClick]
  )

  const handleHover = useCallback(
    (e: MapMouseEvent) => {
      const feature = e.features?.[0]
      const fips = feature?.properties?.FIPS || null
      setHoveredFips(fips)
      onCountyHover?.(fips)
    },
    [onCountyHover]
  )

  const handleMouseLeave = useCallback(() => {
    setHoveredFips(null)
    onCountyHover?.(null)
  }, [onCountyHover])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-nodiac-dark/50 text-gray-400">
        <p>Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the map</p>
      </div>
    )
  }

  return (
    <Map
      ref={ref}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: -96,
        latitude: 39,
        zoom: 4,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      interactiveLayerIds={['county-fill']}
      onClick={handleClick}
      onMouseMove={handleHover}
      onMouseLeave={handleMouseLeave}
      cursor={hoveredFips ? 'pointer' : 'grab'}
    >
      <CountyChoropleth
        scoreLookup={scoreLookup}
        scoreRange={scoreRange}
        hoveredFips={hoveredFips}
      />
      {regions.length > 0 && <HubRegionOverlay regions={regions} />}
    </Map>
  )
}
