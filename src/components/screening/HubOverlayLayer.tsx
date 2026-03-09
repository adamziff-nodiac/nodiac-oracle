'use client'

import { Marker, Popup } from 'react-map-gl/mapbox'
import { useState, useCallback } from 'react'

export interface OverlayHub {
  id: string
  name: string
  status: string | null
  lat: number
  lng: number
  site_count: number
}

const STATUS_COLORS: Record<string, string> = {
  'Operational': '#10b981',
  'Active Development': '#f59e0b',
  'Planning': '#71717a',
}

interface HubOverlayLayerProps {
  hubs: OverlayHub[]
}

export function HubOverlayLayer({ hubs }: HubOverlayLayerProps) {
  const [popupHub, setPopupHub] = useState<OverlayHub | null>(null)

  const handleClick = useCallback((hub: OverlayHub) => {
    setPopupHub(prev => prev?.id === hub.id ? null : hub)
  }, [])

  return (
    <>
      {hubs.map(hub => {
        const color = STATUS_COLORS[hub.status || ''] || '#71717a'
        return (
          <Marker
            key={hub.id}
            longitude={hub.lng}
            latitude={hub.lat}
            anchor="center"
            onClick={e => {
              e.originalEvent.stopPropagation()
              handleClick(hub)
            }}
          >
            <div
              className="cursor-pointer"
              style={{ width: 32, height: 32 }}
              title={hub.name}
            >
              {/* Diamond shape */}
              <svg width="20" height="20" viewBox="0 0 20 20" style={{ margin: '6px' }}>
                <polygon
                  points="10,0 20,10 10,20 0,10"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                />
              </svg>
            </div>
          </Marker>
        )
      })}

      {popupHub && (
        <Popup
          longitude={popupHub.lng}
          latitude={popupHub.lat}
          offset={14}
          closeButton={true}
          closeOnClick={false}
          onClose={() => setPopupHub(null)}
          className="screening-tooltip"
          maxWidth="200px"
        >
          <div className="px-2 py-1.5 text-xs">
            <p className="font-semibold text-gray-900 text-sm">{popupHub.name}</p>
            <p className="text-gray-500">
              {popupHub.status || 'Unknown'} &middot; {popupHub.site_count} site{popupHub.site_count !== 1 ? 's' : ''}
            </p>
          </div>
        </Popup>
      )}
    </>
  )
}
