'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { TrackerPartnerWithCounts, TrackerSiteOverview } from '@/lib/tracker/types'
import { PARTNER_TYPE_OPTIONS, RELATIONSHIP_STAGE_OPTIONS } from '@/lib/tracker/constants'
import { showToast } from './Toast'
import { cn } from '@/lib/utils'
import { StyledSelect } from '@/components/ui/StyledSelect'

interface PartnerDetailPanelProps {
  partner: TrackerPartnerWithCounts
  isNew: boolean
  hubs: Array<{ id: string; name: string }>
  onSave: (partner: TrackerPartnerWithCounts, pendingHubIds?: string[]) => void
  onDelete: (partnerId: string) => void
  onClose: () => void
}

export function PartnerDetailPanel({ partner, isNew, hubs, onSave, onDelete, onClose }: PartnerDetailPanelProps) {
  const [draft, setDraft] = useState(partner)
  const [sites, setSites] = useState<TrackerSiteOverview[]>([])
  const [loadingSites, setLoadingSites] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Hub link management
  const [linkedHubIds, setLinkedHubIds] = useState<string[]>([])
  const [loadingHubs, setLoadingHubs] = useState(false)
  const [pendingHubIds, setPendingHubIds] = useState<string[]>([]) // for new partners

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  // Load linked sites for existing partners
  useEffect(() => {
    if (isNew || !partner.id) return
    setLoadingSites(true)

    async function fetchSites() {
      try {
        const res = await fetch(`/api/tracker/partner-sites?partnerId=${partner.id}`)
        if (res.ok) {
          const data = await res.json()
          setSites(data)
        }
      } catch {
        // Sites list is non-critical
      } finally {
        setLoadingSites(false)
      }
    }
    fetchSites()
  }, [partner.id, isNew])

  // Load linked hub IDs for existing partners
  useEffect(() => {
    if (isNew || !partner.id) return
    setLoadingHubs(true)

    async function fetchLinkedHubs() {
      try {
        const supabase = createClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('tracker_partner_hubs')
          .select('hub_id')
          .eq('partner_id', partner.id)

        if (error) throw error
        setLinkedHubIds((data ?? []).map((r: { hub_id: string }) => r.hub_id))
      } catch {
        // Non-critical
      } finally {
        setLoadingHubs(false)
      }
    }
    fetchLinkedHubs()
  }, [partner.id, isNew])

  // Hub IDs to display (linked for existing, pending for new)
  const displayedHubIds = isNew ? pendingHubIds : linkedHubIds
  const linkedHubs = hubs.filter(h => displayedHubIds.includes(h.id))
  const availableHubs = hubs.filter(h => !displayedHubIds.includes(h.id))

  async function handleLinkHub(hubId: string) {
    if (isNew) {
      setPendingHubIds(prev => [...prev, hubId])
      return
    }

    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('tracker_partner_hubs')
        .insert({ partner_id: partner.id, hub_id: hubId })

      if (error) throw error
      setLinkedHubIds(prev => [...prev, hubId])
      showToast('Hub linked', 'success')
    } catch {
      showToast('Failed to link hub', 'error')
    }
  }

  async function handleUnlinkHub(hubId: string) {
    if (isNew) {
      setPendingHubIds(prev => prev.filter(id => id !== hubId))
      return
    }

    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('tracker_partner_hubs')
        .delete()
        .eq('partner_id', partner.id)
        .eq('hub_id', hubId)

      if (error) throw error
      setLinkedHubIds(prev => prev.filter(id => id !== hubId))
      showToast('Hub unlinked', 'success')
    } catch {
      showToast('Failed to unlink hub', 'error')
    }
  }

  function updateField<K extends keyof TrackerPartnerWithCounts>(key: K, value: TrackerPartnerWithCounts[K]) {
    setDraft(d => ({ ...d, [key]: value }))
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-lg bg-white dark:bg-[#16162a] border-l border-zinc-200 dark:border-[#2a2a40] shadow-xl overflow-y-auto"
      >
        <div className="p-6 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={draft.name}
                onChange={e => updateField('name', e.target.value)}
                placeholder="Partner name"
                className="w-full text-xl font-semibold bg-transparent text-zinc-900 dark:text-zinc-100 border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-nodiac-secondary focus:outline-none pb-1 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Type & Stage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Type
              </label>
              <StyledSelect
                value={draft.type ?? ''}
                onChange={(val) => updateField('type', val || null)}
                options={[
                  { value: '', label: 'Select type...' },
                  ...PARTNER_TYPE_OPTIONS.map(t => ({ value: t, label: t })),
                ]}
                size="md"
                className="mt-1 w-full"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Relationship Stage
              </label>
              <StyledSelect
                value={draft.relationship_stage ?? ''}
                onChange={(val) => updateField('relationship_stage', val || null)}
                options={[
                  { value: '', label: 'Select stage...' },
                  ...RELATIONSHIP_STAGE_OPTIONS.map(s => ({ value: s, label: s })),
                ]}
                size="md"
                className="mt-1 w-full"
              />
            </div>
          </div>

          {/* LOI Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.loi_signed ?? false}
              onChange={e => updateField('loi_signed', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-nodiac-secondary focus:ring-nodiac-secondary"
            />
            <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">LOI Signed</span>
          </label>

          {/* Detail Fields */}
          <div className="flex flex-col gap-4">
            <DetailField
              label="Available Capacity"
              value={draft.available_capacity}
              onChange={v => updateField('available_capacity', v)}
              placeholder="e.g., 50 MW across territory"
            />
            <DetailField
              label="IX Process Notes"
              value={draft.ix_process_notes}
              onChange={v => updateField('ix_process_notes', v)}
              placeholder="How this partner handles interconnection..."
              multiline
            />
            <DetailField
              label="Rate Structure"
              value={draft.rate_structure}
              onChange={v => updateField('rate_structure', v)}
              placeholder="Known rate info..."
              multiline
            />
            <DetailField
              label="Attio Link"
              value={draft.attio_link}
              onChange={v => updateField('attio_link', v)}
              placeholder="https://app.attio.com/..."
            />
          </div>

          {/* Hubs */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
              Hubs
            </div>
            {loadingHubs ? (
              <div className="h-6 w-32 bg-zinc-100 dark:bg-[#1a1a2e] rounded animate-pulse" />
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {linkedHubs.map(hub => (
                  <span
                    key={hub.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-nodiac-secondary/10 text-nodiac-secondary"
                  >
                    {hub.name}
                    <button
                      type="button"
                      onClick={() => handleUnlinkHub(hub.id)}
                      className="ml-0.5 text-nodiac-secondary/50 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                {availableHubs.length > 0 && (
                  <StyledSelect
                    value=""
                    onChange={(val) => { if (val) handleLinkHub(val) }}
                    options={[
                      { value: '', label: '+ Add Hub' },
                      ...availableHubs.map(hub => ({ value: hub.id, label: hub.name })),
                    ]}
                    size="xs"
                    variant="ghost"
                  />
                )}
                {linkedHubs.length === 0 && availableHubs.length === 0 && (
                  <span className="text-[13px] text-zinc-400 dark:text-zinc-600 italic">No hubs available</span>
                )}
              </div>
            )}
          </div>

          {/* Linked Sites */}
          {!isNew && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
                Linked Sites ({partner.site_count})
              </div>
              {loadingSites ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: Math.min(partner.site_count, 3) }).map((_, i) => (
                    <div key={i} className="h-8 bg-zinc-100 dark:bg-[#1a1a2e] rounded" />
                  ))}
                </div>
              ) : sites.length > 0 ? (
                <div className="space-y-1">
                  {sites.map(site => (
                    <Link
                      key={site.id}
                      href={`/tracker/${site.id}`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center justify-between px-3 py-2 rounded-md text-[13px] hover:bg-zinc-50 dark:hover:bg-[#1a1a30] transition-colors"
                    >
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{site.name}</span>
                      <div className="flex items-center gap-2">
                        {site.mw_current && (
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">{site.mw_current} MW</span>
                        )}
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-medium',
                          site.priority === 'Lead' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          site.priority === 'Active' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' :
                          'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                        )}>
                          {site.priority}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-zinc-400 dark:text-zinc-600 italic">No sites linked yet</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-[#2a2a40]">
            <button
              type="button"
              onClick={() => onSave(draft, isNew && pendingHubIds.length > 0 ? pendingHubIds : undefined)}
              disabled={!draft.name.trim()}
              className={cn(
                'px-4 py-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer',
                draft.name.trim()
                  ? 'bg-nodiac-secondary text-nodiac-primary-dark hover:bg-nodiac-secondary/80'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'
              )}
            >
              {isNew ? 'Create Partner' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {!isNew && (
              <div className="ml-auto">
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-red-500">Delete this partner?</span>
                    <button
                      type="button"
                      onClick={() => onDelete(partner.id)}
                      className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      Yes, delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-md text-[12px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-[12px] text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function DetailField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  multiline?: boolean
}) {
  const Tag = multiline ? 'textarea' : 'input'

  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </label>
      <Tag
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
        placeholder={placeholder}
        rows={multiline ? 3 : undefined}
        className={cn(
          'mt-1 w-full px-3 py-2 rounded-md text-[13px] bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-200 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-nodiac-secondary transition-colors',
          multiline && 'resize-none'
        )}
      />
    </div>
  )
}
