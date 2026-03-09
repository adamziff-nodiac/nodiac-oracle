'use client'

import { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TrackerPartner, TrackerSiteOverview } from '@/lib/tracker/types'
import { PARTNER_TYPE_OPTIONS, RELATIONSHIP_STAGE_OPTIONS, PRIORITY_COLORS, type Priority } from '@/lib/tracker/constants'
import { useTrackerRealtime } from '@/lib/tracker/realtime'
import { categorizeSite, STATUS_CATEGORY_CONFIG, type SiteStatusCategory } from './SiteStatusMap'
import { ToastContainer, showToast } from './Toast'
import { cn } from '@/lib/utils'
import { AttioSummaryCard } from './AttioSummaryCard'
import { ArrowLeft, MapPin, Zap, Building2, Search, Pencil, X, Check, ExternalLink } from 'lucide-react'

const SiteStatusMap = dynamic(
  () => import('./SiteStatusMap').then(mod => ({ default: mod.SiteStatusMap })),
  { ssr: false, loading: () => <div className="w-full h-[50vh] bg-zinc-100 dark:bg-[#1a1a2e] rounded-lg animate-pulse" /> }
)

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

interface PartnerDetailPageProps {
  partner: TrackerPartner
  hubNames: string[]
  initialSites: TrackerSiteOverview[]
  screeningSiteCount: number
}

export function PartnerDetailPage({ partner: initialPartner, hubNames, initialSites, screeningSiteCount }: PartnerDetailPageProps) {
  const router = useRouter()
  const [partner, setPartner] = useState(initialPartner)
  const [sites] = useState(initialSites)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialPartner)

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

  const constructionReadyCount = categoryCounts.construction_ready

  async function handleSave() {
    const supabase = createClient()
    const { id, created_at: _ca, updated_at: _ua, notes: draftNotes, ...updateFields } = draft
    void _ca
    void _ua

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('tracker_power_partners')
        .update({ ...updateFields, notes: draftNotes })
        .eq('id', id)

      if (error) throw error
      setPartner(draft)
      setEditing(false)
      showToast('Partner updated', 'success')
    } catch {
      showToast('Failed to save', 'error')
    }
  }

  function handleCancel() {
    setDraft(partner)
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/tracker/partners"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Partners
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
                {partner.name}
              </h2>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-3">
              {editing ? (
                <>
                  <select
                    value={draft.type ?? ''}
                    onChange={e => setDraft(d => ({ ...d, type: e.target.value || null }))}
                    className="w-44 px-2.5 py-1 rounded-md text-[12px] font-medium bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-200 dark:border-[#2a2a40] text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-nodiac-secondary"
                  >
                    <option value="">Select type...</option>
                    {PARTNER_TYPE_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select
                    value={draft.relationship_stage ?? ''}
                    onChange={e => setDraft(d => ({ ...d, relationship_stage: e.target.value || null }))}
                    className="w-48 px-2.5 py-1 rounded-md text-[12px] font-medium bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-200 dark:border-[#2a2a40] text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-nodiac-secondary"
                  >
                    <option value="">Select stage...</option>
                    {RELATIONSHIP_STAGE_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  {partner.type && (
                    <span className={cn('inline-flex px-2.5 py-1 rounded-md text-[12px] font-medium', TYPE_COLORS[partner.type])}>
                      {partner.type}
                    </span>
                  )}
                  {partner.relationship_stage && (
                    <span className={cn('inline-flex px-2.5 py-1 rounded-md text-[12px] font-medium', STAGE_COLORS[partner.relationship_stage])}>
                      {partner.relationship_stage}
                    </span>
                  )}
                </>
              )}

              {partner.loi_signed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  LOI Signed
                </span>
              )}

              {hubNames.length > 0 && (
                <span className="text-[12px] text-zinc-500 dark:text-zinc-400">
                  Hub{hubNames.length > 1 ? 's' : ''}: <span className="font-medium text-zinc-700 dark:text-zinc-300">{hubNames.join(', ')}</span>
                </span>
              )}
            </div>

            {/* Editable detail fields */}
            {editing && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <DetailField
                  label="Available Capacity"
                  value={draft.available_capacity}
                  onChange={v => setDraft(d => ({ ...d, available_capacity: v }))}
                  placeholder="e.g., 50 MW"
                />
                <DetailField
                  label="Rate Structure"
                  value={draft.rate_structure}
                  onChange={v => setDraft(d => ({ ...d, rate_structure: v }))}
                  placeholder="Known rate info..."
                />
                <DetailField
                  label="IX Process Notes"
                  value={draft.ix_process_notes}
                  onChange={v => setDraft(d => ({ ...d, ix_process_notes: v }))}
                  placeholder="How this partner handles IX..."
                />
                {draft.attio_record_id && (
                  <div className="text-[12px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                    Attio linked <Check className="w-3 h-3 text-emerald-500" />
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer col-span-full mt-1">
                  <input
                    type="checkbox"
                    checked={draft.loi_signed ?? false}
                    onChange={e => setDraft(d => ({ ...d, loi_signed: e.target.checked }))}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-nodiac-secondary focus:ring-nodiac-secondary"
                  />
                  <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">LOI Signed</span>
                </label>
              </div>
            )}

            {/* Non-editing details */}
            {!editing && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
                {partner.available_capacity && (
                  <MetaItem label="Capacity" value={partner.available_capacity} />
                )}
                {partner.rate_structure && (
                  <MetaItem label="Rate" value={partner.rate_structure} />
                )}
                {partner.ix_process_notes && (
                  <MetaItem label="IX Process" value={partner.ix_process_notes} />
                )}
                {partner.attio_record_id && (
                  <a
                    href={`https://app.attio.com/companies/${partner.attio_record_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium bg-nodiac-secondary/15 text-nodiac-secondary hover:bg-nodiac-secondary/25 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open in Attio
                  </a>
                )}
              </div>
            )}
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

        {/* Summary Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-zinc-100 dark:border-[#2a2a40]">
          <StatCard icon={<Search className="w-4 h-4" />} label="Sites Screened" value={screeningSiteCount > 0 ? screeningSiteCount : sites.length} />
          <StatCard icon={<MapPin className="w-4 h-4" />} label="In Development" value={sites.length} />
          <StatCard icon={<Building2 className="w-4 h-4" />} label="Construction Ready" value={constructionReadyCount} />
          <StatCard icon={<Zap className="w-4 h-4" />} label="Total MW" value={`${totalMW.toFixed(0)} MW`} />
        </div>
      </div>

      {/* Attio CRM Summary */}
      <AttioSummaryCard
        partnerId={partner.id}
        attioRecordId={partner.attio_record_id}
        relationshipStage={partner.relationship_stage}
      />

      {/* Map */}
      <SiteStatusMap sites={sites} className="h-[50vh] min-h-[400px]" />

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
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Hub</th>
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
                          PRIORITY_COLORS[site.priority as Priority]?.badge ?? 'bg-zinc-500/20 text-zinc-400'
                        )}>
                          {site.priority}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[12px] text-zinc-500 dark:text-zinc-400">
                        {site.hub_name ?? '--'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-[13px] text-zinc-400 dark:text-zinc-600">
            No sites linked to this partner
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

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-[12px]">
      <span className="text-zinc-400 dark:text-zinc-500">{label}:</span>{' '}
      <span className="text-zinc-600 dark:text-zinc-400">{value}</span>
    </div>
  )
}

function DetailField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </label>
      <input
        type="text"
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 rounded-md text-[13px] bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-200 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-nodiac-secondary transition-colors"
      />
    </div>
  )
}
