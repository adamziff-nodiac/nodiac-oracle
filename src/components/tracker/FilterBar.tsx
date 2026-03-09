'use client'

import { cn } from '@/lib/utils'
import { PRIORITY_OPTIONS, PHASES, STATUS_OPTIONS } from '@/lib/tracker/constants'
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
  selectedPhaseFilters?: Map<string, string[]>
  showArchived: boolean
  showAllSites?: boolean
  activeSiteCount?: number
  allSiteCount?: number
  onPriorityChange: (p: string | null) => void
  onHubsChange: (h: string[]) => void
  onUtilitiesChange: (u: string[]) => void
  onPartnersChange: (p: string[]) => void
  onPhaseFilterChange?: (phaseKey: string, statuses: string[]) => void
  onArchiveToggle: () => void
  onShowAllSitesToggle?: () => void
  siteCount: number
  totalMw: number
  onAddSite?: () => void
}

const PHASE_STATUS_FILTER_OPTIONS = STATUS_OPTIONS.filter(s => s !== 'N/A') as unknown as string[]

export function FilterBar({
  hubs,
  utilities,
  partners,
  selectedPriority,
  selectedHubs,
  selectedUtilities,
  selectedPartners,
  selectedPhaseFilters,
  showArchived,
  showAllSites,
  activeSiteCount,
  allSiteCount,
  onPriorityChange,
  onHubsChange,
  onUtilitiesChange,
  onPartnersChange,
  onPhaseFilterChange,
  onArchiveToggle,
  onShowAllSitesToggle,
  siteCount,
  totalMw,
  onAddSite,
}: FilterBarProps) {
  return (
    <div className="w-full px-3 py-2.5 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg space-y-2">
      {/* Row 1: Priority buttons (scroll on mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500 flex-shrink-0 mr-0.5">
          Priority:
        </span>
        <button
          type="button"
          onClick={() => onPriorityChange(null)}
          className={cn(
            'px-2 py-1 rounded-md text-[12px] font-medium transition-colors duration-100 cursor-pointer flex-shrink-0',
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
              'px-2 py-1 rounded-md text-[12px] font-medium transition-colors duration-100 cursor-pointer flex-shrink-0',
              selectedPriority === p
                ? 'bg-nodiac-primary text-white'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a30]'
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Row 2: Entity dropdowns + phase status filters */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none min-w-0">
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

          {onPhaseFilterChange && (
            <>
              <div className="hidden sm:block w-px h-4 bg-zinc-200 dark:bg-[#2a2a40] mx-0.5 flex-shrink-0" />
              {PHASES.map(p => (
                <FilterDropdown
                  key={p.key}
                  label={p.abbrev}
                  options={PHASE_STATUS_FILTER_OPTIONS}
                  selected={selectedPhaseFilters?.get(p.key) ?? []}
                  onChange={(statuses) => onPhaseFilterChange(p.key, statuses)}
                />
              ))}
            </>
          )}

          <div className="hidden sm:block w-px h-4 bg-zinc-200 dark:bg-[#2a2a40] mx-0.5 flex-shrink-0" />

          <label className="flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={onArchiveToggle}
              className="w-3.5 h-3.5 rounded border border-zinc-300 dark:border-zinc-600"
            />
            <span className="hidden sm:inline">Archived</span>
            <span className="sm:hidden">Arc.</span>
          </label>

          {onShowAllSitesToggle && (
            <>
              <div className="hidden sm:block w-px h-4 bg-zinc-200 dark:bg-[#2a2a40] mx-0.5 flex-shrink-0" />
              <div className="flex items-center rounded-md border border-zinc-200 dark:border-[#2a2a40] overflow-hidden flex-shrink-0">
                <button
                  type="button"
                  onClick={showAllSites ? onShowAllSitesToggle : undefined}
                  className={cn(
                    'px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                    !showAllSites
                      ? 'bg-nodiac-primary text-white'
                      : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a30]'
                  )}
                >
                  Active{activeSiteCount != null ? ` (${activeSiteCount})` : ''}
                </button>
                <button
                  type="button"
                  onClick={!showAllSites ? onShowAllSitesToggle : undefined}
                  className={cn(
                    'px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                    showAllSites
                      ? 'bg-nodiac-primary text-white'
                      : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a30]'
                  )}
                >
                  All{allSiteCount != null ? ` (${allSiteCount})` : ''}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">
          <span className="hidden sm:inline">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{siteCount}</span> sites
          </span>
          <span className="hidden sm:inline">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalMw.toFixed(1)}</span> MW
          </span>
          <span className="sm:hidden text-[11px]">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{siteCount}</span>/{totalMw.toFixed(0)}MW
          </span>
          {onAddSite && (
            <button
              type="button"
              onClick={onAddSite}
              className="px-2.5 py-1 rounded-md text-[12px] font-medium bg-nodiac-secondary text-nodiac-primary-dark hover:bg-nodiac-secondary/80 transition-colors cursor-pointer flex-shrink-0"
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
