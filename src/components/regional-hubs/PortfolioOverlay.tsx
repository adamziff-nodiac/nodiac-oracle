'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'

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
}

/**
 * Renders portfolio sites as circles on the map.
 * Sites in cluster regions are bright; sites outside are dull gray.
 *
 * regionStatus property:
 *  2 = site in a "member" county (top-scoring cluster county)
 *  1 = site in a "fill" county (within cluster hull)
 *  0 = site outside all cluster regions
 */
export function PortfolioOverlay({ sites, fipsClusterStatus, scoreLookup, visible = true }: PortfolioOverlayProps) {
  const geojson = useMemo(() => {
    const features: GeoJSON.Feature[] = []

    for (const site of sites) {
      if (site.latitude == null || site.longitude == null) continue

      const regionStatus = site.fips_code ? (fipsClusterStatus.get(site.fips_code) ?? 0) : 0
      const countyScore = site.fips_code ? (scoreLookup.get(site.fips_code) ?? 0) : 0

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [site.longitude, site.latitude],
        },
        properties: {
          name: site.site_name,
          score: site.site_score ?? countyScore,
          regionStatus,
        },
      })
    }

    return { type: 'FeatureCollection' as const, features }
  }, [sites, fipsClusterStatus, scoreLookup])

  const visibility = visible ? 'visible' : 'none'

  return (
    <Source id="portfolio-sites-source" type="geojson" data={geojson}>
      {/* Outer glow for in-region sites */}
      <Layer
        id="portfolio-sites-glow"
        type="circle"
        layout={{ visibility }}
        filter={['>', ['get', 'regionStatus'], 0]}
        paint={{
          'circle-radius': 8,
          'circle-color': '#4de2e4',
          'circle-opacity': 0.15,
          'circle-blur': 0.8,
        }}
      />
      {/* Site dots */}
      <Layer
        id="portfolio-sites-dots"
        type="circle"
        layout={{ visibility }}
        paint={{
          'circle-radius': [
            'match', ['get', 'regionStatus'],
            2, 4.5,   // member county: larger
            1, 4,     // fill county: medium
            2.5,      // outside: small
          ],
          'circle-color': [
            'match', ['get', 'regionStatus'],
            2, '#ffffff',  // in member county: white
            1, '#d4c8e0',  // in fill county: light purple
            '#555555',     // outside: dull gray
          ],
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
          'circle-stroke-color': [
            'match', ['get', 'regionStatus'],
            2, '#4de2e4',
            1, '#8b3578',
            '#333333',
          ],
        }}
      />
    </Source>
  )
}
