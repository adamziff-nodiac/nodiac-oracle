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

  // Subscribe to realtime changes from other users/tabs
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

  async function handleAdd(siteId: string, title: string, assignedTo?: string | null) {
    const res = await fetch('/api/todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_id: siteId,
        title,
        assigned_to: assignedTo !== undefined ? assignedTo : (selectedMember || null),
      }),
    })
    if (res.ok) await fetchItems()
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

  // Compute needs attention alerts
  const alerts: Array<{ type: 'stalled' | 'stale' | 'deadline'; title: string; description: string; link: string }> = []

  // Stale items (>14 days)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const staleItems = [...nextItems, ...waitingItems].filter(i => new Date(i.created_at) < fourteenDaysAgo)
  for (const item of staleItems.slice(0, 5)) {
    const days = Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24))
    alerts.push({
      type: 'stale',
      title: item.title,
      description: `${days} days old - ${item.site_name}`,
      link: `/tracker/${item.site_id}`,
    })
  }

  // Hard deadlines within 14 days
  const twoWeeksOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  const upcomingDeadlines = [...nextItems, ...waitingItems]
    .filter(i => i.hard_deadline && new Date(i.hard_deadline) <= twoWeeksOut && new Date(i.hard_deadline) >= now)
  for (const item of upcomingDeadlines) {
    const daysUntil = Math.floor((new Date(item.hard_deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    alerts.push({
      type: 'deadline',
      title: item.title,
      description: `Deadline in ${daysUntil} days - ${item.site_name}`,
      link: `/tracker/${item.site_id}`,
    })
  }

  // Find sites with zero active items (stalled)
  const activeSiteIds = new Set([...nextItems, ...waitingItems].map(i => i.site_id))
  const stalledSites = sites.filter(s => !s.is_archived && !activeSiteIds.has(s.id))
  for (const site of stalledSites.slice(0, 5)) {
    alerts.push({
      type: 'stalled',
      title: site.name,
      description: 'No active action items defined',
      link: `/tracker/${site.id}`,
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            {getGreeting()}, {currentName}
          </h1>
          <p className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-1">
            {nextItems.length} action{nextItems.length !== 1 ? 's' : ''} · {waitingItems.length} waiting{staleItems.length > 0 ? ` · ${staleItems.length} need review` : ''}
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

      {/* Section 1: My Actions */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="w-4 h-4 text-nodiac-secondary" />
          <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
            Actions
          </h2>
          <span className="text-[11px] text-zinc-400 bg-zinc-100 dark:bg-[#1a1a30] px-1.5 py-0.5 rounded-full">
            {nextItems.length}
          </span>
        </div>
        <div className="space-y-1.5">
          {nextItems.length === 0 ? (
            <p className="text-[13px] text-zinc-400 dark:text-zinc-500 italic py-4 text-center">
              No action items. Add one below or check the Needs Attention section.
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
              />
            ))
          )}
          <QuickAddAction sites={sites} teamMembers={teamMembers} onAdd={handleAdd} />
        </div>
      </section>

      {/* Section 2: Waiting For */}
      {waitingGroups.size > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
              Waiting For
            </h2>
            <span className="text-[11px] text-zinc-400 bg-zinc-100 dark:bg-[#1a1a30] px-1.5 py-0.5 rounded-full">
              {waitingItems.length}
            </span>
          </div>
          <div className="space-y-4">
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
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Needs Attention */}
      {alerts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
              Needs Attention
            </h2>
            <span className="text-[11px] text-zinc-400 bg-zinc-100 dark:bg-[#1a1a30] px-1.5 py-0.5 rounded-full">
              {alerts.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {alerts.map((alert, i) => (
              <NeedsAttentionCard key={i} {...alert} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
