'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TrackerPartnerWithCounts, TrackerHub } from '@/lib/tracker/types'
import { PARTNER_TYPE_OPTIONS, RELATIONSHIP_STAGE_OPTIONS } from '@/lib/tracker/constants'
import { useTrackerRealtime } from '@/lib/tracker/realtime'
import { PartnerDetailPanel } from './PartnerDetailPanel'
import { ToastContainer, showToast } from './Toast'
import { StyledSelect } from '@/components/ui/StyledSelect'
import { cn } from '@/lib/utils'

const STAGE_COLORS: Record<string, string> = {
  'Identified': 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  'Initial Contact': 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
  'Capacity Discussion': 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  'Under Contract': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
}

const TYPE_COLORS: Record<string, string> = {
  'Distribution Co-op': 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  'G&T Co-op': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
  'Municipal Utility': 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
  'IOU': 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
  'IPP': 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
}

type SortKey = 'name' | 'type' | 'relationship_stage' | 'site_count'
type SortDir = 'asc' | 'desc'

const STAGE_ORDER: Record<string, number> = {
  'Identified': 0, 'Initial Contact': 1, 'Capacity Discussion': 2, 'Under Contract': 3,
}

interface PartnersClientProps {
  initialPartners: TrackerPartnerWithCounts[]
  hubs: TrackerHub[]
}

export function PartnersClient({ initialPartners, hubs }: PartnersClientProps) {
  const router = useRouter()
  const [partners, setPartners] = useState(initialPartners)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [selectedHub, setSelectedHub] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedPartner, setSelectedPartner] = useState<TrackerPartnerWithCounts | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleRealtime = useCallback(() => {
    router.refresh()
  }, [router])

  useTrackerRealtime(handleRealtime)

  const hubNames = useMemo(() => hubs.map(h => h.name), [hubs])

  const filteredPartners = useMemo(() => {
    let result = partners

    if (selectedType) {
      result = result.filter(p => p.type === selectedType)
    }
    if (selectedStage) {
      result = result.filter(p => p.relationship_stage === selectedStage)
    }
    if (selectedHub) {
      result = result.filter(p => p.hub_names.includes(selectedHub))
    }

    result = [...result].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'type':
          cmp = (a.type ?? '').localeCompare(b.type ?? '')
          break
        case 'relationship_stage':
          cmp = (STAGE_ORDER[a.relationship_stage ?? ''] ?? 9) - (STAGE_ORDER[b.relationship_stage ?? ''] ?? 9)
          break
        case 'site_count':
          cmp = a.site_count - b.site_count
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [partners, selectedType, selectedStage, selectedHub, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  async function handleSave(partner: TrackerPartnerWithCounts, pendingHubIds?: string[]) {
    const { site_count, hub_names, ...dbFields } = partner
    void site_count
    void hub_names
    const supabase = createClient()

    try {
      if (isCreating) {
        // Create new partner
        const { id: _id, created_at: _ca, updated_at: _ua, ...insertFields } = dbFields
        void _id
        void _ca
        void _ua
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('tracker_power_partners')
          .insert(insertFields)
          .select()
          .single()

        if (error) throw error

        // Link pending hubs for new partner
        const linkedHubNames: string[] = []
        if (pendingHubIds && pendingHubIds.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: hubError } = await (supabase as any)
            .from('tracker_partner_hubs')
            .insert(pendingHubIds.map(hubId => ({ partner_id: data.id, hub_id: hubId })))

          if (hubError) {
            console.error('Failed to link hubs:', hubError)
          } else {
            for (const hubId of pendingHubIds) {
              const hub = hubs.find(h => h.id === hubId)
              if (hub) linkedHubNames.push(hub.name)
            }
          }
        }

        setPartners(prev => [...prev, { ...data, site_count: 0, hub_names: linkedHubNames }])
        showToast('Partner created', 'success')
      } else {
        // Update existing partner
        const { id, created_at: _ca, updated_at: _ua, ...updateFields } = dbFields
        void _ca
        void _ua
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('tracker_power_partners')
          .update(updateFields)
          .eq('id', id)

        if (error) throw error
        setPartners(prev => prev.map(p => p.id === id ? partner : p))
        showToast('Saved', 'success')
      }
    } catch {
      showToast('Failed to save', 'error')
    }

    setSelectedPartner(null)
    setIsCreating(false)
  }

  async function handleDelete(partnerId: string) {
    const supabase = createClient()
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('tracker_power_partners')
        .delete()
        .eq('id', partnerId)

      if (error) throw error
      setPartners(prev => prev.filter(p => p.id !== partnerId))
      showToast('Partner deleted', 'success')
    } catch {
      showToast('Failed to delete', 'error')
    }

    setSelectedPartner(null)
  }

  function handleCreate() {
    setIsCreating(true)
    setSelectedPartner({
      id: '',
      name: '',
      type: null,
      relationship_stage: 'Identified',
      loi_signed: false,
      parent_gt_id: null,
      ix_process_notes: null,
      rate_structure: null,
      available_capacity: null,
      attio_link: null,
      notes: null,
      created_at: '',
      updated_at: '',
      site_count: 0,
      hub_names: [],
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
            Type:
          </span>
          <button
            type="button"
            onClick={() => setSelectedType(null)}
            className={cn(
              'px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors duration-100 cursor-pointer',
              selectedType === null
                ? 'bg-nodiac-primary text-white'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a30]'
            )}
          >
            All
          </button>
          {PARTNER_TYPE_OPTIONS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(selectedType === t ? null : t)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors duration-100 cursor-pointer',
                selectedType === t
                  ? 'bg-nodiac-primary text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a30]'
              )}
            >
              {t}
            </button>
          ))}

          <StyledSelect
            value={selectedStage ?? ''}
            onChange={(val) => setSelectedStage(val || null)}
            options={[
              { value: '', label: 'All Stages' },
              ...RELATIONSHIP_STAGE_OPTIONS.map(s => ({ value: s, label: s })),
            ]}
            size="sm"
            variant="ghost"
          />

          <StyledSelect
            value={selectedHub ?? ''}
            onChange={(val) => setSelectedHub(val || null)}
            options={[
              { value: '', label: 'All Hubs' },
              ...hubNames.map(h => ({ value: h, label: h })),
            ]}
            size="sm"
            variant="ghost"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{filteredPartners.length}</span> partners
          </span>
          <button
            type="button"
            onClick={handleCreate}
            className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-nodiac-secondary text-nodiac-primary-dark hover:bg-nodiac-secondary/80 transition-colors cursor-pointer"
          >
            + Add Partner
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-[#1a1a2e] sticky top-0 z-10">
            <tr>
              <SortHeader label="Partner" sortId="name" />
              <SortHeader label="Type" sortId="type" />
              <SortHeader label="Stage" sortId="relationship_stage" />
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 whitespace-nowrap text-center">
                LOI
              </th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                Hub(s)
              </th>
              <SortHeader label="Sites" sortId="site_count" className="text-center" />
            </tr>
          </thead>
          <tbody>
            {filteredPartners.map(partner => (
              <tr
                key={partner.id}
                onClick={() => { setIsCreating(false); setSelectedPartner(partner) }}
                className="border-t border-zinc-100 dark:border-[#1e1e36] hover:bg-zinc-50 dark:hover:bg-[#1a1a30] cursor-pointer transition-colors duration-100"
              >
                <td className="px-3 py-3 text-[13px] font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {partner.name}
                </td>
                <td className="px-3 py-3">
                  {partner.type && (
                    <span className={cn('inline-flex px-2 py-0.5 rounded text-[11px] font-medium', TYPE_COLORS[partner.type])}>
                      {partner.type}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {partner.relationship_stage && (
                    <span className={cn('inline-flex px-2 py-0.5 rounded text-[11px] font-medium', STAGE_COLORS[partner.relationship_stage])}>
                      {partner.relationship_stage}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  {partner.loi_signed && (
                    <svg className="w-4 h-4 mx-auto text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </td>
                <td className="px-3 py-3 text-[13px] text-zinc-600 dark:text-zinc-400">
                  {partner.hub_names.length > 0 ? partner.hub_names.join(', ') : '--'}
                </td>
                <td className="px-3 py-3 text-center">
                  {partner.site_count > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-nodiac-secondary/20 text-nodiac-secondary">
                      {partner.site_count}
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-600">0</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredPartners.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-zinc-400 dark:text-zinc-600">
                  No partners match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selectedPartner && (
        <PartnerDetailPanel
          partner={selectedPartner}
          isNew={isCreating}
          hubs={hubs.map(h => ({ id: h.id, name: h.name }))}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => { setSelectedPartner(null); setIsCreating(false) }}
        />
      )}

      <ToastContainer />
    </div>
  )
}
