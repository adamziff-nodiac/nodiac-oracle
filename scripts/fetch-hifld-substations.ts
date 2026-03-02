/**
 * Fetches utility substations from HIFLD ArcGIS REST API, filters to those
 * within 300 miles of any North American Google data center, outputs compact JSON.
 *
 * Output: public/data/prospective-substations.json
 *
 * Compact format: { n, y, x, s, tp, mv, c, co, cf, ln, mnv }
 *   n = NAME, y = LATITUDE, x = LONGITUDE, s = STATE, tp = TYPE, mv = MAX_VOLT
 *   c = CITY, co = COUNTY, cf = COUNTYFIPS, ln = LINES, mnv = MIN_VOLT
 *
 * Run: bun run scripts/fetch-hifld-substations.ts
 */

import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const OUT_DIR = resolve(__dirname, '../public/data')

// HIFLD Electric Substations — full national dataset (~78K substations)
const BASE_URL =
  'https://services6.arcgis.com/OO2s4OoyCZkYJ6oE/arcgis/rest/services/Substations/FeatureServer/0/query'

// North American Google DC coordinates [lng, lat]
const NA_GOOGLE_DCS: [number, number][] = [
  [-95.86, 41.26], [-121.18, 45.6], [-84.75, 33.75], [-96.79, 32.35],
  [-114.98, 36.04], [-86.05, 34.77], [-81.54, 35.91], [-79.95, 33.18],
  [-95.21, 36.3], [-96.99, 32.48], [-87.36, 36.53], [-77.49, 39.04],
  [-95.94, 41.26], [-96.04, 41.15], [-119.53, 39.57], [-82.99, 39.96],
  [-86.16, 39.77], [-101.35, 34.95], [-91.67, 41.98], [-77.51, 37.38],
  [-80.41, 33.08], [-99.73, 33.16], [-94.58, 39.1], [-96.68, 40.81],
  [-111.83, 33.42], [-95.37, 35.75], [-90.18, 35.15], [-96.81, 32.52],
  [-97.06, 36.12],
]

const R_KM = 6371
const MAX_DIST_MI = 300
const MAX_DIST_KM = MAX_DIST_MI * 1.60934

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = Math.PI / 180
  const dLat = (lat2 - lat1) * toRad
  const dLng = (lng2 - lng1) * toRad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2
  return 2 * R_KM * Math.asin(Math.sqrt(a))
}

function isNearAnyGoogleDC(lat: number, lng: number): boolean {
  for (const [dcLng, dcLat] of NA_GOOGLE_DCS) {
    if (haversineKm(lat, lng, dcLat, dcLng) <= MAX_DIST_KM) return true
  }
  return false
}

interface SubstationRaw {
  NAME: string
  STATE: string
  TYPE: string
  STATUS: string
  LATITUDE: number
  LONGITUDE: number
  MAX_VOLT: number
  CITY: string
  COUNTY: string
  COUNTYFIPS: string
  LINES: number
  MIN_VOLT: number
}

interface SubstationCompact {
  n: string
  y: number
  x: number
  s: string
  tp: string
  mv: number | null
  c: string
  co: string
  cf: string
  ln: number | null
  mnv: number | null
}

async function fetchAll(): Promise<SubstationCompact[]> {
  const PAGE_SIZE = 2000
  let offset = 0
  const results: SubstationCompact[] = []
  let total = 0

  while (true) {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: 'NAME,STATE,TYPE,STATUS,LATITUDE,LONGITUDE,MAX_VOLT,CITY,COUNTY,COUNTYFIPS,LINES,MIN_VOLT',
      resultOffset: String(offset),
      resultRecordCount: String(PAGE_SIZE),
      f: 'json',
    })

    const url = `${BASE_URL}?${params}`
    console.log(`Fetching offset=${offset}...`)
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`)

    const data = await resp.json()
    const features = data.features as { attributes: SubstationRaw }[]
    if (!features || features.length === 0) break

    for (const f of features) {
      const a = f.attributes
      if (!a.LATITUDE || !a.LONGITUDE) continue
      if (a.STATUS && a.STATUS.toLowerCase() === 'retired') continue

      if (isNearAnyGoogleDC(a.LATITUDE, a.LONGITUDE)) {
        results.push({
          n: a.NAME || 'Unknown',
          y: +a.LATITUDE.toFixed(4),
          x: +a.LONGITUDE.toFixed(4),
          s: a.STATE || '',
          tp: a.TYPE || '',
          mv: a.MAX_VOLT && a.MAX_VOLT > 0 ? +a.MAX_VOLT.toFixed(0) : null,
          c: a.CITY || '',
          co: a.COUNTY || '',
          cf: a.COUNTYFIPS || '',
          ln: a.LINES && a.LINES > 0 ? a.LINES : null,
          mnv: a.MIN_VOLT && a.MIN_VOLT > 0 ? +a.MIN_VOLT.toFixed(0) : null,
        })
      }
    }

    total += features.length
    console.log(`  Fetched ${features.length} (total raw: ${total}, kept: ${results.length})`)

    if (!data.exceededTransferLimit && features.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return results
}

async function main() {
  console.log(`Fetching HIFLD substations (filtering to within ${MAX_DIST_MI}mi of Google DCs)...`)
  const substations = await fetchAll()

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(resolve(OUT_DIR, 'prospective-substations.json'), JSON.stringify(substations))
  console.log(`\nWrote ${substations.length} substations → public/data/prospective-substations.json`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
