'use client'

import { useState } from 'react'
import { Star, Check, ChevronDown, ChevronRight, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActionItemWithContext } from '@/lib/tracker/types'
import { StyledSelect } from '@/components/ui/StyledSelect'
import Link from 'next/link'

interface ActionItemRowProps {
  item: ActionItemWithContext
  isSaving?: boolean
  onToggleDone: (id: string, done: boolean) => void
  onToggleFlag: (id: string, flagged: boolean) => void
  onUpdate: (id: string, updates: Record<string, unknown>) => void
}

function getAgeBadge(createdAt: string, isWaiting: boolean) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
  const thresholds = isWaiting ? { amber: 14, red: 30 } : { amber: 7, red: 14 }

  let color = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  if (days >= thresholds.red) {
    color = 'bg-red-500/15 text-red-600 dark:text-red-400'
  } else if (days >= thresholds.amber) {
    color = 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
  }

  return { days, color }
}

export function ActionItemRow({ item, isSaving, onToggleDone, onToggleFlag, onUpdate }: ActionItemRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(item.notes ?? '')
  const isDone = item.status === 'done'
  const isWaiting = item.status === 'waiting'
  const age = getAgeBadge(item.created_at, isWaiting)

  // Hard deadline warning
  const deadlineSoon = item.hard_deadline && (() => {
    const daysUntil = Math.floor((new Date(item.hard_deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 7 && daysUntil >= 0
  })()

  return (
    <div className={cn(
      'group border border-zinc-200 dark:border-[#2a2a40] rounded-lg transition-colors',
      isDone && 'opacity-50',
      item.flagged && !isDone && 'border-l-2 border-l-amber-400'
    )}>
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#1a1a30] rounded-lg"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Done checkbox */}
        <button
          type="button"
          disabled={isSaving}
          onClick={(e) => { e.stopPropagation(); onToggleDone(item.id, !isDone) }}
          className={cn(
            'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer',
            isDone
              ? 'bg-nodiac-secondary border-nodiac-secondary'
              : 'border-zinc-300 dark:border-zinc-600 hover:border-nodiac-secondary',
            isSaving && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isDone && <Check className="w-3 h-3 text-white" />}
        </button>

        {/* Flag toggle */}
        <button
          type="button"
          disabled={isSaving}
          onClick={(e) => { e.stopPropagation(); onToggleFlag(item.id, !item.flagged) }}
          className={cn('flex-shrink-0 cursor-pointer', isSaving && 'opacity-50 cursor-not-allowed')}
        >
          <Star className={cn(
            'w-4 h-4 transition-colors',
            item.flagged ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600 hover:text-amber-400'
          )} />
        </button>

        {/* Title */}
        <span className={cn(
          'flex-1 text-[13px] text-zinc-800 dark:text-zinc-200 min-w-0 truncate',
          isDone && 'line-through'
        )}>
          {item.title}
        </span>

        {/* Waiting on badge */}
        {isWaiting && item.waiting_on && (
          <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
            <Clock className="w-3 h-3" />
            {item.waiting_on}
          </span>
        )}

        {/* Site name */}
        <Link
          href={`/tracker/${item.site_id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-nodiac-secondary transition-colors flex-shrink-0 max-w-[120px] truncate"
        >
          {item.site_name}
        </Link>

        {/* Hard deadline pill */}
        {deadlineSoon && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
            <AlertTriangle className="w-3 h-3" />
            {new Date(item.hard_deadline!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}

        {/* Age badge / Saving indicator */}
        {isSaving ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving
          </span>
        ) : (
          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 tabular-nums', age.color)}>
            {age.days}d
          </span>
        )}

        {/* Expand chevron */}
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-zinc-100 dark:border-[#2a2a40] space-y-2">
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Status: </span>
              <StyledSelect
                value={item.status}
                onChange={(val) => onUpdate(item.id, { status: val })}
                options={[
                  { value: 'next', label: 'Next' },
                  { value: 'waiting', label: 'Waiting' },
                  { value: 'done', label: 'Done' },
                ]}
                size="xs"
                variant="ghost"
              />
            </div>
            {item.hub_name && (
              <div>
                <span className="text-zinc-400">Hub: </span>
                <span className="text-zinc-700 dark:text-zinc-300">{item.hub_name}</span>
              </div>
            )}
            {item.hard_deadline && (
              <div>
                <span className="text-zinc-400">Deadline: </span>
                <span className="text-zinc-700 dark:text-zinc-300">{new Date(item.hard_deadline).toLocaleDateString()}</span>
              </div>
            )}
            {item.assigned_to_name && (
              <div>
                <span className="text-zinc-400">Assigned: </span>
                <span className="text-zinc-700 dark:text-zinc-300">{item.assigned_to_name}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <span className="text-[11px] text-zinc-400">Notes</span>
            {editingNotes ? (
              <div className="mt-1">
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  onBlur={() => {
                    onUpdate(item.id, { notes: notesDraft || null })
                    setEditingNotes(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                      onUpdate(item.id, { notes: notesDraft || null })
                      setEditingNotes(false)
                    }
                  }}
                  autoFocus
                  className="w-full mt-1 text-[12px] bg-transparent text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded p-2 focus:outline-none focus:border-nodiac-secondary resize-y min-h-[50px]"
                />
              </div>
            ) : (
              <div
                className="mt-1 text-[12px] text-zinc-600 dark:text-zinc-400 cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#1a1a30] rounded p-1 min-h-[24px]"
                onClick={(e) => { e.stopPropagation(); setNotesDraft(item.notes ?? ''); setEditingNotes(true) }}
              >
                {item.notes || <span className="italic text-zinc-400">Add notes...</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
