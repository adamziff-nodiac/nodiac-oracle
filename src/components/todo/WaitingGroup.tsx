'use client'

import { Clock } from 'lucide-react'
import type { ActionItemWithContext } from '@/lib/tracker/types'
import { ActionItemRow } from './ActionItemRow'

interface WaitingGroupProps {
  waitingOn: string
  items: ActionItemWithContext[]
  savingIds?: Set<string>
  onToggleDone: (id: string, done: boolean) => void
  onToggleFlag: (id: string, flagged: boolean) => void
  onUpdate: (id: string, updates: Record<string, unknown>) => void
}

export function WaitingGroup({ waitingOn, items, savingIds, onToggleDone, onToggleFlag, onUpdate }: WaitingGroupProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-1">
        <Clock className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[12px] font-medium text-amber-600 dark:text-amber-400">
          {waitingOn}
        </span>
        <span className="text-[11px] text-zinc-400">({items.length})</span>
      </div>
      <div className="space-y-1 pl-1">
        {items.map(item => (
          <ActionItemRow
            key={item.id}
            item={item}
            isSaving={savingIds?.has(item.id)}
            onToggleDone={onToggleDone}
            onToggleFlag={onToggleFlag}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  )
}
