'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { PortfolioSite } from '@/types/screening'
import { TierBadge } from './TierBadge'
import { ScoringBreakdown } from './ScoringBreakdown'
import { cn } from '@/lib/utils'

type SortKey = 'site_name' | 'county' | 'state' | 'tier' | 'site_score'
type SortDir = 'asc' | 'desc'

const TIER_ORDER = { good: 0, okay: 1, bad: 2 }

interface SiteTableProps {
  sites: PortfolioSite[]
  selectedSiteId: string | null
  onSiteSelect: (siteId: string) => void
}

export function SiteTable({ sites, selectedSiteId, onSiteSelect }: SiteTableProps) {
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left">
            {([
              ['site_name', 'Site'],
              ['county', 'County'],
              ['state', 'State'],
              ['tier', 'Tier'],
              ['site_score', 'Score'],
            ] as [SortKey, string][]).map(([key, label]) => (
              <th
                key={key}
                className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort(key)}
              >
                {label}
                <SortIcon col={key} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((site) => (
            <>
              <tr
                key={site.id}
                className={cn(
                  'border-b border-white/5 cursor-pointer transition-colors',
                  selectedSiteId === site.id
                    ? 'bg-nodiac-secondary/10'
                    : 'hover:bg-white/5'
                )}
                onClick={() => {
                  onSiteSelect(site.id)
                  setExpandedId(expandedId === site.id ? null : site.id)
                }}
              >
                <td className="px-3 py-2.5 text-white font-medium">{site.site_name}</td>
                <td className="px-3 py-2.5 text-gray-300">{site.county || '—'}</td>
                <td className="px-3 py-2.5 text-gray-300">{site.state || '—'}</td>
                <td className="px-3 py-2.5">
                  <TierBadge tier={site.tier} />
                </td>
                <td className="px-3 py-2.5 text-white tabular-nums font-mono">
                  {site.site_score != null ? site.site_score.toFixed(1) : '—'}
                </td>
              </tr>
              {expandedId === site.id && site.score_breakdown && (
                <tr key={`${site.id}-detail`}>
                  <td colSpan={5} className="px-3 py-3 bg-white/[0.02]">
                    <ScoringBreakdown breakdown={site.score_breakdown} />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
