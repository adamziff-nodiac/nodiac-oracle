/**
 * Fetches operator/entity names for renewable energy plants from the EIA API v2.
 *
 * Outputs:
 *   public/data/eia-plant-operators.json — Record<string, string> mapping plantid → entityName
 *
 * Run: bun run scripts/fetch-eia-operators.ts
 */

import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const API_BASE = 'https://api.eia.gov/v2/electricity/operating-generator-capacity/data/'
const API_KEY = process.env.EIA_API_KEY || 'DEMO_KEY'
const PAGE_SIZE = 5000

const TECH_FILTERS = [
  'Solar Photovoltaic',
  'Solar Thermal without Energy Storage',
  'Solar Thermal with Energy Storage',
  'Onshore Wind Turbine',
  'Offshore Wind Turbine',
  'Batteries',
  'Conventional Hydroelectric',
  'Hydroelectric Pumped Storage',
]

const OUT_DIR = resolve(__dirname, '../public/data')

interface EIARow {
  plantid: string
  entityName: string
  entityid: string
  period: string
}

async function fetchWithRetry(url: string, retries = 10): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url)
    if (res.status === 429) {
      const wait = Math.min(30000 * (i + 1), 120000)
      console.log(`  Rate limited, waiting ${wait / 1000}s... (attempt ${i + 1}/${retries})`)
      await new Promise(r => setTimeout(r, wait))
      continue
    }
    return res
  }
  throw new Error('Max retries exceeded due to rate limiting. DEMO_KEY has hourly limits — wait and retry, or set EIA_API_KEY env var.')
}

async function fetchPage(offset: number): Promise<{ data: EIARow[]; total: number }> {
  const url = new URL(API_BASE)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.append('facets[status][]', 'OP')
  for (const tech of TECH_FILTERS) {
    url.searchParams.append('facets[technology][]', tech)
  }
  // Only latest period to minimize rows
  url.searchParams.set('sort[0][column]', 'period')
  url.searchParams.set('sort[0][direction]', 'desc')
  url.searchParams.set('length', String(PAGE_SIZE))
  url.searchParams.set('offset', String(offset))

  const res = await fetchWithRetry(url.toString())
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`EIA API error: ${res.status} ${res.statusText}\n${body}`)
  }
  const json = await res.json()
  return {
    data: json.response.data as EIARow[],
    total: json.response.total as number,
  }
}

async function main() {
  console.log('Fetching renewable plant operators from EIA API...')

  // First, get total count and identify unique plants
  // We only need one row per plant, so we'll stop once we've gathered enough
  const lookup = new Map<string, string>()
  let offset = 0
  let total = Infinity
  let seenPeriods = new Set<string>()

  while (offset < total) {
    const page = await fetchPage(offset)
    total = page.total

    for (const row of page.data) {
      if (row.plantid && row.entityName) {
        lookup.set(row.plantid, row.entityName)
      }
      if (row.period) seenPeriods.add(row.period)
    }

    offset += PAGE_SIZE
    console.log(`  Fetched ${Math.min(offset, total).toLocaleString()} / ${total.toLocaleString()} rows (${lookup.size.toLocaleString()} unique plants)`)

    // Since we sort by period desc, once we've seen 2+ periods and have enough plants,
    // we can stop — subsequent rows are older duplicates
    if (seenPeriods.size >= 2 && page.data.length > 0) {
      const latestPeriod = [...seenPeriods].sort().pop()
      const oldestInBatch = page.data[page.data.length - 1]?.period
      // If we've moved past the latest period, we have all plants
      if (oldestInBatch && oldestInBatch < latestPeriod!) {
        console.log(`  Reached older period ${oldestInBatch}, stopping (have latest ${latestPeriod})`)
        break
      }
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 500))
  }

  mkdirSync(OUT_DIR, { recursive: true })

  const result: Record<string, string> = Object.fromEntries(lookup)
  writeFileSync(resolve(OUT_DIR, 'eia-plant-operators.json'), JSON.stringify(result))

  console.log(`\nWrote ${lookup.size.toLocaleString()} plant→operator mappings → public/data/eia-plant-operators.json`)
}

main().catch((err) => {
  console.error('Failed to fetch EIA operators:', err)
  process.exit(1)
})
