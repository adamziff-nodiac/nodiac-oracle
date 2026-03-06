'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { TrackerSiteOverview } from '@/lib/tracker/types'

interface QuickAddActionProps {
  sites: TrackerSiteOverview[]
  onAdd: (siteId: string, title: string) => void
}

export function QuickAddAction({ sites, onAdd }: QuickAddActionProps) {
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const [siteId, setSiteId] = useState('')

  function handleSubmit() {
    if (!siteId || !title.trim()) return
    onAdd(siteId, title.trim())
    setTitle('')
    setActive(false)
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        className="flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-nodiac-secondary transition-colors py-2 px-1 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        Add action item
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 py-2">
      <select
        value={siteId}
        onChange={(e) => setSiteId(e.target.value)}
        className="text-[12px] bg-transparent text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 max-w-[160px]"
        autoFocus
      >
        <option value="">Site...</option>
        {sites.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') setActive(false) }}
        placeholder="Action item title..."
        className="flex-1 text-[12px] bg-transparent text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 focus:outline-none focus:border-nodiac-secondary"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!siteId || !title.trim()}
        className="text-[11px] font-medium px-2.5 py-1.5 rounded bg-nodiac-secondary/20 text-nodiac-secondary hover:bg-nodiac-secondary/30 transition-colors disabled:opacity-40 cursor-pointer"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => setActive(false)}
        className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
      >
        Cancel
      </button>
    </div>
  )
}
