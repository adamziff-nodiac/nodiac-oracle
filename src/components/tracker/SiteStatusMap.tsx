'use client'

import { useState, useCallback, useMemo } from 'react'
import Map, { Marker, Popup } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useIsDark } from '@/hooks/useIsDark'
import type { TrackerSiteOverview } from '@/lib/tracker/types'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// Site development status categories and colors
export type SiteStatusCategory =
  | 'not_developing'
  | 'screened_only'
  | 'early_development'
  | 'active_development'
  | 'construction_ready'

export const STATUS_CATEGORY_CONFIG: Record<SiteStatusCategory, { color: string; label: string }> = {
  not_developing: { color: '#71717a', label: 'Not Developing' },
  screened_only: { color: '#a78bfa', label: 'Screened Only' },
  early_development: { color: '#f59e0b', label: 'Early Development' },
  active_development: { color: '#3b82f6', label: 'Active Development' },
  construction_ready: { color: '#22c55e', label: 'Construction Ready' },
}

export function categorizeSite(site: TrackerSiteOverview): SiteStatusCategory {
  // Construction Ready / Operational
  if (
    site.construction_ready === true ||
    site.construction_phase === 'In Progress' ||
    site.construction_phase === 'Complete'
  ) {
    return 'construction_ready'
  }

  // Not Developing
  if (
    site.priority === 'Deprioritized' ||
    site.priority === 'On Hold' ||
    site.is_archived === true
  ) {
    return 'not_developing'
  }

  // Screened Only: has screening score but no active development phases
  if (
    site.screening_score != null &&
    site.site_control_phase === 'Not Started' &&
    site.power_phase === 'Not Started' &&
    !site.has_activity
  ) {
    return 'screened_only'
  }

  // Active Development: power phase or later is in progress
  if (
    site.power_phase === 'In Progress' ||
    site.power_phase === 'Complete' ||
    site.permitting_phase === 'In Progress' ||
    site.permitting_phase === 'Complete' ||
    site.fiber_phase === 'In Progress' ||
    site.fiber_phase === 'Complete' ||
    site.engineering_phase === 'In Progress' ||
    site.engineering_phase === 'Complete'
  ) {
    return 'active_development'
  }

  // Early Development: site control phase
  if (
    site.site_control_phase === 'In Progress' ||
    site.site_control_phase === 'Complete'
  ) {
    return 'early_development'
  }

  // Fallback — default to screened only if has score, otherwise not developing
  if (site.screening_score != null) {
    return 'screened_only'
  }
  return 'not_developing'
}

function getCurrentPhaseLabel(site: TrackerSiteOverview): string {
  if (site.construction_phase === 'Complete') return 'Commissioned'
  if (site.construction_phase === 'In Progress') return 'Construction'
  if (site.construction_ready) return 'Construction Ready'
  if (site.engineering_phase === 'In Progress') return 'Engineering'
  if (site.fiber_phase === 'In Progress') return 'Fiber'
  if (site.permitting_phase === 'In Progress') return 'Permitting'
  if (site.power_phase === 'In Progress') return 'Power'
  if (site.site_control_phase === 'In Progress') return 'Site Control'
  return 'Screening'
}

interface SiteStatusMapProps {
  sites: TrackerSiteOverview[]
  className?: string
}

export function SiteStatusMap({ sites, className }: SiteStatusMapProps) {
  const [popupSite, setPopupSite] = useState<TrackerSiteOverview | null>(null)
  const isDark = useIsDark()

  const sitesWithCoords = useMemo(
    () => sites.filter(s => s.latitude != null && s.longitude != null),
    [sites]
  )

  const initialView = useMemo(() => {
    if (sitesWithCoords.length === 0) {
      return { longitude: -96, latitude: 39, zoom: 4 }
    }
    const lats = sitesWithCoords.map(s => Number(s.latitude))
    const lngs = sitesWithCoords.map(s => Number(s.longitude))

    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    const latSpan = maxLat - minLat
    const lngSpan = maxLng - minLng

    // Auto-zoom based on span
    let zoom = 5
    if (sitesWithCoords.length === 1) zoom = 10
    else if (latSpan < 0.5 && lngSpan < 0.5) zoom = 10
    else if (latSpan < 2 && lngSpan < 2) zoom = 8
    else if (latSpan < 5 && lngSpan < 5) zoom = 6
    else zoom = 5

    return {
      longitude: (minLng + maxLng) / 2,
      latitude: (minLat + maxLat) / 2,
      zoom,
    }
  }, [sitesWithCoords])

  // Count by category for legend
  const categoryCounts = useMemo(() => {
    const counts: Record<SiteStatusCategory, number> = {
      not_developing: 0,
      screened_only: 0,
      early_development: 0,
      active_development: 0,
      construction_ready: 0,
    }
    for (const site of sitesWithCoords) {
      counts[categorizeSite(site)]++
    }
    return counts
  }, [sitesWithCoords])

  const handleMarkerClick = useCallback((site: TrackerSiteOverview) => {
    setPopupSite(prev => prev?.id === site.id ? null : site)
  }, [])

  const handlePopupClose = useCallback(() => {
    setPopupSite(null)
  }, [])

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`w-full flex items-center justify-center bg-zinc-100 dark:bg-[#1a1a2e] text-zinc-500 dark:text-zinc-400 rounded-lg ${className ?? ''}`}>
        <p className="text-sm">Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the map</p>
      </div>
    )
  }

  if (sitesWithCoords.length === 0) {
    return (
      <div className={`w-full flex items-center justify-center bg-zinc-100 dark:bg-[#1a1a2e] text-zinc-500 dark:text-zinc-400 rounded-lg ${className ?? ''}`}>
        <p className="text-sm">No sites with coordinates to display</p>
      </div>
    )
  }

  // Legend categories that have sites (in display order)
  const legendOrder: SiteStatusCategory[] = [
    'construction_ready',
    'active_development',
    'early_development',
    'screened_only',
    'not_developing',
  ]
  const activeLegend = legendOrder.filter(cat => categoryCounts[cat] > 0)

  return (
    <div className={`relative w-full rounded-lg overflow-hidden border border-zinc-200 dark:border-[#2a2a40] ${className ?? ''}`}>
      <Map
        key={isDark ? 'dark' : 'light'}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={initialView}
        style={{ width: '100%', height: '100%' }}
        mapStyle={isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'}
        onClick={() => setPopupSite(null)}
      >
        {sitesWithCoords.map((site) => {
          const category = categorizeSite(site)
          const color = STATUS_CATEGORY_CONFIG[category].color
          const isSelected = popupSite?.id === site.id
          return (
            <Marker
              key={site.id}
              longitude={Number(site.longitude)}
              latitude={Number(site.latitude)}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                handleMarkerClick(site)
              }}
            >
              <div
                className="relative flex items-center justify-center cursor-pointer"
                style={{ width: 36, height: 36 }}
              >
                <div
                  className="rounded-full border-2 transition-all pointer-events-none"
                  style={{
                    width: isSelected ? 16 : 11,
                    height: isSelected ? 16 : 11,
                    backgroundColor: color,
                    borderColor: isSelected ? '#fff' : 'transparent',
                    boxShadow: isSelected ? `0 0 12px ${color}` : `0 0 6px ${color}60`,
                  }}
                />
              </div>
            </Marker>
          )
        })}

        {popupSite && popupSite.latitude && popupSite.longitude && (
          <Popup
            longitude={Number(popupSite.longitude)}
            latitude={Number(popupSite.latitude)}
            anchor="top"
            offset={14}
            closeButton={true}
            closeOnClick={false}
            onClose={handlePopupClose}
            className="site-status-tooltip"
            maxWidth="260px"
          >
            <div className="px-2 py-1.5 text-xs">
              <p className="font-semibold text-gray-900 text-sm">{popupSite.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {popupSite.mw_current != null && (
                  <span className="text-gray-600 tabular-nums">{popupSite.mw_current} MW</span>
                )}
                <span className="text-gray-500">{getCurrentPhaseLabel(popupSite)}</span>
              </div>
              {popupSite.hub_name && (
                <p className="text-gray-400 mt-0.5">Hub: {popupSite.hub_name}</p>
              )}
              {popupSite.asset_owner_name && (
                <p className="text-gray-400 mt-0.5">Owner: {popupSite.asset_owner_name}</p>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-[#16162a]/90 backdrop-blur-sm rounded-lg border border-zinc-200/50 dark:border-[#2a2a40]/50 px-3 py-2 shadow-lg">
        <div className="flex flex-col gap-1.5">
          {activeLegend.map(cat => (
            <div key={cat} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: STATUS_CATEGORY_CONFIG[cat].color }}
              />
              <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                {STATUS_CATEGORY_CONFIG[cat].label}
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">
                ({categoryCounts[cat]})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
