'use client'

import { useState, useCallback, useMemo } from 'react'
import type { PortfolioUpload, PortfolioSite } from '@/types/screening'
import type { CriterionKey, ScoringMode } from '@/types/regional-hubs'
import { scoreSiteWeighted, assignPercentileTiers } from '@/lib/scoring/site-scorer'
import { classifyUtilityType } from '@/lib/scoring/utility-classifier'
import { getProfileById, DEFAULT_WEIGHTS } from '@/lib/scoring/weight-profiles'

type ScreeningState = 'idle' | 'uploading' | 'scoring' | 'loading-results' | 'done' | 'error'

export type ProgressStep = {
  label: string
  status: 'pending' | 'active' | 'done'
}

export function usePortfolio() {
  const [state, setState] = useState<ScreeningState>('idle')
  const [upload, setUpload] = useState<PortfolioUpload | null>(null)
  const [sites, setSites] = useState<PortfolioSite[]>([])
  const [error, setError] = useState<string | null>(null)
  const [siteCount, setSiteCount] = useState<number>(0)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>('balanced')
  const [weights, setWeights] = useState<Record<CriterionKey, number>>({ ...DEFAULT_WEIGHTS })
  const [scoringMode, setScoringMode] = useState<ScoringMode>('arithmetic')

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

      if (!site.score_breakdown) {
        return { ...site, utility_type: utilityType }
      }

      const score = scoreSiteWeighted(
        site.score_breakdown,
        weights,
        scoringMode
      )

      return { ...site, site_score: score, utility_type: utilityType }
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

  const uploadCSV = useCallback(async (file: File) => {
    setState('uploading')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)

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
  }
}
