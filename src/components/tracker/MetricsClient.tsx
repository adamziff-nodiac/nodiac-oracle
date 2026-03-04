'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { TrackerSiteOverview, TrackerHub } from '@/lib/tracker/types'
import { PHASES } from '@/lib/tracker/constants'
import { useTrackerRealtime } from '@/lib/tracker/realtime'
import { MetricCard } from './MetricCard'
import { ToastContainer } from './Toast'
import { cn } from '@/lib/utils'

interface MetricsClientProps {
  initialSites: TrackerSiteOverview[]
  hubs: TrackerHub[]
}

const PHASE_BAR_COLORS: Record<string, string> = {
  'site_qualification': 'bg-zinc-300 dark:bg-zinc-600',
  'site_control': 'bg-zinc-400 dark:bg-zinc-500',
  'power': 'bg-amber-400 dark:bg-amber-600',
  'permitting': 'bg-sky-400 dark:bg-sky-600',
  'fiber': 'bg-violet-400 dark:bg-violet-600',
  'engineering': 'bg-nodiac-soft-orchid',
  'construction': 'bg-nodiac-secondary dark:bg-nodiac-secondary-dark',
}

function getFurthestPhase(site: TrackerSiteOverview): string {
  const record = site as unknown as Record<string, unknown>
  for (let i = PHASES.length - 1; i >= 0; i--) {
    const status = record[`${PHASES[i].key}_phase`] as string
    if (status === 'Complete' || status === 'In Progress') {
      return PHASES[i].key
    }
  }
  return PHASES[0].key
}

function formatCurrency(val: number): string {
  if (val === 0) return '$0'
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`
  return `$${val.toLocaleString()}`
}

export function MetricsClient({ initialSites, hubs }: MetricsClientProps) {
  const router = useRouter()
  const [includeArchived, setIncludeArchived] = useState(false)

  const handleRealtime = useCallback(() => {
    router.refresh()
  }, [router])

  useTrackerRealtime(handleRealtime)

  const sites = useMemo(() =>
    includeArchived ? initialSites : initialSites.filter(s => !s.is_archived),
    [initialSites, includeArchived]
  )

  const totalMw = sites.reduce((s, site) => s + (site.mw_current ?? 0), 0)
  const activeSites = sites.length
  const constructionReady = sites.filter(s => s.construction_ready).length
  const totalCapex = sites.reduce((s, site) => s + (site.total_capex ?? 0), 0)

  // MW by stage
  const mwByStage = useMemo(() => {
    const result: Record<string, number> = {}
    for (const phase of PHASES) {
      result[phase.key] = 0
    }
    for (const site of sites) {
      const furthest = getFurthestPhase(site)
      result[furthest] = (result[furthest] ?? 0) + (site.mw_current ?? 0)
    }
    return result
  }, [sites])

  const maxMw = Math.max(...Object.values(mwByStage), 1)

  // Speed metrics per site
  const speedSites = sites.filter(s => s.days_to_ix || s.days_to_construction_ready || s.days_to_cod)
  const avgIx = speedSites.length
    ? Math.round(speedSites.reduce((s, site) => s + (site.days_to_ix ?? 0), 0) / speedSites.filter(s => s.days_to_ix).length || 0)
    : null
  const avgReady = speedSites.length
    ? Math.round(speedSites.reduce((s, site) => s + (site.days_to_construction_ready ?? 0), 0) / speedSites.filter(s => s.days_to_construction_ready).length || 0)
    : null
  const avgCod = speedSites.length
    ? Math.round(speedSites.reduce((s, site) => s + (site.days_to_cod ?? 0), 0) / speedSites.filter(s => s.days_to_cod).length || 0)
    : null

  // Capex analysis
  const capexSites = useMemo(() =>
    sites
      .filter(s => s.capex_per_mw && s.capex_per_mw > 0)
      .sort((a, b) => (a.capex_per_mw ?? 0) - (b.capex_per_mw ?? 0)),
    [sites]
  )
  const medianCapex = capexSites.length
    ? capexSites[Math.floor(capexSites.length / 2)].capex_per_mw ?? 0
    : 0

  // Hub breakdown
  const hubData = useMemo(() => {
    return hubs.map(hub => {
      const hubSites = sites.filter(s => s.hub_name === hub.name)
      return {
        name: hub.name,
        siteCount: hubSites.length,
        totalMw: hubSites.reduce((s, site) => s + (site.mw_current ?? 0), 0),
        avgDaysToIx: hubSites.filter(s => s.days_to_ix).length
          ? Math.round(hubSites.reduce((s, site) => s + (site.days_to_ix ?? 0), 0) / hubSites.filter(s => s.days_to_ix).length)
          : null,
        avgCapexPerMw: hubSites.filter(s => s.capex_per_mw).length
          ? Math.round(hubSites.reduce((s, site) => s + (site.capex_per_mw ?? 0), 0) / hubSites.filter(s => s.capex_per_mw).length)
          : null,
      }
    })
  }, [hubs, sites])

  return (
    <div className="flex flex-col gap-6">
      {/* Archive toggle */}
      <div className="flex justify-end">
        <label className="flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={() => setIncludeArchived(!includeArchived)}
            className="w-3.5 h-3.5 rounded border border-zinc-300 dark:border-zinc-600"
          />
          Include archived
        </label>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Total MW" value={totalMw.toFixed(1)} unit="MW" />
        <MetricCard label="Active Sites" value={activeSites} unit="sites" />
        <MetricCard label="Construction Ready" value={constructionReady} />
        <MetricCard label="Total Capex" value={formatCurrency(totalCapex)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MW by Stage */}
        <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">MW by Stage</h3>
          <div className="space-y-2">
            {PHASES.map(phase => (
              <div key={phase.key} className="flex items-center gap-3 py-1">
                <span className="w-[160px] text-[13px] text-zinc-600 dark:text-zinc-400 shrink-0">{phase.label}</span>
                <div
                  className={cn('h-6 rounded', PHASE_BAR_COLORS[phase.key])}
                  style={{ width: `${Math.max((mwByStage[phase.key] / maxMw) * 100, mwByStage[phase.key] > 0 ? 4 : 0)}%` }}
                />
                <span className="text-[13px] font-medium tabular-nums text-zinc-900 dark:text-zinc-100 ml-2">
                  {mwByStage[phase.key].toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Speed Metrics Table */}
        <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Speed Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-[#2a2a40]">
                  <th className="py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-left">Site</th>
                  <th className="py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-right">Days to IX</th>
                  <th className="py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-right">Days to Ready</th>
                  <th className="py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-right">Days to COD</th>
                </tr>
              </thead>
              <tbody>
                {sites.map(site => (
                  <tr key={site.id} className="border-b border-zinc-100 dark:border-[#22223a]">
                    <td className="py-2 text-[13px]">
                      <Link href={`/tracker/${site.id}`} className="text-nodiac-primary dark:text-nodiac-secondary hover:underline font-medium">
                        {site.name}
                      </Link>
                    </td>
                    <td className={cn('py-2 text-[13px] tabular-nums text-right', site.days_to_ix == null && 'text-zinc-400')}>
                      {site.days_to_ix ?? '--'}
                    </td>
                    <td className={cn('py-2 text-[13px] tabular-nums text-right', site.days_to_construction_ready == null && 'text-zinc-400')}>
                      {site.days_to_construction_ready ?? '--'}
                    </td>
                    <td className={cn('py-2 text-[13px] tabular-nums text-right', site.days_to_cod == null && 'text-zinc-400')}>
                      {site.days_to_cod ?? '--'}
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold bg-zinc-50 dark:bg-[#1a1a2e]">
                  <td className="py-2 text-[13px] text-zinc-900 dark:text-zinc-100">Portfolio Average</td>
                  <td className="py-2 text-[13px] tabular-nums text-right text-zinc-900 dark:text-zinc-100">{avgIx ?? '--'}</td>
                  <td className="py-2 text-[13px] tabular-nums text-right text-zinc-900 dark:text-zinc-100">{avgReady ?? '--'}</td>
                  <td className="py-2 text-[13px] tabular-nums text-right text-zinc-900 dark:text-zinc-100">{avgCod ?? '--'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Capex Analysis */}
        <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Capex Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-[#2a2a40]">
                  <th className="py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-left">Site</th>
                  <th className="py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-right">Total Capex</th>
                  <th className="py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-right">MW</th>
                  <th className="py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-right">Capex/MW</th>
                </tr>
              </thead>
              <tbody>
                {capexSites.map(site => (
                  <tr key={site.id} className="border-b border-zinc-100 dark:border-[#22223a]">
                    <td className="py-2 text-[13px]">
                      <Link href={`/tracker/${site.id}`} className="text-nodiac-primary dark:text-nodiac-secondary hover:underline font-medium">
                        {site.name}
                      </Link>
                    </td>
                    <td className="py-2 text-[13px] tabular-nums text-right text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(site.total_capex ?? 0)}
                    </td>
                    <td className="py-2 text-[13px] tabular-nums text-right text-zinc-900 dark:text-zinc-100">
                      {site.mw_current ?? '--'}
                    </td>
                    <td className={cn(
                      'py-2 text-[13px] tabular-nums text-right font-medium',
                      (site.capex_per_mw ?? 0) <= medianCapex
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    )}>
                      {formatCurrency(site.capex_per_mw ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hub Breakdown */}
        <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Hub Breakdown</h3>
          <div className="space-y-4">
            {hubData.map(hub => (
              <div key={hub.name} className="p-4 bg-zinc-50 dark:bg-[#1a1a2e] rounded-lg">
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{hub.name}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Sites</div>
                    <div className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{hub.siteCount}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Total MW</div>
                    <div className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{hub.totalMw.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Avg Days to IX</div>
                    <div className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{hub.avgDaysToIx ?? '--'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Avg Capex/MW</div>
                    <div className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{hub.avgCapexPerMw ? formatCurrency(hub.avgCapexPerMw) : '--'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}
