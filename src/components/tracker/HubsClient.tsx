'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TrackerHubWithCounts } from '@/lib/tracker/types'
import { HUB_STATUS_OPTIONS } from '@/lib/tracker/constants'
import { useTrackerRealtime } from '@/lib/tracker/realtime'
import { HubDetailPanel } from './HubDetailPanel'
import { ToastContainer, showToast } from './Toast'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  'Planning': 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  'Active Development': 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  'Operational': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
}

type SortKey = 'name' | 'status' | 'target_mw' | 'partner_count' | 'site_count'
type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<string, number> = {
  'Planning': 0, 'Active Development': 1, 'Operational': 2,
}

interface HubsClientProps {
  initialHubs: TrackerHubWithCounts[]
}

export function HubsClient({ initialHubs }: HubsClientProps) {
  const router = useRouter()
  const [hubs, setHubs] = useState(initialHubs)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedHub, setSelectedHub] = useState<TrackerHubWithCounts | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleRealtime = useCallback(() => {
    router.refresh()
  }, [router])

  useTrackerRealtime(handleRealtime)

  const filteredHubs = useMemo(() => {
    let result = hubs

    if (selectedStatus) {
      result = result.filter(h => h.status === selectedStatus)
    }

    result = [...result].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'status':
          cmp = (STATUS_ORDER[a.status ?? ''] ?? 9) - (STATUS_ORDER[b.status ?? ''] ?? 9)
          break
        case 'target_mw':
          cmp = (a.target_mw ?? 0) - (b.target_mw ?? 0)
          break
        case 'partner_count':
          cmp = a.partner_count - b.partner_count
          break
        case 'site_count':
          cmp = a.site_count - b.site_count
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [hubs, selectedStatus, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  async function handleSave(hub: TrackerHubWithCounts) {
    const { partner_count, site_count, ...dbFields } = hub
    void partner_count
    void site_count
    const supabase = createClient()

    try {
      if (isCreating) {
        const { id: _id, created_at: _ca, updated_at: _ua, ...insertFields } = dbFields
        void _id
        void _ca
        void _ua
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('tracker_regional_hubs')
          .insert(insertFields)
          .select()
          .single()

        if (error) throw error
        setHubs(prev => [...prev, { ...data, partner_count: 0, site_count: 0 }])
        showToast('Hub created', 'success')
      } else {
        const { id, created_at: _ca, updated_at: _ua, ...updateFields } = dbFields
        void _ca
        void _ua
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('tracker_regional_hubs')
          .update(updateFields)
          .eq('id', id)

        if (error) throw error
        setHubs(prev => prev.map(h => h.id === id ? hub : h))
        showToast('Saved', 'success')
      }
    } catch {
      showToast('Failed to save', 'error')
    }

    setSelectedHub(null)
    setIsCreating(false)
  }

  async function handleDelete(hubId: string) {
    const supabase = createClient()
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('tracker_regional_hubs')
        .delete()
        .eq('id', hubId)

      if (error) throw error
      setHubs(prev => prev.filter(h => h.id !== hubId))
      showToast('Hub deleted', 'success')
    } catch {
      showToast('Failed to delete', 'error')
    }

    setSelectedHub(null)
  }

  function handleCreate() {
    setIsCreating(true)
    setSelectedHub({
      id: '',
      name: '',
      target_mw: null,
      status: 'Planning',
      notes: null,
      created_at: '',
      updated_at: '',
      partner_count: 0,
      site_count: 0,
    })
  }

  function SortHeader({ label, sortId, className }: { label: string; sortId: SortKey; className?: string }) {
    return (
      <th
        onClick={() => handleSort(sortId)}
        className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 whitespace-nowrap cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors ${className ?? ''}`}
      >
        {label}
        {sortKey === sortId && (
          <span className="ml-0.5">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
        )}
      </th>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 px-4 py-2.5 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mr-1">
            Status:
          </span>
          <button
            type="button"
            onClick={() => setSelectedStatus(null)}
            className={cn(
              'px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors duration-100 cursor-pointer',
              selectedStatus === null
                ? 'bg-nodiac-primary text-white'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a30]'
            )}
          >
            All
          </button>
          {HUB_STATUS_OPTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === s ? null : s)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors duration-100 cursor-pointer',
                selectedStatus === s
                  ? 'bg-nodiac-primary text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a30]'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{filteredHubs.length}</span> hubs
          </span>
          <button
            type="button"
            onClick={handleCreate}
            className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-nodiac-secondary text-nodiac-primary-dark hover:bg-nodiac-secondary/80 transition-colors cursor-pointer"
          >
            + Add Hub
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-[#1a1a2e] sticky top-0 z-10">
            <tr>
              <SortHeader label="Hub" sortId="name" />
              <SortHeader label="Status" sortId="status" />
              <SortHeader label="Target MW" sortId="target_mw" className="text-right" />
              <SortHeader label="Partners" sortId="partner_count" className="text-center" />
              <SortHeader label="Sites" sortId="site_count" className="text-center" />
            </tr>
          </thead>
          <tbody>
            {filteredHubs.map(hub => (
              <tr
                key={hub.id}
                onClick={() => { setIsCreating(false); setSelectedHub(hub) }}
                className="border-t border-zinc-100 dark:border-[#1e1e36] hover:bg-zinc-50 dark:hover:bg-[#1a1a30] cursor-pointer transition-colors duration-100"
              >
                <td className="px-3 py-3 text-[13px] font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {hub.name}
                </td>
                <td className="px-3 py-3">
                  {hub.status && (
                    <span className={cn('inline-flex px-2 py-0.5 rounded text-[11px] font-medium', STATUS_COLORS[hub.status])}>
                      {hub.status}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-right text-[13px] tabular-nums text-zinc-600 dark:text-zinc-400">
                  {hub.target_mw != null ? `${hub.target_mw} MW` : '--'}
                </td>
                <td className="px-3 py-3 text-center">
                  {hub.partner_count > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-nodiac-secondary/20 text-nodiac-secondary">
                      {hub.partner_count}
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-600">0</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  {hub.site_count > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-nodiac-secondary/20 text-nodiac-secondary">
                      {hub.site_count}
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-600">0</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredHubs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-zinc-400 dark:text-zinc-600">
                  No hubs match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selectedHub && (
        <HubDetailPanel
          hub={selectedHub}
          isNew={isCreating}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => { setSelectedHub(null); setIsCreating(false) }}
        />
      )}

      <ToastContainer />
    </div>
  )
}
