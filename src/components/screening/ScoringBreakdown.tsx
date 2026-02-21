'use client'

import type { SiteScoreBreakdown } from '@/types/screening'
import type { PermittingCitation } from '@/types/regional-hubs'
import { CRITERION_LABELS } from '@/types/regional-hubs'
import { PermittingCitations } from '@/components/shared/PermittingCitations'

interface ScoringBreakdownProps {
  breakdown: SiteScoreBreakdown
  permittingCitations?: PermittingCitation[]
}

const KEYS: Array<{ key: keyof SiteScoreBreakdown; label: string }> = [
  { key: 'coop_density', label: CRITERION_LABELS.coop_density },
  { key: 'grid_reliability', label: CRITERION_LABELS.grid_reliability },
  { key: 'clipped_curtailed', label: CRITERION_LABELS.clipped_curtailed },
  { key: 'permitting', label: CRITERION_LABELS.permitting },
  { key: 'tax_incentives', label: CRITERION_LABELS.tax_incentives },
  { key: 'labor', label: CRITERION_LABELS.labor },
  { key: 'fiber', label: CRITERION_LABELS.fiber },
  { key: 'queue_pressure', label: CRITERION_LABELS.queue_pressure },
]

function barColor(value: number): string {
  if (value >= 0.7) return 'bg-nodiac-secondary'
  if (value >= 0.4) return 'bg-nodiac-soft-orchid'
  return 'bg-gray-500'
}

export function ScoringBreakdown({ breakdown, permittingCitations }: ScoringBreakdownProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {KEYS.map(({ key, label }) => {
          const value = breakdown[key]
          return (
            <div key={key} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-gray-600 dark:text-gray-300 tabular-nums">
                  {value != null ? (value * 10).toFixed(1) : 'N/A'}
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                {value != null && (
                  <div
                    className={`h-full rounded-full ${barColor(value)}`}
                    style={{ width: `${value * 100}%` }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
      {permittingCitations && permittingCitations.length > 0 && (
        <PermittingCitations citations={permittingCitations} compact />
      )}
    </div>
  )
}
