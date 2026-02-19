'use client'

import { TIER_1_COLOR, TIER_2_COLOR, TIER_3_COLOR, TIER_4_COLOR, TIER_OUTSIDE_COLOR } from './TierHubsLayer'

interface TierLegendProps {
  clusterCount?: number
}

const legendBox = 'absolute bottom-4 right-4 bg-white/80 dark:bg-nodiac-dark/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 z-10'

const tiers = [
  { color: TIER_1_COLOR, label: 'Tier 1 — Top 10%' },
  { color: TIER_2_COLOR, label: 'Tier 2 — Top 25%' },
  { color: TIER_3_COLOR, label: 'Tier 3 — Top 50%' },
  { color: TIER_4_COLOR, label: 'Tier 4 — Other' },
  { color: TIER_OUTSIDE_COLOR, label: 'Outside hubs' },
]

/**
 * Legend overlay for the Tiers view mode.
 * Shows the four tier colors with their percentile labels.
 */
export function TierLegend({ clusterCount }: TierLegendProps) {
  return (
    <div className={legendBox}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase">
        County Tiers
      </p>
      <div className="flex flex-col gap-1.5">
        {tiers.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>
      {clusterCount != null && (
        <p className="text-[10px] text-gray-500 mt-3">
          {clusterCount} hub region{clusterCount !== 1 ? 's' : ''} &middot; Tiers based on all-county percentiles
        </p>
      )}
    </div>
  )
}
