'use client'

import { useState, useEffect } from 'react'
import type { CountyScore } from '@/types/regional-hubs'

export function useCountyScores() {
  const [scores, setScores] = useState<CountyScore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchScores() {
      try {
        // Try API first, fall back to static JSON
        let data: CountyScore[]

        const res = await fetch('/api/county-scores')
        if (res.ok) {
          data = await res.json()
        } else {
          // Fallback to static data
          const fallback = await fetch('/data/county-scores.json')
          if (!fallback.ok) throw new Error('Failed to load county scores')
          data = await fallback.json()
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
