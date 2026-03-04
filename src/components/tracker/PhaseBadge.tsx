'use client'

import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  'Not Started': 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500',
  'In Progress': 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  'Complete': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  'Blocked': 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
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
      <span className="sm:inline hidden">{abbrev}</span>
      <span className="sm:hidden inline">&nbsp;</span>
    </span>
  )
}
