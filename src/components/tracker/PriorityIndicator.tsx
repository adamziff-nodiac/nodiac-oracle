'use client'

import { cn } from '@/lib/utils'

const DOT_COLORS: Record<string, string> = {
  'Lead': 'bg-nodiac-secondary',
  'Active': 'bg-emerald-500',
  'Pipeline': 'bg-violet-500',
  'On Hold': 'bg-amber-500',
  'Deprioritized': 'bg-zinc-400',
}

const TEXT_COLORS: Record<string, string> = {
  'Lead': 'text-nodiac-secondary',
  'Active': 'text-emerald-500 dark:text-emerald-400',
  'Pipeline': 'text-violet-500 dark:text-violet-400',
  'On Hold': 'text-amber-500 dark:text-amber-400',
  'Deprioritized': 'text-zinc-400 dark:text-zinc-500',
}

interface PriorityIndicatorProps {
  priority: string
  showLabel?: boolean
}

export function PriorityIndicator({ priority, showLabel = true }: PriorityIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('w-2 h-2 rounded-full', DOT_COLORS[priority] ?? 'bg-zinc-400')} />
      {showLabel && (
        <span className={cn('text-[13px] font-medium', TEXT_COLORS[priority] ?? 'text-zinc-400')}>
          {priority}
        </span>
      )}
    </span>
  )
}
