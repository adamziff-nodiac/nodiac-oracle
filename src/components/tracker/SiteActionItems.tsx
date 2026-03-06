'use client'

import { useState, useEffect, useCallback } from 'react'
import { ListChecks } from 'lucide-react'
import type { ActionItemWithContext, TrackerSiteOverview } from '@/lib/tracker/types'
import { ActionItemRow } from '@/components/todo/ActionItemRow'
import { QuickAddAction } from '@/components/todo/QuickAddAction'

interface SiteActionItemsProps {
  siteId: string
  site: TrackerSiteOverview
}

export function SiteActionItems({ siteId, site }: SiteActionItemsProps) {
  const [items, setItems] = useState<ActionItemWithContext[]>([])

  const fetchItems = useCallback(async () => {
    const res = await fetch(`/api/sites/${siteId}/actions`)
    if (res.ok) setItems(await res.json())
  }, [siteId])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function handleToggleDone(id: string, done: boolean) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: done ? 'done' as const : 'next' as const } : i))
    const res = await fetch(`/api/todo/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: done ? 'done' : 'next' }),
    })
    if (!res.ok) fetchItems()
  }

  async function handleToggleFlag(id: string, flagged: boolean) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, flagged } : i))
    const res = await fetch(`/api/todo/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagged }),
    })
    if (!res.ok) fetchItems()
  }

  async function handleUpdate(id: string, updates: Record<string, unknown>) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } as ActionItemWithContext : i))
    const res = await fetch(`/api/todo/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) fetchItems()
  }

  async function handleAdd(_siteId: string, title: string) {
    const res = await fetch('/api/todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_id: siteId, title }),
    })
    if (res.ok) fetchItems()
  }

  const siteForPicker = [site]

  return (
    <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <ListChecks className="w-3.5 h-3.5 text-nodiac-secondary" />
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Action Items
        </div>
        {items.length > 0 && (
          <span className="text-[11px] text-zinc-400 bg-zinc-100 dark:bg-[#1a1a30] px-1.5 py-0.5 rounded-full">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] text-zinc-400 dark:text-zinc-500 italic mb-2">
          No action items for this site.
        </p>
      ) : (
        <div className="space-y-1.5 mb-2">
          {items.map(item => (
            <ActionItemRow
              key={item.id}
              item={item}
              onToggleDone={handleToggleDone}
              onToggleFlag={handleToggleFlag}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      <QuickAddAction sites={siteForPicker} onAdd={handleAdd} />
    </div>
  )
}
