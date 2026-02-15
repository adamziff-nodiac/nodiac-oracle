'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { SlidersHorizontal, X } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import dynamic from 'next/dynamic'

const HubMap = dynamic(() => import('@/components/regional-hubs/HubMap').then(mod => ({ default: mod.HubMap })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-nodiac-dark/50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-nodiac-secondary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading map...</p>
      </div>
    </div>
  ),
})
import { WeightControls } from '@/components/regional-hubs/WeightControls'
import { PresetProfiles } from '@/components/regional-hubs/PresetProfiles'
import { CountyDetailPanel } from '@/components/regional-hubs/CountyDetailPanel'
import { MapLegend } from '@/components/regional-hubs/MapLegend'
import { ExportControls } from '@/components/regional-hubs/ExportControls'
import { NarrativeSection } from '@/components/regional-hubs/NarrativeSection'
import { MethodologyDeepDive } from '@/components/regional-hubs/MethodologyDeepDive'
import { useCountyScores } from '@/hooks/useCountyScores'
import { useHubRegions } from '@/hooks/useHubRegions'
import { useWeightedScores } from '@/hooks/useWeightedScores'
import { DEFAULT_WEIGHTS } from '@/lib/scoring/weight-profiles'
import type { CriterionKey, ScoringMode, WeightedCountyScore } from '@/types/regional-hubs'

export default function RegionalHubsPage() {
  const { scores, citationRegistry, isLoading: scoresLoading } = useCountyScores()
  const { regions } = useHubRegions()

  const [weights, setWeights] = useState<Record<CriterionKey, number>>({ ...DEFAULT_WEIGHTS })
  const [activeProfileId, setActiveProfileId] = useState<string | null>('balanced')
  const [selectedCounty, setSelectedCounty] = useState<WeightedCountyScore | null>(null)
  const [showMobileWeights, setShowMobileWeights] = useState(false)
  const [scoringMode, setScoringMode] = useState<ScoringMode>('arithmetic')

  const { weightedScores, scoreLookup, scoreRange, quantileBreaks } = useWeightedScores(scores, weights, scoringMode)

  const mapExportRef = useRef<HTMLDivElement>(null)

  const handleWeightChange = useCallback((newWeights: Record<CriterionKey, number>) => {
    setWeights(newWeights)
    setActiveProfileId(null) // Custom weights break preset association
  }, [])

  const handlePresetSelect = useCallback((newWeights: Record<CriterionKey, number>, profileId: string) => {
    setWeights(newWeights)
    setActiveProfileId(profileId)
  }, [])

  const handleCountyClick = useCallback(
    (fips: string) => {
      const county = weightedScores.find((s) => s.fips_code === fips) || null
      setSelectedCounty(county)
    },
    [weightedScores]
  )

  const handleCloseDetail = useCallback(() => {
    setSelectedCounty(null)
  }, [])

  return (
    <div className="min-h-screen bg-nodiac-light dark:bg-[#0f0f1a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-transparent backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nodiac-primary to-nodiac-secondary flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-gray-900 dark:text-white font-semibold text-xl hidden sm:inline">Nodiac</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Navigation />
          </div>
        </div>
      </header>

      {/* Editorial Intro */}
      <section className="pt-28 pb-10 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1]">
            Regional Hub Strategy
          </h1>
          <p className="mt-4 text-xl text-gray-500 dark:text-nodiac-dusty-lilac max-w-2xl leading-relaxed">
            Scoring every US county across seven criteria to identify optimal locations for
            Nodiac&apos;s distributed data center hubs.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-nodiac-secondary hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              📖 Developer Docs
            </Link>
            <Link
              href="/screening"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              🔍 Screen a Portfolio
            </Link>
          </div>
          <details className="mt-6 group">
            <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors select-none">
              ℹ️ How to use this map
            </summary>
            <div className="mt-3 p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-gray-300 space-y-2 max-w-2xl">
              <p>
                <strong className="text-gray-900 dark:text-white">Click any county</strong> to see its score breakdown across all seven criteria.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Use the preset buttons</strong> (top-left panel) to snap weights to strategic profiles,
                or drag individual sliders for custom weighting. Changes are instant — no server calls.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Quantile-based color scale:</strong> Colors are spread across the actual score distribution
                so each shade covers an equal number of counties. Purple shades show low-to-strong scores;
                the top 5% of counties glow <strong className="text-[#4de2e4]">neon teal</strong> so the best locations pop instantly.
                Scroll down for narrative context and full methodology.
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* Map Section */}
      <section className="relative px-4 pb-8">
        <div className="max-w-[1600px] mx-auto">
          <div ref={mapExportRef} className="relative h-[50vh] md:h-[70vh] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
            {scoresLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-nodiac-dark/50">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-nodiac-secondary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Loading county data...</p>
                </div>
              </div>
            ) : (
              <>
                <HubMap
                  scoreLookup={scoreLookup}
                  scoreRange={scoreRange}
                  regions={regions}
                  onCountyClick={handleCountyClick}
                  quantileBreaks={quantileBreaks}
                />

                {/* Mobile weight toggle */}
                <button
                  onClick={() => setShowMobileWeights(!showMobileWeights)}
                  className="absolute top-4 left-4 z-20 md:hidden flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-nodiac-dark/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {showMobileWeights ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
                  Weights
                </button>

                {/* Floating weight panel */}
                <div className={`absolute top-4 left-4 w-64 bg-white/90 dark:bg-nodiac-dark/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-4 space-y-5 z-10 max-h-[calc(70vh-2rem)] overflow-y-auto ${showMobileWeights ? 'block top-14' : 'hidden'} md:block md:top-4`}>
                  <PresetProfiles
                    activeProfileId={activeProfileId}
                    onSelect={handlePresetSelect}
                  />
                  <WeightControls
                    weights={weights}
                    onWeightChange={handleWeightChange}
                    scoringMode={scoringMode}
                    onScoringModeChange={setScoringMode}
                  />
                </div>

                <MapLegend scoreRange={scoreRange} quantileBreaks={quantileBreaks} />

                {/* Export button */}
                <div className="absolute top-4 right-4 z-10">
                  <ExportControls targetRef={mapExportRef} />
                </div>

                {/* County detail panel */}
                <CountyDetailPanel
                  county={selectedCounty}
                  citationRegistry={citationRegistry}
                  onClose={handleCloseDetail}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Narrative */}
      <NarrativeSection />

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-6">
        <hr className="border-gray-200 dark:border-white/10" />
      </div>

      {/* Deep Dive Methodology */}
      <MethodologyDeepDive />
    </div>
  )
}
