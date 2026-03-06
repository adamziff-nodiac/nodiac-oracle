'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Map as MapIcon, BarChart3, Users, Zap } from 'lucide-react'
import { FunnelChart } from './FunnelChart'
import { cn } from '@/lib/utils'

interface FunnelData {
  screened: number
  strong_fit: number
  in_pipeline: number
  active_dev: number
  construction_ready: number
}

interface StatsData {
  total_mw: number
  avg_score: number | null
  ipp_count: number
  hub_count: number
}

interface IppBreakdown {
  id: string
  name: string
  screened: number
  strong_fit: number
  in_pipeline: number
  active_dev: number
}

interface PipelineData {
  funnel: FunnelData
  stats: StatsData
  ipp_breakdown: IppBreakdown[]
}

export function PipelineDashboard() {
  const [data, setData] = useState<PipelineData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/pipeline/stats')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-nodiac-secondary animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Failed to load pipeline data</p>
      </div>
    )
  }

  const { funnel, stats, ipp_breakdown } = data

  const funnelStages = [
    { label: 'Screened', value: funnel.screened, color: '#c77dba' },
    { label: 'Strong Fit', value: funnel.strong_fit, color: '#9b4d8e' },
    { label: 'In Pipeline', value: funnel.in_pipeline, color: '#6b1f5a' },
    { label: 'Active Dev', value: funnel.active_dev, color: '#490f42' },
    { label: 'Construction Ready', value: funnel.construction_ready, color: '#10b981' },
  ]

  const statCards = [
    { label: 'Total MW', value: stats.total_mw ? `${stats.total_mw.toFixed(0)}` : '0', icon: Zap },
    { label: 'Avg Score', value: stats.avg_score ? stats.avg_score.toFixed(1) : '\u2014', icon: BarChart3 },
    { label: 'IPPs', value: stats.ipp_count.toString(), icon: Users },
    { label: 'Hubs', value: stats.hub_count.toString(), icon: MapIcon },
  ]

  return (
    <div className="space-y-8">
      {/* Funnel */}
      <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
          Pipeline Funnel
        </h3>
        <FunnelChart stages={funnelStages} />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{card.label}</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                {card.value}
              </span>
            </div>
          )
        })}
      </div>

      {/* IPP Breakdown */}
      {ipp_breakdown.length > 0 && (
        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Breakdown by IPP
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 text-left">
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">IPP</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Screened</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Strong Fit</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">In Pipeline</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Active Dev</th>
                </tr>
              </thead>
              <tbody>
                {ipp_breakdown.map(ipp => (
                  <tr key={ipp.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/screening/ipp/${ipp.id}`}
                        className="text-gray-900 dark:text-white font-medium hover:text-nodiac-secondary transition-colors"
                      >
                        {ipp.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{ipp.screened}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{ipp.strong_fit}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{ipp.in_pipeline}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{ipp.active_dev}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/screening"
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10',
            'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
          )}
        >
          Screen Portfolio &rarr;
        </Link>
        <Link
          href="/tracker"
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10',
            'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
          )}
        >
          View Tracker &rarr;
        </Link>
        <Link
          href="/regional-hubs"
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10',
            'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
          )}
        >
          Regional Hubs &rarr;
        </Link>
      </div>
    </div>
  )
}
