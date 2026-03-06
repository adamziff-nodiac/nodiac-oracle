'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { showToast } from './Toast'

const PROXIMITY_OPTIONS = ['Collocated', 'Adjacent'] as const
const PURPOSE_OPTIONS = ['DC Location', 'Fiber Route', 'Access Easement', 'Utility Easement'] as const
const LEASE_STATUS_OPTIONS = ['No Contact', 'Engaged', 'Amendment In Progress', 'Signed'] as const

type Proximity = (typeof PROXIMITY_OPTIONS)[number]
type Purpose = (typeof PURPOSE_OPTIONS)[number]
type LeaseStatus = (typeof LEASE_STATUS_OPTIONS)[number]

interface Landowner {
  id: string
  name: string
  email: string | null
  phone: string | null
  mailing_address: string | null
  notes: string | null
}

interface LinkedLandowner extends Landowner {
  proximity: Proximity
  purpose: Purpose[]
  lease_status: LeaseStatus
  junction_notes: string | null
}

function leaseStatusColor(status: LeaseStatus) {
  switch (status) {
    case 'No Contact':
      return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
    case 'Engaged':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'Amendment In Progress':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'Signed':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  }
}

function proximityColor(proximity: Proximity) {
  switch (proximity) {
    case 'Collocated':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case 'Adjacent':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
  }
}

export function LandownersSection({ siteId }: { siteId: string }) {
  const [landowners, setLandowners] = useState<LinkedLandowner[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchLandowners = useCallback(async () => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('tracker_site_landowners')
      .select('proximity, purpose, lease_status, notes, landowner:tracker_landowners(id, name, email, phone, mailing_address, notes)')
      .eq('site_id', siteId)

    if (error) {
      showToast('Failed to load landowners', 'error')
      setLoading(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped: LinkedLandowner[] = (data ?? []).map((row: any) => ({
      id: row.landowner.id,
      name: row.landowner.name,
      email: row.landowner.email,
      phone: row.landowner.phone,
      mailing_address: row.landowner.mailing_address,
      notes: row.landowner.notes,
      proximity: row.proximity,
      purpose: row.purpose ?? [],
      lease_status: row.lease_status ?? 'No Contact',
      junction_notes: row.notes,
    }))

    setLandowners(mapped)
    setLoading(false)
  }, [siteId])

  useEffect(() => {
    fetchLandowners()
  }, [fetchLandowners])

  return (
    <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Landowners
        </div>
        <button
          type="button"
          onClick={() => { setAdding(true); setExpandedId(null) }}
          className="text-[12px] font-medium text-nodiac-secondary hover:text-nodiac-secondary/80 transition-colors cursor-pointer"
        >
          + Add Landowner
        </button>
      </div>

      {loading ? (
        <div className="text-[13px] text-zinc-500">Loading...</div>
      ) : (
        <div className="flex flex-col gap-2">
          {landowners.map(lo => (
            <LandownerRow
              key={lo.id}
              landowner={lo}
              siteId={siteId}
              expanded={expandedId === lo.id}
              onToggle={() => { setExpandedId(expandedId === lo.id ? null : lo.id); setAdding(false) }}
              onRefresh={fetchLandowners}
            />
          ))}
          {landowners.length === 0 && !adding && (
            <div className="text-[13px] text-zinc-500">No landowners linked</div>
          )}
        </div>
      )}

      {adding && (
        <AddLandownerForm
          siteId={siteId}
          onDone={() => { setAdding(false); fetchLandowners() }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  )
}

function LandownerRow({
  landowner,
  siteId,
  expanded,
  onToggle,
  onRefresh,
}: {
  landowner: LinkedLandowner
  siteId: string
  expanded: boolean
  onToggle: () => void
  onRefresh: () => void
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-3 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-[#1a1a30] transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {landowner.name}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', proximityColor(landowner.proximity))}>
              {landowner.proximity}
            </span>
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', leaseStatusColor(landowner.lease_status))}>
              {landowner.lease_status}
            </span>
          </div>
        </div>
        {landowner.purpose.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {landowner.purpose.map(p => (
              <span key={p} className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {p}
              </span>
            ))}
          </div>
        )}
      </button>

      {expanded && (
        <LandownerDetail
          landowner={landowner}
          siteId={siteId}
          onRefresh={onRefresh}
        />
      )}
    </div>
  )
}

function LandownerDetail({
  landowner,
  siteId,
  onRefresh,
}: {
  landowner: LinkedLandowner
  siteId: string
  onRefresh: () => void
}) {
  const [name, setName] = useState(landowner.name)
  const [email, setEmail] = useState(landowner.email ?? '')
  const [phone, setPhone] = useState(landowner.phone ?? '')
  const [mailingAddress, setMailingAddress] = useState(landowner.mailing_address ?? '')
  const [notes, setNotes] = useState(landowner.notes ?? '')
  const [proximity, setProximity] = useState<Proximity>(landowner.proximity)
  const [purpose, setPurpose] = useState<Purpose[]>(landowner.purpose)
  const [leaseStatus, setLeaseStatus] = useState<LeaseStatus>(landowner.lease_status)
  const [junctionNotes, setJunctionNotes] = useState(landowner.junction_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function togglePurpose(p: Purpose) {
    setPurpose(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()

    // Update landowner record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: loError } = await (supabase as any)
      .from('tracker_landowners')
      .update({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        mailing_address: mailingAddress.trim() || null,
        notes: notes.trim() || null,
      })
      .eq('id', landowner.id)

    if (loError) {
      showToast('Failed to save landowner', 'error')
      setSaving(false)
      return
    }

    // Update junction record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: jError } = await (supabase as any)
      .from('tracker_site_landowners')
      .update({
        proximity,
        purpose,
        lease_status: leaseStatus,
        notes: junctionNotes.trim() || null,
      })
      .eq('site_id', siteId)
      .eq('landowner_id', landowner.id)

    if (jError) {
      showToast('Failed to save link details', 'error')
      setSaving(false)
      return
    }

    showToast('Saved', 'success')
    setSaving(false)
    onRefresh()
  }

  async function handleUnlink() {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tracker_site_landowners')
      .delete()
      .eq('site_id', siteId)
      .eq('landowner_id', landowner.id)

    if (error) {
      showToast('Failed to unlink', 'error')
      return
    }
    showToast('Landowner unlinked', 'success')
    onRefresh()
  }

  async function handleDelete() {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tracker_landowners')
      .delete()
      .eq('id', landowner.id)

    if (error) {
      showToast('Failed to delete landowner', 'error')
      return
    }
    showToast('Landowner deleted', 'success')
    onRefresh()
  }

  const inputClass = 'w-full px-2 py-1 rounded text-[13px] bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-300 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-nodiac-secondary'
  const labelClass = 'text-[11px] text-zinc-500 dark:text-zinc-400 mb-0.5'

  return (
    <div className="mt-1 mx-1 p-3 rounded-md bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-200 dark:border-[#2a2a40] space-y-3">
      {/* Landowner fields */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className={labelClass}>Name</div>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <div className={labelClass}>Email</div>
          <input type="text" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <div className={labelClass}>Phone</div>
          <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
        </div>
        <div>
          <div className={labelClass}>Mailing Address</div>
          <input type="text" value={mailingAddress} onChange={e => setMailingAddress(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <div className={labelClass}>Landowner Notes</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={cn(inputClass, 'resize-none')} />
      </div>

      {/* Junction fields */}
      <div className="border-t border-zinc-200 dark:border-[#2a2a40] pt-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
          Site Link Details
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <div className={labelClass}>Proximity</div>
            <select value={proximity} onChange={e => setProximity(e.target.value as Proximity)} className={cn(inputClass, 'cursor-pointer appearance-none pr-7')}>
              {PROXIMITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <div className="pointer-events-none absolute right-1.5 bottom-1.5">
              <svg className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="relative">
            <div className={labelClass}>Lease Status</div>
            <select value={leaseStatus} onChange={e => setLeaseStatus(e.target.value as LeaseStatus)} className={cn(inputClass, 'cursor-pointer appearance-none pr-7')}>
              {LEASE_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <div className="pointer-events-none absolute right-1.5 bottom-1.5">
              <svg className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <div className={labelClass}>Purpose</div>
          <div className="flex flex-wrap gap-1.5">
            {PURPOSE_OPTIONS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => togglePurpose(p)}
                className={cn(
                  'px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer border',
                  purpose.includes(p)
                    ? 'bg-nodiac-secondary/15 text-nodiac-secondary border-nodiac-secondary/30'
                    : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-[#1a1a30] dark:text-zinc-400 dark:border-[#2a2a40] hover:border-zinc-300 dark:hover:border-zinc-600'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2">
          <div className={labelClass}>Link Notes</div>
          <textarea value={junctionNotes} onChange={e => setJunctionNotes(e.target.value)} rows={2} className={cn(inputClass, 'resize-none')} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className={cn(
              'px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer',
              saving ? 'bg-nodiac-secondary/50 text-white cursor-not-allowed' : 'bg-nodiac-secondary text-zinc-900 hover:bg-nodiac-secondary/80'
            )}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleUnlink}
            className="px-3 py-1.5 rounded-md text-[12px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#1a1a30] transition-colors cursor-pointer"
          >
            Unlink
          </button>
        </div>

        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-red-500">Delete forever?</span>
            <button
              type="button"
              onClick={handleDelete}
              className="px-2 py-1 rounded text-[11px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 rounded text-[11px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-[12px] font-medium text-red-500 dark:text-red-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            Delete Landowner
          </button>
        )}
      </div>
    </div>
  )
}

function AddLandownerForm({
  siteId,
  onDone,
  onCancel,
}: {
  siteId: string
  onDone: () => void
  onCancel: () => void
}) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Landowner[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [proximity, setProximity] = useState<Proximity>('Collocated')
  const [purpose, setPurpose] = useState<Purpose[]>([])
  const [leaseStatus, setLeaseStatus] = useState<LeaseStatus>('No Contact')
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'search' | 'new'>('search')

  async function handleSearch(query: string) {
    setSearch(query)
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('tracker_landowners')
      .select('id, name, email, phone, mailing_address, notes')
      .ilike('name', `%${query.trim()}%`)
      .limit(10)

    setResults(data ?? [])
    setSearching(false)
  }

  function togglePurpose(p: Purpose) {
    setPurpose(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function handleLink() {
    if (!selectedId && !newName.trim()) return
    setSaving(true)
    const supabase = createClient()

    let landownerId = selectedId

    // Create new landowner if needed
    if (!landownerId && newName.trim()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('tracker_landowners')
        .insert({ name: newName.trim() })
        .select('id')
        .single()

      if (error || !data) {
        showToast('Failed to create landowner', 'error')
        setSaving(false)
        return
      }
      landownerId = data.id
    }

    // Link to site
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tracker_site_landowners')
      .insert({
        site_id: siteId,
        landowner_id: landownerId,
        proximity,
        purpose,
        lease_status: leaseStatus,
      })

    if (error) {
      showToast(error.message?.includes('duplicate') ? 'Already linked' : 'Failed to link', 'error')
      setSaving(false)
      return
    }

    showToast('Landowner linked', 'success')
    setSaving(false)
    onDone()
  }

  const inputClass = 'w-full px-2 py-1 rounded text-[13px] bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-300 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-nodiac-secondary'
  const labelClass = 'text-[11px] text-zinc-500 dark:text-zinc-400 mb-0.5'

  return (
    <div className="mt-2 p-3 rounded-md bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-200 dark:border-[#2a2a40] space-y-3">
      {/* Mode tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-[#2a2a40] pb-2">
        <button
          type="button"
          onClick={() => { setMode('search'); setSelectedId(null) }}
          className={cn(
            'text-[12px] font-medium px-2 py-1 rounded transition-colors cursor-pointer',
            mode === 'search' ? 'text-nodiac-secondary bg-nodiac-secondary/10' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          )}
        >
          Search Existing
        </button>
        <button
          type="button"
          onClick={() => { setMode('new'); setSelectedId(null) }}
          className={cn(
            'text-[12px] font-medium px-2 py-1 rounded transition-colors cursor-pointer',
            mode === 'new' ? 'text-nodiac-secondary bg-nodiac-secondary/10' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          )}
        >
          Create New
        </button>
      </div>

      {mode === 'search' ? (
        <div>
          <div className={labelClass}>Search by name</div>
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Type to search..."
            autoFocus
            className={inputClass}
          />
          {searching && <div className="text-[11px] text-zinc-500 mt-1">Searching...</div>}
          {results.length > 0 && (
            <div className="mt-1 max-h-32 overflow-y-auto rounded border border-zinc-200 dark:border-[#2a2a40]">
              {results.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { setSelectedId(r.id); setSearch(r.name) }}
                  className={cn(
                    'w-full text-left px-2 py-1.5 text-[13px] transition-colors cursor-pointer',
                    selectedId === r.id
                      ? 'bg-nodiac-secondary/15 text-nodiac-secondary'
                      : 'text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#1a1a30]'
                  )}
                >
                  {r.name}
                  {r.email && <span className="text-[11px] text-zinc-500 ml-2">{r.email}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className={labelClass}>Name</div>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Landowner name"
            autoFocus
            className={inputClass}
          />
        </div>
      )}

      {/* Junction fields */}
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <div className={labelClass}>Proximity</div>
          <select value={proximity} onChange={e => setProximity(e.target.value as Proximity)} className={cn(inputClass, 'cursor-pointer appearance-none pr-7')}>
            {PROXIMITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <div className="pointer-events-none absolute right-1.5 bottom-1.5">
            <svg className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        <div className="relative">
          <div className={labelClass}>Lease Status</div>
          <select value={leaseStatus} onChange={e => setLeaseStatus(e.target.value as LeaseStatus)} className={cn(inputClass, 'cursor-pointer appearance-none pr-7')}>
            {LEASE_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <div className="pointer-events-none absolute right-1.5 bottom-1.5">
            <svg className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      <div>
        <div className={labelClass}>Purpose</div>
        <div className="flex flex-wrap gap-1.5">
          {PURPOSE_OPTIONS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => togglePurpose(p)}
              className={cn(
                'px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer border',
                purpose.includes(p)
                  ? 'bg-nodiac-secondary/15 text-nodiac-secondary border-nodiac-secondary/30'
                  : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-[#1a1a30] dark:text-zinc-400 dark:border-[#2a2a40] hover:border-zinc-300 dark:hover:border-zinc-600'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleLink}
          disabled={saving || (mode === 'search' ? !selectedId : !newName.trim())}
          className={cn(
            'px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer',
            saving ? 'bg-nodiac-secondary/50 text-white cursor-not-allowed' : 'bg-nodiac-secondary text-zinc-900 hover:bg-nodiac-secondary/80',
            (mode === 'search' ? !selectedId : !newName.trim()) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {saving ? 'Linking...' : mode === 'new' ? 'Create & Link' : 'Link'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-md text-[12px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
