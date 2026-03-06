'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { showToast } from './Toast'

interface Option {
  id: string
  name: string
}

interface AddSiteModalProps {
  onClose: () => void
}

function CreatableSelect({
  label,
  options,
  value,
  onChange,
  onCreateNew,
  placeholder,
}: {
  label: string
  options: Option[]
  value: string | null
  onChange: (id: string | null) => void
  onCreateNew: (name: string) => Promise<string | null>
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  const selectedOption = options.find(o => o.id === value)
  const filtered = options.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase())
  )
  const exactMatch = options.some(o => o.name.toLowerCase() === search.toLowerCase())

  async function handleCreate() {
    if (!search.trim() || exactMatch) return
    setCreating(true)
    const newId = await onCreateNew(search.trim())
    setCreating(false)
    if (newId) {
      onChange(newId)
      setOpen(false)
      setSearch('')
    }
  }

  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </label>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen(!open)
            setTimeout(() => inputRef.current?.focus(), 50)
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-300 dark:border-[#2a2a40] text-left transition-colors hover:border-zinc-400 dark:hover:border-zinc-500 cursor-pointer"
        >
          <span className={selectedOption ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}>
            {selectedOption?.name ?? placeholder}
          </span>
          <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-zinc-200 dark:border-[#2a2a40] bg-white dark:bg-[#16162a] shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden">
            <div className="p-1.5">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search or create..."
                className="w-full px-2.5 py-1.5 rounded-md text-[12px] bg-zinc-50 dark:bg-[#0f0f1a] border border-zinc-200 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-nodiac-secondary placeholder-zinc-400 dark:placeholder-zinc-600"
              />
            </div>

            <div className="max-h-[200px] overflow-y-auto">
              {/* None / clear option */}
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); setSearch('') }}
                className="w-full px-3 py-1.5 text-[12px] text-left text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
              >
                None
              </button>

              {filtered.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => { onChange(option.id); setOpen(false); setSearch('') }}
                  className={`w-full px-3 py-1.5 text-[12px] text-left transition-colors ${
                    value === option.id
                      ? 'text-nodiac-secondary bg-nodiac-secondary/5 font-medium'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'
                  }`}
                >
                  {option.name}
                </button>
              ))}

              {search.trim() && !exactMatch && (
                <>
                  <div className="h-px bg-zinc-100 dark:bg-[#2a2a40]" />
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full px-3 py-1.5 text-[12px] text-left text-nodiac-secondary hover:bg-nodiac-secondary/5 transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : `+ Create "${search.trim()}"`}
                  </button>
                </>
              )}

              {filtered.length === 0 && !search.trim() && (
                <div className="px-3 py-2 text-[11px] text-zinc-400 dark:text-zinc-600">
                  No options yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function AddSiteModal({ onClose }: AddSiteModalProps) {
  const router = useRouter()
  const [siteName, setSiteName] = useState('')
  const [hubId, setHubId] = useState<string | null>(null)
  const [utilityId, setUtilityId] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [hubs, setHubs] = useState<Option[]>([])
  const [partners, setPartners] = useState<Option[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function load() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const [hubsRes, partnersRes] = await Promise.all([
        (supabase as any).from('tracker_regional_hubs').select('id, name').order('name'),
        (supabase as any).from('tracker_power_partners').select('id, name').order('name'),
      ])
      setHubs((hubsRes.data ?? []) as Option[])
      setPartners((partnersRes.data ?? []) as Option[])
    }
    load()
  }, [])

  async function createHub(name: string): Promise<string | null> {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('tracker_regional_hubs')
      .insert({ name })
      .select('id, name')
      .single()
    if (error) { showToast('Failed to create hub', 'error'); return null }
    setHubs(prev => [...prev, data as Option].sort((a, b) => a.name.localeCompare(b.name)))
    return data.id
  }

  async function createPartner(name: string): Promise<string | null> {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from('tracker_power_partners')
      .insert({ name })
      .select('id, name')
      .single()
    if (error) { showToast('Failed to create partner', 'error'); return null }
    setPartners(prev => [...prev, data as Option].sort((a, b) => a.name.localeCompare(b.name)))
    return data.id
  }

  async function handleSubmit() {
    if (!siteName.trim()) return
    setCreating(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const insert: Record<string, unknown> = {
        name: siteName.trim(),
        priority: 'Lead',
      }
      if (hubId) insert.hub_id = hubId
      if (utilityId) insert.utility_id = utilityId
      if (partnerId) insert.asset_owner_id = partnerId

      const { data, error } = await (supabase as any)
        .from('tracker_sites')
        .insert(insert)
        .select('id')
        .single()

      if (error) throw error
      onClose()
      router.push(`/tracker/${data.id}`)
    } catch {
      showToast('Failed to create site', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-5">Add New Site</h3>

        <div className="space-y-4">
          {/* Site Name */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Site Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Walleye"
              value={siteName}
              onChange={e => setSiteName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && siteName.trim()) handleSubmit() }}
              autoFocus
              className="w-full px-3 py-2 rounded-lg text-[13px] bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-300 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-nodiac-secondary placeholder-zinc-400 dark:placeholder-zinc-600"
            />
          </div>

          {/* Hub */}
          <CreatableSelect
            label="Hub"
            options={hubs}
            value={hubId}
            onChange={setHubId}
            onCreateNew={createHub}
            placeholder="Select or create hub..."
          />

          {/* Utility */}
          <CreatableSelect
            label="Utility"
            options={partners}
            value={utilityId}
            onChange={setUtilityId}
            onCreateNew={createPartner}
            placeholder="Select or create utility..."
          />

          {/* Partner / Asset Owner */}
          <CreatableSelect
            label="Partner"
            options={partners}
            value={partnerId}
            onChange={setPartnerId}
            onCreateNew={createPartner}
            placeholder="Select or create partner..."
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!siteName.trim() || creating}
            className="px-4 py-2 rounded-lg text-[13px] font-medium bg-nodiac-secondary text-nodiac-primary-dark hover:bg-nodiac-secondary/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Site'}
          </button>
        </div>
      </div>
    </div>
  )
}
