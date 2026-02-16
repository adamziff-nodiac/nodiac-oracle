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
import { useCountyScores } from '@/hooks/useCountyScores'
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
              step.status === 'active' && 'text-gray-900 dark:text-white font-medium',
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
  const { scores: countyScores, citationRegistry } = useCountyScores()
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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Screen an IPP Portfolio
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Upload a CSV of potential sites to score them against our regional hub criteria
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <a href="/regional-hubs" className="text-sm text-nodiac-secondary hover:underline">← Regional Hubs</a>
            <span className="text-gray-600">·</span>
            <a href="/scoring" className="text-sm text-nodiac-secondary hover:underline">📖 Scoring Methodology</a>
          </div>
        </div>

        {/* Workflow steps */}
        <div className="flex items-center gap-3 sm:gap-6 mb-10 text-sm">
          {[
            { step: '1', label: 'Upload CSV' },
            { step: '2', label: 'Score Sites' },
            { step: '3', label: 'View Results' },
          ].map((item, i) => (
            <div key={item.step} className="flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-nodiac-primary/20 dark:bg-white/10 text-nodiac-primary dark:text-nodiac-secondary text-xs font-bold flex items-center justify-center">
                  {item.step}
                </span>
                <span className="text-gray-600 dark:text-gray-400 font-medium">{item.label}</span>
              </div>
              {i < 2 && (
                <div className="w-8 sm:w-12 h-px bg-gray-300 dark:bg-white/10" />
              )}
            </div>
          ))}
        </div>

        <CsvUploader
          onUpload={uploadCSV}
          isUploading={false}
        />
        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}

        {/* How it works */}
        <div className="mt-12 max-w-2xl w-full">
          <details className="group">
            <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors select-none font-medium">
              ℹ️ How Site Screening Works
            </summary>
            <div className="mt-3 p-5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                <strong className="text-gray-900 dark:text-white">1. Upload</strong> — Drop a CSV with site names, lat/lon coordinates, and optionally utility info.
                Supports Fleet CIR Validated and consolidated formats.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">2. FIPS Resolution</strong> — Each site&apos;s location is matched to a US county using
                county/state names or the FCC Area API (lat/lon → FIPS code).
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">3. Scoring</strong> — Sites inherit their county&apos;s criterion scores (grid reliability,
                curtailment, permitting, labor, fiber). Co-op density is determined by a spatial check:
                if the site&apos;s coordinates fall within a co-op/public power service territory → 1.0, otherwise → 0.0.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">4. Tiering</strong> — Scores are averaged to a 0–10 composite.
                ≥ 6.5 = Strong Fit (teal), ≥ 4.0 = Moderate Fit (orchid), &lt; 4.0 = Weak Fit (red).
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">5. Re-weighting</strong> — After upload, use the preset buttons to re-score with different
                weight profiles. This happens instantly in your browser.
              </p>
            </div>
          </details>
        </div>
      </div>
    )
  }

  // Loading phase (uploading, scoring, or loading results)
  if (state === 'uploading' || state === 'scoring' || state === 'loading-results') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Processing portfolio</h3>
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {upload?.name || 'Portfolio Results'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {sites.length} sites — {tierCounts.good} strong, {tierCounts.okay} moderate, {tierCounts.bad} weak
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/scoring#site-screening"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            📖 Scoring
          </a>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Upload
          </button>
        </div>
      </div>

      {/* Weight presets */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-white/10">
        <div className="flex flex-wrap gap-1.5">
          {WEIGHT_PROFILES.map((profile) => (
            <button
              key={profile.id}
              onClick={() => setProfileId(profile.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                selectedProfileId === profile.id
                  ? 'bg-nodiac-secondary text-nodiac-dark'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
              )}
              title={profile.description}
            >
              {profile.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map filter + map */}
      <div className="px-6 py-2 flex items-center gap-1.5 border-b border-gray-200 dark:border-white/10">
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
      <div className="h-[30vh] md:h-[40vh] border-b border-gray-200 dark:border-white/10">
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
          countyScores={countyScores}
          citationRegistry={citationRegistry}
        />
      </div>
    </div>
  )
}
