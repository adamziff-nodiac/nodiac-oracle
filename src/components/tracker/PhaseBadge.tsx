'use client'

import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  'Not Started': 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400',
  'In Progress': 'bg-amber-200 text-amber-800 dark:bg-amber-700/50 dark:text-amber-200',
  'Complete': 'bg-emerald-200 text-emerald-800 dark:bg-emerald-700/50 dark:text-emerald-200',
  'Blocked': 'bg-red-200 text-red-800 dark:bg-red-700/50 dark:text-red-200',
  'N/A': '',
}

interface PhaseBadgeProps {
  status: 'Not Started' | 'In Progress' | 'Complete' | 'Blocked' | 'N/A'
  abbrev: string
}

export function PhaseBadge({ status, abbrev }: PhaseBadgeProps) {
  if (status === 'N/A') {
    return (
      <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-medium tracking-wide min-w-[40px] text-zinc-400 dark:text-zinc-600">
        --
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-medium tracking-wide min-w-[40px] transition-colors duration-150',
        STATUS_COLORS[status]
      )}
      title={`${abbrev}: ${status}`}
    >
      {abbrev}
    </span>
  )
}
