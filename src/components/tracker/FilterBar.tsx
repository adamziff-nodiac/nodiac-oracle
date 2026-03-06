'use client'

import { cn } from '@/lib/utils'
import { PRIORITY_OPTIONS } from '@/lib/tracker/constants'
import { FilterDropdown } from './FilterDropdown'

interface FilterBarProps {
  priorities: readonly string[]
  hubs: string[]
  utilities: string[]
  partners: string[]
  selectedPriority: string | null
  selectedHubs: string[]
  selectedUtilities: string[]
  selectedPartners: string[]
  showArchived: boolean
  onPriorityChange: (p: string | null) => void
  onHubsChange: (h: string[]) => void
  onUtilitiesChange: (u: string[]) => void
  onPartnersChange: (p: string[]) => void
  onArchiveToggle: () => void
  siteCount: number
  totalMw: number
  onAddSite?: () => void
}

export function FilterBar({
  hubs,
  utilities,
  partners,
  selectedPriority,
  selectedHubs,
  selectedUtilities,
  selectedPartners,
  showArchived,
  onPriorityChange,
  onHubsChange,
  onUtilitiesChange,
  onPartnersChange,
  onArchiveToggle,
  siteCount,
  totalMw,
  onAddSite,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 px-4 py-2.5 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mr-1">
          Priority:
        </span>
        <button
          type="button"
          onClick={() => onPriorityChange(null)}
          className={cn(
            'px-2.5 py-2 sm:py-1 rounded-md text-[12px] font-medium transition-colors duration-100 cursor-pointer',
            selectedPriority === null
              ? 'bg-nodiac-primary text-white'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a30]'
          )}
        >
          All
        </button>
        {PRIORITY_OPTIONS.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onPriorityChange(selectedPriority === p ? null : p)}
            className={cn(
              'px-2.5 py-2 sm:py-1 rounded-md text-[12px] font-medium transition-colors duration-100 cursor-pointer',
              selectedPriority === p
                ? 'bg-nodiac-primary text-white'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a30]'
            )}
          >
            {p}
          </button>
        ))}

        <div className="w-px h-4 bg-zinc-200 dark:bg-[#2a2a40] mx-1" />

        <FilterDropdown
          label="Hub"
          options={hubs}
          selected={selectedHubs}
          onChange={onHubsChange}
        />
        <FilterDropdown
          label="Utility"
          options={utilities}
          selected={selectedUtilities}
          onChange={onUtilitiesChange}
        />
        <FilterDropdown
          label="Partner"
          options={partners}
          selected={selectedPartners}
          onChange={onPartnersChange}
        />

        <div className="w-px h-4 bg-zinc-200 dark:bg-[#2a2a40] mx-1" />

        <label className="flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={onArchiveToggle}
            className="w-3.5 h-3.5 rounded border border-zinc-300 dark:border-zinc-600"
          />
          Archived
        </label>
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{siteCount}</span> sites
        </span>
        <span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalMw.toFixed(1)}</span> MW
        </span>
        {onAddSite && (
          <button
            type="button"
            onClick={onAddSite}
            className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-nodiac-secondary text-nodiac-primary-dark hover:bg-nodiac-secondary/80 transition-colors cursor-pointer"
          >
            + Add Site
          </button>
        )}
      </div>
    </div>
  )
}
