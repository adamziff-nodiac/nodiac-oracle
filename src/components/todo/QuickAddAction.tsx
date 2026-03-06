'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import type { TrackerSiteOverview, TeamMember } from '@/lib/tracker/types'
import { StyledSelect } from '@/components/ui/StyledSelect'

interface QuickAddActionProps {
  sites: TrackerSiteOverview[]
  teamMembers?: TeamMember[]
  defaultStatus?: 'next' | 'waiting'
  onAdd: (siteId: string, title: string, assignedTo?: string | null, status?: string, waitingOn?: string | null) => Promise<void> | void
}

export function QuickAddAction({ sites, teamMembers, defaultStatus = 'next', onAdd }: QuickAddActionProps) {
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const [siteId, setSiteId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [waitingOn, setWaitingOn] = useState('')
  const [saving, setSaving] = useState(false)
  const isWaiting = defaultStatus === 'waiting'

  async function handleSubmit() {
    if (!siteId || !title.trim() || saving) return
    if (isWaiting && !waitingOn.trim()) return
    setSaving(true)
    try {
      await onAdd(siteId, title.trim(), assignedTo || null, defaultStatus, isWaiting ? waitingOn.trim() : null)
      setTitle('')
      setAssignedTo('')
      setWaitingOn('')
      setActive(false)
    } finally {
      setSaving(false)
    }
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-nodiac-secondary transition-colors py-1.5 px-3 cursor-pointer border-b border-transparent"
      >
        <Plus className="w-3 h-3" />
        {isWaiting ? 'Add waiting item' : 'Add action item'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-3 border-b border-zinc-100 dark:border-[#1e1e36]">
      <StyledSelect
        value={siteId}
        onChange={setSiteId}
        options={sites.map(s => ({ value: s.id, label: s.name }))}
        placeholder="Site..."
        size="sm"
        className="max-w-[140px]"
      />
      {teamMembers && teamMembers.length > 0 && (
        <StyledSelect
          value={assignedTo}
          onChange={setAssignedTo}
          options={[
            { value: '', label: 'Assign...' },
            ...teamMembers.map(m => ({ value: m.id, label: m.display_name })),
          ]}
          size="sm"
          className="max-w-[110px]"
        />
      )}
      {isWaiting && (
        <input
          type="text"
          value={waitingOn}
          onChange={(e) => setWaitingOn(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape' && !saving) setActive(false) }}
          placeholder="Waiting on..."
          disabled={saving}
          className="text-[12px] bg-transparent text-amber-500 dark:text-amber-400 placeholder:text-amber-400/40 border-0 focus:outline-none disabled:opacity-50 w-[100px]"
        />
      )}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape' && !saving) setActive(false) }}
        placeholder={isWaiting ? 'What are you waiting for?' : 'What needs to happen?'}
        autoFocus
        disabled={saving}
        className="flex-1 text-[12px] bg-transparent text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400/50 dark:placeholder:text-zinc-600 border-0 focus:outline-none disabled:opacity-50 min-w-0"
      />
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!siteId || !title.trim() || saving}
          className="text-[11px] font-medium px-2 py-1 rounded bg-nodiac-secondary/15 text-nodiac-secondary hover:bg-nodiac-secondary/25 transition-colors disabled:opacity-30 cursor-pointer flex items-center gap-1"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => setActive(false)}
          disabled={saving}
          className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer disabled:opacity-40 px-1"
        >
          Esc
        </button>
      </div>
    </div>
  )
}
