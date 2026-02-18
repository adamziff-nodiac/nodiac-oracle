'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { SlidersHorizontal, X, Info } from 'lucide-react'
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
import { CountyRankingGrid } from '@/components/regional-hubs/CountyRankingGrid'
import { useCountyScores } from '@/hooks/useCountyScores'
import { useWeightedScores } from '@/hooks/useWeightedScores'
import { usePortfolioSites } from '@/hooks/usePortfolioSites'
import { DEFAULT_WEIGHTS } from '@/lib/scoring/weight-profiles'
import type { ScoringMode } from '@/lib/scoring/county-scorer'
import type { ColorMode } from '@/components/regional-hubs/CountyChoropleth'
import type { ViewMode } from '@/components/regional-hubs/HubMap'
import type { CriterionKey, WeightedCountyScore } from '@/types/regional-hubs'

export default function RegionalHubsPage() {
  const { scores, citationRegistry, isLoading: scoresLoading } = useCountyScores()

  const [weights, setWeights] = useState<Record<CriterionKey, number>>({ ...DEFAULT_WEIGHTS })
  const [activeProfileId, setActiveProfileId] = useState<string | null>('balanced')
  const [selectedCounty, setSelectedCounty] = useState<WeightedCountyScore | null>(null)
  const [showMobileWeights, setShowMobileWeights] = useState(false)
  const [scoringMode, setScoringMode] = useState<ScoringMode>('arithmetic')
  const [colorMode, setColorMode] = useState<ColorMode>('percentile')
  const [highlightThreshold, setHighlightThreshold] = useState(6.5)
  const [viewMode, setViewMode] = useState<ViewMode>('county')
  const [clusterTopPercent, setClusterTopPercent] = useState(10)
  const [clusterMinSize, setClusterMinSize] = useState(10)
  const [clusterLinkDist, setClusterLinkDist] = useState(250)
  const [clusterCount, setClusterCount] = useState(0)
  const [showPortfolio, setShowPortfolio] = useState(false)

  const { sites: portfolioSites } = usePortfolioSites()
  const { weightedScores, scoreLookup, scoreRange, quantileBreaks } = useWeightedScores(scores, weights, scoringMode)

  const clusterOptions = useMemo(() => ({
    topPercent: clusterTopPercent,
    minClusterSize: clusterMinSize,
    maxDistKm: clusterLinkDist,
  }), [clusterTopPercent, clusterMinSize, clusterLinkDist])

  const mapExportRef = useRef<HTMLDivElement>(null)

  const handleWeightChange = useCallback((newWeights: Record<CriterionKey, number>) => {
    setWeights(newWeights)
    setActiveProfileId(null)
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

  const handleScoringModeChange = useCallback((mode: ScoringMode) => {
    setScoringMode(mode)
    if (mode === 'geometric') {
      setColorMode('percentile')
    }
  }, [])

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
          <p className="mt-4 text-xl text-gray-600 dark:text-nodiac-dusty-lilac max-w-2xl leading-relaxed">
            Scoring every US county across seven criteria to identify optimal locations for
            Nodiac&apos;s distributed data center hubs.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/scoring"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-nodiac-secondary hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              Scoring Methodology
            </Link>
            <Link
              href="/screening"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              Screen a Portfolio
            </Link>
          </div>
          <details className="mt-6 group">
            <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors select-none">
              How to use this map
            </summary>
            <div className="mt-3 p-4 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-gray-300 space-y-2 max-w-2xl">
              <p>
                <strong className="text-gray-900 dark:text-white">Click any county</strong> to see its score breakdown across all seven criteria.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Use the preset buttons</strong> (top-left panel) to snap weights to strategic profiles,
                or drag individual sliders for custom weighting. Changes are instant — no server calls.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Color modes:</strong> By default, counties are colored using a <strong className="text-gray-900 dark:text-white">percentile</strong> scale
                — top 5% glow <strong className="text-[#4de2e4]">neon teal</strong>. Switch to <strong className="text-gray-900 dark:text-white">absolute</strong> mode
                (in Advanced Controls) for a fixed 0–10 scale with an adjustable threshold.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Scoring modes:</strong> Arithmetic mean (default) averages scores linearly.
                Geometric mean penalises counties that score near-zero on any criterion, rewarding balanced performance.
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
              <div className="w-full h-full flex items-center justify-center bg-white/50 dark:bg-nodiac-dark/50">
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
                  onCountyClick={handleCountyClick}
                  highlightThreshold={highlightThreshold}
                  colorMode={colorMode}
                  quantileBreaks={quantileBreaks}
                  viewMode={viewMode}
                  clusterOptions={clusterOptions}
                  onClusterCount={setClusterCount}
                  showPortfolio={showPortfolio}
                  portfolioSites={portfolioSites}
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
                  {/* View Mode pill row */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-600 dark:text-gray-300 font-semibold tracking-wide uppercase">
                      View Mode
                    </label>
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0.5">
                      {([
                        { id: 'county', label: 'County' },
                        { id: 'regions', label: 'Regions' },
                      ] as const).map(({ id, label }) => (
                        <button
                          key={id}
                          onClick={() => {
                            setViewMode(id)
                            if (id !== 'county') setSelectedCounty(null)
                          }}
                          className={`whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            viewMode === id
                              ? 'bg-nodiac-secondary/20 text-nodiac-secondary'
                              : 'bg-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {/* Cluster tuning sliders — visible in regions mode */}
                    {viewMode === 'regions' && (
                      <div className="mt-2 space-y-2.5">
                        {/* Top percent */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">Top counties</span>
                            <span className="text-xs text-nodiac-secondary tabular-nums font-mono font-semibold">
                              {clusterTopPercent}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={5}
                            max={30}
                            step={5}
                            value={clusterTopPercent}
                            onChange={(e) => setClusterTopPercent(parseInt(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                              bg-gray-200 dark:bg-white/10
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-3.5
                              [&::-webkit-slider-thumb]:h-3.5
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-nodiac-secondary
                              [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(77,226,228,0.4)]"
                          />
                        </div>
                        {/* Min cluster size */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">Min cluster size</span>
                            <span className="text-xs text-nodiac-secondary tabular-nums font-mono font-semibold">
                              {clusterMinSize}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={3}
                            max={30}
                            step={1}
                            value={clusterMinSize}
                            onChange={(e) => setClusterMinSize(parseInt(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                              bg-gray-200 dark:bg-white/10
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-3.5
                              [&::-webkit-slider-thumb]:h-3.5
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-nodiac-secondary
                              [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(77,226,228,0.4)]"
                          />
                        </div>
                        {/* Link distance */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">Link distance</span>
                            <span className="text-xs text-nodiac-secondary tabular-nums font-mono font-semibold">
                              {clusterLinkDist}km <span className="text-gray-400 dark:text-gray-500 font-normal">~{Math.round(clusterLinkDist * 0.621)}mi</span>
                            </span>
                          </div>
                          <input
                            type="range"
                            min={100}
                            max={500}
                            step={25}
                            value={clusterLinkDist}
                            onChange={(e) => setClusterLinkDist(parseInt(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                              bg-gray-200 dark:bg-white/10
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-3.5
                              [&::-webkit-slider-thumb]:h-3.5
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-nodiac-secondary
                              [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(77,226,228,0.4)]"
                          />
                        </div>
                      </div>
                    )}
                    {/* Portfolio overlay toggle — visible in regions mode */}
                    {viewMode === 'regions' && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                        <button
                          onClick={() => setShowPortfolio(!showPortfolio)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            showPortfolio
                              ? 'bg-nodiac-secondary/20 text-nodiac-secondary'
                              : 'bg-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          <span>Show Portfolio Sites</span>
                          <span className="tabular-nums font-mono text-[10px]">
                            {portfolioSites.length} sites
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  <PresetProfiles
                    activeProfileId={activeProfileId}
                    onSelect={handlePresetSelect}
                  />

                  {/* Collapsible advanced controls */}
                  <details className="group">
                    <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors select-none flex items-center gap-1.5">
                      <span className="transition-transform group-open:rotate-90 text-[10px]">&#9654;</span>
                      Advanced Controls
                    </summary>
                    <div className="mt-4 space-y-5">
                      {/* Scoring Mode toggle */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs text-gray-600 dark:text-gray-300 font-semibold tracking-wide uppercase">
                            Scoring Mode
                          </label>
                          <div className="group relative">
                            <Info className="w-3 h-3 text-gray-400 dark:text-gray-500 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 p-2.5 rounded-lg bg-gray-900 dark:bg-gray-800 text-[11px] text-gray-200 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                              <p><strong className="text-white">Arithmetic</strong> averages scores linearly — good all-rounder.</p>
                              <p className="mt-1"><strong className="text-white">Geometric</strong> penalizes near-zero scores, rewarding counties that are strong across all criteria.</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                          <button
                            onClick={() => handleScoringModeChange('arithmetic')}
                            className={`flex-1 text-xs py-1.5 transition-colors ${
                              scoringMode === 'arithmetic'
                                ? 'bg-nodiac-secondary/20 text-nodiac-secondary'
                                : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            Arithmetic
                          </button>
                          <button
                            onClick={() => handleScoringModeChange('geometric')}
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

                      {/* Color Mode toggle */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-600 dark:text-gray-300 font-semibold tracking-wide uppercase">
                          Color Mode
                        </label>
                        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                          <button
                            onClick={() => setColorMode('percentile')}
                            className={`flex-1 text-xs py-1.5 transition-colors ${
                              colorMode === 'percentile'
                                ? 'bg-nodiac-secondary/20 text-nodiac-secondary'
                                : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            Percentile
                          </button>
                          <button
                            onClick={() => setColorMode('absolute')}
                            disabled={scoringMode === 'geometric'}
                            className={`flex-1 text-xs py-1.5 transition-colors ${
                              colorMode === 'absolute'
                                ? 'bg-nodiac-secondary/20 text-nodiac-secondary'
                                : scoringMode === 'geometric'
                                  ? 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                  : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                            title={scoringMode === 'geometric' ? 'Absolute mode is not available with geometric scoring' : undefined}
                          >
                            Absolute
                          </button>
                        </div>
                      </div>

                      {/* Threshold slider — only visible in absolute mode */}
                      {colorMode === 'absolute' && (
                        <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-xs text-gray-600 dark:text-gray-300 font-semibold tracking-wide uppercase">
                              Highlight Threshold
                            </label>
                            <span className="text-xs text-nodiac-secondary tabular-nums font-mono">
                              {highlightThreshold.toFixed(1)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={10}
                            step={0.5}
                            value={highlightThreshold}
                            onChange={(e) => setHighlightThreshold(parseFloat(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                              bg-gray-200 dark:bg-white/10
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-3.5
                              [&::-webkit-slider-thumb]:h-3.5
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-nodiac-secondary
                              [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(77,226,228,0.4)]
                              [&::-webkit-slider-thumb]:transition-shadow
                              [&::-webkit-slider-thumb]:hover:shadow-[0_0_10px_rgba(77,226,228,0.6)]"
                          />
                          <p className="text-[10px] text-gray-500">
                            Counties scoring above this glow teal
                          </p>
                        </div>
                      )}

                      <WeightControls
                        weights={weights}
                        onWeightChange={handleWeightChange}
                      />
                    </div>
                  </details>
                </div>

                <MapLegend scoreRange={scoreRange} highlightThreshold={highlightThreshold} colorMode={colorMode} viewMode={viewMode} clusterCount={viewMode === 'regions' ? clusterCount : undefined} />

                {/* Export button */}
                <div className="absolute top-4 right-4 z-10">
                  <ExportControls targetRef={mapExportRef} viewMode={viewMode} />
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

      {/* County Ranking Grid */}
      {!scoresLoading && weightedScores.length > 0 && (
        <section className="px-4 sm:px-6 pb-8">
          <div className="max-w-[1600px] mx-auto">
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer select-none py-3">
                <span className="transition-transform group-open:rotate-90 text-xs text-gray-400 dark:text-gray-500">&#9654;</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  County Rankings
                </h2>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                  {weightedScores.length.toLocaleString()} counties
                </span>
              </summary>
              <div className="mt-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4">
                <CountyRankingGrid
                  weightedScores={weightedScores}
                  onCountyClick={handleCountyClick}
                />
              </div>
            </details>
          </div>
        </section>
      )}

      {/* Brief usage guide */}
      <section className="px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">How it works</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Each county is scored 0–10 across seven criteria (co-op density, grid reliability,
            curtailment opportunity, permitting environment, IT labor, fiber availability, and queue pressure).
            Adjust the weight sliders to prioritize what matters most for your deployment strategy,
            and drag the highlight threshold to control where the teal glow begins.
            Click any county to inspect its full score breakdown.
          </p>
          <p className="text-gray-500 text-sm">
            For full methodology, data sources, and technical details, see the{' '}
            <Link href="/scoring" className="text-nodiac-secondary hover:underline">
              Scoring Methodology
            </Link>.
          </p>
        </div>
      </section>
    </div>
  )
}
