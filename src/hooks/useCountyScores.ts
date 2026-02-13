'use client'

import { useState, useEffect } from 'react'
import type { CountyScore, PermittingCitation, CountyScoreData } from '@/types/regional-hubs'

async function fetchStaticFallback(): Promise<{ counties: CountyScore[]; registry: PermittingCitation[] }> {
  const res = await fetch('/data/county-scores.json')
  if (!res.ok) throw new Error('Failed to load static county scores')
  const raw = await res.json()

  // Support both old flat array format and new wrapped format
  if (Array.isArray(raw)) {
    return { counties: raw, registry: [] }
  }
  const data = raw as CountyScoreData
  return {
    counties: data.counties ?? [],
    registry: data.permitting_citation_registry ?? [],
  }
}

export function useCountyScores() {
  const [scores, setScores] = useState<CountyScore[]>([])
  const [citationRegistry, setCitationRegistry] = useState<PermittingCitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchScores() {
      try {
        let data: CountyScore[] = []
        let registry: PermittingCitation[] = []

        // Try API first
        try {
          const res = await fetch('/api/county-scores')
          if (res.ok) {
            data = await res.json()
          }
        } catch {
          // API failed, will try fallback
        }

        // Fall back to static JSON if API returned nothing or a truncated set
        // (Supabase defaults to 1000 rows which misses many states)
        if (data.length < 2000) {
          const fallback = await fetchStaticFallback()
          data = fallback.counties
          registry = fallback.registry
        }

        if (!cancelled) {
          setScores(data)
          setCitationRegistry(registry)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load county scores')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchScores()
    return () => { cancelled = true }
  }, [])

  return { scores, citationRegistry, isLoading, error }
}
