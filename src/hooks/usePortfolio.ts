'use client'

import { useState, useCallback, useMemo } from 'react'
import type { PortfolioUpload, PortfolioSite } from '@/types/screening'
import type { CriterionKey } from '@/types/regional-hubs'
import { scoreSiteWeighted } from '@/lib/scoring/site-scorer'
import { getProfileById } from '@/lib/scoring/weight-profiles'

type ScreeningState = 'idle' | 'uploading' | 'scoring' | 'done' | 'error'

export function usePortfolio() {
  const [state, setState] = useState<ScreeningState>('idle')
  const [upload, setUpload] = useState<PortfolioUpload | null>(null)
  const [sites, setSites] = useState<PortfolioSite[]>([])
  const [error, setError] = useState<string | null>(null)
  const [siteCount, setSiteCount] = useState<number>(0)
  const [selectedProfileId, setProfileId] = useState<string>('balanced')

  // Recompute site scores/tiers client-side when the weight profile changes
  const scoredSites = useMemo(() => {
    if (sites.length === 0) return sites

    const profile = getProfileById(selectedProfileId)
    if (!profile) return sites

    return sites.map((site) => {
      if (!site.score_breakdown) return site

      const { score, tier } = scoreSiteWeighted(
        site.score_breakdown,
        profile.weights as Record<CriterionKey, number>
      )

      return { ...site, site_score: score, tier }
    })
  }, [sites, selectedProfileId])

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
    setProfileId('balanced')
  }, [])

  return {
    state,
    upload,
    sites: scoredSites,
    error,
    siteCount,
    selectedProfileId,
    setProfileId,
    uploadCSV,
    reset,
  }
}
