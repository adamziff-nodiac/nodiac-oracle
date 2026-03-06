'use client'

import { Fragment, useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'
import type { PortfolioSite } from '@/types/screening'
import type { PermittingCitation, CountyScore } from '@/types/regional-hubs'
import { TierBadge } from './TierBadge'
import { ScoringBreakdown } from './ScoringBreakdown'
import { cn } from '@/lib/utils'

type SortKey = 'site_name' | 'county' | 'state' | 'utility_type' | 'tier' | 'site_score' | 'nearest_hub'
type SortDir = 'asc' | 'desc'

const TIER_ORDER = { good: 0, okay: 1, bad: 2 }

export interface NearestHub {
  name: string
  distance_miles: number
}

interface SiteTableProps {
  sites: PortfolioSite[]
  selectedSiteId: string | null
  onSiteSelect: (siteId: string) => void
  countyScores?: CountyScore[]
  citationRegistry?: PermittingCitation[]
  // Selection for promote flow
  selectedIds?: Set<string>
  onToggleSelect?: (siteId: string) => void
  onSelectAll?: () => void
  // Promoted sites map: portfolio_site_id → tracker_site_id
  promotedMap?: Record<string, string>
  // Nearest hub data
  nearestHubs?: Record<string, NearestHub>
}

function resolveCitations(
  fips: string | null,
  countyScores?: CountyScore[],
  registry?: PermittingCitation[]
): PermittingCitation[] {
  if (!fips || !countyScores || !registry?.length) return []
  const county = countyScores.find(c => c.fips_code === fips)
  if (!county?.permitting_citation_ids) return []
  return county.permitting_citation_ids
    .filter(id => id >= 0 && id < registry.length)
    .map(id => registry[id])
}

export function SiteTable({
  sites, selectedSiteId, onSiteSelect, countyScores, citationRegistry,
  selectedIds, onToggleSelect, onSelectAll, promotedMap, nearestHubs,
}: SiteTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('site_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const hasSelection = !!onToggleSelect

  const sorted = useMemo(() => {
    return [...sites].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'site_name':
          cmp = (a.site_name || '').localeCompare(b.site_name || '')
          break
        case 'county':
          cmp = (a.county || '').localeCompare(b.county || '')
          break
        case 'state':
          cmp = (a.state || '').localeCompare(b.state || '')
          break
        case 'utility_type':
          cmp = (a.utility_type || '').localeCompare(b.utility_type || '')
          break
        case 'tier':
          cmp = (TIER_ORDER[a.tier || 'bad'] ?? 3) - (TIER_ORDER[b.tier || 'bad'] ?? 3)
          break
        case 'site_score':
          cmp = (a.site_score ?? 0) - (b.site_score ?? 0)
          break
        case 'nearest_hub': {
          const da = nearestHubs?.[a.id]?.distance_miles ?? Infinity
          const db = nearestHubs?.[b.id]?.distance_miles ?? Infinity
          cmp = da - db
          break
        }
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [sites, sortKey, sortDir, nearestHubs])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 inline ml-1" />
      : <ChevronDown className="w-3 h-3 inline ml-1" />
  }

  const allSelected = selectedIds && sites.length > 0 && sites.every(s => selectedIds.has(s.id))

  const colSpan = 6 + (hasSelection ? 1 : 0) + (nearestHubs ? 1 : 0)

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm min-w-[600px] sm:min-w-0">
        <thead>
          <tr className="border-b border-gray-200 dark:border-white/10 text-left">
            {hasSelection && (
              <th className="px-3 py-2 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onSelectAll?.()}
                  className="rounded border-gray-300 dark:border-white/20"
                />
              </th>
            )}
            <th
              className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => toggleSort('site_name')}
            >
              Site
              <SortIcon col="site_name" />
            </th>
            <th
              className="hidden md:table-cell px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => toggleSort('county')}
            >
              County
              <SortIcon col="county" />
            </th>
            <th
              className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => toggleSort('state')}
            >
              State
              <SortIcon col="state" />
            </th>
            <th
              className="hidden lg:table-cell px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => toggleSort('utility_type')}
            >
              Utility
              <SortIcon col="utility_type" />
            </th>
            <th
              className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => toggleSort('tier')}
            >
              Tier
              <SortIcon col="tier" />
            </th>
            <th
              className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => toggleSort('site_score')}
            >
              Score
              <SortIcon col="site_score" />
            </th>
            {nearestHubs && (
              <th
                className="hidden lg:table-cell px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                onClick={() => toggleSort('nearest_hub')}
              >
                Nearest Hub
                <SortIcon col="nearest_hub" />
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((site) => {
            const isPromoted = promotedMap?.[site.id]
            return (
              <Fragment key={site.id}>
                <tr
                  className={cn(
                    'border-b border-gray-100 dark:border-white/5 cursor-pointer transition-colors',
                    selectedSiteId === site.id
                      ? 'bg-nodiac-secondary/10'
                      : 'hover:bg-gray-100 dark:hover:bg-white/5'
                  )}
                  onClick={() => {
                    onSiteSelect(site.id)
                    setExpandedId(expandedId === site.id ? null : site.id)
                  }}
                >
                  {hasSelection && (
                    <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds?.has(site.id) ?? false}
                        onChange={() => onToggleSelect?.(site.id)}
                        className="rounded border-gray-300 dark:border-white/20"
                      />
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-gray-900 dark:text-white font-medium max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{site.site_name}</span>
                      {isPromoted && (
                        <Link
                          href={`/tracker/${isPromoted}`}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors flex-shrink-0"
                        >
                          In Pipeline
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-3 py-2.5 text-gray-600 dark:text-gray-300">{site.county || '\u2014'}</td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{site.state || '\u2014'}</td>
                  <td className="hidden lg:table-cell px-3 py-2.5 text-gray-500 dark:text-gray-400 text-xs">{site.utility_type || '\u2014'}</td>
                  <td className="px-3 py-2.5">
                    <TierBadge tier={site.tier} />
                  </td>
                  <td className="px-3 py-2.5 text-gray-900 dark:text-white tabular-nums font-mono">
                    {site.site_score != null ? site.site_score.toFixed(1) : '\u2014'}
                  </td>
                  {nearestHubs && (
                    <td className="hidden lg:table-cell px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                      {nearestHubs[site.id] ? (
                        <span>
                          <span className="text-gray-900 dark:text-white font-medium">{nearestHubs[site.id].name}</span>
                          {' '}
                          <span className="tabular-nums">{nearestHubs[site.id].distance_miles.toFixed(0)} mi</span>
                        </span>
                      ) : '\u2014'}
                    </td>
                  )}
                </tr>
                {expandedId === site.id && site.score_breakdown && (
                  <tr>
                    <td colSpan={colSpan} className="px-3 py-3 bg-gray-50 dark:bg-white/[0.02]">
                      <ScoringBreakdown
                        breakdown={site.score_breakdown}
                        permittingCitations={resolveCitations(site.fips_code, countyScores, citationRegistry)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
