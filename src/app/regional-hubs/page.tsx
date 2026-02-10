'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
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
import { useCountyScores } from '@/hooks/useCountyScores'
import { useHubRegions } from '@/hooks/useHubRegions'
import { useWeightedScores } from '@/hooks/useWeightedScores'
import { DEFAULT_WEIGHTS } from '@/lib/scoring/weight-profiles'
import type { CriterionKey, WeightedCountyScore } from '@/types/regional-hubs'

export default function RegionalHubsPage() {
  const { scores, isLoading: scoresLoading } = useCountyScores()
  const { regions } = useHubRegions()

  const [weights, setWeights] = useState<Record<CriterionKey, number>>({ ...DEFAULT_WEIGHTS })
  const [activeProfileId, setActiveProfileId] = useState<string | null>('balanced')
  const [selectedCounty, setSelectedCounty] = useState<WeightedCountyScore | null>(null)

  const { weightedScores, scoreLookup, scoreRange } = useWeightedScores(scores, weights)

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
                />

                {/* Floating weight panel */}
                <div className="absolute top-4 left-4 w-64 bg-nodiac-dark/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 space-y-5 z-10 max-h-[calc(70vh-2rem)] overflow-y-auto">
                  <PresetProfiles
                    activeProfileId={activeProfileId}
                    onSelect={handlePresetSelect}
                  />
                  <WeightControls
                    weights={weights}
                    onWeightChange={handleWeightChange}
                  />
                </div>

                <MapLegend scoreRange={scoreRange} />

                {/* Export button */}
                <div className="absolute top-4 right-4 z-10">
                  <ExportControls targetRef={mapExportRef} />
                </div>

                {/* County detail panel */}
                <CountyDetailPanel
                  county={selectedCounty}
                  onClose={handleCloseDetail}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Narrative */}
      <NarrativeSection />
    </div>
  )
}
