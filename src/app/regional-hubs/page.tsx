'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { HubMap } from '@/components/regional-hubs/HubMap'
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
import type { ScoringMode } from '@/lib/scoring/county-scorer'
import type { ColorMode } from '@/components/regional-hubs/CountyChoropleth'
import type { CriterionKey, WeightedCountyScore } from '@/types/regional-hubs'

export default function RegionalHubsPage() {
  const { scores, citationRegistry, isLoading: scoresLoading } = useCountyScores()
  const { regions } = useHubRegions()

  const [weights, setWeights] = useState<Record<CriterionKey, number>>({ ...DEFAULT_WEIGHTS })
  const [activeProfileId, setActiveProfileId] = useState<string | null>('balanced')
  const [selectedCounty, setSelectedCounty] = useState<WeightedCountyScore | null>(null)
  const [scoringMode, setScoringMode] = useState<ScoringMode>('arithmetic')
  const [colorMode, setColorMode] = useState<ColorMode>('percentile')
  const [highlightThreshold, setHighlightThreshold] = useState(6.5)

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
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-transparent backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nodiac-primary to-nodiac-secondary flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-white font-semibold text-xl hidden sm:inline">Nodiac</span>
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
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Regional Hub Strategy
          </h1>
          <p className="mt-4 text-xl text-nodiac-dusty-lilac max-w-2xl leading-relaxed">
            Scoring every US county across six criteria to identify optimal locations for
            Nodiac&apos;s distributed data center hubs.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-nodiac-secondary hover:bg-white/10 transition-colors"
            >
              📖 Developer Docs
            </Link>
            <Link
              href="/screening"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
            >
              🔍 Screen a Portfolio
            </Link>
          </div>
          <details className="mt-6 group">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-white transition-colors select-none">
              ℹ️ How to use this map
            </summary>
            <div className="mt-3 p-4 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 space-y-2 max-w-2xl">
              <p>
                <strong className="text-white">Click any county</strong> to see its score breakdown across all six criteria.
              </p>
              <p>
                <strong className="text-white">Use the preset buttons</strong> (top-left panel) to snap weights to strategic profiles,
                or drag individual sliders for custom weighting. Changes are instant — no server calls.
              </p>
              <p>
                <strong className="text-white">Color modes:</strong> By default, counties are colored using a <strong className="text-white">percentile</strong> scale
                — top 5% glow <strong className="text-[#4de2e4]">neon teal</strong>. Switch to <strong className="text-white">absolute</strong> mode
                (in Advanced Controls) for a fixed 0–10 scale with an adjustable threshold.
              </p>
              <p>
                <strong className="text-white">Scoring modes:</strong> Arithmetic mean (default) averages scores linearly.
                Geometric mean penalises counties that score near-zero on any criterion, rewarding balanced performance.
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* Map Section */}
      <section className="relative px-4 pb-8">
        <div className="max-w-[1600px] mx-auto">
          <div ref={mapExportRef} className="relative h-[70vh] rounded-xl overflow-hidden border border-white/10">
            {scoresLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-nodiac-dark/50">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-nodiac-secondary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Loading county data...</p>
                </div>
              </div>
            ) : (
              <>
                <HubMap
                  scoreLookup={scoreLookup}
                  scoreRange={scoreRange}
                  regions={regions}
                  onCountyClick={handleCountyClick}
                  highlightThreshold={highlightThreshold}
                  colorMode={colorMode}
                  quantileBreaks={quantileBreaks}
                />

                {/* Floating weight panel */}
                <div className="absolute top-4 left-4 w-64 bg-nodiac-dark/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 space-y-5 z-10 max-h-[calc(70vh-2rem)] overflow-y-auto">
                  <PresetProfiles
                    activeProfileId={activeProfileId}
                    onSelect={handlePresetSelect}
                  />

                  {/* Collapsible advanced controls */}
                  <details className="group">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-white transition-colors select-none flex items-center gap-1.5">
                      <span className="transition-transform group-open:rotate-90 text-[10px]">&#9654;</span>
                      Advanced Controls
                    </summary>
                    <div className="mt-4 space-y-5">
                      {/* Scoring Mode toggle */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-300 font-semibold tracking-wide uppercase">
                          Scoring Mode
                        </label>
                        <div className="flex rounded-lg overflow-hidden border border-white/10">
                          <button
                            onClick={() => setScoringMode('arithmetic')}
                            className={`flex-1 text-xs py-1.5 transition-colors ${
                              scoringMode === 'arithmetic'
                                ? 'bg-nodiac-secondary/20 text-nodiac-secondary'
                                : 'bg-white/5 text-gray-400 hover:text-white'
                            }`}
                          >
                            Arithmetic
                          </button>
                          <button
                            onClick={() => setScoringMode('geometric')}
                            className={`flex-1 text-xs py-1.5 transition-colors ${
                              scoringMode === 'geometric'
                                ? 'bg-nodiac-secondary/20 text-nodiac-secondary'
                                : 'bg-white/5 text-gray-400 hover:text-white'
                            }`}
                          >
                            Geometric
                          </button>
                        </div>
                      </div>

                      {/* Color Mode toggle */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-gray-300 font-semibold tracking-wide uppercase">
                          Color Mode
                        </label>
                        <div className="flex rounded-lg overflow-hidden border border-white/10">
                          <button
                            onClick={() => setColorMode('percentile')}
                            className={`flex-1 text-xs py-1.5 transition-colors ${
                              colorMode === 'percentile'
                                ? 'bg-nodiac-secondary/20 text-nodiac-secondary'
                                : 'bg-white/5 text-gray-400 hover:text-white'
                            }`}
                          >
                            Percentile
                          </button>
                          <button
                            onClick={() => setColorMode('absolute')}
                            className={`flex-1 text-xs py-1.5 transition-colors ${
                              colorMode === 'absolute'
                                ? 'bg-nodiac-secondary/20 text-nodiac-secondary'
                                : 'bg-white/5 text-gray-400 hover:text-white'
                            }`}
                          >
                            Absolute
                          </button>
                        </div>
                      </div>

                      <WeightControls
                        weights={weights}
                        onWeightChange={handleWeightChange}
                      />

                      {/* Threshold slider — only visible in absolute mode */}
                      {colorMode === 'absolute' && (
                        <div className="pt-4 border-t border-white/10 space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-xs text-gray-300 font-semibold tracking-wide uppercase">
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
                              bg-white/10
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
                    </div>
                  </details>
                </div>

                <MapLegend scoreRange={scoreRange} highlightThreshold={highlightThreshold} colorMode={colorMode} />

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
        <hr className="border-white/10" />
      </div>

      {/* Deep Dive Methodology */}
      <MethodologyDeepDive />
    </div>
  )
}
