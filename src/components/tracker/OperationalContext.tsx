'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
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

function EditableList({
  items,
  placeholder,
  onSave,
}: {
  items: string[]
  placeholder: string
  onSave: (items: string[]) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(items)
  const [newItem, setNewItem] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEditing() {
    setDraft([...items])
    setNewItem('')
    setEditing(true)
  }

  function save() {
    const filtered = draft.filter(s => s.trim())
    onSave(filtered)
    setEditing(false)
  }

  function addItem() {
    if (newItem.trim()) {
      setDraft([...draft, newItem.trim()])
      setNewItem('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  if (!editing) {
    return (
      <div className="group relative cursor-pointer min-h-[40px]" onClick={startEditing}>
        {items.length ? (
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 py-1">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <span className="text-[13px] text-zinc-700 dark:text-zinc-300">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-[13px] text-zinc-400 dark:text-zinc-600 italic">{placeholder}</span>
        )}
        <Pencil className="absolute top-0 right-0 w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {draft.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            value={item}
            onChange={e => {
              const next = [...draft]
              next[i] = e.target.value
              setDraft(next)
            }}
            className="flex-1 text-[13px] bg-transparent text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 focus:outline-none focus:border-nodiac-secondary"
          />
          <button
            type="button"
            onClick={() => setDraft(draft.filter((_, j) => j !== i))}
            className="p-0.5 text-zinc-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addItem() }}
          placeholder="Add item..."
          className="flex-1 text-[13px] bg-transparent text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 focus:outline-none focus:border-nodiac-secondary focus:text-zinc-700 dark:focus:text-zinc-300"
        />
        <button type="button" onClick={addItem} className="p-0.5 text-zinc-400 hover:text-nodiac-secondary transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={save} className="text-[11px] font-medium px-2.5 py-1 rounded bg-nodiac-secondary/20 text-nodiac-secondary hover:bg-nodiac-secondary/30 transition-colors">Save</button>
        <button type="button" onClick={() => setEditing(false)} className="text-[11px] font-medium px-2.5 py-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Cancel</button>
      </div>
    </div>
  )
}

function EditableBlockerList({
  items,
  placeholder,
  onSave,
}: {
  items: Array<{ issue: string; contact?: string; since?: string }>
  placeholder: string
  onSave: (items: Array<{ issue: string; contact?: string; since?: string }>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(items)

  function startEditing() {
    setDraft([...items])
    setEditing(true)
  }

  function save() {
    const filtered = draft.filter(b => b.issue.trim())
    onSave(filtered)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="group relative cursor-pointer min-h-[40px]" onClick={startEditing}>
        {items.length ? (
          <ul className="space-y-1">
            {items.map((b, i) => (
              <li key={i} className="flex items-start gap-2 py-1">
                <span className="w-1 h-1 rounded-full bg-red-400 mt-2 shrink-0" />
                <span className="text-[13px] text-red-600 dark:text-red-400">
                  {b.issue}
                  {b.contact && <span className="text-zinc-500"> ({b.contact})</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-[13px] text-zinc-400 dark:text-zinc-600 italic">{placeholder}</span>
        )}
        <Pencil className="absolute top-0 right-0 w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {draft.map((item, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <div className="flex-1 space-y-1">
            <input
              value={item.issue}
              onChange={e => {
                const next = [...draft]
                next[i] = { ...next[i], issue: e.target.value }
                setDraft(next)
              }}
              placeholder="Issue"
              className="w-full text-[13px] bg-transparent text-red-600 dark:text-red-400 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 focus:outline-none focus:border-nodiac-secondary"
            />
            <input
              value={item.contact ?? ''}
              onChange={e => {
                const next = [...draft]
                next[i] = { ...next[i], contact: e.target.value || undefined }
                setDraft(next)
              }}
              placeholder="Contact (optional)"
              className="w-full text-[13px] bg-transparent text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 focus:outline-none focus:border-nodiac-secondary"
            />
          </div>
          <button
            type="button"
            onClick={() => setDraft(draft.filter((_, j) => j !== i))}
            className="p-0.5 mt-1 text-zinc-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setDraft([...draft, { issue: '' }])}
        className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-nodiac-secondary transition-colors"
      >
        <Plus className="w-3 h-3" /> Add blocker
      </button>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={save} className="text-[11px] font-medium px-2.5 py-1 rounded bg-nodiac-secondary/20 text-nodiac-secondary hover:bg-nodiac-secondary/30 transition-colors">Save</button>
        <button type="button" onClick={() => setEditing(false)} className="text-[11px] font-medium px-2.5 py-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Cancel</button>
      </div>
    </div>
  )
}

function EditableWaitingList({
  items,
  placeholder,
  onSave,
}: {
  items: Array<{ who: string; what: string; since?: string }>
  placeholder: string
  onSave: (items: Array<{ who: string; what: string; since?: string }>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(items)

  function startEditing() {
    setDraft([...items])
    setEditing(true)
  }

  function save() {
    const filtered = draft.filter(w => w.who.trim() || w.what.trim())
    onSave(filtered)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="group relative cursor-pointer min-h-[40px]" onClick={startEditing}>
        {items.length ? (
          <ul className="space-y-1">
            {items.map((w, i) => (
              <li key={i} className="flex items-start gap-2 py-1">
                <span className="w-1 h-1 rounded-full bg-amber-400 mt-2 shrink-0" />
                <span className="text-[13px] text-amber-600 dark:text-amber-400">
                  {w.who}: {w.what}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-[13px] text-zinc-400 dark:text-zinc-600 italic">{placeholder}</span>
        )}
        <Pencil className="absolute top-0 right-0 w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {draft.map((item, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <div className="flex-1 space-y-1">
            <input
              value={item.who}
              onChange={e => {
                const next = [...draft]
                next[i] = { ...next[i], who: e.target.value }
                setDraft(next)
              }}
              placeholder="Who"
              className="w-full text-[13px] bg-transparent text-amber-600 dark:text-amber-400 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 focus:outline-none focus:border-nodiac-secondary"
            />
            <input
              value={item.what}
              onChange={e => {
                const next = [...draft]
                next[i] = { ...next[i], what: e.target.value }
                setDraft(next)
              }}
              placeholder="What"
              className="w-full text-[13px] bg-transparent text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 focus:outline-none focus:border-nodiac-secondary"
            />
          </div>
          <button
            type="button"
            onClick={() => setDraft(draft.filter((_, j) => j !== i))}
            className="p-0.5 mt-1 text-zinc-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setDraft([...draft, { who: '', what: '' }])}
        className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-nodiac-secondary transition-colors"
      >
        <Plus className="w-3 h-3" /> Add item
      </button>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={save} className="text-[11px] font-medium px-2.5 py-1 rounded bg-nodiac-secondary/20 text-nodiac-secondary hover:bg-nodiac-secondary/30 transition-colors">Save</button>
        <button type="button" onClick={() => setEditing(false)} className="text-[11px] font-medium px-2.5 py-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Cancel</button>
      </div>
    </div>
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
