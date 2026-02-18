'use client'

import { useState, useEffect } from 'react'

interface PortfolioSiteMinimal {
  latitude: number | null
  longitude: number | null
  fips_code: string | null
  site_name: string
  site_score: number | null
}

interface PortfolioData {
  name: string
  siteCount: number
  sites: PortfolioSiteMinimal[]
}

/**
 * Loads the Greenbacker full portfolio (462 sites) from static JSON.
 * Returns minimal site data needed for the map overlay.
 */
export function usePortfolioSites(): { sites: PortfolioSiteMinimal[]; isLoading: boolean } {
  const [sites, setSites] = useState<PortfolioSiteMinimal[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    fetch('/data/portfolios/greenbacker-full.json')
      .then(res => res.json())
      .then((data: PortfolioData) => {
        if (cancelled) return
        // Only keep sites with coordinates
        const withCoords = data.sites.filter(
          (s: PortfolioSiteMinimal) => s.latitude != null && s.longitude != null
        )
        setSites(withCoords)
      })
      .catch(err => {
        console.error('[usePortfolioSites] Failed to load portfolio:', err)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { sites, isLoading }
}
