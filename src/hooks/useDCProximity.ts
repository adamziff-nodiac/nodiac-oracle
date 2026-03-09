'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { haversineKm, kmToMiles } from '@/lib/geo/haversine'
import type { GoogleDataCenter } from '@/data/googleDataCenters'
import type { IPPSiteCompact, SubstationCompact } from '@/types/prospective-sites'
import type { DCProximityResponse, DCProximityPartner, DCProximitySite as TrackerSiteSlim } from '@/app/api/dc-proximity/route'

// ── Result types ──────────────────────────────────────

export interface ProximitySite {
  name: string
  type: 'solar' | 'wind' | 'storage' | 'hydro' | 'other' | 'substation'
  state: string
  distanceMi: number
  voltage: number | null
  lat: number
  lng: number
  utility: string | null
  utilityType: string | null
  holdingCompany: string | null
  city: string | null
  county: string | null
}

export interface UtilityGroup {
  name: string
  utilityType: string | null
  isPartner: boolean
  partnerStage: string | null
  siteCount: number
  minDistanceMi: number
  sites: ProximitySite[]
}

export interface PipelineSite {
  id: string
  name: string
  distanceMi: number
  partnerName: string | null
  priority: string
  mw: number | null
  siteType: string | null
  hubName: string | null
}

export interface DCProximityData {
  pipelineSites: PipelineSite[]
  utilityGroups: UtilityGroup[]
  ippSites: ProximitySite[]
  totalSites: number
  isLoading: boolean
}

// ── Module-level caches ───────────────────────────────

let ippDistCache: IPPSiteCompact[] | null = null
let substationCache: SubstationCompact[] | null = null
let trackerCache: DCProximityResponse | null = null
let dataLoadPromise: Promise<void> | null = null
let trackerLoadPromise: Promise<void> | null = null

function classifySiteType(techType: string): ProximitySite['type'] {
  const t = techType.toLowerCase()
  if (t.includes('solar') || t.includes('photovoltaic')) return 'solar'
  if (t.includes('wind')) return 'wind'
  if (t.includes('storage') || t.includes('battery')) return 'storage'
  if (t.includes('hydro')) return 'hydro'
  return 'other'
}

function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return kmToMiles(haversineKm(lat1, lng1, lat2, lng2))
}

// ── Hook ──────────────────────────────────────────────

interface UseDCProximityParams {
  selectedDC: GoogleDataCenter | null
  radiusMiles: number
}

export function useDCProximity({ selectedDC, radiusMiles }: UseDCProximityParams): DCProximityData {
  const [isLoading, setIsLoading] = useState(false)
  const [dataVersion, setDataVersion] = useState(0)
  const abortRef = useRef(0)

  // Load prospective sites JSON (browser-cached if already loaded by useProspectiveSites)
  useEffect(() => {
    if (!selectedDC) return
    if (ippDistCache && substationCache) {
      // Already loaded, just trigger recompute
      setDataVersion(v => v + 1)
      return
    }

    const batchId = ++abortRef.current
    setIsLoading(true)

    if (!dataLoadPromise) {
      dataLoadPromise = Promise.all([
        fetch('/data/prospective-ipp-dist.json').then(r => r.json()),
        fetch('/data/prospective-substations.json').then(r => r.json()),
      ]).then(([dist, subs]) => {
        ippDistCache = dist as IPPSiteCompact[]
        substationCache = subs as SubstationCompact[]
      })
    }

    dataLoadPromise
      .then(() => {
        if (batchId !== abortRef.current) return
        setDataVersion(v => v + 1)
        setIsLoading(false)
      })
      .catch(() => {
        if (batchId !== abortRef.current) return
        setIsLoading(false)
      })
  }, [selectedDC])

  // Load tracker data (partners + sites) — graceful failure
  useEffect(() => {
    if (!selectedDC) return
    if (trackerCache) return

    if (!trackerLoadPromise) {
      trackerLoadPromise = fetch('/api/dc-proximity')
        .then(r => r.json())
        .then((data: DCProximityResponse) => {
          trackerCache = data
        })
        .catch(() => {
          trackerCache = { partners: [], sites: [] }
        })
    }

    trackerLoadPromise.then(() => setDataVersion(v => v + 1))
  }, [selectedDC])

  return useMemo(() => {
    if (!selectedDC || isLoading || (!ippDistCache && !substationCache)) {
      return { pipelineSites: [], utilityGroups: [], ippSites: [], totalSites: 0, isLoading }
    }

    const dcLat = selectedDC.coordinates[1]
    const dcLng = selectedDC.coordinates[0]

    // ── Pipeline sites (tracker) ──────────────────
    const pipelineSites: PipelineSite[] = []
    if (trackerCache?.sites) {
      for (const site of trackerCache.sites) {
        const dist = distanceMiles(site.latitude, site.longitude, dcLat, dcLng)
        if (dist <= radiusMiles) {
          pipelineSites.push({
            id: site.id,
            name: site.name,
            distanceMi: Math.round(dist),
            partnerName: site.utility_name || site.asset_owner_name || null,
            priority: site.priority,
            mw: site.mw_current,
            siteType: site.site_type,
            hubName: site.hub_name,
          })
        }
      }
      pipelineSites.sort((a, b) => a.distanceMi - b.distanceMi)
    }

    // ── Build partner name lookup (case-insensitive) ──
    const partnerLookup = new Map<string, DCProximityPartner>()
    if (trackerCache?.partners) {
      for (const p of trackerCache.partners) {
        partnerLookup.set(p.name.toLowerCase(), p)
      }
    }

    // ── Substations within radius, grouped by utility ──
    const utilityMap = new Map<string, { sites: ProximitySite[]; utilityType: string | null }>()
    if (substationCache) {
      for (const sub of substationCache) {
        // Distribution only: max voltage < 69kV
        if (sub.mv != null && sub.mv >= 69) continue

        const dist = distanceMiles(sub.y, sub.x, dcLat, dcLng)
        if (dist > radiusMiles) continue

        const site: ProximitySite = {
          name: sub.n,
          type: 'substation',
          state: sub.s,
          distanceMi: Math.round(dist),
          voltage: sub.mv,
          lat: sub.y,
          lng: sub.x,
          utility: sub.u,
          utilityType: sub.ut,
          holdingCompany: sub.hc,
          city: sub.c || null,
          county: sub.co || null,
        }

        const key = sub.u?.trim() || sub.hc?.trim() || 'Unknown Utility'
        const existing = utilityMap.get(key)
        if (existing) {
          existing.sites.push(site)
        } else {
          utilityMap.set(key, { sites: [site], utilityType: sub.ut })
        }
      }
    }

    // Build utility groups with partner matching
    const utilityGroups: UtilityGroup[] = []
    for (const [name, { sites, utilityType }] of utilityMap) {
      sites.sort((a, b) => a.distanceMi - b.distanceMi)
      const partner = partnerLookup.get(name.toLowerCase())

      utilityGroups.push({
        name,
        utilityType,
        isPartner: !!partner,
        partnerStage: partner?.relationship_stage ?? null,
        siteCount: sites.length,
        minDistanceMi: sites[0]?.distanceMi ?? 0,
        sites,
      })
    }

    // Sort: existing partners first, then by site count desc
    utilityGroups.sort((a, b) => {
      if (a.isPartner !== b.isPartner) return a.isPartner ? -1 : 1
      return b.siteCount - a.siteCount
    })

    // ── IPP sites within radius ──
    const ippSites: ProximitySite[] = []
    if (ippDistCache) {
      for (const site of ippDistCache) {
        const dist = distanceMiles(site.y, site.x, dcLat, dcLng)
        if (dist > radiusMiles) continue

        ippSites.push({
          name: site.n,
          type: classifySiteType(site.t),
          state: site.s,
          distanceMi: Math.round(dist),
          voltage: site.kv,
          lat: site.y,
          lng: site.x,
          utility: null,
          utilityType: null,
          holdingCompany: null,
          city: null,
          county: null,
        })
      }
      ippSites.sort((a, b) => a.distanceMi - b.distanceMi)
    }

    const totalSites = utilityGroups.reduce((sum, g) => sum + g.siteCount, 0) + ippSites.length

    return { pipelineSites, utilityGroups, ippSites, totalSites, isLoading }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDC, radiusMiles, isLoading, dataVersion])
}
