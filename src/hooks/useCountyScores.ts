'use client'

import { useState, useEffect } from 'react'
import type { CountyScore } from '@/types/regional-hubs'

async function fetchStaticFallback(): Promise<CountyScore[]> {
  const res = await fetch('/data/county-scores.json')
  if (!res.ok) throw new Error('Failed to load static county scores')
  return res.json()
}

export function useCountyScores() {
  const [scores, setScores] = useState<CountyScore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchScores() {
      try {
        let data: CountyScore[] = []

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
          data = await fetchStaticFallback()
        }

        if (!cancelled) {
          setScores(data)
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

  return { scores, isLoading, error }
}
