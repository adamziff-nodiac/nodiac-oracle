'use client'

import { useState, useCallback, useMemo } from 'react'
import { SearchInput } from '@/components/ui/SearchInput'
// Sites come from server component props and update via router.refresh() on realtime changes
import { useRouter } from 'next/navigation'
import type { TrackerSiteOverview, TrackerHub } from '@/lib/tracker/types'
import { PHASES } from '@/lib/tracker/constants'
import { useTrackerRealtime } from '@/lib/tracker/realtime'
import { FilterBar } from './FilterBar'
import { SiteRow } from './SiteRow'
import { AddSiteModal } from './AddSiteModal'
import { ToastContainer } from './Toast'

type SortKey = 'name' | 'hub_name' | 'mw_current' | 'priority' | 'asset_owner_name' | 'utility_name' | 'construction_ready' | 'next_step'
type SortDir = 'asc' | 'desc'

const PRIORITY_ORDER: Record<string, number> = {
  'Lead': 0, 'Active': 1, 'Pipeline': 2, 'On Hold': 3, 'Deprioritized': 4,
}

interface TrackerGridClientProps {
  initialSites: TrackerSiteOverview[]
  hubs: TrackerHub[]
}

export function TrackerGridClient({ initialSites, hubs }: TrackerGridClientProps) {
  const router = useRouter()
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null)
  const [selectedHubs, setSelectedHubs] = useState<string[]>([])
  const [selectedUtilities, setSelectedUtilities] = useState<string[]>([])
  const [selectedPartners, setSelectedPartners] = useState<string[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showAddSite, setShowAddSite] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleRealtime = useCallback(() => {
    router.refresh()
  }, [router])

  useTrackerRealtime(handleRealtime)

  // Use initialSites directly -- server component re-passes on revalidation
  const sites = initialSites

  const hubNames = useMemo(() => hubs.map(h => h.name), [hubs])

  const utilityNames = useMemo(() => {
    const names = new Set<string>()
    sites.forEach(s => { if (s.utility_name) names.add(s.utility_name) })
    return [...names].sort()
  }, [sites])

  const partnerNames = useMemo(() => {
    const names = new Set<string>()
    sites.forEach(s => { if (s.asset_owner_name) names.add(s.asset_owner_name) })
    return [...names].sort()
  }, [sites])

  const filteredSites = useMemo(() => {
    let result = sites

    // Text search across key fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        (s.name ?? '').toLowerCase().includes(q) ||
        (s.hub_name ?? '').toLowerCase().includes(q) ||
        (s.asset_owner_name ?? '').toLowerCase().includes(q) ||
        (s.utility_name ?? '').toLowerCase().includes(q) ||
        (s.next_step ?? '').toLowerCase().includes(q)
      )
    }

    if (!showArchived) {
      result = result.filter(s => !s.is_archived)
    }
    if (selectedPriority) {
      result = result.filter(s => s.priority === selectedPriority)
    }
    if (selectedHubs.length > 0) {
      result = result.filter(s => s.hub_name && selectedHubs.includes(s.hub_name))
    }
    if (selectedUtilities.length > 0) {
      result = result.filter(s => s.utility_name && selectedUtilities.includes(s.utility_name))
    }
    if (selectedPartners.length > 0) {
      result = result.filter(s => s.asset_owner_name && selectedPartners.includes(s.asset_owner_name))
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = (a.name ?? '').localeCompare(b.name ?? '')
          break
        case 'hub_name':
          cmp = (a.hub_name ?? '').localeCompare(b.hub_name ?? '')
          break
        case 'mw_current':
          cmp = (a.mw_current ?? 0) - (b.mw_current ?? 0)
          break
        case 'priority':
          cmp = (PRIORITY_ORDER[a.priority ?? 'Pipeline'] ?? 9) - (PRIORITY_ORDER[b.priority ?? 'Pipeline'] ?? 9)
          if (cmp === 0) cmp = (a.name ?? '').localeCompare(b.name ?? '')
          break
        case 'construction_ready':
          cmp = (a.construction_ready ? 1 : 0) - (b.construction_ready ? 1 : 0)
          break
        case 'asset_owner_name':
          cmp = (a.asset_owner_name ?? '').localeCompare(b.asset_owner_name ?? '')
          break
        case 'utility_name':
          cmp = (a.utility_name ?? '').localeCompare(b.utility_name ?? '')
          break
        case 'next_step':
          cmp = (a.next_step ?? '').localeCompare(b.next_step ?? '')
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    // Archived at bottom
    if (showArchived) {
      const active = result.filter(s => !s.is_archived)
      const archived = result.filter(s => s.is_archived)
      result = [...active, ...archived]
    }

    return result
  }, [sites, searchQuery, selectedPriority, selectedHubs, selectedUtilities, selectedPartners, showArchived, sortKey, sortDir])

  const totalMw = useMemo(() =>
    filteredSites.reduce((sum, s) => sum + (s.mw_current ?? 0), 0),
    [filteredSites]
  )

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
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
      <FilterBar
        priorities={[]}
        hubs={hubNames}
        utilities={utilityNames}
        partners={partnerNames}
        selectedPriority={selectedPriority}
        selectedHubs={selectedHubs}
        selectedUtilities={selectedUtilities}
        selectedPartners={selectedPartners}
        showArchived={showArchived}
        onPriorityChange={setSelectedPriority}
        onHubsChange={setSelectedHubs}
        onUtilitiesChange={setSelectedUtilities}
        onPartnersChange={setSelectedPartners}
        onArchiveToggle={() => setShowArchived(!showArchived)}
        siteCount={filteredSites.length}
        totalMw={totalMw}
        onAddSite={() => setShowAddSite(true)}
      />

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search sites, hubs, partners, utilities..."
        className="max-w-xs"
      />

      <div className="overflow-x-auto border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-[#1a1a2e] sticky top-0 z-10">
            <tr>
              <SortHeader label="Site" sortId="name" className="sticky left-0 z-20 bg-zinc-50 dark:bg-[#1a1a2e]" />
              <SortHeader label="Hub" sortId="hub_name" />
              <SortHeader label="MW" sortId="mw_current" className="text-right" />
              <SortHeader label="Priority" sortId="priority" />
              <SortHeader label="Partner" sortId="asset_owner_name" />
              <SortHeader label="Utility" sortId="utility_name" />
              {PHASES.map(p => (
                <th
                  key={p.key}
                  className="px-1 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 whitespace-nowrap text-center"
                  title={p.label}
                >
                  {p.abbrev}
                </th>
              ))}
              <SortHeader label="Ready" sortId="construction_ready" className="text-center" />
              <SortHeader label="Next Step" sortId="next_step" className="hidden lg:table-cell" />
            </tr>
          </thead>
          <tbody>
            {filteredSites.map(site => (
              <SiteRow
                key={site.id}
                site={site}
                onClick={() => router.push(`/tracker/${site.id}`)}
              />
            ))}
            {filteredSites.length === 0 && (
              <tr>
                <td colSpan={15} className="px-4 py-8 text-center text-[13px] text-zinc-400 dark:text-zinc-600">
                  No sites match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddSite && (
        <AddSiteModal onClose={() => setShowAddSite(false)} />
      )}

      <ToastContainer />
    </div>
  )
}
