'use client'

import { useState } from 'react'
import { Star, Check, ChevronDown, ChevronRight, Clock, AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActionItemWithContext, TeamMember } from '@/lib/tracker/types'
import { StyledSelect } from '@/components/ui/StyledSelect'
import Link from 'next/link'

interface ActionItemRowProps {
  item: ActionItemWithContext
  teamMembers?: TeamMember[]
  isSaving?: boolean
  onToggleDone: (id: string, done: boolean) => void
  onToggleFlag: (id: string, flagged: boolean) => void
  onUpdate: (id: string, updates: Record<string, unknown>) => void
  onDelete?: (id: string) => void
}

function getAgeBadge(createdAt: string, isWaiting: boolean) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
  const thresholds = isWaiting ? { amber: 14, red: 30 } : { amber: 7, red: 14 }

  let color = 'text-emerald-500'
  if (days >= thresholds.red) {
    color = 'text-red-400'
  } else if (days >= thresholds.amber) {
    color = 'text-amber-400'
  }

  return { days, color }
}

export function ActionItemRow({ item, teamMembers, isSaving, onToggleDone, onToggleFlag, onUpdate, onDelete }: ActionItemRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(item.notes ?? '')
  const isDone = item.status === 'done'
  const isWaiting = item.status === 'waiting'
  const age = getAgeBadge(item.created_at, isWaiting)

  const deadlineSoon = item.hard_deadline && (() => {
    const daysUntil = Math.floor((new Date(item.hard_deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 7 && daysUntil >= 0
  })()

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors duration-75',
          'hover:bg-zinc-50/80 dark:hover:bg-white/[0.03]',
          'border-b border-zinc-100 dark:border-[#1e1e36] last:border-b-0',
          expanded && 'bg-zinc-50/50 dark:bg-white/[0.02]',
          isDone && 'opacity-40',
          item.flagged && !isDone && 'border-l-2 border-l-amber-400 pl-[10px]'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Checkbox */}
        <button
          type="button"
          disabled={isSaving}
          onClick={(e) => { e.stopPropagation(); onToggleDone(item.id, !isDone) }}
          className={cn(
            'flex-shrink-0 w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-all cursor-pointer',
            isDone
              ? 'bg-nodiac-secondary/80 border-nodiac-secondary/80'
              : 'border-zinc-300 dark:border-zinc-600 hover:border-nodiac-secondary/60',
            isSaving && 'opacity-40 cursor-not-allowed'
          )}
        >
          {isDone && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
        </button>

        {/* Flag */}
        <button
          type="button"
          disabled={isSaving}
          onClick={(e) => { e.stopPropagation(); onToggleFlag(item.id, !item.flagged) }}
          className={cn(
            'flex-shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity',
            item.flagged && '!opacity-100',
            isSaving && 'cursor-not-allowed'
          )}
        >
          <Star className={cn(
            'w-3.5 h-3.5',
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

        {/* Right-aligned metadata cluster */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Waiting badge (inline) */}
          {isWaiting && item.waiting_on && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-amber-500/80 truncate max-w-[100px]">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {item.waiting_on}
            </span>
          )}

          {/* Site link */}
          <Link
            href={`/tracker/${item.site_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-nodiac-secondary transition-colors truncate max-w-[100px]"
          >
            {item.site_name}
          </Link>

          {/* Deadline pill */}
          {deadlineSoon && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-400 flex-shrink-0">
              <AlertTriangle className="w-3 h-3" />
              {new Date(item.hard_deadline!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}

          {/* Age / Saving */}
          {isSaving ? (
            <Loader2 className="w-3 h-3 text-zinc-400 animate-spin flex-shrink-0" />
          ) : (
            <span className={cn('text-[10px] font-medium tabular-nums w-[28px] text-right flex-shrink-0', age.color)}>
              {age.days}d
            </span>
          )}

          {/* Chevron */}
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-zinc-400/60 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-zinc-400/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Expanded inline */}
      {expanded && (
        <div className="px-3 py-2.5 bg-zinc-50/30 dark:bg-white/[0.015] border-b border-zinc-100 dark:border-[#1e1e36]">
          <div className="pl-[52px] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 dark:text-zinc-500">Status</span>
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
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 dark:text-zinc-500">Assigned</span>
              {teamMembers && teamMembers.length > 0 ? (
                <StyledSelect
                  value={item.assigned_to ?? ''}
                  onChange={(val) => onUpdate(item.id, { assigned_to: val || null })}
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...teamMembers.map(m => ({ value: m.id, label: m.display_name })),
                  ]}
                  size="xs"
                  variant="ghost"
                />
              ) : (
                <span className="text-zinc-600 dark:text-zinc-400">{item.assigned_to_name ?? 'Unassigned'}</span>
              )}
            </div>
            {item.hub_name && (
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 dark:text-zinc-500">Hub</span>
                <span className="text-zinc-600 dark:text-zinc-400">{item.hub_name}</span>
              </div>
            )}
            {item.status === 'waiting' && (
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 dark:text-zinc-500">Waiting on</span>
                <input
                  type="text"
                  value={item.waiting_on ?? ''}
                  onChange={(e) => onUpdate(item.id, { waiting_on: e.target.value || null })}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Who?"
                  className="text-[11px] bg-transparent text-amber-500 dark:text-amber-400 border-0 border-b border-dashed border-zinc-300 dark:border-zinc-600 focus:outline-none focus:border-nodiac-secondary px-0 py-0 w-[120px]"
                />
              </div>
            )}
            {item.hard_deadline && (
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 dark:text-zinc-500">Deadline</span>
                <span className="text-zinc-600 dark:text-zinc-400">{new Date(item.hard_deadline).toLocaleDateString()}</span>
              </div>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
                disabled={isSaving}
                className="flex items-center gap-1 text-zinc-400 dark:text-zinc-600 hover:text-red-400 transition-colors ml-auto cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-3 h-3" />
                <span className="text-[10px]">Delete</span>
              </button>
            )}
          </div>

          {/* Notes */}
          <div className="pl-[52px] mt-2">
            {editingNotes ? (
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
                className="w-full text-[12px] bg-white dark:bg-[#12122a] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#2a2a40] rounded px-2 py-1.5 focus:outline-none focus:border-nodiac-secondary/50 resize-y min-h-[40px]"
                placeholder="Add notes..."
              />
            ) : (
              <div
                className="text-[12px] text-zinc-500 dark:text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors py-0.5"
                onClick={(e) => { e.stopPropagation(); setNotesDraft(item.notes ?? ''); setEditingNotes(true) }}
              >
                {item.notes || <span className="text-zinc-400/60 dark:text-zinc-600">Add notes...</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
