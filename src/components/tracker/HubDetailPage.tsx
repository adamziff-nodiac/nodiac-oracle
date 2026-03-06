'use client'

import { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TrackerHub, TrackerPartner, TrackerSiteOverview } from '@/lib/tracker/types'
import { HUB_STATUS_OPTIONS } from '@/lib/tracker/constants'
import { useTrackerRealtime } from '@/lib/tracker/realtime'
import { categorizeSite, STATUS_CATEGORY_CONFIG, type SiteStatusCategory } from './SiteStatusMap'
import { ToastContainer, showToast } from './Toast'
import { cn } from '@/lib/utils'
import { ArrowLeft, MapPin, Zap, Users, Building2, Pencil, X, Check } from 'lucide-react'

const SiteStatusMap = dynamic(
  () => import('./SiteStatusMap').then(mod => ({ default: mod.SiteStatusMap })),
  { ssr: false, loading: () => <div className="w-full h-[50vh] bg-zinc-100 dark:bg-[#1a1a2e] rounded-lg animate-pulse" /> }
)

const STATUS_COLORS: Record<string, string> = {
  'Planning': 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  'Active Development': 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  'Operational': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
}

interface HubDetailPageProps {
  hub: TrackerHub
  initialSites: TrackerSiteOverview[]
  initialPartners: TrackerPartner[]
}

export function HubDetailPage({ hub: initialHub, initialSites, initialPartners }: HubDetailPageProps) {
  const router = useRouter()
  const [hub, setHub] = useState(initialHub)
  const [sites] = useState(initialSites)
  const [partners] = useState(initialPartners)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialHub)

  const handleRealtime = useCallback(() => {
    router.refresh()
  }, [router])

  useTrackerRealtime(handleRealtime)

  // Summary stats
  const totalMW = useMemo(
    () => sites.reduce((sum, s) => sum + (s.mw_current ?? 0), 0),
    [sites]
  )

  const categoryCounts = useMemo(() => {
    const counts: Record<SiteStatusCategory, number> = {
      not_developing: 0,
      screened_only: 0,
      early_development: 0,
      active_development: 0,
      construction_ready: 0,
    }
    for (const site of sites) {
      counts[categorizeSite(site)]++
    }
    return counts
  }, [sites])

  async function handleSave() {
    const supabase = createClient()
    const { id, created_at: _ca, updated_at: _ua, ...updateFields } = draft
    void _ca
    void _ua

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('tracker_regional_hubs')
        .update(updateFields)
        .eq('id', id)

      if (error) throw error
      setHub(draft)
      setEditing(false)
      showToast('Hub updated', 'success')
    } catch {
      showToast('Failed to save', 'error')
    }
  }

  function handleCancel() {
    setDraft(hub)
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/tracker/hubs"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Hubs
      </Link>

      {/* Header Card */}
      <div className="bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                type="text"
                value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                className="text-2xl font-bold bg-transparent text-zinc-900 dark:text-zinc-100 border-b border-nodiac-secondary focus:outline-none pb-1 w-full"
              />
            ) : (
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {hub.name}
              </h2>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-3">
              {editing ? (
                <select
                  value={draft.status ?? ''}
                  onChange={e => setDraft(d => ({ ...d, status: e.target.value || null }))}
                  className="w-48 px-2.5 py-1 rounded-md text-[12px] font-medium bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-200 dark:border-[#2a2a40] text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-nodiac-secondary"
                >
                  <option value="">Select status...</option>
                  {HUB_STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : hub.status ? (
                <span className={cn('inline-flex px-2.5 py-1 rounded-md text-[12px] font-medium', STATUS_COLORS[hub.status])}>
                  {hub.status}
                </span>
              ) : null}

              {editing ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Target:</span>
                  <input
                    type="number"
                    value={draft.target_mw ?? ''}
                    onChange={e => setDraft(d => ({ ...d, target_mw: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="MW"
                    className="w-24 px-2 py-1 rounded text-[13px] bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-200 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-nodiac-secondary"
                  />
                </div>
              ) : hub.target_mw != null ? (
                <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
                  Target: <span className="font-medium text-zinc-700 dark:text-zinc-300 tabular-nums">{hub.target_mw} MW</span>
                </span>
              ) : null}
            </div>

            {editing ? (
              <textarea
                value={typeof draft.notes === 'object' && draft.notes !== null ? JSON.stringify(draft.notes, null, 2) : (draft.notes ?? '')}
                onChange={e => setDraft(d => ({ ...d, notes: e.target.value || null }))}
                placeholder="Hub notes..."
                rows={2}
                className="mt-3 w-full px-3 py-2 rounded-md text-[13px] bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-200 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-nodiac-secondary resize-none"
              />
            ) : hub.notes ? (
              <p className="mt-3 text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {typeof hub.notes === 'object' ? JSON.stringify(hub.notes) : hub.notes}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!draft.name.trim()}
                  className="p-2 rounded-lg bg-nodiac-secondary text-nodiac-primary-dark hover:bg-nodiac-secondary/80 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#1a1a30] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#1a1a30] transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-zinc-100 dark:border-[#2a2a40]">
          <StatCard icon={<MapPin className="w-4 h-4" />} label="Total Sites" value={sites.length} />
          <StatCard icon={<Zap className="w-4 h-4" />} label="Total MW" value={`${totalMW.toFixed(0)} MW`} />
          <StatCard icon={<Users className="w-4 h-4" />} label="Partners" value={partners.length} />
          <StatCard
            icon={<Building2 className="w-4 h-4" />}
            label="Active"
            value={categoryCounts.active_development + categoryCounts.construction_ready}
          />
        </div>
      </div>

      {/* Map */}
      <SiteStatusMap sites={sites} className="h-[50vh] min-h-[400px]" />

      {/* Partners section */}
      {partners.length > 0 && (
        <div className="bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-[#2a2a40]">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Linked Partners ({partners.length})
            </h3>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-[#1e1e36]">
            {partners.map(partner => (
              <Link
                key={partner.id}
                href={`/tracker/partners/${partner.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 dark:hover:bg-[#1a1a30] transition-colors"
              >
                <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{partner.name}</span>
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
        </div>
      )}

      {/* Sites Table */}
      <div className="bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 dark:border-[#2a2a40]">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Sites ({sites.length})
          </h3>
        </div>
        {sites.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-[#1a1a2e]">
                <tr>
                  <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Site</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Status</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-right">MW</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Priority</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Owner</th>
                </tr>
              </thead>
              <tbody>
                {sites.map(site => {
                  const category = categorizeSite(site)
                  const config = STATUS_CATEGORY_CONFIG[category]
                  return (
                    <tr
                      key={site.id}
                      onClick={() => router.push(`/tracker/${site.id}`)}
                      className="border-t border-zinc-100 dark:border-[#1e1e36] hover:bg-zinc-50 dark:hover:bg-[#1a1a30] cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: config.color }}
                          />
                          <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{site.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[12px] text-zinc-500 dark:text-zinc-400">{config.label}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-[13px] tabular-nums text-zinc-600 dark:text-zinc-400">
                        {site.mw_current != null ? site.mw_current : '--'}
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-medium',
                          site.priority === 'Lead' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          site.priority === 'Active' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' :
                          site.priority === 'Pipeline' ? 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' :
                          'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                        )}>
                          {site.priority}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[12px] text-zinc-500 dark:text-zinc-400">
                        {site.asset_owner_name ?? '--'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-[13px] text-zinc-400 dark:text-zinc-600">
            No sites linked to this hub
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-nodiac-secondary/10 text-nodiac-secondary">
        {icon}
      </div>
      <div>
        <p className="text-[20px] font-bold text-zinc-900 dark:text-zinc-100 tabular-nums leading-none">{value}</p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}
