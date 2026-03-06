'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { showToast } from './Toast'

interface Parcel {
  id: string
  apn: string
  area_acres: number | null
  landowner_id: string | null
  landowner_name: string | null
  notes: string | null
}

interface LinkedLandowner {
  id: string
  name: string
}

export function ParcelsSection({ siteId }: { siteId: string }) {
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [landowners, setLandowners] = useState<LinkedLandowner[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()

    // Fetch parcels with landowner names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: parcelData, error: pError } = await (supabase as any)
      .from('tracker_parcels')
      .select('id, apn, area_acres, landowner_id, notes, landowner:tracker_landowners(id, name)')
      .eq('site_id', siteId)
      .order('apn')

    if (pError) {
      showToast('Failed to load parcels', 'error')
      setLoading(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped: Parcel[] = (parcelData ?? []).map((row: any) => ({
      id: row.id,
      apn: row.apn,
      area_acres: row.area_acres,
      landowner_id: row.landowner_id,
      landowner_name: row.landowner?.name ?? null,
      notes: row.notes,
    }))
    setParcels(mapped)

    // Fetch landowners linked to this site for the dropdown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: loData } = await (supabase as any)
      .from('tracker_site_landowners')
      .select('landowner:tracker_landowners(id, name)')
      .eq('site_id', siteId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const los: LinkedLandowner[] = (loData ?? []).map((row: any) => ({
      id: row.landowner.id,
      name: row.landowner.name,
    }))
    setLandowners(los)
    setLoading(false)
  }, [siteId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Parcels
        </div>
        <button
          type="button"
          onClick={() => { setAdding(true); setExpandedId(null) }}
          className="text-[12px] font-medium text-nodiac-secondary hover:text-nodiac-secondary/80 transition-colors cursor-pointer"
        >
          + Add Parcel
        </button>
      </div>

      {loading ? (
        <div className="text-[13px] text-zinc-500">Loading...</div>
      ) : (
        <div className="flex flex-col gap-2">
          {parcels.map(p => (
            <ParcelRow
              key={p.id}
              parcel={p}
              landowners={landowners}
              expanded={expandedId === p.id}
              onToggle={() => { setExpandedId(expandedId === p.id ? null : p.id); setAdding(false) }}
              onRefresh={fetchData}
            />
          ))}
          {parcels.length === 0 && !adding && (
            <div className="text-[13px] text-zinc-500">No parcels</div>
          )}
        </div>
      )}

      {adding && (
        <AddParcelForm
          siteId={siteId}
          landowners={landowners}
          onDone={() => { setAdding(false); fetchData() }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  )
}

function ParcelRow({
  parcel,
  landowners,
  expanded,
  onToggle,
  onRefresh,
}: {
  parcel: Parcel
  landowners: LinkedLandowner[]
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
          <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 font-mono">
            {parcel.apn}
          </span>
          <div className="flex items-center gap-2 text-[12px] text-zinc-500 dark:text-zinc-400">
            {parcel.area_acres != null && (
              <span className="tabular-nums">{parcel.area_acres} ac</span>
            )}
            {parcel.landowner_name && (
              <span className="truncate max-w-[100px]">{parcel.landowner_name}</span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <ParcelDetail
          parcel={parcel}
          landowners={landowners}
          onRefresh={onRefresh}
        />
      )}
    </div>
  )
}

function ParcelDetail({
  parcel,
  landowners,
  onRefresh,
}: {
  parcel: Parcel
  landowners: LinkedLandowner[]
  onRefresh: () => void
}) {
  const [apn, setApn] = useState(parcel.apn)
  const [acres, setAcres] = useState(parcel.area_acres?.toString() ?? '')
  const [landownerId, setLandownerId] = useState(parcel.landowner_id ?? '')
  const [notes, setNotes] = useState(parcel.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSave() {
    if (!apn.trim()) return
    setSaving(true)
    const supabase = createClient()

    const parsedAcres = acres.trim() === '' ? null : parseFloat(acres)
    if (parsedAcres !== null && isNaN(parsedAcres)) {
      showToast('Invalid acreage', 'error')
      setSaving(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tracker_parcels')
      .update({
        apn: apn.trim(),
        area_acres: parsedAcres,
        landowner_id: landownerId || null,
        notes: notes.trim() || null,
      })
      .eq('id', parcel.id)

    if (error) {
      showToast('Failed to save', 'error')
      setSaving(false)
      return
    }

    showToast('Saved', 'success')
    setSaving(false)
    onRefresh()
  }

  async function handleDelete() {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tracker_parcels')
      .delete()
      .eq('id', parcel.id)

    if (error) {
      showToast('Failed to delete', 'error')
      return
    }

    showToast('Parcel deleted', 'success')
    onRefresh()
  }

  const inputClass = 'w-full px-2 py-1 rounded text-[13px] bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-300 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-nodiac-secondary'
  const labelClass = 'text-[11px] text-zinc-500 dark:text-zinc-400 mb-0.5'

  return (
    <div className="mt-1 mx-1 p-3 rounded-md bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-200 dark:border-[#2a2a40] space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className={labelClass}>APN</div>
          <input type="text" value={apn} onChange={e => setApn(e.target.value)} className={inputClass} />
        </div>
        <div>
          <div className={labelClass}>Acreage</div>
          <input type="text" value={acres} onChange={e => setAcres(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="relative">
        <div className={labelClass}>Landowner</div>
        <select value={landownerId} onChange={e => setLandownerId(e.target.value)} className={cn(inputClass, 'cursor-pointer appearance-none pr-7')}>
          <option value="">-- None --</option>
          {landowners.map(lo => (
            <option key={lo.id} value={lo.id}>{lo.name}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-1.5 bottom-1.5">
          <svg className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      <div>
        <div className={labelClass}>Notes</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={cn(inputClass, 'resize-none')} />
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !apn.trim()}
          className={cn(
            'px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer',
            saving ? 'bg-nodiac-secondary/50 text-white cursor-not-allowed' : 'bg-nodiac-secondary text-zinc-900 hover:bg-nodiac-secondary/80',
            !apn.trim() && 'opacity-50 cursor-not-allowed'
          )}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-red-500">Delete?</span>
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
            Delete Parcel
          </button>
        )}
      </div>
    </div>
  )
}

function AddParcelForm({
  siteId,
  landowners,
  onDone,
  onCancel,
}: {
  siteId: string
  landowners: LinkedLandowner[]
  onDone: () => void
  onCancel: () => void
}) {
  const [apn, setApn] = useState('')
  const [acres, setAcres] = useState('')
  const [landownerId, setLandownerId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!apn.trim()) return
    setSaving(true)
    const supabase = createClient()

    const parsedAcres = acres.trim() === '' ? null : parseFloat(acres)
    if (parsedAcres !== null && isNaN(parsedAcres)) {
      showToast('Invalid acreage', 'error')
      setSaving(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tracker_parcels')
      .insert({
        site_id: siteId,
        apn: apn.trim(),
        area_acres: parsedAcres,
        landowner_id: landownerId || null,
        notes: notes.trim() || null,
      })

    if (error) {
      showToast('Failed to create parcel', 'error')
      setSaving(false)
      return
    }

    showToast('Parcel created', 'success')
    setSaving(false)
    onDone()
  }

  const inputClass = 'w-full px-2 py-1 rounded text-[13px] bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-300 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-nodiac-secondary'
  const labelClass = 'text-[11px] text-zinc-500 dark:text-zinc-400 mb-0.5'

  return (
    <div className="mt-2 p-3 rounded-md bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-200 dark:border-[#2a2a40] space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className={labelClass}>APN *</div>
          <input
            type="text"
            value={apn}
            onChange={e => setApn(e.target.value)}
            placeholder="Parcel number"
            autoFocus
            className={inputClass}
          />
        </div>
        <div>
          <div className={labelClass}>Acreage</div>
          <input
            type="text"
            value={acres}
            onChange={e => setAcres(e.target.value)}
            placeholder="e.g. 40.5"
            className={inputClass}
          />
        </div>
      </div>

      <div className="relative">
        <div className={labelClass}>Landowner</div>
        <select value={landownerId} onChange={e => setLandownerId(e.target.value)} className={cn(inputClass, 'cursor-pointer appearance-none pr-7')}>
          <option value="">-- None --</option>
          {landowners.map(lo => (
            <option key={lo.id} value={lo.id}>{lo.name}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-1.5 bottom-1.5">
          <svg className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      <div>
        <div className={labelClass}>Notes</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={cn(inputClass, 'resize-none')} placeholder="Optional notes" />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !apn.trim()}
          className={cn(
            'px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer',
            saving ? 'bg-nodiac-secondary/50 text-white cursor-not-allowed' : 'bg-nodiac-secondary text-zinc-900 hover:bg-nodiac-secondary/80',
            !apn.trim() && 'opacity-50 cursor-not-allowed'
          )}
        >
          {saving ? 'Creating...' : 'Create Parcel'}
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
