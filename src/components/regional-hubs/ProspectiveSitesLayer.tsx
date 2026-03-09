'use client'

import { useEffect, useState } from 'react'
import { Source, Layer, Popup, useMap } from 'react-map-gl/mapbox'
import type { ProspectiveSiteProperties } from '@/types/prospective-sites'
import { SitePopupContent, POPUP_CLASS, type SitePopupData } from './SitePopupContent'

// Color mapping by site type
const SITE_COLORS: Record<ProspectiveSiteProperties['siteType'], string> = {
  solar: '#FFB800',     // amber
  wind: '#00B4D8',      // cyan
  storage: '#7B2FBE',   // purple
  hydro: '#0EA5E9',     // sky blue
  other: '#9CA3AF',     // gray
  substation: '#22C55E', // green
}

interface ProspectiveSitesLayerProps {
  geojson: GeoJSON.FeatureCollection<GeoJSON.Point, ProspectiveSiteProperties> | null
  visible?: boolean
}

export function ProspectiveSitesLayer({ geojson, visible = true }: ProspectiveSitesLayerProps) {
  const { current: map } = useMap()
  const [hovered, setHovered] = useState<{
    site: SitePopupData
    lngLat: [number, number]
  } | null>(null)

  const visibility = visible ? ('visible' as const) : ('none' as const)

  // Hover events
  useEffect(() => {
    if (!map) return
    const m = map.getMap()

    const handleEnter = (e: mapboxgl.MapLayerMouseEvent) => {
      m.getCanvas().style.cursor = 'pointer'
      if (!e.features?.length) return
      const f = e.features[0]
      if (f.geometry.type === 'Point') {
        const coords = f.geometry.coordinates as [number, number]
        // Mapbox stringifies nested properties, parse them back
        const props = f.properties as Record<string, string | number | null>
        const parseStr = (v: string | number | null | undefined) =>
          v != null && String(v) !== '' && String(v) !== 'null' ? String(v) : null
        const parseNum = (v: string | number | null | undefined) =>
          v != null && String(v) !== '' && String(v) !== 'null' ? Number(v) : null

        setHovered({
          site: {
            name: String(props.name || ''),
            siteType: String(props.siteType || 'other') as SitePopupData['siteType'],
            state: String(props.state || ''),
            voltage: parseNum(props.voltage),
            voltageTier: parseStr(props.voltageTier),
            distanceMi: Number(props.nearestDCMiles || 0),
            city: parseStr(props.city),
            county: parseStr(props.county),
            lines: parseNum(props.lines),
            minVoltage: parseNum(props.minVoltage),
            utility: parseStr(props.utility),
            utilityType: parseStr(props.utilityType),
            holdingCompany: parseStr(props.holdingCompany),
          },
          lngLat: coords,
        })
      }
    }

    const handleLeave = () => {
      m.getCanvas().style.cursor = ''
      setHovered(null)
    }

    const attach = () => {
      if (!m.isStyleLoaded() || !m.getLayer('prospective-sites-unclustered')) {
        setTimeout(attach, 200)
        return
      }
      m.on('mouseenter', 'prospective-sites-unclustered', handleEnter)
      m.on('mouseleave', 'prospective-sites-unclustered', handleLeave)
    }
    attach()

    return () => {
      try {
        if (m.getLayer('prospective-sites-unclustered')) {
          m.off('mouseenter', 'prospective-sites-unclustered', handleEnter)
          m.off('mouseleave', 'prospective-sites-unclustered', handleLeave)
        }
      } catch { /* style may be undefined during cleanup */ }
    }
  }, [map])

  // Empty collection fallback
  const data = geojson ?? { type: 'FeatureCollection' as const, features: [] }

  // Build Mapbox match expression for circle color
  const colorExpr: mapboxgl.Expression = [
    'match',
    ['get', 'siteType'],
    'solar', SITE_COLORS.solar,
    'wind', SITE_COLORS.wind,
    'storage', SITE_COLORS.storage,
    'hydro', SITE_COLORS.hydro,
    'substation', SITE_COLORS.substation,
    SITE_COLORS.other, // default
  ]

  return (
    <>
      <Source
        id="prospective-sites-source"
        type="geojson"
        data={data}
      >
        {/* Individual site circles — no clustering, always visible */}
        <Layer
          id="prospective-sites-unclustered"
          type="circle"
          layout={{ visibility }}
          paint={{
            'circle-color': colorExpr,
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              3, 2,
              6, 3.5,
              10, 6,
            ],
            'circle-opacity': 0.8,
            'circle-stroke-width': 0.5,
            'circle-stroke-color': 'rgba(0,0,0,0.3)',
          }}
        />
      </Source>

      {/* Hover popup */}
      {hovered && visible && (
        <Popup
          longitude={hovered.lngLat[0]}
          latitude={hovered.lngLat[1]}
          closeButton={false}
          closeOnClick={false}
          anchor="bottom"
          offset={12}
          className={POPUP_CLASS}
        >
          <SitePopupContent site={hovered.site} />
        </Popup>
      )}
    </>
  )
}
