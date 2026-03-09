'use client'

import { useState, useCallback, useMemo } from 'react'
import { X, Download, ChevronDown, ChevronRight, Star, MapPin, Zap, Building2 } from 'lucide-react'
import type { GoogleDataCenter } from '@/data/googleDataCenters'
import { useDCProximity, type UtilityGroup, type ProximitySite, type PipelineSite } from '@/hooks/useDCProximity'

const TYPE_COLORS: Record<string, string> = {
  solar: '#FFB800',
  wind: '#00B4D8',
  storage: '#7B2FBE',
  hydro: '#0EA5E9',
  other: '#9CA3AF',
  substation: '#22C55E',
}

const UTILITY_TYPE_SHORT: Record<string, string> = {
  'MUNICIPAL': 'Municipal',
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

interface DCProximityPanelProps {
  dc: GoogleDataCenter | null
  radiusMiles: number
  onRadiusChange: (radius: number) => void
  onClose: () => void
}

function PipelineSiteRow({ site }: { site: PipelineSite }) {
  const priorityColors: Record<string, string> = {
    Lead: 'bg-red-500/20 text-red-300',
    Active: 'bg-amber-500/20 text-amber-300',
    Pipeline: 'bg-purple-500/20 text-purple-300',
    'On Hold': 'bg-gray-500/20 text-gray-400',
    Deprioritized: 'bg-gray-500/20 text-gray-500',
  }

  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className="flex-shrink-0 mt-0.5">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: TYPE_COLORS[site.siteType?.toLowerCase() ?? 'other'] ?? TYPE_COLORS.other }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{site.name}</span>
          <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityColors[site.priority] ?? priorityColors['On Hold']}`}>
            {site.priority}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400">
          {site.partnerName && <span>{site.partnerName}</span>}
          {site.mw != null && <span>{site.mw} MW</span>}
          {site.hubName && <span className="text-[#c77dba]">{site.hubName}</span>}
        </div>
      </div>
      <span className="flex-shrink-0 text-xs tabular-nums font-mono text-[#4285F4]">
        {site.distanceMi}mi
      </span>
    </div>
  )
}

function UtilityGroupRow({ group, defaultExpanded }: { group: UtilityGroup; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const typeLabel = group.utilityType ? (UTILITY_TYPE_SHORT[group.utilityType] || group.utilityType) : null

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors text-left"
      >
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {group.isPartner && <Star className="w-3 h-3 text-[#c77dba] flex-shrink-0" fill="currentColor" />}
            <span className={`text-sm font-medium truncate ${group.isPartner ? 'text-white' : 'text-gray-200'}`}>
              {group.name}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
            {typeLabel && <span>{typeLabel}</span>}
            {group.isPartner && group.partnerStage && (
              <span className="text-[#c77dba]">{group.partnerStage}</span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-xs tabular-nums font-mono text-gray-300">
            {group.siteCount} {group.siteCount === 1 ? 'sub' : 'subs'}
          </div>
          <div className="text-[10px] tabular-nums font-mono text-gray-500">
            {group.minDistanceMi}mi closest
          </div>
        </div>
      </button>

      {expanded && (
        <div className="ml-6 border-l border-white/5 pl-3 pb-1">
          {group.sites.map((site, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 text-[11px] text-gray-400">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0 opacity-60" />
              <span className="truncate flex-1">{site.name}</span>
              {site.voltage != null && <span className="text-gray-500">{site.voltage}kV</span>}
              <span className="tabular-nums font-mono text-[#4285F4]">{site.distanceMi}mi</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function IPPSiteRow({ site }: { site: ProximitySite }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 px-3 text-[11px]">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: TYPE_COLORS[site.type] }}
      />
      <span className="text-gray-300 truncate flex-1">{site.name}</span>
      <span className="text-gray-500 capitalize flex-shrink-0">{site.type}</span>
      {site.voltage != null && <span className="text-gray-500">{site.voltage}kV</span>}
      <span className="text-gray-500">{site.state}</span>
      <span className="tabular-nums font-mono text-[#4285F4]">{site.distanceMi}mi</span>
    </div>
  )
}

export function DCProximityPanel({ dc, radiusMiles, onRadiusChange, onClose }: DCProximityPanelProps) {
  const { pipelineSites, utilityGroups, ippSites, totalSites, isLoading } = useDCProximity({
    selectedDC: dc,
    radiusMiles,
  })

  const [showAllIPP, setShowAllIPP] = useState(false)
  const visibleIPP = showAllIPP ? ippSites : ippSites.slice(0, 20)

  const exportCSV = useCallback(() => {
    if (!dc) return

    const rows: string[][] = [
      ['Name', 'Type', 'Category', 'Distance (mi)', 'State', 'City', 'County', 'Utility', 'Utility Type', 'Holding Company', 'Voltage (kV)', 'Partner Status', 'Partner Stage'],
    ]

    // Pipeline sites first
    for (const site of pipelineSites) {
      rows.push([
        site.name,
        site.siteType || '',
        'Pipeline',
        String(site.distanceMi),
        '', '', '',
        site.partnerName || '',
        '', '',
        '',
        'Active Partner',
        '',
      ])
    }

    // Utility groups (substations)
    for (const group of utilityGroups) {
      for (const site of group.sites) {
        rows.push([
          site.name,
          'Substation',
          'Substation',
          String(site.distanceMi),
          site.state,
          site.city || '',
          site.county || '',
          site.utility || '',
          site.utilityType || '',
          site.holdingCompany || '',
          site.voltage != null ? String(site.voltage) : '',
          group.isPartner ? 'Existing Partner' : 'Potential',
          group.partnerStage || '',
        ])
      }
    }

    // IPP sites
    for (const site of ippSites) {
      rows.push([
        site.name,
        site.type,
        'Renewable',
        String(site.distanceMi),
        site.state,
        '', '', '', '', '',
        site.voltage != null ? String(site.voltage) : '',
        '',
        '',
      ])
    }

    const csvContent = rows.map(row =>
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${dc.name.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}-${radiusMiles}mi-proximity.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [dc, radiusMiles, pipelineSites, utilityGroups, ippSites])

  // Section collapse states
  const [pipelineOpen, setPipelineOpen] = useState(true)
  const [utilitiesOpen, setUtilitiesOpen] = useState(true)
  const [ippOpen, setIPPOpen] = useState(true)

  const partnerCount = useMemo(() => utilityGroups.filter(g => g.isPartner).length, [utilityGroups])
  const substationCount = useMemo(() => utilityGroups.reduce((s, g) => s + g.siteCount, 0), [utilityGroups])

  if (!dc) return null

  return (
    <div className="absolute top-0 right-0 bottom-0 w-[380px] max-w-[90vw] z-30 flex flex-col bg-gray-950/95 backdrop-blur-xl border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl font-bold text-[#4285F4]">G</span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">{dc.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {dc.status === 'in_development' ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">In Development</span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Active</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Radius slider */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Search Radius</span>
            <span className="text-xs text-[#4285F4] tabular-nums font-mono font-semibold">{radiusMiles}mi</span>
          </div>
          <input
            type="range"
            min={25}
            max={200}
            step={25}
            value={radiusMiles}
            onChange={(e) => onRadiusChange(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer
              bg-white/10
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3.5
              [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-[#4285F4]
              [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(66,133,244,0.4)]"
          />
        </div>

        {/* Summary stats */}
        {!isLoading && (
          <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-400">
            <span className="tabular-nums">
              <span className="text-white font-medium">{totalSites.toLocaleString()}</span> sites
            </span>
            <span className="tabular-nums">
              <span className="text-white font-medium">{utilityGroups.length}</span> utilities
            </span>
            {partnerCount > 0 && (
              <span className="tabular-nums">
                <span className="text-[#c77dba] font-medium">{partnerCount}</span> partners
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="py-2">
            {/* Section: Pipeline Sites */}
            {pipelineSites.length > 0 && (
              <div className="mb-1">
                <button
                  onClick={() => setPipelineOpen(!pipelineOpen)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-white/5 transition-colors"
                >
                  {pipelineOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                  <MapPin className="w-3.5 h-3.5 text-[#c77dba]" />
                  <span className="text-xs font-semibold text-[#c77dba] uppercase tracking-wider">Our Pipeline</span>
                  <span className="text-[10px] text-gray-500 tabular-nums ml-auto">{pipelineSites.length}</span>
                </button>
                {pipelineOpen && (
                  <div className="px-1">
                    {pipelineSites.map(site => (
                      <PipelineSiteRow key={site.id} site={site} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Section: Utility Companies */}
            {utilityGroups.length > 0 && (
              <div className="mb-1">
                <button
                  onClick={() => setUtilitiesOpen(!utilitiesOpen)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-white/5 transition-colors"
                >
                  {utilitiesOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                  <Building2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span className="text-xs font-semibold text-[#22C55E] uppercase tracking-wider">Utility Companies</span>
                  <span className="text-[10px] text-gray-500 tabular-nums ml-auto">
                    {utilityGroups.length} utilities &middot; {substationCount.toLocaleString()} subs
                  </span>
                </button>
                {utilitiesOpen && (
                  <div className="px-1">
                    {utilityGroups.map(group => (
                      <UtilityGroupRow
                        key={group.name}
                        group={group}
                        defaultExpanded={group.isPartner && group.siteCount <= 10}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Section: IPP / Renewable Sites */}
            {ippSites.length > 0 && (
              <div className="mb-1">
                <button
                  onClick={() => setIPPOpen(!ippOpen)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-white/5 transition-colors"
                >
                  {ippOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                  <Zap className="w-3.5 h-3.5 text-[#FFB800]" />
                  <span className="text-xs font-semibold text-[#FFB800] uppercase tracking-wider">Renewable Sites</span>
                  <span className="text-[10px] text-gray-500 tabular-nums ml-auto">{ippSites.length.toLocaleString()}</span>
                </button>
                {ippOpen && (
                  <div>
                    {visibleIPP.map((site, i) => (
                      <IPPSiteRow key={i} site={site} />
                    ))}
                    {ippSites.length > 20 && !showAllIPP && (
                      <button
                        onClick={() => setShowAllIPP(true)}
                        className="w-full py-2 text-center text-[11px] text-[#FFB800] hover:bg-white/5 transition-colors"
                      >
                        Show all {ippSites.length.toLocaleString()} sites
                      </button>
                    )}
                    {showAllIPP && ippSites.length > 20 && (
                      <button
                        onClick={() => setShowAllIPP(false)}
                        className="w-full py-2 text-center text-[11px] text-gray-500 hover:bg-white/5 transition-colors"
                      >
                        Collapse
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {totalSites === 0 && !isLoading && (
              <div className="py-16 text-center">
                <p className="text-sm text-gray-500">No distribution-level sites within {radiusMiles}mi</p>
                <p className="text-[11px] text-gray-600 mt-1">Try increasing the search radius</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: Export */}
      {totalSites > 0 && !isLoading && (
        <div className="flex-shrink-0 p-3 border-t border-white/10">
          <button
            onClick={exportCSV}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#4285F4]/10 hover:bg-[#4285F4]/20 border border-[#4285F4]/20 text-sm font-medium text-[#4285F4] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV ({totalSites.toLocaleString()} sites)
          </button>
        </div>
      )}
    </div>
  )
}
