'use client'

import { useState, useCallback } from 'react'
import { CsvUploader } from './CsvUploader'
import { ScreeningMap } from './ScreeningMap'
import { SiteTable } from './SiteTable'
import { usePortfolio } from '@/hooks/usePortfolio'
import type { ProgressStep } from '@/hooks/usePortfolio'
import { RotateCcw, Check, Loader2 } from 'lucide-react'
import { WEIGHT_PROFILES } from '@/lib/scoring/weight-profiles'
import type { SiteTier } from '@/types/screening'
import { TIER_COLORS, TIER_LABELS } from '@/types/screening'
import { cn } from '@/lib/utils'

const ALL_TIERS: SiteTier[] = ['good', 'okay', 'bad']

function StepIndicator({ steps }: { steps: ProgressStep[] }) {
  return (
    <div className="flex flex-col gap-3 w-64">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
            {step.status === 'done' ? (
              <div className="w-5 h-5 rounded-full bg-nodiac-secondary/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-nodiac-secondary" />
              </div>
            ) : step.status === 'active' ? (
              <Loader2 className="w-5 h-5 text-nodiac-secondary animate-spin" />
            ) : (
              <div className="w-5 h-5 rounded-full border border-white/20" />
            )}
          </div>
          <span
            className={cn(
              'text-sm',
              step.status === 'active' && 'text-white font-medium',
              step.status === 'done' && 'text-gray-400',
              step.status === 'pending' && 'text-gray-500'
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ScreeningContainer() {
  const {
    state, upload, sites, error, steps,
    selectedProfileId, setProfileId,
    uploadCSV, reset,
  } = usePortfolio()
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
  const [visibleTiers, setVisibleTiers] = useState<Set<SiteTier>>(new Set(ALL_TIERS))

  const handleSiteSelect = useCallback((siteId: string) => {
    setSelectedSiteId(prev => prev === siteId ? null : siteId)
  }, [])

  const toggleTier = useCallback((tier: SiteTier) => {
    setVisibleTiers(prev => {
      const next = new Set(prev)
      if (next.has(tier)) {
        // Don't allow deselecting all — keep at least one
        if (next.size > 1) next.delete(tier)
      } else {
        next.add(tier)
      }
      return next
    })
  }, [])

  // Upload phase
  if (state === 'idle' || state === 'error') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">
            Screen an IPP Portfolio
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Upload a CSV of potential sites to score them against our regional hub criteria
          </p>
        </div>
        <CsvUploader
          onUpload={uploadCSV}
          isUploading={false}
        />
        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }

  // Loading phase (uploading, scoring, or loading results)
  if (state === 'uploading' || state === 'scoring' || state === 'loading-results') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <h3 className="text-lg font-semibold text-white">Processing portfolio</h3>
          <StepIndicator steps={steps} />
        </div>
      </div>
    )
  }

  // Results phase
  const tierCounts = {
    good: sites.filter(s => s.tier === 'good').length,
    okay: sites.filter(s => s.tier === 'okay').length,
    bad: sites.filter(s => s.tier === 'bad').length,
  }

  return (
    <div className="space-y-0">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {upload?.name || 'Portfolio Results'}
          </h2>
          <p className="text-sm text-gray-400">
            {sites.length} sites — {tierCounts.good} strong, {tierCounts.okay} moderate, {tierCounts.bad} weak
          </p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          New Upload
        </button>
      </div>

      {/* Weight presets */}
      <div className="px-6 py-3 border-b border-white/10">
        <div className="flex flex-wrap gap-1.5">
          {WEIGHT_PROFILES.map((profile) => (
            <button
              key={profile.id}
              onClick={() => setProfileId(profile.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                selectedProfileId === profile.id
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

      {/* Map filter + map */}
      <div className="px-6 py-2 flex items-center gap-1.5 border-b border-white/10">
        <span className="text-xs text-gray-500 mr-1">Show:</span>
        {ALL_TIERS.map((tier) => {
          const active = visibleTiers.has(tier)
          const color = TIER_COLORS[tier]
          return (
            <button
              key={tier}
              onClick={() => toggleTier(tier)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                active
                  ? 'bg-white/10 text-white'
                  : 'bg-white/[0.03] text-gray-500 hover:bg-white/5'
              )}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  backgroundColor: color,
                  opacity: active ? 1 : 0.3,
                }}
              />
              {TIER_LABELS[tier]}
            </button>
          )
        })}
      </div>
      <div className="h-[40vh] border-b border-white/10">
        <ScreeningMap
          sites={sites}
          selectedSiteId={selectedSiteId}
          onSiteSelect={handleSiteSelect}
          visibleTiers={visibleTiers}
        />
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        <SiteTable
          sites={sites}
          selectedSiteId={selectedSiteId}
          onSiteSelect={handleSiteSelect}
        />
      </div>
    </div>
  )
}
