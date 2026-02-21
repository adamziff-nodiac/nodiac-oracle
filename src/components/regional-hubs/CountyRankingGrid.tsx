'use client'

import { useMemo, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { WeightedCountyScore, CriterionKey } from '@/types/regional-hubs'
import { CRITERION_LABELS } from '@/types/regional-hubs'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 25

const CRITERIA_KEYS: CriterionKey[] = [
  'coop_density',
  'grid_reliability',
  'clipped_curtailed',
  'permitting',
  'tax_incentives',
  'labor',
  'fiber',
  'queue_pressure',
]

const SHORT_LABELS: Record<CriterionKey, string> = {
  coop_density: 'Co-op',
  grid_reliability: 'Grid',
  clipped_curtailed: 'Curtail',
  permitting: 'Permit',
  tax_incentives: 'Tax',
  labor: 'Labor',
  fiber: 'Fiber',
  queue_pressure: 'Queue',
}

function ScoreCell({ value }: { value: number }) {
  // Color intensity: 0 = gray, 1 = bright orchid
  const intensity = value
  const r = Math.round(100 + intensity * 99)    // 100 → 199
  const g = Math.round(100 + intensity * 25)    // 100 → 125
  const b = Math.round(120 + intensity * 66)    // 120 → 186
  const bg = `rgba(${r}, ${g}, ${b}, ${0.15 + intensity * 0.2})`

  return (
    <td
      className="px-2 py-2 text-center tabular-nums text-xs font-mono"
      style={{ backgroundColor: bg }}
    >
      {(value * 10).toFixed(1)}
    </td>
  )
}

interface CountyRankingGridProps {
  weightedScores: WeightedCountyScore[]
  onCountyClick?: (fips: string) => void
}

export function CountyRankingGrid({ weightedScores, onCountyClick }: CountyRankingGridProps) {
  const [page, setPage] = useState(0)

  const sorted = useMemo(
    () => [...weightedScores].sort((a, b) => b.composite_score - a.composite_score),
    [weightedScores]
  )

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageItems = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const goNext = useCallback(() => setPage(p => Math.min(p + 1, totalPages - 1)), [totalPages])
  const goPrev = useCallback(() => setPage(p => Math.max(p - 1, 0)), [])

  // Reset to page 0 when scores change (weights change)
  useMemo(() => setPage(0), [weightedScores])

  if (sorted.length === 0) return null

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10 text-left">
              <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10">
                #
              </th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                County
              </th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                State
              </th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16 text-center">
                Score
              </th>
              {CRITERIA_KEYS.map(key => (
                <th
                  key={key}
                  className="px-2 py-2 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center w-14"
                  title={CRITERION_LABELS[key]}
                >
                  {SHORT_LABELS[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((county, i) => {
              const rank = page * PAGE_SIZE + i + 1
              return (
                <tr
                  key={county.fips_code}
                  className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                  onClick={() => onCountyClick?.(county.fips_code)}
                >
                  <td className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                    {rank}
                  </td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">
                    {county.county_name}
                  </td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">
                    {county.state_abbr}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold tabular-nums bg-[#c77dba]/20 text-[#c77dba]">
                      {county.composite_score.toFixed(1)}
                    </span>
                  </td>
                  <ScoreCell value={county.coop_density_score} />
                  <ScoreCell value={county.grid_reliability_score} />
                  <ScoreCell value={county.clipped_curtailed_score} />
                  <ScoreCell value={county.permitting_score} />
                  <ScoreCell value={county.tax_incentives_score ?? county.permitting_score} />
                  <ScoreCell value={county.labor_score} />
                  <ScoreCell value={county.fiber_score} />
                  <ScoreCell value={county.queue_pressure_score} />
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-1">
        <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
          Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length.toLocaleString()} counties
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            disabled={page === 0}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              page === 0
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums min-w-[4rem] text-center">
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={goNext}
            disabled={page >= totalPages - 1}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              page >= totalPages - 1
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
