/**
 * Generate pre-scored portfolio JSON files from Fleet CIR Validated CSVs.
 *
 * Usage: bun run scripts/generate-portfolios.ts
 *
 * Reads CSVs, resolves FIPS codes via county/state matching + FCC API,
 * checks co-op territory via ArcGIS API, builds score breakdowns from
 * static county-scores.json, and outputs scored PortfolioSite JSON files.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ── Types ──────────────────────────────────────────────────────────────

interface SiteScoreBreakdown {
  coop_density: number | null
  grid_reliability: number | null
  clipped_curtailed: number | null
  permitting: number | null
  labor: number | null
  fiber: number | null
  queue_pressure: number | null
}

interface CountyScoreRow {
  fips_code: string
  county_name: string
  state_abbr: string
  coop_density_score: number
  grid_reliability_score: number
  clipped_curtailed_score: number
  permitting_score: number
  labor_score: number
  fiber_score: number
  queue_pressure_score: number
}

interface PortfolioSite {
  id: string
  upload_id: string
  site_name: string
  latitude: number | null
  longitude: number | null
  county: string | null
  state: string | null
  fips_code: string | null
  raw_data: Record<string, string>
  site_score: number | null
  tier: 'good' | 'okay' | 'bad' | null
  score_breakdown: SiteScoreBreakdown | null
  utility_type: string | null
}

interface PortfolioConfig {
  slug: string
  name: string
  csvPath: string
}

// ── Config ─────────────────────────────────────────────────────────────

const DOWNLOADS = '/Users/adamziff/Downloads'
const ROOT = resolve(new URL('.', import.meta.url).pathname, '..')
const COUNTY_SCORES_PATH = resolve(ROOT, 'public/data/county-scores.json')
const OUTPUT_DIR = resolve(ROOT, 'public/data/portfolios')

const PORTFOLIOS: PortfolioConfig[] = [
  {
    slug: 'greenbacker',
    name: 'Greenbacker Portfolio',
    csvPath: resolve(DOWNLOADS, 'Fleet CIR Validated - Master.csv'),
  },
  {
    slug: 'greenbacker-full',
    name: 'Greenbacker Full Portfolio',
    csvPath: resolve(DOWNLOADS, 'Fleet CIR Validated - gb filtered phase 1.csv'),
  },
  {
    slug: 'powerbank',
    name: 'Powerbank Portfolio',
    csvPath: resolve(DOWNLOADS, 'Fleet CIR Validated - Powerbank Sites.csv'),
  },
]

// ── CSV Parsing ────────────────────────────────────────────────────────

/** Parse a CSV line respecting quoted fields. */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

/**
 * Parse a CSV string handling multiline quoted fields.
 * Returns [headers, rows] where rows are arrays of field values.
 */
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = []
  let current = ''
  let inQuotes = false

  // Split into logical lines (respecting quoted newlines)
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      current += ch
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      if (current.trim()) lines.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) lines.push(current)

  if (lines.length < 2) return { headers: [], rows: [] }

  const headers = parseCSVLine(lines[0])
  const rows: string[][] = []
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i])
    if (fields.every(f => f === '')) continue
    rows.push(fields)
  }

  return { headers, rows }
}

function parseNumber(value: string | undefined): number | null {
  if (!value || value.trim() === '' || value === 'N/A' || value === '-') return null
  const cleaned = value.replace(/[,$%]/g, '').replace(/\s*MW\s*/i, '').replace(/\s*kV\s*/i, '').trim()
  const num = Number(cleaned)
  return isNaN(num) ? null : num
}

/** Find a value in raw_data by checking multiple possible key names (case-insensitive). */
function findRawValue(rd: Record<string, string>, keys: string[]): string | undefined {
  for (const [k, v] of Object.entries(rd)) {
    if (keys.includes(k.toLowerCase().trim()) && v.trim()) return v.trim()
  }
  return undefined
}

/** Parse a CSV into site records with raw_data and extracted fields. */
function parseSites(csvText: string): Array<{
  site_name: string
  latitude: number | null
  longitude: number | null
  county: string | null
  state: string | null
  raw_data: Record<string, string>
}> {
  const { headers, rows } = parseCSV(csvText)
  if (headers.length === 0) return []

  // Normalize headers for field matching
  // Collapse all whitespace (handles multiline quoted headers like Powerbank CSV)
  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/\s+/g, ' ').trim())

  const sites: Array<{
    site_name: string
    latitude: number | null
    longitude: number | null
    county: string | null
    state: string | null
    raw_data: Record<string, string>
  }> = []

  for (let i = 0; i < rows.length; i++) {
    const fields = rows[i]
    const raw_data: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      if (fields[j]) raw_data[headers[j]] = fields[j]
    }

    // Find site name
    let site_name = ''
    for (const key of ['site name', 'site', 'name', 'project name']) {
      const idx = normalizedHeaders.indexOf(key)
      if (idx >= 0 && fields[idx]) { site_name = fields[idx]; break }
    }
    if (!site_name) site_name = `Site ${i + 1}`

    // Find latitude
    let latitude: number | null = null
    for (const key of ['geolocation (latitude)', 'latitude', 'lat']) {
      const idx = normalizedHeaders.indexOf(key)
      if (idx >= 0) { latitude = parseNumber(fields[idx]); break }
    }

    // Find longitude
    let longitude: number | null = null
    for (const key of ['geolocation (longitude)', 'longitude', 'lon', 'lng']) {
      const idx = normalizedHeaders.indexOf(key)
      if (idx >= 0) { longitude = parseNumber(fields[idx]); break }
    }

    // Find county
    const county = findRawValue(raw_data, ['county', 'county name', 'county_name']) || null

    // Find state
    const state = findRawValue(raw_data, [
      'state', 'state name', 'state_name', 'state abbreviation', 'state/province',
    ]) || null

    sites.push({ site_name, latitude, longitude, county, state, raw_data })
  }

  return sites
}

// ── County Score Lookup ────────────────────────────────────────────────

function loadCountyScores(): {
  scoresByFips: Map<string, CountyScoreRow>
  fipsByCountyState: Map<string, string>
} {
  const raw = JSON.parse(readFileSync(COUNTY_SCORES_PATH, 'utf-8'))
  const counties: CountyScoreRow[] = raw.counties

  const scoresByFips = new Map<string, CountyScoreRow>()
  const fipsByCountyState = new Map<string, string>()

  for (const row of counties) {
    // Ensure queue_pressure_score has a default
    if (row.queue_pressure_score == null) {
      (row as CountyScoreRow).queue_pressure_score = 0
    }
    scoresByFips.set(row.fips_code, row)
    const key = `${row.county_name.toLowerCase()}|${row.state_abbr.toLowerCase()}`
    fipsByCountyState.set(key, row.fips_code)
  }

  return { scoresByFips, fipsByCountyState }
}

// ── FCC API FIPS Lookup ────────────────────────────────────────────────

async function lookupFips(lat: number, lon: number): Promise<{
  fips: string; county_name: string; state_name: string
} | null> {
  try {
    const url = `https://geo.fcc.gov/api/census/area?lat=${lat}&lon=${lon}&format=json`
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) return null
    const data = await response.json()
    if (!data.results || data.results.length === 0) return null
    const result = data.results[0]
    return {
      fips: result.county_fips,
      county_name: result.county_name,
      state_name: result.state_name,
    }
  } catch {
    return null
  }
}

async function batchLookupFips(
  coords: Array<{ lat: number; lon: number; index: number }>,
  concurrency = 5
): Promise<Map<number, { fips: string; county_name: string; state_name: string }>> {
  const results = new Map<number, { fips: string; county_name: string; state_name: string }>()
  const chunks: Array<typeof coords> = []

  for (let i = 0; i < coords.length; i += concurrency) {
    chunks.push(coords.slice(i, i + concurrency))
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async ({ lat, lon, index }) => {
      const result = await lookupFips(lat, lon)
      if (result) results.set(index, result)
    })
    await Promise.all(promises)
  }

  return results
}

// ── Co-op Territory Check ──────────────────────────────────────────────

const COOP_TERRITORY_URL =
  'https://services5.arcgis.com/ARxOqVFcodl7rmzw/arcgis/rest/services/' +
  'America_Electrical_Coop_Service_Territories/FeatureServer/10/query'

async function checkCoopTerritory(lat: number, lon: number): Promise<{
  inCoopTerritory: boolean; utilityName: string | null
}> {
  try {
    const geometry = JSON.stringify({
      x: lon, y: lat,
      spatialReference: { wkid: 4326 },
    })
    const params = new URLSearchParams({
      geometry,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'NAME',
      returnGeometry: 'false',
      f: 'json',
    })
    const response = await fetch(`${COOP_TERRITORY_URL}?${params}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return { inCoopTerritory: false, utilityName: null }
    const data = await response.json()
    const features = data.features ?? []
    if (features.length > 0) {
      const name = features[0].attributes?.NAME ?? null
      return { inCoopTerritory: true, utilityName: name }
    }
    return { inCoopTerritory: false, utilityName: null }
  } catch {
    return { inCoopTerritory: false, utilityName: null }
  }
}

async function batchCheckCoopTerritory(
  coords: Array<{ lat: number; lon: number; index: number }>,
  concurrency = 5
): Promise<Map<number, { inCoopTerritory: boolean; utilityName: string | null }>> {
  const results = new Map<number, { inCoopTerritory: boolean; utilityName: string | null }>()
  const chunks: Array<typeof coords> = []

  for (let i = 0; i < coords.length; i += concurrency) {
    chunks.push(coords.slice(i, i + concurrency))
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async ({ lat, lon, index }) => {
      const result = await checkCoopTerritory(lat, lon)
      results.set(index, result)
    })
    await Promise.all(promises)
  }

  return results
}

// ── Utility Classification ─────────────────────────────────────────────

function classifyUtilityType(rawData: Record<string, unknown>): {
  utilityType: string | null
  coopOverride: number | null
} {
  const keys = [
    'Electric Infrastructure Owner & Operator',
    'electric infrastructure owner & operator',
    'utility type', 'Utility Type', 'utility_type',
  ]
  let value: string | null = null
  for (const key of keys) {
    if (rawData[key] && typeof rawData[key] === 'string') {
      value = (rawData[key] as string).trim()
      break
    }
  }
  if (!value) return { utilityType: null, coopOverride: null }
  const lower = value.toLowerCase()
  if (lower.includes('coop') || lower.includes('cooperative') || lower.includes('co-op')) {
    return { utilityType: 'Co-op', coopOverride: 1.0 }
  }
  if (lower.includes('investor') || lower === 'iou' || lower.includes('investor-owned')) {
    return { utilityType: 'IOU', coopOverride: 0.2 }
  }
  if (lower.includes('municipal') || lower.includes('muni') || lower.includes('city of') || lower.includes('public power')) {
    return { utilityType: 'Municipal', coopOverride: 0.6 }
  }
  return { utilityType: value, coopOverride: null }
}

// ── Scoring ────────────────────────────────────────────────────────────

function buildSiteBreakdown(countyScores: CountyScoreRow | null): SiteScoreBreakdown {
  if (!countyScores) {
    return {
      coop_density: null, grid_reliability: null, clipped_curtailed: null,
      permitting: null, labor: null, fiber: null, queue_pressure: null,
    }
  }
  return {
    coop_density: countyScores.coop_density_score,
    grid_reliability: countyScores.grid_reliability_score,
    clipped_curtailed: countyScores.clipped_curtailed_score,
    permitting: countyScores.permitting_score,
    labor: countyScores.labor_score,
    fiber: countyScores.fiber_score,
    queue_pressure: countyScores.queue_pressure_score,
  }
}

function scoreSite(breakdown: SiteScoreBreakdown): number {
  const values = Object.values(breakdown).filter(
    (v): v is number => v !== null && v !== undefined
  )
  if (values.length === 0) return 0
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length
  return Math.round(avg * 100) / 10
}

// ── State abbreviation map (for converting full names to abbreviations) ──

const STATE_ABBR: Record<string, string> = {
  'alabama': 'al', 'alaska': 'ak', 'arizona': 'az', 'arkansas': 'ar',
  'california': 'ca', 'colorado': 'co', 'connecticut': 'ct', 'delaware': 'de',
  'florida': 'fl', 'georgia': 'ga', 'hawaii': 'hi', 'idaho': 'id',
  'illinois': 'il', 'indiana': 'in', 'iowa': 'ia', 'kansas': 'ks',
  'kentucky': 'ky', 'louisiana': 'la', 'maine': 'me', 'maryland': 'md',
  'massachusetts': 'ma', 'michigan': 'mi', 'minnesota': 'mn', 'mississippi': 'ms',
  'missouri': 'mo', 'montana': 'mt', 'nebraska': 'ne', 'nevada': 'nv',
  'new hampshire': 'nh', 'new jersey': 'nj', 'new mexico': 'nm', 'new york': 'ny',
  'north carolina': 'nc', 'north dakota': 'nd', 'ohio': 'oh', 'oklahoma': 'ok',
  'oregon': 'or', 'pennsylvania': 'pa', 'rhode island': 'ri', 'south carolina': 'sc',
  'south dakota': 'sd', 'tennessee': 'tn', 'texas': 'tx', 'utah': 'ut',
  'vermont': 'vt', 'virginia': 'va', 'washington': 'wa', 'west virginia': 'wv',
  'wisconsin': 'wi', 'wyoming': 'wy', 'district of columbia': 'dc',
}

function normalizeState(state: string): string {
  const lower = state.toLowerCase().trim()
  // Already an abbreviation
  if (lower.length === 2) return lower
  // Full name
  return STATE_ABBR[lower] || lower
}

// ── Main ───────────────────────────────────────────────────────────────

async function processPortfolio(
  config: PortfolioConfig,
  scoresByFips: Map<string, CountyScoreRow>,
  fipsByCountyState: Map<string, string>,
): Promise<void> {
  console.log(`\n── Processing: ${config.name} ──`)

  if (!existsSync(config.csvPath)) {
    console.error(`  CSV not found: ${config.csvPath}`)
    return
  }

  const csvText = readFileSync(config.csvPath, 'utf-8')
  const parsed = parseSites(csvText)
  console.log(`  Parsed ${parsed.length} sites`)

  // Step 1: Resolve FIPS via county+state matching
  const resolved: Array<{
    site: typeof parsed[number]
    fips_code: string | null
    county: string | null
    state: string | null
  }> = []
  const needsFccLookup: Array<{ lat: number; lon: number; index: number }> = []

  for (let i = 0; i < parsed.length; i++) {
    const site = parsed[i]
    let fips_code: string | null = null
    let county = site.county
    let state = site.state

    if (county && state) {
      const stateAbbr = normalizeState(state)
      const key = `${county.toLowerCase()}|${stateAbbr}`
      const matched = fipsByCountyState.get(key)
      if (matched) fips_code = matched
    }

    if (!fips_code && site.latitude && site.longitude) {
      // Only do FCC lookup for US coordinates (rough lat/lon bounds)
      if (site.latitude >= 24 && site.latitude <= 50 &&
          site.longitude >= -125 && site.longitude <= -66) {
        needsFccLookup.push({ lat: site.latitude, lon: site.longitude, index: i })
      }
    }

    resolved.push({ site, fips_code, county, state })
  }

  const matchedCount = resolved.filter(r => r.fips_code).length
  console.log(`  County/state matched: ${matchedCount}/${parsed.length}`)

  // Step 2: FCC API lookup for unmatched US sites
  if (needsFccLookup.length > 0) {
    console.log(`  FCC API lookup: ${needsFccLookup.length} sites...`)
    const fccResults = await batchLookupFips(needsFccLookup, 5)
    for (const [idx, result] of fccResults) {
      const r = resolved[idx]
      r.fips_code = result.fips
      if (!r.county) r.county = result.county_name
      if (!r.state) r.state = result.state_name
    }
    const fccMatched = Array.from(fccResults.values()).length
    console.log(`  FCC resolved: ${fccMatched}/${needsFccLookup.length}`)
  }

  // Step 3: Co-op territory check for sites with US coordinates
  const coordsForCoopCheck: Array<{ lat: number; lon: number; index: number }> = []
  for (let i = 0; i < resolved.length; i++) {
    const site = resolved[i].site
    if (site.latitude && site.longitude &&
        site.latitude >= 24 && site.latitude <= 50 &&
        site.longitude >= -125 && site.longitude <= -66) {
      coordsForCoopCheck.push({ lat: site.latitude, lon: site.longitude, index: i })
    }
  }

  let coopResults = new Map<number, { inCoopTerritory: boolean; utilityName: string | null }>()
  if (coordsForCoopCheck.length > 0) {
    console.log(`  Co-op territory check: ${coordsForCoopCheck.length} sites...`)
    coopResults = await batchCheckCoopTerritory(coordsForCoopCheck, 5)
    const inCoop = Array.from(coopResults.values()).filter(r => r.inCoopTerritory).length
    console.log(`  In co-op territory: ${inCoop}/${coordsForCoopCheck.length}`)
  }

  // Step 4: Score each site
  const portfolioSites: PortfolioSite[] = []

  for (let i = 0; i < resolved.length; i++) {
    const { site, fips_code, county, state } = resolved[i]
    const countyScores = fips_code ? scoresByFips.get(fips_code) ?? null : null
    const breakdown = buildSiteBreakdown(countyScores)

    // Co-op territory override — only apply when site has county scores
    const coopCheck = coopResults.get(i)
    let utilityType: string | null = null
    const hasCountyScores = countyScores !== null

    if (coopCheck) {
      if (hasCountyScores) {
        breakdown.coop_density = coopCheck.inCoopTerritory ? 1.0 : 0.0
      }
      if (coopCheck.inCoopTerritory) {
        utilityType = coopCheck.utilityName ? `Co-op: ${coopCheck.utilityName}` : 'Co-op'
      }
    } else {
      // No coords or non-US — fall back to CSV keyword classification
      const classified = classifyUtilityType(site.raw_data as Record<string, unknown>)
      utilityType = classified.utilityType
      if (hasCountyScores && classified.coopOverride !== null) {
        breakdown.coop_density = classified.coopOverride
      }
    }

    const score = hasCountyScores ? scoreSite(breakdown) : null

    portfolioSites.push({
      id: `${config.slug}-${String(i).padStart(4, '0')}`,
      upload_id: config.slug,
      site_name: site.site_name,
      latitude: site.latitude,
      longitude: site.longitude,
      county,
      state,
      fips_code,
      raw_data: site.raw_data,
      site_score: score,
      tier: null, // Client-side percentile tiering
      score_breakdown: hasCountyScores ? breakdown : null,
      utility_type: utilityType,
    })
  }

  const scoredCount = portfolioSites.filter(s => s.score_breakdown !== null).length
  console.log(`  Scored: ${scoredCount}/${portfolioSites.length}`)

  // Step 5: Write output
  const output = {
    name: config.name,
    slug: config.slug,
    generatedAt: new Date().toISOString(),
    siteCount: portfolioSites.length,
    sites: portfolioSites,
  }

  const outputPath = resolve(OUTPUT_DIR, `${config.slug}.json`)
  writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log(`  Written: ${outputPath}`)
}

async function main() {
  console.log('Loading county scores...')
  const { scoresByFips, fipsByCountyState } = loadCountyScores()
  console.log(`  ${scoresByFips.size} counties loaded`)

  for (const config of PORTFOLIOS) {
    await processPortfolio(config, scoresByFips, fipsByCountyState)
  }

  console.log('\nDone!')
}

main().catch(console.error)
