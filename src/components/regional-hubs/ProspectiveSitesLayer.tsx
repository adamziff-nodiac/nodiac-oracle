'use client'

import { useEffect, useState } from 'react'
import { Source, Layer, Popup, useMap } from 'react-map-gl/mapbox'
import type { ProspectiveSiteProperties } from '@/types/prospective-sites'

// Color mapping by site type
const SITE_COLORS: Record<ProspectiveSiteProperties['siteType'], string> = {
  solar: '#FFB800',     // amber
  wind: '#00B4D8',      // cyan
  storage: '#7B2FBE',   // purple
  hydro: '#0EA5E9',     // sky blue
  other: '#9CA3AF',     // gray
  substation: '#22C55E', // green
}

const UTILITY_TYPE_LABELS: Record<string, string> = {
  'MUNICIPAL': 'Muni',
  'COOPERATIVE': 'Co-op',
  'INVESTOR OWNED': 'IOU',
  'STATE': 'State',
  'FEDERAL': 'Federal',
  'POLITICAL SUBDIVISION': 'Poli Sub',
  'MUNICIPAL MKTG AUTHORITY': 'Muni Auth',
  'WHOLESALE POWER MARKETER': 'Wholesale',
  'COMMUNITY CHOICE AGGREGATOR': 'CCA',
  'NOT AVAILABLE': '',
}

function SubstationPopup({ props }: { props: ProspectiveSiteProperties }) {
  const voltageStr = (() => {
    if (props.minVoltage != null && props.voltage != null) {
      return props.minVoltage === props.voltage
        ? `${props.voltage}kV`
        : `${props.minVoltage}–${props.voltage}kV`
    }
    if (props.voltage != null) return `${props.voltage}kV`
    if (props.minVoltage != null) return `${props.minVoltage}kV`
    return null
  })()

  const location = [props.city, props.county, props.state].filter(Boolean).join(', ')
  const utilityBadge = props.utilityType && props.utilityType !== 'NOT AVAILABLE'
    ? UTILITY_TYPE_LABELS[props.utilityType] || props.utilityType
    : null

  return (
    <div className="text-xs text-gray-200 space-y-1.5 max-w-[240px]">
      {/* Name */}
      <div className="flex items-center gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: SITE_COLORS.substation }}
        />
        <span className="font-semibold text-white truncate">
          {props.name}
        </span>
      </div>

      {/* Utility owner */}
      {props.utility && (
        <div>
          <span className="text-gray-400">Utility:</span>{' '}
          <span className="font-medium text-green-300">{props.utility}</span>
          {utilityBadge && (
            <span className="ml-1 px-1 py-0.5 rounded text-[10px] bg-white/10 text-gray-300">
              {utilityBadge}
            </span>
          )}
        </div>
      )}

      {/* Holding company (hide if same as utility name) */}
      {props.holdingCompany && props.holdingCompany !== props.utility && (
        <div>
          <span className="text-gray-400">Holding Co:</span>{' '}
          {props.holdingCompany}
        </div>
      )}

      {/* Location */}
      {location && (
        <div>
          <span className="text-gray-400">Location:</span> {location}
        </div>
      )}

      {/* Voltage */}
      {voltageStr && (
        <div>
          <span className="text-gray-400">Voltage:</span> {voltageStr}
        </div>
      )}

      {/* Lines */}
      {props.lines != null && (
        <div>
          <span className="text-gray-400">Lines:</span> {props.lines}
        </div>
      )}

      {/* Distance */}
      <div>
        <span className="text-gray-400">Nearest Google DC:</span>{' '}
        <span className="text-[#4285F4]">{props.nearestDCMiles}mi</span>
      </div>
    </div>
  )
}

interface ProspectiveSitesLayerProps {
  geojson: GeoJSON.FeatureCollection<GeoJSON.Point, ProspectiveSiteProperties> | null
  visible?: boolean
}

export function ProspectiveSitesLayer({ geojson, visible = true }: ProspectiveSitesLayerProps) {
  const { current: map } = useMap()
  const [hovered, setHovered] = useState<{
    props: ProspectiveSiteProperties
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
          props: {
            name: String(props.name || ''),
            siteType: String(props.siteType || 'other') as ProspectiveSiteProperties['siteType'],
            state: String(props.state || ''),
            voltage: parseNum(props.voltage),
            voltageTier: parseStr(props.voltageTier),
            nearestDCMiles: Number(props.nearestDCMiles || 0),
            city: parseStr(props.city),
            county: parseStr(props.county),
            countyFips: parseStr(props.countyFips),
            lines: parseNum(props.lines),
            minVoltage: parseNum(props.minVoltage),
            utility: parseStr(props.utility),
            utilityType: parseStr(props.utilityType),
            holdingCompany: parseStr(props.holdingCompany),
            customers: parseNum(props.customers),
            summerPeakMW: parseNum(props.summerPeakMW),
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
      if (!m.getLayer('prospective-sites-unclustered')) {
        setTimeout(attach, 200)
        return
      }
      m.on('mouseenter', 'prospective-sites-unclustered', handleEnter)
      m.on('mouseleave', 'prospective-sites-unclustered', handleLeave)
    }
    attach()

    return () => {
      if (m.getLayer('prospective-sites-unclustered')) {
        m.off('mouseenter', 'prospective-sites-unclustered', handleEnter)
        m.off('mouseleave', 'prospective-sites-unclustered', handleLeave)
      }
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
          className="[&_.mapboxgl-popup-content]:!bg-gray-900 [&_.mapboxgl-popup-content]:!rounded-lg [&_.mapboxgl-popup-content]:!shadow-xl [&_.mapboxgl-popup-content]:!p-3 [&_.mapboxgl-popup-content]:!border [&_.mapboxgl-popup-content]:!border-white/10 [&_.mapboxgl-popup-tip]:!border-t-gray-900"
        >
          {hovered.props.siteType === 'substation' ? (
            <SubstationPopup props={hovered.props} />
          ) : (
            <div className="text-xs text-gray-200 space-y-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SITE_COLORS[hovered.props.siteType] }}
                />
                <span className="font-semibold text-white truncate max-w-[180px]">
                  {hovered.props.name}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Type:</span>{' '}
                <span className="capitalize">{hovered.props.siteType}</span>
              </div>
              <div>
                <span className="text-gray-400">State:</span> {hovered.props.state}
              </div>
              {hovered.props.voltage != null && (
                <div>
                  <span className="text-gray-400">Voltage:</span> {hovered.props.voltage}kV
                  {hovered.props.voltageTier && (
                    <span className="text-gray-500 ml-1">({hovered.props.voltageTier})</span>
                  )}
                </div>
              )}
              <div>
                <span className="text-gray-400">Nearest Google DC:</span>{' '}
                <span className="text-[#4285F4]">{hovered.props.nearestDCMiles}mi</span>
              </div>
            </div>
          )}
        </Popup>
      )}
    </>
  )
}
