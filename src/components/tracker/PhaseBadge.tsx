'use client'

import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  'Not Started': 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400',
  'In Progress': 'bg-amber-200 text-amber-800 dark:bg-amber-700/50 dark:text-amber-200',
  'Complete': 'bg-emerald-200 text-emerald-800 dark:bg-emerald-700/50 dark:text-emerald-200',
  'Waiting': 'bg-amber-200 text-amber-800 dark:bg-amber-700/50 dark:text-amber-200',
  'N/A': '',
}

interface PhaseBadgeProps {
  status: 'Not Started' | 'In Progress' | 'Complete' | 'Waiting' | 'N/A'
  abbrev: string
}

const STATUS_LABEL: Record<string, string> = {
  'Not Started': '--',
  'In Progress': 'In Progress',
  'Complete': '✓',
  'Waiting': 'Waiting',
}

export function PhaseBadge({ status, abbrev }: PhaseBadgeProps) {
  if (status === 'N/A') {
    return (
      <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-medium tracking-wide min-w-[56px] text-zinc-400 dark:text-zinc-600">
        --
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-medium tracking-wide min-w-[56px] transition-colors duration-150',
        STATUS_COLORS[status]
      )}
      title={`${abbrev}: ${status}`}
    >
      {STATUS_LABEL[status] ?? '--'}
    </span>
  )
}
