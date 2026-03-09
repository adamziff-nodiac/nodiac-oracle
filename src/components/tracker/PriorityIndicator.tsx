'use client'

import { cn } from '@/lib/utils'
import { PRIORITY_COLORS, type Priority } from '@/lib/tracker/constants'

interface PriorityIndicatorProps {
  priority: string
  showLabel?: boolean
}

export function PriorityIndicator({ priority, showLabel = true }: PriorityIndicatorProps) {
  const colors = PRIORITY_COLORS[priority as Priority]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('w-2 h-2 rounded-full', colors?.dot ?? 'bg-zinc-400')} />
      {showLabel && (
        <span className={cn('text-[13px] font-medium', colors?.text ?? 'text-zinc-400')}>
          {priority}
        </span>
      )}
    </span>
  )
}
