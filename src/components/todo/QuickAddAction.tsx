'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import type { TrackerSiteOverview, TeamMember } from '@/lib/tracker/types'
import { StyledSelect } from '@/components/ui/StyledSelect'

interface QuickAddActionProps {
  sites: TrackerSiteOverview[]
  teamMembers?: TeamMember[]
  onAdd: (siteId: string, title: string, assignedTo?: string | null) => Promise<void> | void
}

export function QuickAddAction({ sites, teamMembers, onAdd }: QuickAddActionProps) {
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const [siteId, setSiteId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!siteId || !title.trim() || saving) return
    setSaving(true)
    try {
      await onAdd(siteId, title.trim(), assignedTo || null)
      setTitle('')
      setAssignedTo('')
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
        className="flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-nodiac-secondary transition-colors py-2 px-1 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        Add action item
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 py-2">
      <StyledSelect
        value={siteId}
        onChange={setSiteId}
        options={sites.map(s => ({ value: s.id, label: s.name }))}
        placeholder="Site..."
        size="sm"
        className="max-w-[160px]"
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
          className="max-w-[120px]"
        />
      )}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape' && !saving) setActive(false) }}
        placeholder="Action item title..."
        disabled={saving}
        className="flex-1 text-[12px] bg-transparent text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1.5 focus:outline-none focus:border-nodiac-secondary disabled:opacity-50"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!siteId || !title.trim() || saving}
        className="text-[11px] font-medium px-2.5 py-1.5 rounded bg-nodiac-secondary/20 text-nodiac-secondary hover:bg-nodiac-secondary/30 transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1"
      >
        {saving ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving
          </>
        ) : (
          'Add'
        )}
      </button>
      <button
        type="button"
        onClick={() => setActive(false)}
        disabled={saving}
        className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer disabled:opacity-40"
      >
        Cancel
      </button>
    </div>
  )
}
