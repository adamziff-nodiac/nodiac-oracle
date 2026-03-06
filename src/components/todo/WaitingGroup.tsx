'use client'

import { Clock } from 'lucide-react'
import type { ActionItemWithContext, TeamMember } from '@/lib/tracker/types'
import { ActionItemRow } from './ActionItemRow'

interface WaitingGroupProps {
  waitingOn: string
  items: ActionItemWithContext[]
  teamMembers?: TeamMember[]
  savingIds?: Set<string>
  onToggleDone: (id: string, done: boolean) => void
  onToggleFlag: (id: string, flagged: boolean) => void
  onUpdate: (id: string, updates: Record<string, unknown>) => void
}

export function WaitingGroup({ waitingOn, items, teamMembers, savingIds, onToggleDone, onToggleFlag, onUpdate }: WaitingGroupProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/[0.04] dark:bg-amber-500/[0.03] border-b border-zinc-100 dark:border-[#1e1e36]">
        <Clock className="w-3 h-3 text-amber-500/70" />
        <span className="text-[11px] font-medium text-amber-600/80 dark:text-amber-400/70">
          {waitingOn}
        </span>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-600">{items.length}</span>
      </div>
      {items.map(item => (
        <ActionItemRow
          key={item.id}
          item={item}
          teamMembers={teamMembers}
          isSaving={savingIds?.has(item.id)}
          onToggleDone={onToggleDone}
          onToggleFlag={onToggleFlag}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  )
}
