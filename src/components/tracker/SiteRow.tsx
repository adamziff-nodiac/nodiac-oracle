'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { PHASES, getCurrentSubStep, phaseHasWaiting, type PhaseKey } from '@/lib/tracker/constants'
import type { TrackerSiteOverview } from '@/lib/tracker/types'
import { SubStepBadge } from './SubStepBadge'
import { PriorityIndicator } from './PriorityIndicator'
import { Check } from 'lucide-react'

interface SiteRowProps {
  site: TrackerSiteOverview
  onClick: () => void
}

export const SiteRow = memo(function SiteRow({ site, onClick }: SiteRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-colors duration-100 hover:bg-zinc-50 dark:hover:bg-[#1a1a30] border-b border-zinc-100 dark:border-[#22223a] group',
        site.is_archived && 'opacity-50',
        !site.has_activity && !site.is_archived && 'opacity-50'
      )}
    >
      <td className="px-3 py-2 whitespace-nowrap sticky left-0 z-[5] bg-white dark:bg-[#16162a] group-hover:bg-zinc-50 dark:group-hover:bg-[#1a1a30] transition-colors duration-100">
        <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 truncate block max-w-[180px]">
          {site.name}
        </span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{site.hub_name ?? '--'}</span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-right">
        <span className="text-[13px] font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
          {site.mw_current ?? '--'}
        </span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <PriorityIndicator priority={site.priority ?? 'Pipeline'} />
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <span className="text-[13px] text-zinc-500 dark:text-zinc-400 truncate block max-w-[120px]">
          {site.asset_owner_name ?? '--'}
        </span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <span className="text-[13px] text-zinc-500 dark:text-zinc-400 truncate block max-w-[120px]">
          {site.utility_name ?? '--'}
        </span>
      </td>
      {PHASES.map(phase => {
        const siteRecord = site as Record<string, unknown>
        const subStep = getCurrentSubStep(phase.key as PhaseKey, siteRecord)
        const hasWaiting = phaseHasWaiting(phase.key as PhaseKey, siteRecord)
        return (
          <td key={phase.key} className="px-1 py-2 whitespace-nowrap text-center">
            <SubStepBadge
              phase={phase.key as PhaseKey}
              subStep={subStep}
              site={siteRecord}
              hasWaiting={hasWaiting}
            />
          </td>
        )
      })}
      <td className="px-3 py-2 whitespace-nowrap text-center">
        {site.construction_ready && (
          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
        )}
      </td>
      <td className="px-3 py-2 whitespace-nowrap hidden lg:table-cell">
        <span className="text-[13px] text-zinc-600 dark:text-zinc-400 truncate block max-w-[200px]">
          {site.next_step ?? '--'}
        </span>
      </td>
    </tr>
  )
})
