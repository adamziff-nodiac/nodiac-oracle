'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, ChevronDown, ChevronRight, Star, Map as MapIcon, ChevronsUpDown } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { googleDataCenters, type GoogleDataCenter } from '@/data/googleDataCenters'
import { PhaseProgress, getActivePhase } from '@/components/regional-hubs/PhaseProgress'
import { useDCProximity, type UtilityGroup, type OperatorGroup, type ProximitySite, type PipelineSite } from '@/hooks/useDCProximity'
import { LogoLink } from '@/components/LogoLink'
import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'

const DCProximityMap = dynamic(
  () => import('@/components/regional-hubs/DCProximityMap').then(mod => ({ default: mod.DCProximityMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="w-6 h-6 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
)

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

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function findDC(slug: string): GoogleDataCenter | null {
  return googleDataCenters.find(dc => slugify(dc.name) === slug) ?? null
}

function PipelineSiteRow({ site }: { site: PipelineSite }) {
  const priorityColors: Record<string, string> = {
    Lead: 'bg-red-500/20 text-red-300',
    Active: 'bg-amber-500/20 text-amber-300',
    Pipeline: 'bg-purple-500/20 text-purple-300',
    'On Hold': 'bg-gray-500/20 text-gray-400',
    Deprioritized: 'bg-gray-500/20 text-gray-500',
  }

  const activePhase = getActivePhase(site.phases)

  return (
    <Link
      href={`/tracker/${site.id}`}
      className="flex items-start gap-3 py-2.5 px-4 rounded-lg hover:bg-white/5 transition-colors"
    >
      <div className="flex-shrink-0 mt-0.5">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: TYPE_COLORS[site.siteType?.toLowerCase() ?? 'other'] ?? TYPE_COLORS.other }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate hover:text-[#4285F4] transition-colors">{site.name}</span>
          <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityColors[site.priority] ?? priorityColors['On Hold']}`}>
            {site.priority}
          </span>
          {activePhase && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400">
              {activePhase.abbrev} {site.phases[activePhase.key] === 'Waiting' ? '(Waiting)' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400">
          {site.partnerName && <span>{site.partnerName}</span>}
          {site.mw != null && <span>{site.mw} MW</span>}
          {site.hubName && <span className="text-[#c77dba]">{site.hubName}</span>}
          <PhaseProgress phases={site.phases} />
        </div>
      </div>
      <span className="flex-shrink-0 text-xs tabular-nums font-mono text-[#4285F4]">
        {site.distanceMi}mi
      </span>
    </Link>
  )
}

function UtilityGroupRow({ group, defaultExpanded }: { group: UtilityGroup; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const typeLabel = group.utilityType ? (UTILITY_TYPE_SHORT[group.utilityType] || group.utilityType) : null

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 py-2.5 px-4 rounded-lg hover:bg-white/5 transition-colors text-left"
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
        <div className="ml-8 border-l border-white/5 pl-3 pb-1">
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

function OperatorGroupRow({ group, defaultExpanded }: { group: OperatorGroup; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 py-2.5 px-4 rounded-lg hover:bg-white/5 transition-colors text-left"
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
          {group.isPartner && group.partnerStage && (
            <div className="mt-0.5 text-[11px] text-[#c77dba]">{group.partnerStage}</div>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-xs tabular-nums font-mono text-gray-300">
            {group.siteCount} {group.siteCount === 1 ? 'site' : 'sites'}
          </div>
          <div className="text-[10px] tabular-nums font-mono text-gray-500">
            {group.minDistanceMi}mi closest
          </div>
        </div>
      </button>

      {expanded && (
        <div className="ml-8 border-l border-white/5 pl-3 pb-1">
          {group.sites.map((site, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 text-[11px] text-gray-400">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 opacity-60"
                style={{ backgroundColor: TYPE_COLORS[site.type] }}
              />
              <div className="truncate flex-1">
                <span>{site.name}</span>
                {site.utility && (
                  <span className="text-gray-600 ml-1">· {site.utility}</span>
                )}
              </div>
              <span className="text-gray-500 capitalize flex-shrink-0">{site.type}</span>
              {site.voltage != null && <span className="text-gray-500">{site.voltage}kV</span>}
              <span className="tabular-nums font-mono text-[#4285F4]">{site.distanceMi}mi</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function useExportCSV(dc: GoogleDataCenter | null, radiusMiles: number, pipelineSites: PipelineSite[], utilityGroups: UtilityGroup[], ippOperatorGroups: OperatorGroup[]) {
  return () => {
    if (!dc) return

    const rows: string[][] = [
      ['Name', 'Type', 'Category', 'Distance (mi)', 'State', 'City', 'County', 'Site Owner', 'Utility', 'Utility Type', 'Holding Company', 'Voltage (kV)', 'Partner Status', 'Partner Stage'],
    ]

    for (const site of pipelineSites) {
      rows.push([site.name, site.siteType || '', 'Pipeline', String(site.distanceMi), '', '', '', site.partnerName || '', '', '', '', '', 'Active Partner', ''])
    }

    for (const group of utilityGroups) {
      for (const site of group.sites) {
        rows.push([site.name, 'Substation', 'Substation', String(site.distanceMi), site.state, site.city || '', site.county || '', site.owner || '', site.utility || '', site.utilityType || '', site.holdingCompany || '', site.voltage != null ? String(site.voltage) : '', group.isPartner ? 'Existing Partner' : 'Potential', group.partnerStage || ''])
      }
    }

    for (const group of ippOperatorGroups) {
      for (const site of group.sites) {
        rows.push([site.name, site.type, 'Renewable', String(site.distanceMi), site.state, '', '', site.owner || '', site.utility || '', '', '', site.voltage != null ? String(site.voltage) : '', group.isPartner ? 'Existing Partner' : '', group.partnerStage || ''])
      }
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
  }
}

function DCSelector({ currentDC, radiusMiles }: { currentDC: GoogleDataCenter | null; radiusMiles: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const allDCs = useMemo(() => {
    const active = googleDataCenters.filter(dc => dc.region === 'North America' && dc.status === 'active').sort((a, b) => a.name.localeCompare(b.name))
    const dev = googleDataCenters.filter(dc => dc.region === 'North America' && dc.status === 'in_development').sort((a, b) => a.name.localeCompare(b.name))
    return { active, dev }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return allDCs
    return {
      active: allDCs.active.filter(dc => dc.name.toLowerCase().includes(q)),
      dev: allDCs.dev.filter(dc => dc.name.toLowerCase().includes(q)),
    }
  }, [allDCs, search])

  const handleSelect = (dc: GoogleDataCenter) => {
    setOpen(false)
    setSearch('')
    router.push(`/regional-hubs/dc?name=${slugify(dc.name)}&radius=${radiusMiles}`)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
      >
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{currentDC?.name ?? 'Select DC'}</h1>
        <ChevronsUpDown className="w-4 h-4 text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-40 w-72 max-h-96 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-xl flex flex-col">
            <div className="p-2 border-b border-gray-100 dark:border-white/5">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search data centers..."
                autoFocus
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-[#4285F4]"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.active.length > 0 && (
                <>
                  <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Active</div>
                  {filtered.active.map(dc => (
                    <button
                      key={dc.name}
                      onClick={() => handleSelect(dc)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                        currentDC?.name === dc.name ? 'text-[#4285F4] font-medium' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {dc.name}
                    </button>
                  ))}
                </>
              )}
              {filtered.dev.length > 0 && (
                <>
                  <div className="px-3 py-2 text-[10px] font-semibold text-amber-500 uppercase tracking-wider border-t border-gray-100 dark:border-white/5">In Development</div>
                  {filtered.dev.map(dc => (
                    <button
                      key={dc.name}
                      onClick={() => handleSelect(dc)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                        currentDC?.name === dc.name ? 'text-[#4285F4] font-medium' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {dc.name}
                    </button>
                  ))}
                </>
              )}
              {filtered.active.length === 0 && filtered.dev.length === 0 && (
                <div className="px-3 py-4 text-sm text-gray-400 text-center">No matches</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function DCFullPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dcSlug = searchParams.get('name') ?? ''
  const initialRadius = parseInt(searchParams.get('radius') ?? '50', 10)

  const dc = useMemo(() => findDC(dcSlug), [dcSlug])
  const [radiusMiles, setRadiusMiles] = useState(initialRadius)

  // Keep URL in sync with radius changes
  const handleRadiusChange = (newRadius: number) => {
    setRadiusMiles(newRadius)
    window.history.replaceState(null, '', `/regional-hubs/dc?name=${dcSlug}&radius=${newRadius}`)
  }

  const { pipelineSites, utilityGroups, ippSites, ippOperatorGroups, totalSites, isLoading } = useDCProximity({
    selectedDC: dc,
    radiusMiles,
  })

  const exportCSV = useExportCSV(dc, radiusMiles, pipelineSites, utilityGroups, ippOperatorGroups)

  const partnerCount = useMemo(() => utilityGroups.filter(g => g.isPartner).length, [utilityGroups])
  const substationCount = useMemo(() => utilityGroups.reduce((s, g) => s + g.siteCount, 0), [utilityGroups])
  const ippPartnerCount = useMemo(() => ippOperatorGroups.filter(g => g.isPartner).length, [ippOperatorGroups])

  const [mapOpen, setMapOpen] = useState(true)
  const [pipelineOpen, setPipelineOpen] = useState(true)
  const [utilitiesOpen, setUtilitiesOpen] = useState(true)
  const [ippOpen, setIPPOpen] = useState(true)

  // Combine all sites for the map
  const allSites = useMemo(() => {
    const sites: ProximitySite[] = []
    for (const g of utilityGroups) sites.push(...g.sites)
    sites.push(...ippSites)
    return sites
  }, [utilityGroups, ippSites])

  if (!dc) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Data center not found</p>
          <Link href="/regional-hubs" className="text-[#4285F4] hover:underline text-sm">
            Back to Regional Hubs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Top nav */}
      <header className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-gray-950 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <LogoLink />
            <Navigation />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb + header */}
        <div className="mb-6">
          <Link
            href="/regional-hubs"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Regional Hubs
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-[#4285F4]">G</span>
            <div>
              <DCSelector currentDC={dc} radiusMiles={radiusMiles} />
              <div className="flex items-center gap-3 mt-1">
                {dc.status === 'in_development' ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">In Development</span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">Active</span>
                )}
                <span className="text-xs text-gray-400 tabular-nums">
                  {dc.coordinates[1].toFixed(2)}°N, {Math.abs(dc.coordinates[0]).toFixed(2)}°W
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex flex-wrap items-center gap-6 mb-6 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Search Radius</span>
              <span className="text-xs text-[#4285F4] tabular-nums font-mono font-semibold">{radiusMiles}mi</span>
            </div>
            <input
              type="range"
              min={25}
              max={200}
              step={25}
              value={radiusMiles}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                bg-gray-200 dark:bg-white/10
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3.5
                [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[#4285F4]
                [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(66,133,244,0.4)]"
            />
          </div>

          {!isLoading && (
            <div className="flex items-center gap-5 text-[11px] text-gray-500 dark:text-gray-400">
              <span className="tabular-nums">
                <span className="text-gray-900 dark:text-white font-medium">{totalSites.toLocaleString()}</span> sites
              </span>
              <span className="tabular-nums">
                <span className="text-gray-900 dark:text-white font-medium">{utilityGroups.length}</span> utilities
              </span>
              <span className="tabular-nums">
                <span className="text-gray-900 dark:text-white font-medium">{ippOperatorGroups.length}</span> operators
              </span>
              {(partnerCount > 0 || ippPartnerCount > 0) && (
                <span className="tabular-nums">
                  <span className="text-[#c77dba] font-medium">{partnerCount + ippPartnerCount}</span> partners
                </span>
              )}
            </div>
          )}

          <button
            onClick={exportCSV}
            disabled={isLoading || totalSites === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4285F4]/10 hover:bg-[#4285F4]/20 border border-[#4285F4]/20 text-sm font-medium text-[#4285F4] transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Collapsible Map */}
        <section className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden mb-6">
          <button
            onClick={() => setMapOpen(!mapOpen)}
            className="w-full flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-white/5 text-left hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
          >
            {mapOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
            <MapIcon className="w-3.5 h-3.5 text-[#4285F4]" />
            <span className="text-xs font-semibold text-[#4285F4] uppercase tracking-wider">Map</span>
            {!isLoading && (
              <span className="text-[10px] text-gray-500 tabular-nums ml-auto">
                {totalSites.toLocaleString()} sites within {radiusMiles}mi
              </span>
            )}
          </button>
          {mapOpen && (
            <div className="h-[400px]">
              {dc && <DCProximityMap dc={dc} radiusMiles={radiusMiles} sites={allSites} />}
            </div>
          )}
        </section>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pipeline Sites */}
            {pipelineSites.length > 0 && (
              <section className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <button
                  onClick={() => setPipelineOpen(!pipelineOpen)}
                  className="w-full flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-white/5 text-left hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                >
                  {pipelineOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                  <span className="text-xs font-semibold text-[#c77dba] uppercase tracking-wider">Our Pipeline</span>
                  <span className="text-[10px] text-gray-500 tabular-nums ml-auto">{pipelineSites.length}</span>
                </button>
                {pipelineOpen && (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {pipelineSites.map(site => (
                      <PipelineSiteRow key={site.id} site={site} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Utility Companies */}
            {utilityGroups.length > 0 && (
              <section className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <button
                  onClick={() => setUtilitiesOpen(!utilitiesOpen)}
                  className="w-full flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-white/5 text-left hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                >
                  {utilitiesOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                  <span className="text-xs font-semibold text-[#22C55E] uppercase tracking-wider">Utility Companies</span>
                  <span className="text-[10px] text-gray-500 tabular-nums ml-auto">
                    {utilityGroups.length} utilities · {substationCount.toLocaleString()} subs
                  </span>
                </button>
                {utilitiesOpen && (
                  <div>
                    {utilityGroups.map(group => (
                      <UtilityGroupRow
                        key={group.name}
                        group={group}
                        defaultExpanded={group.isPartner && group.siteCount <= 10}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Renewable Sites */}
            {ippOperatorGroups.length > 0 && (
              <section className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <button
                  onClick={() => setIPPOpen(!ippOpen)}
                  className="w-full flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-white/5 text-left hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                >
                  {ippOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                  <span className="text-xs font-semibold text-[#FFB800] uppercase tracking-wider">Renewable Sites</span>
                  <span className="text-[10px] text-gray-500 tabular-nums ml-auto">
                    {ippOperatorGroups.length} operators · {ippSites.length.toLocaleString()} sites
                  </span>
                </button>
                {ippOpen && (
                  <div>
                    {ippOperatorGroups.map(group => (
                      <OperatorGroupRow
                        key={group.name}
                        group={group}
                        defaultExpanded={group.isPartner && group.siteCount <= 10}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {totalSites === 0 && (
              <div className="py-20 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No distribution-level sites within {radiusMiles}mi</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">Try increasing the search radius</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default function DCFullPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DCFullPageInner />
    </Suspense>
  )
}
