'use client'

import { useState, useEffect } from 'react'
import type { HubRegion } from '@/types/regional-hubs'

export function useHubRegions() {
  const [regions, setRegions] = useState<HubRegion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchRegions() {
      try {
        const res = await fetch('/api/hub-regions')
        if (!res.ok) throw new Error('Failed to load hub regions')
        const data = await res.json()
        if (!cancelled) {
          setRegions(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load hub regions')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchRegions()
    return () => { cancelled = true }
  }, [])

  return { regions, isLoading, error }
}
