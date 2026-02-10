'use client'

import { useCallback } from 'react'
import type { CriterionKey } from '@/types/regional-hubs'
import { WEIGHT_PROFILES } from '@/lib/scoring/weight-profiles'
import { cn } from '@/lib/utils'

interface PresetProfilesProps {
  activeProfileId: string | null
  onSelect: (weights: Record<CriterionKey, number>, profileId: string) => void
}

export function PresetProfiles({ activeProfileId, onSelect }: PresetProfilesProps) {
  const handleSelect = useCallback(
    (profile: (typeof WEIGHT_PROFILES)[number]) => {
      onSelect({ ...profile.weights }, profile.id)
    },
    [onSelect]
  )

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
        Presets
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {WEIGHT_PROFILES.map((profile) => (
          <button
            key={profile.id}
            onClick={() => handleSelect(profile)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              activeProfileId === profile.id
                ? 'bg-nodiac-secondary text-nodiac-dark'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
            )}
            title={profile.description}
          >
            {profile.name}
          </button>
        ))}
      </div>
    </div>
  )
}
