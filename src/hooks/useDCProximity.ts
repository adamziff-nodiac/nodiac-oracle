'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { haversineKm, kmToMiles } from '@/lib/geo/haversine'
import type { GoogleDataCenter } from '@/data/googleDataCenters'
import { PHASES, type PhaseKey, type PhaseStatuses } from '@/lib/tracker/constants'
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
  owner: string | null
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
  priority: string
  mw: number | null
  siteType: string | null
  hubName: string | null
  utilityName: string | null
  assetOwnerName: string | null
  address: string | null
  ahj: string | null
  voltage: number | null
  phases: PhaseStatuses
}

export interface OperatorGroup {
  name: string
  isPartner: boolean
  partnerStage: string | null
  siteCount: number
  minDistanceMi: number
  sites: ProximitySite[]
}

export interface DCProximityData {
  pipelineSites: PipelineSite[]
  utilityGroups: UtilityGroup[]
  ippSites: ProximitySite[]
  ippOperatorGroups: OperatorGroup[]
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
      return { pipelineSites: [], utilityGroups: [], ippSites: [], ippOperatorGroups: [], totalSites: 0, isLoading }
    }

    const dcLat = selectedDC.coordinates[1]
    const dcLng = selectedDC.coordinates[0]

    // ── Pipeline sites (tracker) ──────────────────
    const PHASE_SCORE: Record<string, number> = {
      'Complete': 2,
      'In Progress': 1,
      'Waiting': 1,
      'Not Started': 0,
    }
    const PHASE_KEYS = PHASES.map(p => p.key)
    const PRIORITY_SCORE: Record<string, number> = {
      'Lead': 5,
      'Active': 4,
      'Pipeline': 3,
      'On Hold': 1,
      'Deprioritized': 0,
    }

    function devProgressScore(site: PipelineSite): number {
      let score = 0
      const phases = site.phases
      for (const key of PHASE_KEYS) {
        score += PHASE_SCORE[phases[key] ?? 'Not Started'] ?? 0
      }
      // Add priority weight so Lead/Active sites break ties
      score += (PRIORITY_SCORE[site.priority] ?? 0) * 0.1
      return score
    }

    const pipelineSites: PipelineSite[] = []
    if (trackerCache?.sites) {
      for (const site of trackerCache.sites) {
        const dist = distanceMiles(site.latitude, site.longitude, dcLat, dcLng)
        if (dist <= radiusMiles) {
          const siteAny = site as Record<string, unknown>
          pipelineSites.push({
            id: site.id,
            name: site.name,
            distanceMi: Math.round(dist),
            priority: site.priority,
            mw: site.mw_current,
            siteType: site.site_type,
            hubName: site.hub_name,
            utilityName: site.utility_name || null,
            assetOwnerName: site.asset_owner_name || null,
            address: (siteAny.address as string) || null,
            ahj: (siteAny.ahj as string) || null,
            voltage: (siteAny.interconnection_voltage_kv as number) ?? null,
            phases: Object.fromEntries(
              PHASES.map(p => [p.key, (site as Record<string, unknown>)[`${p.key}_phase`] as string | null ?? null])
            ) as PhaseStatuses,
          })
        }
      }
      // Sort by development progress (furthest along first), then by distance
      pipelineSites.sort((a, b) => {
        const progressDiff = devProgressScore(b) - devProgressScore(a)
        if (Math.abs(progressDiff) > 0.01) return progressDiff
        return a.distanceMi - b.distanceMi
      })
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
          owner: sub.u || null,
          utility: sub.u || null,
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

    // ── IPP sites within radius, grouped by operator ──
    const ippSites: ProximitySite[] = []
    const operatorMap = new Map<string, ProximitySite[]>()
    const ungroupedIPP: ProximitySite[] = []

    if (ippDistCache) {
      for (const site of ippDistCache) {
        const dist = distanceMiles(site.y, site.x, dcLat, dcLng)
        if (dist > radiusMiles) continue

        const proxSite: ProximitySite = {
          name: site.n,
          type: classifySiteType(site.t),
          state: site.s,
          distanceMi: Math.round(dist),
          voltage: site.kv,
          lat: site.y,
          lng: site.x,
          owner: site.o || null,
          utility: site.su || null,
          utilityType: null,
          holdingCompany: null,
          city: null,
          county: null,
        }

        ippSites.push(proxSite)

        if (site.o) {
          const existing = operatorMap.get(site.o)
          if (existing) {
            existing.push(proxSite)
          } else {
            operatorMap.set(site.o, [proxSite])
          }
        } else {
          ungroupedIPP.push(proxSite)
        }
      }
      ippSites.sort((a, b) => a.distanceMi - b.distanceMi)
    }

    // Build operator groups with partner matching
    const ippOperatorGroups: OperatorGroup[] = []
    for (const [name, sites] of operatorMap) {
      sites.sort((a, b) => a.distanceMi - b.distanceMi)
      const partner = partnerLookup.get(name.toLowerCase())

      ippOperatorGroups.push({
        name,
        isPartner: !!partner,
        partnerStage: partner?.relationship_stage ?? null,
        siteCount: sites.length,
        minDistanceMi: sites[0]?.distanceMi ?? 0,
        sites,
      })
    }

    if (ungroupedIPP.length > 0) {
      ungroupedIPP.sort((a, b) => a.distanceMi - b.distanceMi)
      ippOperatorGroups.push({
        name: 'Unknown Operator',
        isPartner: false,
        partnerStage: null,
        siteCount: ungroupedIPP.length,
        minDistanceMi: ungroupedIPP[0]?.distanceMi ?? 0,
        sites: ungroupedIPP,
      })
    }

    // Sort: partners first, then by site count desc, unknown last
    ippOperatorGroups.sort((a, b) => {
      if (a.name === 'Unknown Operator') return 1
      if (b.name === 'Unknown Operator') return -1
      if (a.isPartner !== b.isPartner) return a.isPartner ? -1 : 1
      return b.siteCount - a.siteCount
    })

    const totalSites = utilityGroups.reduce((sum, g) => sum + g.siteCount, 0) + ippSites.length

    return { pipelineSites, utilityGroups, ippSites, ippOperatorGroups, totalSites, isLoading }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDC, radiusMiles, isLoading, dataVersion])
}
