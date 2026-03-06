'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import type { TrackerHubWithCounts, TrackerPartner, TrackerSiteOverview } from '@/lib/tracker/types'
import { HUB_STATUS_OPTIONS } from '@/lib/tracker/constants'
import { cn } from '@/lib/utils'

interface HubDetailPanelProps {
  hub: TrackerHubWithCounts
  isNew: boolean
  onSave: (hub: TrackerHubWithCounts) => void
  onDelete: (hubId: string) => void
  onClose: () => void
}

export function HubDetailPanel({ hub, isNew, onSave, onDelete, onClose }: HubDetailPanelProps) {
  const [draft, setDraft] = useState(hub)
  const [partners, setPartners] = useState<TrackerPartner[]>([])
  const [sites, setSites] = useState<TrackerSiteOverview[]>([])
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [loadingSites, setLoadingSites] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

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

  // Load linked partners for existing hubs
  useEffect(() => {
    if (isNew || !hub.id) return
    setLoadingPartners(true)

    async function fetchPartners() {
      try {
        const res = await fetch(`/api/tracker/hub-partners?hubId=${hub.id}`)
        if (res.ok) {
          const data = await res.json()
          setPartners(data)
        }
      } catch {
        // Partners list is non-critical
      } finally {
        setLoadingPartners(false)
      }
    }
    fetchPartners()
  }, [hub.id, isNew])

  // Load linked sites for existing hubs
  useEffect(() => {
    if (isNew || !hub.name) return
    setLoadingSites(true)

    async function fetchSites() {
      try {
        const res = await fetch(`/api/tracker/hub-sites?hubName=${encodeURIComponent(hub.name)}`)
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
  }, [hub.name, isNew])

  function updateField<K extends keyof TrackerHubWithCounts>(key: K, value: TrackerHubWithCounts[K]) {
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
                placeholder="Hub name"
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

          {/* Status & Target MW */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Status
              </label>
              <select
                value={draft.status ?? ''}
                onChange={e => updateField('status', e.target.value || null)}
                className="mt-1 w-full px-3 py-2 rounded-md text-[13px] bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-200 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 cursor-pointer"
              >
                <option value="">Select status...</option>
                {HUB_STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Target MW
              </label>
              <input
                type="number"
                value={draft.target_mw ?? ''}
                onChange={e => updateField('target_mw', e.target.value ? Number(e.target.value) : null)}
                placeholder="e.g., 100"
                className="mt-1 w-full px-3 py-2 rounded-md text-[13px] bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-200 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-nodiac-secondary transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Notes
            </label>
            <textarea
              value={typeof draft.notes === 'object' && draft.notes !== null ? JSON.stringify(draft.notes, null, 2) : (draft.notes ?? '')}
              onChange={e => updateField('notes', e.target.value || null)}
              placeholder="Hub notes..."
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-md text-[13px] bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-200 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-nodiac-secondary transition-colors resize-none"
            />
          </div>

          {/* Linked Partners */}
          {!isNew && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
                Linked Partners ({hub.partner_count})
              </div>
              {loadingPartners ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: Math.min(hub.partner_count, 3) }).map((_, i) => (
                    <div key={i} className="h-8 bg-zinc-100 dark:bg-[#1a1a2e] rounded" />
                  ))}
                </div>
              ) : partners.length > 0 ? (
                <div className="space-y-1">
                  {partners.map(partner => (
                    <Link
                      key={partner.id}
                      href="/tracker/partners"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center justify-between px-3 py-2 rounded-md text-[13px] hover:bg-zinc-50 dark:hover:bg-[#1a1a30] transition-colors"
                    >
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{partner.name}</span>
                      <div className="flex items-center gap-2">
                        {partner.type && (
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{partner.type}</span>
                        )}
                        {partner.relationship_stage && (
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-medium',
                            partner.relationship_stage === 'Under Contract' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            partner.relationship_stage === 'Capacity Discussion' ? 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' :
                            partner.relationship_stage === 'Initial Contact' ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' :
                            'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                          )}>
                            {partner.relationship_stage}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-zinc-400 dark:text-zinc-600 italic">No partners linked yet</p>
              )}
            </div>
          )}

          {/* Linked Sites */}
          {!isNew && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
                Linked Sites ({hub.site_count})
              </div>
              {loadingSites ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: Math.min(hub.site_count, 3) }).map((_, i) => (
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
              onClick={() => onSave(draft)}
              disabled={!draft.name.trim()}
              className={cn(
                'px-4 py-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer',
                draft.name.trim()
                  ? 'bg-nodiac-secondary text-nodiac-primary-dark hover:bg-nodiac-secondary/80'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'
              )}
            >
              {isNew ? 'Create Hub' : 'Save Changes'}
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
                    <span className="text-[12px] text-red-500">Delete this hub?</span>
                    <button
                      type="button"
                      onClick={() => onDelete(hub.id)}
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
