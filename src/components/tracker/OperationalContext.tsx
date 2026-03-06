'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import type { SiteNotes } from '@/lib/tracker/types'

interface OperationalContextProps {
  notes: SiteNotes | null
  onUpdate?: (notes: SiteNotes) => void
}

function EditableText({
  value,
  placeholder,
  onSave,
}: {
  value: string
  placeholder: string
  onSave: (val: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus()
      ref.current.selectionStart = ref.current.value.length
    }
  }, [editing])

  if (!editing) {
    return (
      <div
        className="group relative cursor-pointer min-h-[40px]"
        onClick={() => { setDraft(value); setEditing(true) }}
      >
        <div className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {value || <span className="text-zinc-400 dark:text-zinc-600 italic">{placeholder}</span>}
        </div>
        <Pencil className="absolute top-0 right-0 w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <textarea
      ref={ref}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => { onSave(draft); setEditing(false) }}
      onKeyDown={e => {
        if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        if (e.key === 'Enter' && e.metaKey) { onSave(draft); setEditing(false) }
      }}
      className="w-full text-[13px] bg-transparent text-zinc-700 dark:text-zinc-300 leading-relaxed border border-nodiac-secondary/50 rounded p-1.5 focus:outline-none focus:border-nodiac-secondary resize-y min-h-[60px]"
      placeholder={placeholder}
    />
  )
}

export function OperationalContext({ notes, onUpdate }: OperationalContextProps) {
  const currentNotes = notes ?? {}

  function updateSummary(summary: string) {
    onUpdate?.({ ...currentNotes, summary, updated_at: new Date().toISOString() })
  }

  return (
    <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
        Summary
      </div>
      <EditableText
        value={currentNotes.summary ?? ''}
        placeholder="No summary"
        onSave={updateSummary}
      />
    </div>
  )
}
