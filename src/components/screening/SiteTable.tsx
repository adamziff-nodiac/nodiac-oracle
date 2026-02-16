'use client'

import { Fragment, useState, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { PortfolioSite } from '@/types/screening'
import type { PermittingCitation, CountyScore } from '@/types/regional-hubs'
import { TierBadge } from './TierBadge'
import { ScoringBreakdown } from './ScoringBreakdown'
import { cn } from '@/lib/utils'

type SortKey = 'site_name' | 'county' | 'state' | 'utility_type' | 'tier' | 'site_score'
type SortDir = 'asc' | 'desc'

const TIER_ORDER = { good: 0, okay: 1, bad: 2 }

interface SiteTableProps {
  sites: PortfolioSite[]
  selectedSiteId: string | null
  onSiteSelect: (siteId: string) => void
  countyScores?: CountyScore[]
  citationRegistry?: PermittingCitation[]
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

export function SiteTable({ sites, selectedSiteId, onSiteSelect, countyScores, citationRegistry }: SiteTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('site_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [sites, sortKey, sortDir])

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

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm min-w-[600px] sm:min-w-0">
        <thead>
          <tr className="border-b border-gray-200 dark:border-white/10 text-left">
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
          </tr>
        </thead>
        <tbody>
          {sorted.map((site) => (
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
                <td className="px-3 py-2.5 text-gray-900 dark:text-white font-medium max-w-[200px] truncate">{site.site_name}</td>
                <td className="hidden md:table-cell px-3 py-2.5 text-gray-600 dark:text-gray-300">{site.county || '—'}</td>
                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{site.state || '—'}</td>
                <td className="hidden lg:table-cell px-3 py-2.5 text-gray-500 dark:text-gray-400 text-xs">{site.utility_type || '—'}</td>
                <td className="px-3 py-2.5">
                  <TierBadge tier={site.tier} />
                </td>
                <td className="px-3 py-2.5 text-gray-900 dark:text-white tabular-nums font-mono">
                  {site.site_score != null ? site.site_score.toFixed(1) : '—'}
                </td>
              </tr>
              {expandedId === site.id && site.score_breakdown && (
                <tr>
                  <td colSpan={6} className="px-3 py-3 bg-gray-50 dark:bg-white/[0.02]">
                    <ScoringBreakdown
                      breakdown={site.score_breakdown}
                      permittingCitations={resolveCitations(site.fips_code, countyScores, citationRegistry)}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
