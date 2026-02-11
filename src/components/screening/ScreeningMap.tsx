'use client'

import { useState, useCallback, useMemo } from 'react'
import Map, { Marker, Popup } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { PortfolioSite, SiteTier } from '@/types/screening'
import { TIER_COLORS, TIER_LABELS } from '@/types/screening'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

interface ScreeningMapProps {
  sites: PortfolioSite[]
  selectedSiteId: string | null
  onSiteSelect: (siteId: string) => void
  visibleTiers: Set<SiteTier>
}

export function ScreeningMap({ sites, selectedSiteId, onSiteSelect, visibleTiers }: ScreeningMapProps) {
  const [hoveredSite, setHoveredSite] = useState<PortfolioSite | null>(null)

  const sitesWithCoords = useMemo(
    () => sites.filter(
      s => s.latitude != null && s.longitude != null && visibleTiers.has(s.tier as SiteTier)
    ),
    [sites, visibleTiers]
  )

  // Compute bounds for initial view
  const initialView = useMemo(() => {
    const allWithCoords = sites.filter(s => s.latitude != null && s.longitude != null)
    if (allWithCoords.length === 0) {
      return { longitude: -96, latitude: 39, zoom: 4 }
    }
    const lats = allWithCoords.map(s => Number(s.latitude))
    const lngs = allWithCoords.map(s => Number(s.longitude))
    return {
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      zoom: allWithCoords.length === 1 ? 8 : 5,
    }
  }, [sites])

  const handleMouseEnter = useCallback((site: PortfolioSite) => {
    setHoveredSite(site)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredSite(null)
  }, [])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-nodiac-dark/50 text-gray-400">
        <p>Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the map</p>
      </div>
    )
  }

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={initialView}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
    >
      {sitesWithCoords.map((site) => {
        const color = TIER_COLORS[site.tier as SiteTier] || '#666'
        const isSelected = site.id === selectedSiteId
        return (
          <Marker
            key={site.id}
            longitude={Number(site.longitude)}
            latitude={Number(site.latitude)}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              onSiteSelect(site.id)
            }}
          >
            <div
              className="rounded-full border-2 transition-all cursor-pointer"
              style={{
                width: isSelected ? 16 : 12,
                height: isSelected ? 16 : 12,
                backgroundColor: color,
                borderColor: isSelected ? '#fff' : 'transparent',
                boxShadow: isSelected ? `0 0 12px ${color}` : `0 0 6px ${color}60`,
              }}
              onMouseEnter={() => handleMouseEnter(site)}
              onMouseLeave={handleMouseLeave}
            />
          </Marker>
        )
      })}

      {hoveredSite && hoveredSite.latitude && hoveredSite.longitude && (
        <Popup
          longitude={Number(hoveredSite.longitude)}
          latitude={Number(hoveredSite.latitude)}
          anchor="bottom"
          offset={12}
          closeButton={false}
          closeOnClick={false}
          className="screening-tooltip"
        >
          <div className="px-2 py-1.5 text-xs">
            <p className="font-semibold text-gray-900">{hoveredSite.site_name}</p>
            <p className="text-gray-500">
              {[hoveredSite.county, hoveredSite.state].filter(Boolean).join(', ') || 'Unknown location'}
            </p>
            {hoveredSite.site_score != null && (
              <p className="mt-0.5">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: TIER_COLORS[hoveredSite.tier as SiteTier] || '#666' }}
                />
                <span className="text-gray-700">
                  {TIER_LABELS[hoveredSite.tier as SiteTier] || 'Unscored'} ({hoveredSite.site_score.toFixed(1)})
                </span>
              </p>
            )}
          </div>
        </Popup>
      )}
    </Map>
  )
}
