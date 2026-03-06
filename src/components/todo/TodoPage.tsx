'use client'

import { useState, useEffect, useCallback } from 'react'
import { ListChecks, Clock, AlertTriangle } from 'lucide-react'
import type { ActionItemWithContext, TeamMember, TrackerSiteOverview } from '@/lib/tracker/types'
import { ActionItemRow } from './ActionItemRow'
import { WaitingGroup } from './WaitingGroup'
import { NeedsAttentionCard } from './NeedsAttentionCard'
import { QuickAddAction } from './QuickAddAction'
import { StyledSelect } from '@/components/ui/StyledSelect'
import { useActionItemsRealtime } from '@/lib/tracker/realtime'

interface TodoPageProps {
  initialItems: ActionItemWithContext[]
  teamMembers: TeamMember[]
  currentMemberId: string | null
  sites: TrackerSiteOverview[]
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function TodoPage({ initialItems, teamMembers, currentMemberId, sites }: TodoPageProps) {
  const [items, setItems] = useState(initialItems)
  const [selectedMember, setSelectedMember] = useState(currentMemberId ?? '')
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())

  const currentName = teamMembers.find(m => m.id === selectedMember)?.display_name ?? 'there'

  const fetchItems = useCallback(async () => {
    const params = new URLSearchParams()
    if (selectedMember) params.set('assigned_to', selectedMember)
    params.set('status', 'next,waiting,done')

    const res = await fetch(`/api/todo?${params}`)
    if (res.ok) {
      const data = await res.json()
      setItems(data)
    }
  }, [selectedMember])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useActionItemsRealtime(fetchItems)

  function addSavingId(id: string) {
    setSavingIds(prev => new Set(prev).add(id))
  }

  function removeSavingId(id: string) {
    setSavingIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  async function handleToggleDone(id: string, done: boolean) {
    addSavingId(id)
    try {
      await fetch(`/api/todo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: done ? 'done' : 'next' }),
      })
      await fetchItems()
    } finally {
      removeSavingId(id)
    }
  }

  async function handleToggleFlag(id: string, flagged: boolean) {
    addSavingId(id)
    try {
      await fetch(`/api/todo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagged }),
      })
      await fetchItems()
    } finally {
      removeSavingId(id)
    }
  }

  async function handleUpdate(id: string, updates: Record<string, unknown>) {
    addSavingId(id)
    try {
      await fetch(`/api/todo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      await fetchItems()
    } finally {
      removeSavingId(id)
    }
  }

  async function handleAdd(siteId: string, title: string, assignedTo?: string | null, status?: string, waitingOn?: string | null) {
    const res = await fetch('/api/todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_id: siteId,
        title,
        status: status ?? 'next',
        assigned_to: assignedTo !== undefined ? assignedTo : (selectedMember || null),
        waiting_on: waitingOn ?? null,
      }),
    })
    if (res.ok) await fetchItems()
  }

  async function handleDelete(id: string) {
    addSavingId(id)
    try {
      await fetch(`/api/todo/${id}`, { method: 'DELETE' })
      await fetchItems()
    } finally {
      removeSavingId(id)
    }
  }

  // Filter items by status
  const now = new Date()
  const nextItems = items
    .filter(i => i.status === 'next')
    .filter(i => !i.defer_until || new Date(i.defer_until) <= now)
    .sort((a, b) => {
      if (a.flagged !== b.flagged) return a.flagged ? -1 : 1
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

  const waitingItems = items.filter(i => i.status === 'waiting')

  // Group waiting items by waiting_on
  const waitingGroups = new Map<string, ActionItemWithContext[]>()
  for (const item of waitingItems) {
    const key = item.waiting_on ?? 'Unknown'
    const group = waitingGroups.get(key) ?? []
    group.push(item)
    waitingGroups.set(key, group)
  }

  // Compute needs attention alerts (only deadlines — stale items already have age badges inline)
  const alerts: Array<{ type: 'stale' | 'deadline'; title: string; description: string; link: string }> = []

  const twoWeeksOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  const upcomingDeadlines = [...nextItems, ...waitingItems]
    .filter(i => i.hard_deadline && new Date(i.hard_deadline) <= twoWeeksOut && new Date(i.hard_deadline) >= now)
  for (const item of upcomingDeadlines) {
    const daysUntil = Math.floor((new Date(item.hard_deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    alerts.push({
      type: 'deadline',
      title: item.title,
      description: `${daysUntil}d left · ${item.site_name}`,
      link: `/tracker/${item.site_id}`,
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            {getGreeting()}, {currentName}
          </h1>
          <p className="text-[12px] text-zinc-400 dark:text-zinc-500 mt-0.5 tabular-nums">
            {nextItems.length} action{nextItems.length !== 1 ? 's' : ''} · {waitingItems.length} waiting
          </p>
        </div>
        <StyledSelect
          value={selectedMember}
          onChange={setSelectedMember}
          options={[
            { value: '', label: 'All team members' },
            ...teamMembers.map(m => ({ value: m.id, label: m.display_name })),
          ]}
          size="md"
          align="right"
        />
      </div>

      {/* Section 1: Actions */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <ListChecks className="w-3.5 h-3.5 text-nodiac-secondary" />
          <h2 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Actions
          </h2>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-600 tabular-nums">
            {nextItems.length}
          </span>
        </div>
        <div className="bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg overflow-hidden">
          {nextItems.length === 0 ? (
            <p className="text-[12px] text-zinc-400 dark:text-zinc-600 py-6 text-center">
              No action items right now
            </p>
          ) : (
            nextItems.map(item => (
              <ActionItemRow
                key={item.id}
                item={item}
                teamMembers={teamMembers}
                isSaving={savingIds.has(item.id)}
                onToggleDone={handleToggleDone}
                onToggleFlag={handleToggleFlag}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))
          )}
          <QuickAddAction sites={sites} teamMembers={teamMembers} onAdd={handleAdd} />
        </div>
      </section>

      {/* Section 2: Waiting For */}
      {waitingGroups.size > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <h2 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Waiting For
            </h2>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-600 tabular-nums">
              {waitingItems.length}
            </span>
          </div>
          <div className="bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg overflow-hidden">
            {Array.from(waitingGroups.entries()).map(([key, groupItems]) => (
              <WaitingGroup
                key={key}
                waitingOn={key}
                items={groupItems}
                teamMembers={teamMembers}
                savingIds={savingIds}
                onToggleDone={handleToggleDone}
                onToggleFlag={handleToggleFlag}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
            <QuickAddAction sites={sites} teamMembers={teamMembers} defaultStatus="waiting" onAdd={handleAdd} />
          </div>
        </section>
      )}

      {/* Section 3: Needs Attention */}
      {alerts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <h2 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Needs Attention
            </h2>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-600 tabular-nums">
              {alerts.length}
            </span>
          </div>
          <div className="bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg overflow-hidden">
            {alerts.map((alert, i) => (
              <NeedsAttentionCard key={i} {...alert} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
