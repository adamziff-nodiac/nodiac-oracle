'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { CsvUploader } from './CsvUploader'
import { ScreeningMap } from './ScreeningMap'
import { SiteTable, type NearestHub } from './SiteTable'
import { PromoteSitesModal } from './PromoteSitesModal'
import { usePortfolio } from '@/hooks/usePortfolio'
import type { ProgressStep } from '@/hooks/usePortfolio'
import { RotateCcw, Check, Loader2, Info, ArrowLeft, ArrowRight } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { WEIGHT_PROFILES } from '@/lib/scoring/weight-profiles'
import { WeightControls } from '@/components/regional-hubs/WeightControls'
import type { SiteTier } from '@/types/screening'
import { TIER_COLORS, TIER_LABELS } from '@/types/screening'
import { PREBUILT_PORTFOLIOS } from '@/data/portfolio-registry'
import { useCountyScores } from '@/hooks/useCountyScores'
import { cn } from '@/lib/utils'
import { FullscreenToggle } from '@/components/ui/FullscreenToggle'
import { haversineKm, kmToMiles } from '@/lib/geo/haversine'
import type { OverlayHub } from './HubOverlayLayer'
import type { OverlayTrackerSite } from './TrackerSiteOverlayLayer'

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
              <div className="w-5 h-5 rounded-full border border-gray-300 dark:border-white/20" />
            )}
          </div>
          <span
            className={cn(
              'text-sm',
              step.status === 'active' && 'text-gray-900 dark:text-white font-medium',
              step.status === 'done' && 'text-gray-500 dark:text-gray-400',
              step.status === 'pending' && 'text-gray-400 dark:text-gray-500'
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}

interface ScreeningContainerProps {
  prebuiltSlug?: string
}

export function ScreeningContainer({ prebuiltSlug }: ScreeningContainerProps) {
  const {
    state, upload, sites, error, steps,
    selectedProfileId, setProfileId,
    weights, onWeightChange,
    scoringMode, onScoringModeChange,
    uploadCSV, reset, isPrebuilt,
  } = usePortfolio(prebuiltSlug)
  const { scores: countyScores, citationRegistry } = useCountyScores()
  const screeningMapRef = useRef<HTMLDivElement>(null)
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
  const [visibleTiers, setVisibleTiers] = useState<Set<SiteTier>>(new Set(ALL_TIERS))

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Selection state for promote flow
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [promotedMap, setPromotedMap] = useState<Record<string, string>>({})

  // Overlay data
  const [overlayHubs, setOverlayHubs] = useState<OverlayHub[]>([])
  const [overlayTrackerSites, setOverlayTrackerSites] = useState<OverlayTrackerSite[]>([])
  const [showHubs, setShowHubs] = useState(true)
  const [showTrackerSites, setShowTrackerSites] = useState(false)

  // Fetch overlay data when results are ready
  useEffect(() => {
    if (state !== 'done') return
    fetch('/api/map/overlay-data')
      .then(r => r.json())
      .then(data => {
        setOverlayHubs(data.hubs ?? [])
        setOverlayTrackerSites(data.trackerSites ?? [])
      })
      .catch(() => {})
  }, [state])

  // Fetch promoted sites map
  useEffect(() => {
    if (state !== 'done' || !upload?.id || isPrebuilt) return
    fetch(`/api/screening/promoted?upload_id=${upload.id}`)
      .then(r => r.json())
      .then(data => setPromotedMap(data.promoted ?? {}))
      .catch(() => {})
  }, [state, upload?.id, isPrebuilt])

  // Compute nearest hub for each site
  const nearestHubs = useMemo(() => {
    if (overlayHubs.length === 0 || sites.length === 0) return undefined
    const result: Record<string, NearestHub> = {}
    for (const site of sites) {
      if (site.latitude == null || site.longitude == null) continue
      let nearest: NearestHub | null = null
      let minDist = Infinity
      for (const hub of overlayHubs) {
        const dist = kmToMiles(haversineKm(
          Number(site.latitude), Number(site.longitude),
          hub.lat, hub.lng
        ))
        if (dist < minDist) {
          minDist = dist
          nearest = { name: hub.name, distance_miles: dist }
        }
      }
      if (nearest) result[site.id] = nearest
    }
    return result
  }, [sites, overlayHubs])

  const handleSiteSelect = useCallback((siteId: string) => {
    setSelectedSiteId(prev => prev === siteId ? null : siteId)
  }, [])

  const toggleTier = useCallback((tier: SiteTier) => {
    setVisibleTiers(prev => {
      const next = new Set(prev)
      if (next.has(tier)) {
        if (next.size > 1) next.delete(tier)
      } else {
        next.add(tier)
      }
      return next
    })
  }, [])

  const handleToggleSelect = useCallback((siteId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(siteId)) next.delete(siteId)
      else next.add(siteId)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === sites.length) return new Set()
      return new Set(sites.map(s => s.id))
    })
  }, [sites])

  const handlePromoted = useCallback(() => {
    // Re-fetch promoted map
    if (upload?.id) {
      fetch(`/api/screening/promoted?upload_id=${upload.id}`)
        .then(r => r.json())
        .then(data => setPromotedMap(data.promoted ?? {}))
        .catch(() => {})
    }
    setSelectedIds(new Set())
  }, [upload?.id])

  // Upload phase
  if (state === 'idle' || (state === 'error' && !isPrebuilt)) {
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
            <a href="/regional-hubs" className="text-sm text-nodiac-secondary hover:underline">&larr; Regional Hubs</a>
            <span className="text-gray-400 dark:text-gray-600">&middot;</span>
            <a href="/scoring" className="text-sm text-nodiac-secondary hover:underline">Scoring Methodology</a>
          </div>
        </div>

        {/* Pre-built portfolios */}
        <div className="w-full max-w-lg mb-10">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold mb-3 text-center">
            View Existing Portfolios
          </p>
          <div className="grid gap-2">
            {PREBUILT_PORTFOLIOS.map((p) =>
              p.disabled ? (
                <div
                  key={p.slug}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 opacity-50 cursor-not-allowed"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                      {p.name}
                    </span>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {p.description}
                    </p>
                    {p.disabledReason && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 italic">
                        {p.disabledReason}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-300 dark:text-gray-600">
                    Unavailable
                  </span>
                </div>
              ) : (
                <Link
                  key={p.slug}
                  href={`/screening/${p.slug}`}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:border-gray-300 dark:hover:border-white/20 transition-all group"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-nodiac-secondary transition-colors">
                      {p.name}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {p.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-nodiac-secondary transition-colors">
                    View &rarr;
                  </span>
                </Link>
              )
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 w-full max-w-lg mb-10">
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">or upload your own</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
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
              How Site Screening Works
            </summary>
            <div className="mt-3 p-5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                <strong className="text-gray-900 dark:text-white">1. Upload</strong> &mdash; Drop a CSV with site names, lat/lon coordinates, and optionally utility info.
                Supports Fleet CIR Validated and consolidated formats.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">2. FIPS Resolution</strong> &mdash; Each site&apos;s location is matched to a US county using
                county/state names or the FCC Area API (lat/lon &rarr; FIPS code).
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">3. Scoring</strong> &mdash; Sites inherit their county&apos;s criterion scores (grid reliability,
                curtailment, permitting, labor, fiber, queue pressure). Co-op density is determined by a spatial check:
                if the site&apos;s coordinates fall within a co-op/public power service territory &rarr; 1.0, otherwise &rarr; 0.0.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">4. Tiering</strong> &mdash; Scores are combined into a 0&ndash;10 composite using weighted arithmetic or geometric mean.
                Sites are ranked by percentile within the portfolio: top ~33% = Strong Fit, middle ~34% = Moderate Fit, bottom ~33% = Weak Fit.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">5. Customization</strong> &mdash; After upload, switch weight presets, adjust individual criterion weights,
                or toggle between arithmetic and geometric scoring. All re-scoring happens instantly in your browser.
              </p>
            </div>
          </details>
        </div>
      </div>
    )
  }

  // Loading phase
  if (state === 'uploading' || state === 'scoring' || state === 'loading-results') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isPrebuilt ? 'Loading portfolio' : 'Processing portfolio'}
          </h3>
          {!isPrebuilt && <StepIndicator steps={steps} />}
          {isPrebuilt && <Loader2 className="w-6 h-6 text-nodiac-secondary animate-spin" />}
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

  const selectedSites = sites.filter(s => selectedIds.has(s.id))

  return (
    <div className="space-y-0">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-white/10">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
            {upload?.name || 'Portfolio Results'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {sites.length} sites &mdash; {tierCounts.good} strong, {tierCounts.okay} moderate, {tierCounts.bad} weak
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search sites..."
            className="w-40 sm:w-52"
          />
          <a
            href="/scoring#site-screening"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Scoring
          </a>
          {isPrebuilt ? (
            <Link
              href="/screening"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">All Portfolios</span>
              <span className="sm:hidden">Back</span>
            </Link>
          ) : (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Upload
            </button>
          )}
        </div>
      </div>

      {/* Weight presets + scoring controls */}
      <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-white/10 space-y-3">
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

        {/* Collapsible advanced controls */}
        <details className="group">
          <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors select-none flex items-center gap-1.5">
            <span className="transition-transform group-open:rotate-90 text-[10px]">&#9654;</span>
            Advanced Controls
          </summary>
          <div className="mt-3 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-600 dark:text-gray-300 font-semibold tracking-wide uppercase">
                  Scoring Mode
                </label>
                <div className="group/tip relative">
                  <Info className="w-3 h-3 text-gray-400 dark:text-gray-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 p-2.5 rounded-lg bg-gray-900 dark:bg-gray-800 text-[11px] text-gray-200 leading-relaxed opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-50 shadow-lg">
                    <p><strong className="text-white">Arithmetic</strong> averages scores linearly &mdash; good all-rounder.</p>
                    <p className="mt-1"><strong className="text-white">Geometric</strong> penalizes near-zero scores, rewarding sites that are strong across all criteria.</p>
                  </div>
                </div>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 max-w-xs">
                <button
                  onClick={() => onScoringModeChange('arithmetic')}
                  className={`flex-1 text-xs py-1.5 transition-colors ${
                    scoringMode === 'arithmetic'
                      ? 'bg-nodiac-secondary/20 text-nodiac-secondary'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Arithmetic
                </button>
                <button
                  onClick={() => onScoringModeChange('geometric')}
                  className={`flex-1 text-xs py-1.5 transition-colors ${
                    scoringMode === 'geometric'
                      ? 'bg-nodiac-secondary/20 text-nodiac-secondary'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Geometric
                </button>
              </div>
            </div>

            <WeightControls
              weights={weights}
              onWeightChange={onWeightChange}
            />
          </div>
        </details>
      </div>

      {/* Map filter + overlay toggles */}
      <div className="px-4 sm:px-6 py-2 flex items-center gap-1.5 border-b border-gray-200 dark:border-white/10 flex-wrap">
        <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Show:</span>
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
                  ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-white/[0.03] text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
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

        {/* Overlay toggles */}
        {overlayHubs.length > 0 && (
          <>
            <span className="text-xs text-gray-300 dark:text-gray-600 mx-1">|</span>
            <button
              onClick={() => setShowHubs(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                showHubs
                  ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-white/[0.03] text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
              )}
            >
              <svg width="8" height="8" viewBox="0 0 10 10">
                <polygon points="5,0 10,5 5,10 0,5" fill={showHubs ? '#10b981' : '#9ca3af'} />
              </svg>
              Hubs
            </button>
            <button
              onClick={() => setShowTrackerSites(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                showTrackerSites
                  ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-white/[0.03] text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
              )}
            >
              <svg width="8" height="8" viewBox="0 0 10 10">
                <rect x="1" y="1" width="8" height="8" rx="1" fill={showTrackerSites ? '#8b5cf6' : '#9ca3af'} />
              </svg>
              Pipeline Sites
            </button>
          </>
        )}
      </div>
      <div ref={screeningMapRef} className="relative h-[50vh] md:h-[40vh] border-b border-gray-200 dark:border-white/10">
        <FullscreenToggle targetRef={screeningMapRef} className="absolute top-3 right-3 z-10" />
        <ScreeningMap
          sites={sites}
          selectedSiteId={selectedSiteId}
          onSiteSelect={handleSiteSelect}
          visibleTiers={visibleTiers}
          countySaidi={Object.fromEntries(
            countyScores.map(cs => [cs.fips_code, {
              avg_saidi: cs.grid_reliability_avg_saidi ?? null,
              years: cs.grid_reliability_years ?? null,
            }])
          )}
          overlayHubs={overlayHubs}
          overlayTrackerSites={overlayTrackerSites}
          showHubs={showHubs}
          showTrackerSites={showTrackerSites}
        />
      </div>

      {/* Selection action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-0 z-40 px-4 sm:px-6 py-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            <strong>{selectedIds.size}</strong> site{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => setShowPromoteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-nodiac-secondary text-nodiac-dark text-sm font-semibold rounded-lg hover:bg-nodiac-secondary/90 transition-colors"
          >
            Add to Pipeline
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="px-4 sm:px-6 py-4">
        <SiteTable
          sites={sites}
          selectedSiteId={selectedSiteId}
          onSiteSelect={handleSiteSelect}
          countyScores={countyScores}
          citationRegistry={citationRegistry}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          promotedMap={promotedMap}
          nearestHubs={nearestHubs}
          searchQuery={searchQuery}
        />
      </div>

      {/* Promote Modal */}
      {showPromoteModal && (
        <PromoteSitesModal
          sites={selectedSites}
          onClose={() => setShowPromoteModal(false)}
          onPromoted={handlePromoted}
        />
      )}
    </div>
  )
}
