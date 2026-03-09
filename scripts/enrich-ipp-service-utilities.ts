/**
 * Enrich IPP site JSON files with HIFLD service utility territory data.
 * Uses point-in-polygon queries against ArcGIS to map each site's lat/lon
 * to the electric utility serving that location.
 *
 * Usage: bun run scripts/enrich-ipp-service-utilities.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const OUT_DIR = resolve(import.meta.dirname!, '../public/data')

const FEATURE_SERVER_URL =
  'https://services3.arcgis.com/OYP7N6mAJJCyH6hd/arcgis/rest/services/' +
  'Electric_Retail_Service_Territories_HIFLD/FeatureServer/0/query'

interface IPPSite {
  id: number
  n: string
  y: number
  x: number
  s: string
  t: string
  kv: number | null
  vt?: string | null
  o: string | null
  su?: string | null
}

async function lookupUtility(lat: number, lon: number): Promise<string | null> {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'NAME',
    returnGeometry: 'false',
    f: 'json',
  })

  const res = await fetch(`${FEATURE_SERVER_URL}?${params}`, {
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) return null

  const data = await res.json()
  return data.features?.[0]?.attributes?.NAME ?? null
}

async function fetchWithRetry(lat: number, lon: number, retries = 3): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await lookupUtility(lat, lon)
    } catch {
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)))
      }
    }
  }
  return null
}

async function enrichFile(filename: string) {
  const filePath = resolve(OUT_DIR, filename)
  const sites: IPPSite[] = JSON.parse(readFileSync(filePath, 'utf-8'))

  console.log(`\nEnriching ${filename} (${sites.length} sites)...`)

  // Check how many already have su field
  const alreadyEnriched = sites.filter(s => s.su !== undefined).length
  if (alreadyEnriched === sites.length) {
    console.log('  All sites already enriched, skipping.')
    return
  }

  const needsLookup = sites.filter(s => s.su === undefined)
  console.log(`  ${needsLookup.length} sites need utility lookup...`)

  const CONCURRENCY = 10
  let completed = 0
  let found = 0

  for (let i = 0; i < needsLookup.length; i += CONCURRENCY) {
    const batch = needsLookup.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map(async (site) => {
        const utility = await fetchWithRetry(site.y, site.x)
        site.su = utility
        if (utility) found++
        completed++
        return utility
      })
    )

    if (completed % 100 === 0 || completed === needsLookup.length) {
      console.log(`  Progress: ${completed}/${needsLookup.length} (${found} found)`)
    }
  }

  // Write back
  writeFileSync(filePath, JSON.stringify(sites))
  console.log(`  Done: ${found}/${needsLookup.length} sites matched to a utility`)
}

async function main() {
  console.log('Enriching IPP sites with HIFLD service utility data...')

  await enrichFile('prospective-ipp-dist.json')
  await enrichFile('prospective-ipp-all.json')

  console.log('\nDone!')
}

main().catch(console.error)
