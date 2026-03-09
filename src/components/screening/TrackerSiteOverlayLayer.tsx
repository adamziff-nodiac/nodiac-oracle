'use client'

import { Marker, Popup } from 'react-map-gl/mapbox'
import { useState, useCallback } from 'react'

export interface OverlayTrackerSite {
  id: string
  name: string
  priority: string
  lat: number
  lng: number
  hub_name: string | null
  phase_summary: string
}

const PRIORITY_COLORS: Record<string, string> = {
  'Lead': '#ef4444',
  'Active': '#f59e0b',
  'Pipeline': '#8b5cf6',
  'On Hold': '#71717a',
  'Deprioritized': '#4b5563',
}

interface TrackerSiteOverlayLayerProps {
  sites: OverlayTrackerSite[]
}

export function TrackerSiteOverlayLayer({ sites }: TrackerSiteOverlayLayerProps) {
  const [popupSite, setPopupSite] = useState<OverlayTrackerSite | null>(null)

  const handleClick = useCallback((site: OverlayTrackerSite) => {
    setPopupSite(prev => prev?.id === site.id ? null : site)
  }, [])

  return (
    <>
      {sites.map(site => {
        const color = PRIORITY_COLORS[site.priority] || '#8b5cf6'
        return (
          <Marker
            key={site.id}
            longitude={site.lng}
            latitude={site.lat}
            anchor="center"
            onClick={e => {
              e.originalEvent.stopPropagation()
              handleClick(site)
            }}
          >
            <div
              className="cursor-pointer"
              style={{ width: 28, height: 28 }}
              title={site.name}
            >
              {/* Small square marker */}
              <svg width="12" height="12" viewBox="0 0 12 12" style={{ margin: '8px' }}>
                <rect
                  x="1" y="1" width="10" height="10"
                  fill={color}
                  stroke="white"
                  strokeWidth="1.5"
                  rx="1"
                  opacity="0.9"
                />
              </svg>
            </div>
          </Marker>
        )
      })}

      {popupSite && (
        <Popup
          longitude={popupSite.lng}
          latitude={popupSite.lat}
          offset={14}
          closeButton={true}
          closeOnClick={false}
          onClose={() => setPopupSite(null)}
          className="screening-tooltip"
          maxWidth="220px"
        >
          <div className="px-2 py-1.5 text-xs">
            <p className="font-semibold text-gray-900 text-sm">{popupSite.name}</p>
            <p className="text-gray-500">
              {popupSite.priority} &middot; {popupSite.phase_summary}
            </p>
            {popupSite.hub_name && (
              <p className="text-gray-400 mt-0.5">Hub: {popupSite.hub_name}</p>
            )}
          </div>
        </Popup>
      )}
    </>
  )
}
