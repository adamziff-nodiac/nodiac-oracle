'use client'

const TYPE_COLORS: Record<string, string> = {
  solar: '#FFB800',
  wind: '#00B4D8',
  storage: '#7B2FBE',
  hydro: '#0EA5E9',
  other: '#9CA3AF',
  substation: '#22C55E',
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

export interface SitePopupData {
  name: string
  siteType: 'solar' | 'wind' | 'storage' | 'hydro' | 'other' | 'substation'
  state: string
  voltage: number | null
  distanceMi: number
  city?: string | null
  county?: string | null
  lines?: number | null
  minVoltage?: number | null
  utility?: string | null
  utilityType?: string | null
  holdingCompany?: string | null
  owner?: string | null
  voltageTier?: string | null
}

function SubstationContent({ site }: { site: SitePopupData }) {
  const voltageStr = (() => {
    if (site.minVoltage != null && site.voltage != null) {
      return site.minVoltage === site.voltage
        ? `${site.voltage}kV`
        : `${site.minVoltage}–${site.voltage}kV`
    }
    if (site.voltage != null) return `${site.voltage}kV`
    if (site.minVoltage != null) return `${site.minVoltage}kV`
    return null
  })()

  const location = [site.city, site.county, site.state].filter(Boolean).join(', ')
  const utilityBadge = site.utilityType && site.utilityType !== 'NOT AVAILABLE'
    ? UTILITY_TYPE_LABELS[site.utilityType] || site.utilityType
    : null

  return (
    <div className="text-xs text-gray-200 space-y-1.5 max-w-[240px]">
      <div className="flex items-center gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: TYPE_COLORS.substation }}
        />
        <span className="font-semibold text-white truncate">{site.name}</span>
      </div>

      {site.utility && (
        <div>
          <span className="text-gray-400">Utility:</span>{' '}
          <span className="font-medium text-green-300">{site.utility}</span>
          {utilityBadge && (
            <span className="ml-1 px-1 py-0.5 rounded text-[10px] bg-white/10 text-gray-300">
              {utilityBadge}
            </span>
          )}
        </div>
      )}

      {site.holdingCompany && site.holdingCompany !== site.utility && (
        <div>
          <span className="text-gray-400">Holding Co:</span> {site.holdingCompany}
        </div>
      )}

      {location && (
        <div>
          <span className="text-gray-400">Location:</span> {location}
        </div>
      )}

      <div>
        <span className="text-gray-400">Voltage:</span>{' '}
        {voltageStr ?? <span className="text-gray-500">unknown</span>}
      </div>

      {site.lines != null && (
        <div>
          <span className="text-gray-400">Lines:</span> {site.lines}
        </div>
      )}

      <div>
        <span className="text-gray-400">Distance:</span>{' '}
        <span className="text-[#4285F4]">{site.distanceMi}mi</span>
      </div>
    </div>
  )
}

function RenewableContent({ site }: { site: SitePopupData }) {
  return (
    <div className="text-xs text-gray-200 space-y-1">
      <div className="flex items-center gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: TYPE_COLORS[site.siteType] }}
        />
        <span className="font-semibold text-white truncate max-w-[180px]">{site.name}</span>
      </div>
      <div>
        <span className="text-gray-400">Type:</span>{' '}
        <span className="capitalize">{site.siteType}</span>
      </div>
      {site.owner && (
        <div>
          <span className="text-gray-400">Owner:</span> {site.owner}
        </div>
      )}
      {site.utility && (
        <div>
          <span className="text-gray-400">Utility:</span> {site.utility}
        </div>
      )}
      <div>
        <span className="text-gray-400">State:</span> {site.state}
      </div>
      {site.voltage != null && (
        <div>
          <span className="text-gray-400">Voltage:</span> {site.voltage}kV
          {site.voltageTier && (
            <span className="text-gray-500 ml-1">({site.voltageTier})</span>
          )}
        </div>
      )}
      <div>
        <span className="text-gray-400">Distance:</span>{' '}
        <span className="text-[#4285F4]">{site.distanceMi}mi</span>
      </div>
    </div>
  )
}

export function SitePopupContent({ site }: { site: SitePopupData }) {
  return site.siteType === 'substation'
    ? <SubstationContent site={site} />
    : <RenewableContent site={site} />
}

/** Mapbox popup class string for consistent dark popup styling */
export const POPUP_CLASS = "[&_.mapboxgl-popup-content]:!bg-gray-900 [&_.mapboxgl-popup-content]:!rounded-lg [&_.mapboxgl-popup-content]:!shadow-xl [&_.mapboxgl-popup-content]:!p-3 [&_.mapboxgl-popup-content]:!border [&_.mapboxgl-popup-content]:!border-white/10 [&_.mapboxgl-popup-tip]:!border-t-gray-900 [&_.mapboxgl-popup-tip]:!border-b-gray-900"
