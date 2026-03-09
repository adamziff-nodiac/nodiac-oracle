'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TrackerSiteOverview, TrackerActivity, TrackerPartner, TrackerHub, SiteNotes } from '@/lib/tracker/types'
import { PHASES, getCheckpointsByPhase } from '@/lib/tracker/constants'
import { useTrackerRealtime } from '@/lib/tracker/realtime'
import { SiteHeader } from './SiteHeader'
import { ArchiveBanner } from './ArchiveBanner'
import { OperationalContext } from './OperationalContext'
import { SiteActionItems } from './SiteActionItems'
import { PhaseCheckpointGroup } from './PhaseCheckpointGroup'
import { SpeedMetric } from './SpeedMetric'
import { ActivityLog } from './ActivityLog'
import { ToastContainer, showToast } from './Toast'
import { LandownersSection } from './LandownersSection'
import { ParcelsSection } from './ParcelsSection'
import { StyledSelect } from '@/components/ui/StyledSelect'

interface SiteDetailClientProps {
  initialSite: TrackerSiteOverview
  initialActivity: TrackerActivity[]
  partners: TrackerPartner[]
  hubs: TrackerHub[]
  backHref?: string
}

export function SiteDetailClient({ initialSite, initialActivity, partners, hubs, backHref = '/tracker' }: SiteDetailClientProps) {
  const router = useRouter()
  const [site, setSite] = useState(initialSite)
  const [activity] = useState(initialActivity)

  const handleRealtime = useCallback(() => {
    router.refresh()
  }, [router])

  useTrackerRealtime(handleRealtime)

  async function handleUpdate(prefix: string, field: string, value: unknown) {
    const columnName = `${prefix}_${field}`
    const prev = { ...site }

    // Optimistic update
    setSite(s => ({ ...s, [columnName]: value } as TrackerSiteOverview))

    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('tracker_sites')
        .update({ [columnName]: value })
        .eq('id', site.id)

      if (error) throw error
      showToast('Saved', 'success')
    } catch {
      // Revert
      setSite(prev)
      showToast('Failed to save', 'error')
    }
  }

  async function handleNotesUpdate(updatedNotes: SiteNotes) {
    const prev = { ...site }
    setSite(s => ({ ...s, site_notes: updatedNotes } as TrackerSiteOverview))

    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('tracker_sites')
        .update({ site_notes: updatedNotes })
        .eq('id', site.id)

      if (error) throw error
      showToast('Saved', 'success')
    } catch {
      setSite(prev)
      showToast('Failed to save', 'error')
    }
  }

  async function handleSiteFieldUpdate(column: string, value: unknown, displayOverrides?: Record<string, unknown>) {
    const prev = { ...site }

    setSite(s => ({ ...s, [column]: value, ...displayOverrides } as TrackerSiteOverview))

    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('tracker_sites')
        .update({ [column]: value })
        .eq('id', site.id)

      if (error) throw error
      showToast('Saved', 'success')
    } catch {
      setSite(prev)
      showToast('Failed to save', 'error')
    }
  }

  const notes = (site.site_notes as SiteNotes | null) ?? null
  const siteQualCompleted = site['site_qualified_completed'] as string | null

  // Determine if speed metrics are still running
  const isIxRunning = site.days_to_ix === null && siteQualCompleted != null
  const isReadyRunning = site.days_to_construction_ready === null && siteQualCompleted != null && !site.construction_ready
  const isCodRunning = site.days_to_cod === null && siteQualCompleted != null

  // Separate partner lists for utility vs asset owner dropdowns
  const utilities = partners.filter(p => p.type !== 'IPP')
  const assetOwners = partners

  return (
    <div className="flex flex-col gap-6">
      <SiteHeader
        site={site}
        backHref={backHref}
        onPriorityChange={(p) => handleSiteFieldUpdate('priority', p)}
      />

      {site.is_archived && site.archived_at && (
        <ArchiveBanner
          archivedAt={site.archived_at}
          archivedReason={site.archived_reason}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <OperationalContext notes={notes} onUpdate={handleNotesUpdate} />

          <SiteActionItems siteId={site.id} site={site} />

          {PHASES.map(phase => (
            <PhaseCheckpointGroup
              key={phase.key}
              phase={phase}
              checkpoints={getCheckpointsByPhase(phase.key)}
              site={site}
              onUpdate={handleUpdate}
            />
          ))}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Speed Metrics */}
          <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-3">
              Speed Metrics
            </div>
            <div className="flex sm:flex-row lg:flex-col gap-2">
              <SpeedMetric label="Days to IX" value={site.days_to_ix} isRunning={isIxRunning} />
              <SpeedMetric label="Days to Ready" value={site.days_to_construction_ready} isRunning={isReadyRunning} />
              <SpeedMetric label="Days to COD" value={site.days_to_cod} isRunning={isCodRunning} />
            </div>
          </div>

          {/* Site Attributes */}
          <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-3">
              Site Details
            </div>
            <dl className="space-y-2 text-[13px]">
              <EditableSelect
                label="Hub"
                value={site.hub_id}
                displayValue={site.hub_name}
                options={hubs.map(h => ({ id: h.id, name: h.name }))}
                onSave={(id) => {
                  const hub = hubs.find(h => h.id === id)
                  handleSiteFieldUpdate('regional_hub_id', id, { hub_name: hub?.name ?? null })
                }}
              />
              <EditableSelect
                label="Utility"
                value={site.utility_id}
                displayValue={site.utility_name}
                options={utilities.map(p => ({ id: p.id, name: p.name }))}
                onSave={(id) => {
                  const p = partners.find(x => x.id === id)
                  handleSiteFieldUpdate('utility_id', id, { utility_name: p?.name ?? null })
                }}
              />
              <EditableSelect
                label="Asset Owner"
                value={site.asset_owner_id}
                displayValue={site.asset_owner_name}
                options={assetOwners.map(p => ({ id: p.id, name: p.name }))}
                onSave={(id) => {
                  const p = partners.find(x => x.id === id)
                  handleSiteFieldUpdate('asset_owner_id', id, { asset_owner_name: p?.name ?? null })
                }}
              />
              <EditableText
                label="Address"
                value={site['address'] as string | null}
                onSave={(v) => handleSiteFieldUpdate('address', v)}
              />
              <EditableText
                label="Coordinates"
                value={site['coordinates'] as string | null}
                onSave={(v) => handleSiteFieldUpdate('coordinates', v)}
                actions={
                  site['coordinates'] ? (
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(site['coordinates'] as string)
                          showToast('Copied', 'success')
                        }}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#1a1a30] transition-colors cursor-pointer"
                        title="Copy coordinates"
                      >
                        Copy
                      </button>
                      <a
                        href={`https://www.google.com/maps?q=${encodeURIComponent(site['coordinates'] as string)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium text-nodiac-secondary hover:text-nodiac-secondary/80 hover:bg-zinc-100 dark:hover:bg-[#1a1a30] transition-colors"
                        title="Open in Google Maps"
                      >
                        Maps
                      </a>
                    </div>
                  ) : undefined
                }
              />
              <EditableNumber
                label="MW Current"
                value={site.mw_current}
                onSave={(v) => handleSiteFieldUpdate('mw_current', v)}
              />
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Total Capex</dt>
                <dd className="text-zinc-900 dark:text-zinc-100 font-medium tabular-nums">
                  {site.total_capex ? `$${site.total_capex.toLocaleString()}` : '--'}
                </dd>
              </div>
              {site.capex_per_mw && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500 dark:text-zinc-400">Capex/MW</dt>
                  <dd className="text-zinc-900 dark:text-zinc-100 font-medium tabular-nums">
                    ${site.capex_per_mw.toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Landowners */}
          <LandownersSection siteId={site.id} />

          {/* Parcels */}
          <ParcelsSection siteId={site.id} />

          {/* Activity Log */}
          <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-3">
              Activity
            </div>
            <ActivityLog entries={activity} />
          </div>

          {/* Danger Zone */}
          <SiteDangerZone
            siteId={site.id}
            siteName={site.name}
            isArchived={site.is_archived}
          />
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}

function SiteDangerZone({
  siteId,
  siteName,
  isArchived,
}: {
  siteId: string
  siteName: string
  isArchived: boolean
}) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleArchiveToggle() {
    const supabase = createClient()
    const update = isArchived
      ? { archived_at: null, archived_reason: null }
      : { archived_at: new Date().toISOString().split('T')[0], archived_reason: 'Archived from site detail' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tracker_sites')
      .update(update)
      .eq('id', siteId)

    if (error) {
      showToast('Failed to update', 'error')
      return
    }
    showToast(isArchived ? 'Site unarchived' : 'Site archived', 'success')
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tracker_sites')
      .delete()
      .eq('id', siteId)

    if (error) {
      showToast('Failed to delete', 'error')
      setDeleting(false)
      return
    }

    showToast('Site deleted', 'success')
    router.push('/tracker')
  }

  return (
    <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-3">
        Actions
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleArchiveToggle}
          className="w-full px-3 py-2 rounded-md text-[13px] font-medium text-left text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a30] transition-colors cursor-pointer"
        >
          {isArchived ? 'Unarchive site' : 'Archive site'}
        </button>

        {confirmDelete ? (
          <div className="p-3 rounded-md border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
            <p className="text-[12px] text-red-600 dark:text-red-400 mb-2">
              Permanently delete <strong>{siteName}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className={cn(
                  'px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer',
                  deleting
                    ? 'bg-red-300 text-white cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                )}
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full px-3 py-2 rounded-md text-[13px] font-medium text-left text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
          >
            Delete site
          </button>
        )}
      </div>
    </div>
  )
}

function EditableSelect({
  label,
  value,
  displayValue,
  options,
  onSave,
}: {
  label: string
  value: string | null
  displayValue: string | null
  options: Array<{ id: string; name: string }>
  onSave: (id: string | null) => void
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="flex justify-between items-center">
        <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
        <dd>
          <StyledSelect
            value={value ?? ''}
            onChange={(val) => {
              onSave(val || null)
              setEditing(false)
            }}
            options={[
              { value: '', label: '--' },
              ...options.map(o => ({ value: o.id, label: o.name })),
            ]}
            size="sm"
            align="right"
            className="max-w-[180px]"
          />
        </dd>
      </div>
    )
  }

  return (
    <div className="flex justify-between items-center">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-100 dark:hover:bg-[#1a1a30] px-2 py-0.5 rounded transition-colors cursor-pointer"
        >
          {displayValue ?? '--'}
        </button>
      </dd>
    </div>
  )
}

function EditableText({
  label,
  value,
  onSave,
  actions,
}: {
  label: string
  value: string | null
  onSave: (v: string | null) => void
  actions?: React.ReactNode
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')

  function handleSave() {
    onSave(draft.trim() || null)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex justify-between items-center">
        <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
        <dd>
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            autoFocus
            className="w-40 px-2 py-1 rounded text-[13px] font-medium bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-300 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-nodiac-secondary"
          />
        </dd>
      </div>
    )
  }

  return (
    <div className="flex justify-between items-center">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => { setDraft(value ?? ''); setEditing(true) }}
          className="text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-100 dark:hover:bg-[#1a1a30] px-2 py-0.5 rounded transition-colors cursor-pointer truncate max-w-[140px]"
          title={value ?? undefined}
        >
          {value ?? '--'}
        </button>
        {actions}
      </dd>
    </div>
  )
}

function EditableNumber({
  label,
  value,
  onSave,
}: {
  label: string
  value: number | null
  onSave: (v: number | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value?.toString() ?? '')

  function handleSave() {
    const parsed = draft.trim() === '' ? null : parseFloat(draft)
    if (parsed !== null && isNaN(parsed)) return
    onSave(parsed)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex justify-between items-center">
        <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
        <dd>
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            autoFocus
            className="w-20 px-2 py-1 rounded text-[13px] font-medium tabular-nums text-right bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-300 dark:border-[#2a2a40] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-nodiac-secondary"
          />
        </dd>
      </div>
    )
  }

  return (
    <div className="flex justify-between items-center">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd>
        <button
          type="button"
          onClick={() => { setDraft(value?.toString() ?? ''); setEditing(true) }}
          className="text-zinc-900 dark:text-zinc-100 font-medium tabular-nums hover:bg-zinc-100 dark:hover:bg-[#1a1a30] px-2 py-0.5 rounded transition-colors cursor-pointer"
        >
          {value ?? '--'}
        </button>
      </dd>
    </div>
  )
}
