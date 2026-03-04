'use client'

import { useState, useCallback, useMemo } from 'react'
import Map, { Marker, Popup } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useIsDark } from '@/hooks/useIsDark'
import type { PortfolioSite, SiteTier } from '@/types/screening'
import { TIER_COLORS, TIER_LABELS } from '@/types/screening'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const CRITERION_LABELS: Record<string, string> = {
  grid_reliability: 'Grid Reliability',
  clipped_curtailed: 'Curtailment',
  permitting: 'Permitting',
  labor: 'Labor',
  fiber: 'Fiber',
  queue_pressure: 'Queue Pressure',
  coop_density: 'Co-op Density',
}

interface CountySaidiData {
  avg_saidi: number | null
  years: number | null
}

interface ScreeningMapProps {
  sites: PortfolioSite[]
  selectedSiteId: string | null
  onSiteSelect: (siteId: string) => void
  visibleTiers: Set<SiteTier>
  countySaidi?: Record<string, CountySaidiData>
}

export function ScreeningMap({ sites, selectedSiteId, onSiteSelect, visibleTiers, countySaidi }: ScreeningMapProps) {
  const [popupSite, setPopupSite] = useState<PortfolioSite | null>(null)
  const [expanded, setExpanded] = useState(false)
  const isDark = useIsDark()

  const sitesWithCoords = useMemo(
    () => sites.filter(
      s => s.latitude != null && s.longitude != null && visibleTiers.has(s.tier as SiteTier)
    ),
    [sites, visibleTiers]
  )

  const initialView = useMemo(() => {
    const allWithCoords = sites.filter(s => s.latitude != null && s.longitude != null)
    if (allWithCoords.length === 0) {
      return { longitude: -96, latitude: 39, zoom: 4 }
    }
    const lats = allWithCoords.map(s => Number(s.latitude))
    const lngs = allWithCoords.map(s => Number(s.longitude))
    // On mobile (< 768px), zoom out more so the full US is visible
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const defaultZoom = isMobile ? 3 : 5

    return {
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      zoom: allWithCoords.length === 1 ? (isMobile ? 6 : 8) : defaultZoom,
    }
  }, [sites])

  const handleMarkerClick = useCallback((site: PortfolioSite) => {
    setPopupSite(prev => prev?.id === site.id ? null : site)
    setExpanded(false)
    onSiteSelect(site.id)
  }, [onSiteSelect])

  const handlePopupClose = useCallback(() => {
    setPopupSite(null)
    setExpanded(false)
  }, [])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-nodiac-dark/50 text-gray-500 dark:text-gray-400">
        <p>Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the map</p>
      </div>
    )
  }

  // Build score breakdown rows for popup
  const breakdownRows = popupSite?.score_breakdown
    ? Object.entries(popupSite.score_breakdown)
        .filter(([, v]) => v != null)
        .sort(([, a], [, b]) => (b as number) - (a as number))
    : []

  return (
    <Map
      key={isDark ? 'dark' : 'light'}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={initialView}
      style={{ width: '100%', height: '100%' }}
      mapStyle={isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'}
      onClick={() => { setPopupSite(null); setExpanded(false) }}
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
              handleMarkerClick(site)
            }}
          >
            {/* Enlarged invisible hit area for mobile tap targets */}
            <div
              className="relative flex items-center justify-center cursor-pointer"
              style={{ width: 40, height: 40 }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                handleMarkerClick(site)
              }}
            >
              <div
                className="rounded-full border-2 transition-all pointer-events-none"
                style={{
                  width: isSelected ? 16 : 12,
                  height: isSelected ? 16 : 12,
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
          className="screening-tooltip"
          maxWidth="280px"
        >
          <div className="px-2 py-1.5 text-xs">
            <p className="font-semibold text-gray-900 text-sm">{popupSite.site_name}</p>
            <p className="text-gray-500">
              {[popupSite.county, popupSite.state].filter(Boolean).join(', ') || 'Unknown location'}
            </p>

            {popupSite.site_score != null && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: TIER_COLORS[popupSite.tier as SiteTier] || '#666' }}
                />
                <span className="font-medium text-gray-800">
                  {TIER_LABELS[popupSite.tier as SiteTier] || 'Unscored'}
                </span>
                <span className="text-gray-500">
                  — {popupSite.site_score.toFixed(1)} / 10
                </span>
              </div>
            )}

            {/* Projected uptime from county SAIDI data */}
            {popupSite.fips_code && countySaidi?.[popupSite.fips_code]?.avg_saidi != null && (() => {
              const saidi = countySaidi[popupSite.fips_code].avg_saidi!
              const uptime = (100 - (saidi / 525960) * 100)
              return (
                <p className="text-[10px] text-gray-500 mt-1">
                  Projected grid uptime: <span className="font-medium text-gray-700">{uptime.toFixed(saidi < 1000 ? 3 : 2)}%</span>
                  <span className="text-gray-400"> ({saidi.toFixed(0)} min/yr outage)</span>
                </p>
              )
            })()}

            {/* Top criteria (always show top 3) */}
            {breakdownRows.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Score Breakdown</p>
                {(expanded ? breakdownRows : breakdownRows.slice(0, 3)).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className="flex-1 flex items-center gap-1.5">
                      <span className="text-gray-600 truncate">{CRITERION_LABELS[key] || key}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${((val as number) * 100).toFixed(0)}%`,
                            backgroundColor: TIER_COLORS[popupSite.tier as SiteTier] || '#666',
                          }}
                        />
                      </div>
                      <span className="text-gray-500 w-7 text-right tabular-nums">
                        {((val as number) * 10).toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
                {breakdownRows.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpanded(!expanded)
                    }}
                    className="text-[10px] text-nodiac-secondary hover:underline mt-0.5"
                  >
                    {expanded ? 'Show less' : `+${breakdownRows.length - 3} more`}
                  </button>
                )}
              </div>
            )}
          </div>
        </Popup>
      )}
    </Map>
  )
}
