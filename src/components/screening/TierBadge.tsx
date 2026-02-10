'use client'

import type { SiteTier } from '@/types/screening'
import { TIER_COLORS, TIER_LABELS } from '@/types/screening'
import { cn } from '@/lib/utils'

interface TierBadgeProps {
  tier: SiteTier | null
  className?: string
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  if (!tier) {
    return (
      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-400', className)}>
        Unscored
      </span>
    )
  }

  return (
    <span
      className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', className)}
      style={{
        backgroundColor: `${TIER_COLORS[tier]}20`,
        color: TIER_COLORS[tier],
      }}
    >
      {TIER_LABELS[tier]}
    </span>
  )
}
