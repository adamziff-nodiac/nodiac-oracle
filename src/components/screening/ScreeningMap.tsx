'use client'

import { useCallback, useMemo } from 'react'
import Map, { Marker } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { PortfolioSite, SiteTier } from '@/types/screening'
import { TIER_COLORS } from '@/types/screening'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

interface ScreeningMapProps {
  sites: PortfolioSite[]
  selectedSiteId: string | null
  onSiteSelect: (siteId: string) => void
}

export function ScreeningMap({ sites, selectedSiteId, onSiteSelect }: ScreeningMapProps) {
  const sitesWithCoords = useMemo(
    () => sites.filter(s => s.latitude != null && s.longitude != null),
    [sites]
  )

  // Compute bounds for initial view
  const initialView = useMemo(() => {
    if (sitesWithCoords.length === 0) {
      return { longitude: -96, latitude: 39, zoom: 4 }
    }
    const lats = sitesWithCoords.map(s => Number(s.latitude))
    const lngs = sitesWithCoords.map(s => Number(s.longitude))
    return {
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      zoom: sitesWithCoords.length === 1 ? 8 : 5,
    }
  }, [sitesWithCoords])

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
              title={`${site.site_name} — ${site.tier || 'unscored'}`}
            />
          </Marker>
        )
      })}
    </Map>
  )
}
