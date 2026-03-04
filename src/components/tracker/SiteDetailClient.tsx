'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TrackerSiteOverview, TrackerActivity, SiteNotes } from '@/lib/tracker/types'
import { PHASES, getCheckpointsByPhase } from '@/lib/tracker/constants'
import { useTrackerRealtime } from '@/lib/tracker/realtime'
import { SiteHeader } from './SiteHeader'
import { ArchiveBanner } from './ArchiveBanner'
import { OperationalContext } from './OperationalContext'
import { PhaseCheckpointGroup } from './PhaseCheckpointGroup'
import { SpeedMetric } from './SpeedMetric'
import { ActivityLog } from './ActivityLog'
import { ToastContainer, showToast } from './Toast'

interface SiteDetailClientProps {
  initialSite: TrackerSiteOverview
  initialActivity: TrackerActivity[]
}

export function SiteDetailClient({ initialSite, initialActivity }: SiteDetailClientProps) {
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

  const notes = (site.site_notes as SiteNotes | null) ?? null
  const siteQualCompleted = site['site_qualified_completed'] as string | null

  // Determine if speed metrics are still running
  const isIxRunning = site.days_to_ix === null && siteQualCompleted != null
  const isReadyRunning = site.days_to_construction_ready === null && siteQualCompleted != null && !site.construction_ready
  const isCodRunning = site.days_to_cod === null && siteQualCompleted != null

  return (
    <div className="flex flex-col gap-6">
      <SiteHeader site={site} />

      {site.is_archived && site.archived_at && (
        <ArchiveBanner
          archivedAt={site.archived_at}
          archivedReason={site.archived_reason}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <OperationalContext notes={notes} />

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
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Hub</dt>
                <dd className="text-zinc-900 dark:text-zinc-100 font-medium">{site.hub_name ?? '--'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Utility</dt>
                <dd className="text-zinc-900 dark:text-zinc-100 font-medium">{site.utility_name ?? '--'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Asset Owner</dt>
                <dd className="text-zinc-900 dark:text-zinc-100 font-medium">{site.asset_owner_name ?? '--'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">MW Current</dt>
                <dd className="text-zinc-900 dark:text-zinc-100 font-medium tabular-nums">{site.mw_current ?? '--'}</dd>
              </div>
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

          {/* Activity Log */}
          <div className="p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-3">
              Activity
            </div>
            <ActivityLog entries={activity} />
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}
