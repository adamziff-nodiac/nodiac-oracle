'use client'

import { useMemo, useState, useEffect } from 'react'
import { haversineKm, kmToMiles, milesToKm } from '@/lib/geo/haversine'
import { googleDataCenters } from '@/data/googleDataCenters'
import type { IPPSiteCompact, SubstationCompact, ProspectiveSiteProperties } from '@/types/prospective-sites'

// NA Google DC coordinates for distance pre-computation
const NA_DCS = googleDataCenters
  .filter((dc) => dc.region === 'North America')
  .map((dc) => ({ lat: dc.coordinates[1], lng: dc.coordinates[0] }))

// Module-level cache: loaded once, shared across renders
let ippAllCache: IPPSiteCompact[] | null = null
let ippDistCache: IPPSiteCompact[] | null = null
let substationCache: SubstationCompact[] | null = null

// Pre-computed nearest-DC distance (miles) per site, keyed by cache identity
let ippAllDistances: Float32Array | null = null
let ippDistDistances: Float32Array | null = null
let substationDistances: Float32Array | null = null

function nearestDCMiles(lat: number, lng: number): number {
  let min = Infinity
  for (const dc of NA_DCS) {
    const d = haversineKm(lat, lng, dc.lat, dc.lng)
    if (d < min) min = d
  }
  return kmToMiles(min)
}

function precomputeDistances(sites: { y: number; x: number }[]): Float32Array {
  const arr = new Float32Array(sites.length)
  for (let i = 0; i < sites.length; i++) {
    arr[i] = nearestDCMiles(sites[i].y, sites[i].x)
  }
  return arr
}

function classifySiteType(techType: string): ProspectiveSiteProperties['siteType'] {
  const t = techType.toLowerCase()
  if (t.includes('solar') || t.includes('photovoltaic')) return 'solar'
  if (t.includes('wind')) return 'wind'
  if (t.includes('storage') || t.includes('battery')) return 'storage'
  if (t.includes('hydro')) return 'hydro'
  return 'other'
}

interface UseProspectiveSitesParams {
  enabled: boolean
  showIPP: boolean
  showSubstations: boolean
  includeTransmission: boolean // false = distribution-connected only
  radiusMiles: number
}

interface UseProspectiveSitesResult {
  geojson: GeoJSON.FeatureCollection<GeoJSON.Point, ProspectiveSiteProperties> | null
  ippCount: number
  substationCount: number
  isLoading: boolean
}

export function useProspectiveSites({
  enabled,
  showIPP,
  showSubstations,
  includeTransmission,
  radiusMiles,
}: UseProspectiveSitesParams): UseProspectiveSitesResult {
  const [isLoading, setIsLoading] = useState(false)
  const [dataVersion, setDataVersion] = useState(0)

  // Lazy-load data on first enable
  useEffect(() => {
    if (!enabled) return
    if (ippAllCache && ippDistCache && substationCache) return

    let cancelled = false
    setIsLoading(true)

    Promise.all([
      fetch('/data/prospective-ipp-all.json').then((r) => r.json()),
      fetch('/data/prospective-ipp-dist.json').then((r) => r.json()),
      fetch('/data/prospective-substations.json').then((r) => r.json()),
    ])
      .then(([all, dist, subs]) => {
        if (cancelled) return
        ippAllCache = all as IPPSiteCompact[]
        ippDistCache = dist as IPPSiteCompact[]
        substationCache = subs as SubstationCompact[]

        // Pre-compute distances
        ippAllDistances = precomputeDistances(ippAllCache)
        ippDistDistances = precomputeDistances(ippDistCache)
        substationDistances = precomputeDistances(substationCache)

        setDataVersion((v) => v + 1)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('[useProspectiveSites] Failed to load data:', err)
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  const radiusKm = milesToKm(radiusMiles)

  const result = useMemo(() => {
    if (!enabled || isLoading) return { geojson: null, ippCount: 0, substationCount: 0, isLoading }

    const features: GeoJSON.Feature<GeoJSON.Point, ProspectiveSiteProperties>[] = []
    let ippCount = 0
    let substationCount = 0

    // IPP sites
    if (showIPP) {
      const sites = includeTransmission ? ippAllCache : ippDistCache
      const distances = includeTransmission ? ippAllDistances : ippDistDistances
      if (sites && distances) {
        const maxMiles = radiusMiles
        for (let i = 0; i < sites.length; i++) {
          if (distances[i] > maxMiles) continue
          const site = sites[i]
          ippCount++
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [site.x, site.y] },
            properties: {
              name: site.n,
              siteType: classifySiteType(site.t),
              state: site.s,
              voltage: site.kv,
              voltageTier: site.vt ?? null,
              nearestDCMiles: Math.round(distances[i]),
            },
          })
        }
      }
    }

    // Substations
    if (showSubstations && substationCache && substationDistances) {
      const maxMiles = radiusMiles
      for (let i = 0; i < substationCache.length; i++) {
        if (substationDistances[i] > maxMiles) continue
        const sub = substationCache[i]
        // Filter by voltage: distribution < 69kV, transmission >= 69kV
        if (!includeTransmission && sub.mv != null && sub.mv >= 69) continue
        substationCount++
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [sub.x, sub.y] },
          properties: {
            name: sub.n,
            siteType: 'substation',
            state: sub.s,
            voltage: sub.mv,
            nearestDCMiles: Math.round(substationDistances[i]),
          },
        })
      }
    }

    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point, ProspectiveSiteProperties> = {
      type: 'FeatureCollection',
      features,
    }

    return { geojson, ippCount, substationCount, isLoading }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, showIPP, showSubstations, includeTransmission, radiusMiles, radiusKm, isLoading, dataVersion])

  return result
}
