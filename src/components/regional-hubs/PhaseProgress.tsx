'use client'

import { PHASES } from '@/lib/tracker/constants'
import type { PhaseStatuses } from '@/lib/tracker/constants'

const DOT_COLORS: Record<string, string> = {
  'Complete': 'bg-emerald-400',
  'In Progress': 'bg-amber-400',
  'Waiting': 'bg-red-400',
  'Not Started': 'bg-gray-300 dark:bg-gray-600',
}

/**
 * Compact row of colored dots showing development phase progress.
 * Only renders if at least one phase has started.
 */
export function PhaseProgress({ phases }: { phases: PhaseStatuses }) {
  const hasProgress = PHASES.some(p => {
    const v = phases[p.key]
    return v && v !== 'Not Started'
  })
  if (!hasProgress) return null

  return (
    <div className="flex items-center gap-1">
      {PHASES.map(p => {
        const status = phases[p.key] ?? 'Not Started'
        return (
          <div key={p.key} title={`${p.abbrev}: ${status}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[status] ?? DOT_COLORS['Not Started']}`} />
          </div>
        )
      })}
    </div>
  )
}

/**
 * Returns the first phase that is In Progress or Waiting, or null.
 */
export function getActivePhase(phases: PhaseStatuses) {
  return PHASES.find(p => {
    const v = phases[p.key]
    return v === 'In Progress' || v === 'Waiting'
  }) ?? null
}
