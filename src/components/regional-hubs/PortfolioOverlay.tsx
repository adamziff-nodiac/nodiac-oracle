'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { ViewMode } from './HubMap'
import { computeTierBreaks, getTier, getTierColor } from './TierHubsLayer'

interface PortfolioSiteMinimal {
  latitude: number | null
  longitude: number | null
  fips_code: string | null
  site_name: string
  site_score: number | null
}

interface PortfolioOverlayProps {
  sites: PortfolioSiteMinimal[]
  fipsClusterStatus: Map<string, number>
  scoreLookup: Map<string, number>
  visible?: boolean
  viewMode?: ViewMode
}

/**
 * Renders portfolio sites as circles on the map.
 * Sites in cluster regions are bright; sites outside are dull gray.
 *
 * regionStatus property:
 *  2 = site in a "member" county (top-scoring cluster county)
 *  1 = site in a "fill" county (within cluster hull)
 *  0 = site outside all cluster regions
 *
 * In gradient mode, sites are colored by their score gradient.
 * In tiers mode, sites are colored by their county's tier color.
 */
export function PortfolioOverlay({ sites, fipsClusterStatus, scoreLookup, visible = true, viewMode = 'regions' }: PortfolioOverlayProps) {
  const tierBreaks = useMemo(() => computeTierBreaks(scoreLookup), [scoreLookup])

  const geojson = useMemo(() => {
    const features: GeoJSON.Feature[] = []

    for (const site of sites) {
      if (site.latitude == null || site.longitude == null) continue

      const regionStatus = site.fips_code ? (fipsClusterStatus.get(site.fips_code) ?? 0) : 0
      const countyScore = site.fips_code ? (scoreLookup.get(site.fips_code) ?? 0) : 0
      const score = site.site_score ?? countyScore

      let tier: number | null = null
      let tierColor: string | null = null
      if (tierBreaks && regionStatus > 0) {
        tier = getTier(score, tierBreaks)
        tierColor = getTierColor(tier)
      }

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [site.longitude, site.latitude],
        },
        properties: {
          name: site.site_name,
          score,
          regionStatus,
          tier,
          tierColor,
        },
      })
    }

    return { type: 'FeatureCollection' as const, features }
  }, [sites, fipsClusterStatus, scoreLookup, tierBreaks])

  const visibility = visible ? 'visible' : 'none'

  const GRAD_LOW = '#1a1520'
  const GRAD_MID_LOW = '#2d2233'
  const GRAD_MID = '#5c2d55'
  const GRAD_HIGH = '#8b3578'
  const GRAD_ORCHID = '#b48fc1'
  const GRAD_PEAK = '#4de2e4'

  const isGradient = viewMode === 'gradient'
  const isTiers = viewMode === 'tiers'

  const dotColorExpression = useMemo(() => {
    if (isTiers) {
      return [
        'case',
        ['==', ['get', 'regionStatus'], 0], '#555555',
        ['has', 'tierColor'], ['get', 'tierColor'],
        '#555555',
      ] as unknown as string
    }
    if (isGradient) {
      return [
        'case',
        ['==', ['get', 'regionStatus'], 0], '#555555',
        [
          'interpolate',
          ['linear'],
          ['get', 'score'],
          0, GRAD_LOW,
          2, GRAD_MID_LOW,
          4, GRAD_MID,
          6, GRAD_HIGH,
          7.5, GRAD_ORCHID,
          10, GRAD_PEAK,
        ],
      ] as unknown as string
    }
    return [
      'match', ['get', 'regionStatus'],
      2, '#ffffff',
      1, '#d4c8e0',
      '#555555',
    ] as unknown as string
  }, [isGradient, isTiers])

  const strokeColorExpression = useMemo(() => {
    if (isTiers) {
      return [
        'case',
        ['==', ['get', 'regionStatus'], 0], '#333333',
        'rgba(255, 255, 255, 0.6)',
      ] as unknown as string
    }
    if (isGradient) {
      return [
        'case',
        ['==', ['get', 'regionStatus'], 0], '#333333',
        'rgba(255, 255, 255, 0.5)',
      ] as unknown as string
    }
    return [
      'match', ['get', 'regionStatus'],
      2, '#4de2e4',
      1, '#8b3578',
      '#333333',
    ] as unknown as string
  }, [isGradient, isTiers])

  const glowColor = isTiers
    ? [
        'case',
        ['==', ['get', 'tier'], 1], '#4de2e4',
        ['==', ['get', 'tier'], 2], '#2a9d8f',
        '#6b4d7a',
      ] as unknown as string
    : '#4de2e4'

  return (
    <Source id="portfolio-sites-source" type="geojson" data={geojson}>
      <Layer
        id="portfolio-sites-glow"
        type="circle"
        layout={{ visibility }}
        filter={['>', ['get', 'regionStatus'], 0]}
        paint={{
          'circle-radius': 22,
          'circle-color': glowColor,
          'circle-opacity': 0.15,
          'circle-blur': 0.8,
        }}
      />
      <Layer
        id="portfolio-sites-dots"
        type="circle"
        layout={{ visibility }}
        paint={{
          'circle-radius': [
            'match', ['get', 'regionStatus'],
            2, 11,
            1, 9.5,
            6,
          ],
          'circle-color': dotColorExpression,
          'circle-opacity': [
            'match', ['get', 'regionStatus'],
            2, 0.95,
            1, 0.8,
            0.3,
          ],
          'circle-stroke-width': [
            'match', ['get', 'regionStatus'],
            2, 1.5,
            1, 1,
            0.5,
          ],
          'circle-stroke-color': strokeColorExpression,
        }}
      />
    </Source>
  )
}
