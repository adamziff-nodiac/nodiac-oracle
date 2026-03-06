'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import type { PortfolioUpload, PortfolioSite, SiteScoreBreakdown } from '@/types/screening'
import type { CriterionKey, ScoringMode } from '@/types/regional-hubs'
import { scoreSiteWeighted, assignPercentileTiers } from '@/lib/scoring/site-scorer'
import { classifyUtilityType } from '@/lib/scoring/utility-classifier'
import { getProfileById, DEFAULT_WEIGHTS } from '@/lib/scoring/weight-profiles'
import { getPortfolioBySlug } from '@/data/portfolio-registry'
import { useCountyScores } from '@/hooks/useCountyScores'

type ScreeningState = 'idle' | 'uploading' | 'scoring' | 'loading-results' | 'done' | 'error'

export type ProgressStep = {
  label: string
  status: 'pending' | 'active' | 'done'
}

export function usePortfolio(prebuiltSlug?: string) {
  const [state, setState] = useState<ScreeningState>(prebuiltSlug ? 'loading-results' : 'idle')
  const [upload, setUpload] = useState<PortfolioUpload | null>(null)
  const [sites, setSites] = useState<PortfolioSite[]>([])
  const [error, setError] = useState<string | null>(null)
  const [siteCount, setSiteCount] = useState<number>(0)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>('balanced')
  const [weights, setWeights] = useState<Record<CriterionKey, number>>({ ...DEFAULT_WEIGHTS })
  const [scoringMode, setScoringMode] = useState<ScoringMode>('arithmetic')
  const [isPrebuilt, setIsPrebuilt] = useState(!!prebuiltSlug)
  const { scores: countyScores } = useCountyScores()

  // Build a FIPS → county score lookup for live scoring
  const countyScoreLookup = useMemo(() => {
    const map: Record<string, SiteScoreBreakdown> = {}
    for (const cs of countyScores) {
      const qp = cs.queue_pressure_score ?? 0
      map[cs.fips_code] = {
        coop_density: cs.coop_density_score,
        grid_reliability: cs.grid_reliability_score,
        clipped_curtailed: cs.clipped_curtailed_score,
        permitting: cs.permitting_score,
        labor: cs.labor_score,
        fiber: cs.fiber_score,
        queue_pressure: qp ?? 0,
      }
    }
    return map
  }, [countyScores])

  // Load pre-built portfolio on mount
  useEffect(() => {
    if (!prebuiltSlug) return

    const portfolio = getPortfolioBySlug(prebuiltSlug)
    if (!portfolio) {
      setError(`Portfolio "${prebuiltSlug}" not found`)
      setState('error')
      return
    }

    let cancelled = false

    async function load() {
      try {
        const res = await fetch(portfolio!.jsonPath)
        if (!res.ok) throw new Error('Failed to load portfolio data')
        const data = await res.json()

        if (cancelled) return

        setUpload({
          id: portfolio!.slug,
          user_id: 'prebuilt',
          name: data.name,
          site_count: data.siteCount,
          created_at: data.generatedAt,
          updated_at: data.generatedAt,
        })
        setSites(data.sites)
        setSiteCount(data.siteCount)
        setIsPrebuilt(true)
        setState('done')
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load portfolio')
        setState('error')
      }
    }

    load()
    return () => { cancelled = true }
  }, [prebuiltSlug])

  // Build progress steps from current state
  const steps: ProgressStep[] = useMemo(() => {
    const siteLabel = siteCount > 0 ? `${siteCount} sites` : 'sites'
    const all: { label: string; doneAt: ScreeningState[] }[] = [
      { label: 'Uploading CSV', doneAt: ['scoring', 'loading-results', 'done'] },
      { label: `Scoring ${siteLabel}`, doneAt: ['loading-results', 'done'] },
      { label: 'Loading results', doneAt: ['done'] },
    ]

    return all.map((step, i) => {
      if (step.doneAt.includes(state)) return { label: step.label, status: 'done' as const }
      const prevAllDone = all.slice(0, i).every(s => s.doneAt.includes(state))
      if (prevAllDone && state !== 'idle' && state !== 'done' && state !== 'error') {
        return { label: step.label, status: 'active' as const }
      }
      return { label: step.label, status: 'pending' as const }
    })
  }, [state, siteCount])

  // Recompute site scores client-side, then assign percentile-based tiers.
  // Always rebuilds score_breakdown from live county-scores.json so portfolio
  // JSONs don't need to bake in scores.
  const scoredSites = useMemo(() => {
    if (sites.length === 0) return sites

    // Pass 1: score each site
    const withScores = sites.map((site) => {
      let utilityType = site.utility_type
      if (!utilityType && site.raw_data) {
        const { utilityType: derived } = classifyUtilityType(
          site.raw_data as Record<string, unknown>
        )
        utilityType = derived
      }

      // Rebuild score_breakdown from live county data if available
      let breakdown = site.score_breakdown
      if (site.fips_code && countyScoreLookup[site.fips_code]) {
        breakdown = { ...countyScoreLookup[site.fips_code] }
      }

      if (!breakdown) {
        return { ...site, utility_type: utilityType }
      }

      // For site screening, co-op score is binary (1 or 0) based on utility type.
      // County-level density is for the regional hubs map; individual sites are
      // either in co-op territory or not.
      if (utilityType) {
        const ut = utilityType.toLowerCase()
        if (ut.includes('co-op') || ut.includes('coop') || ut.includes('cooperative')) {
          breakdown.coop_density = 1
        } else {
          breakdown.coop_density = 0
        }
      }

      const score = scoreSiteWeighted(
        breakdown,
        weights,
        scoringMode
      )

      return { ...site, score_breakdown: breakdown, site_score: score, utility_type: utilityType }
    })

    // Pass 2: assign tiers by percentile rank within the portfolio
    return assignPercentileTiers(withScores)
  }, [sites, weights, scoringMode])

  // Select a preset profile — sets weights and tracks selection
  const setProfileId = useCallback((id: string) => {
    const profile = getProfileById(id)
    if (!profile) return
    setWeights({ ...profile.weights })
    setSelectedProfileId(id)
  }, [])

  // Custom weight change — clears active profile
  const handleWeightChange = useCallback((newWeights: Record<CriterionKey, number>) => {
    setWeights(newWeights)
    setSelectedProfileId(null)
  }, [])

  // Scoring mode change — auto-switch behavior for geometric
  const handleScoringModeChange = useCallback((mode: ScoringMode) => {
    setScoringMode(mode)
  }, [])

  const uploadCSV = useCallback(async (file: File, ippName?: string) => {
    setState('uploading')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)
      if (ippName) formData.append('ipp_name', ippName)

      const res = await fetch('/api/upload-csv', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const { upload_id, site_count } = await res.json()
      setSiteCount(site_count)

      // Start scoring
      setState('scoring')
      const scoreRes = await fetch(`/api/portfolio/${upload_id}/score`, { method: 'POST' })
      if (!scoreRes.ok) {
        const data = await scoreRes.json()
        throw new Error(data.error || 'Scoring failed')
      }

      // Fetch final results
      setState('loading-results')
      const detailRes = await fetch(`/api/portfolio/${upload_id}`)
      if (!detailRes.ok) throw new Error('Failed to load results')

      const { upload: uploadData, sites: sitesData } = await detailRes.json()
      setUpload(uploadData)
      setSites(sitesData)
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setUpload(null)
    setSites([])
    setError(null)
    setSiteCount(0)
    setSelectedProfileId('balanced')
    setWeights({ ...DEFAULT_WEIGHTS })
    setScoringMode('arithmetic')
    setIsPrebuilt(false)
  }, [])

  return {
    state,
    upload,
    sites: scoredSites,
    error,
    siteCount,
    steps,
    selectedProfileId,
    setProfileId,
    weights,
    onWeightChange: handleWeightChange,
    scoringMode,
    onScoringModeChange: handleScoringModeChange,
    uploadCSV,
    reset,
    isPrebuilt,
  }
}
