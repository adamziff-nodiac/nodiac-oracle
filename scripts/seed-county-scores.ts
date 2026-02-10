/**
 * Seed script for county_scores table.
 *
 * Usage: bun run scripts/seed-county-scores.ts
 *
 * This script processes public datasets to populate county scores.
 * For the Feb 17 deadline, it generates placeholder scores with realistic
 * distributions based on state-level patterns.
 *
 * Future: Replace with actual data pipeline from EIA, FCC, Census sources.
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// State-level baseline scores (rough estimates for seed data)
// These will be replaced with actual per-county data from EIA/FCC/Census
const STATE_BASELINES: Record<string, {
  coop: number, grid: number, curtail: number, labor: number, fiber: number
}> = {
  // Strong co-op / wind states
  MN: { coop: 0.75, grid: 0.70, curtail: 0.65, labor: 0.50, fiber: 0.60 },
  IA: { coop: 0.70, grid: 0.65, curtail: 0.70, labor: 0.40, fiber: 0.55 },
  WI: { coop: 0.60, grid: 0.70, curtail: 0.40, labor: 0.55, fiber: 0.60 },
  ND: { coop: 0.80, grid: 0.60, curtail: 0.75, labor: 0.30, fiber: 0.40 },
  SD: { coop: 0.75, grid: 0.60, curtail: 0.60, labor: 0.30, fiber: 0.40 },
  NE: { coop: 0.70, grid: 0.65, curtail: 0.55, labor: 0.35, fiber: 0.50 },
  KS: { coop: 0.70, grid: 0.60, curtail: 0.70, labor: 0.35, fiber: 0.45 },
  OK: { coop: 0.65, grid: 0.55, curtail: 0.75, labor: 0.35, fiber: 0.45 },
  TX: { coop: 0.55, grid: 0.50, curtail: 0.80, labor: 0.55, fiber: 0.60 },
  // Hydro/solar states
  OR: { coop: 0.40, grid: 0.70, curtail: 0.60, labor: 0.50, fiber: 0.55 },
  WA: { coop: 0.45, grid: 0.75, curtail: 0.55, labor: 0.55, fiber: 0.65 },
  CA: { coop: 0.20, grid: 0.55, curtail: 0.85, labor: 0.70, fiber: 0.75 },
  // Traditional DC markets (less co-op)
  VA: { coop: 0.15, grid: 0.75, curtail: 0.20, labor: 0.80, fiber: 0.90 },
  GA: { coop: 0.35, grid: 0.65, curtail: 0.30, labor: 0.55, fiber: 0.65 },
  OH: { coop: 0.30, grid: 0.65, curtail: 0.35, labor: 0.55, fiber: 0.60 },
  NC: { coop: 0.30, grid: 0.70, curtail: 0.30, labor: 0.55, fiber: 0.60 },
  IL: { coop: 0.35, grid: 0.65, curtail: 0.50, labor: 0.60, fiber: 0.65 },
  IN: { coop: 0.35, grid: 0.65, curtail: 0.45, labor: 0.45, fiber: 0.55 },
  MO: { coop: 0.50, grid: 0.60, curtail: 0.40, labor: 0.45, fiber: 0.50 },
  MT: { coop: 0.55, grid: 0.55, curtail: 0.50, labor: 0.25, fiber: 0.30 },
  WY: { coop: 0.55, grid: 0.55, curtail: 0.65, labor: 0.20, fiber: 0.30 },
  CO: { coop: 0.40, grid: 0.65, curtail: 0.60, labor: 0.55, fiber: 0.60 },
  NM: { coop: 0.50, grid: 0.55, curtail: 0.65, labor: 0.30, fiber: 0.40 },
  AZ: { coop: 0.25, grid: 0.60, curtail: 0.70, labor: 0.50, fiber: 0.55 },
  NV: { coop: 0.20, grid: 0.60, curtail: 0.65, labor: 0.45, fiber: 0.55 },
  UT: { coop: 0.30, grid: 0.65, curtail: 0.50, labor: 0.50, fiber: 0.55 },
  ID: { coop: 0.35, grid: 0.65, curtail: 0.40, labor: 0.35, fiber: 0.45 },
  MI: { coop: 0.30, grid: 0.60, curtail: 0.40, labor: 0.50, fiber: 0.55 },
  PA: { coop: 0.20, grid: 0.65, curtail: 0.30, labor: 0.55, fiber: 0.60 },
  NY: { coop: 0.15, grid: 0.65, curtail: 0.35, labor: 0.65, fiber: 0.70 },
  SC: { coop: 0.30, grid: 0.65, curtail: 0.30, labor: 0.45, fiber: 0.55 },
  TN: { coop: 0.40, grid: 0.65, curtail: 0.25, labor: 0.45, fiber: 0.55 },
  AL: { coop: 0.40, grid: 0.60, curtail: 0.25, labor: 0.35, fiber: 0.45 },
  MS: { coop: 0.50, grid: 0.55, curtail: 0.20, labor: 0.30, fiber: 0.35 },
  AR: { coop: 0.50, grid: 0.55, curtail: 0.30, labor: 0.30, fiber: 0.40 },
  LA: { coop: 0.35, grid: 0.50, curtail: 0.30, labor: 0.40, fiber: 0.45 },
  KY: { coop: 0.35, grid: 0.60, curtail: 0.25, labor: 0.35, fiber: 0.45 },
  WV: { coop: 0.25, grid: 0.55, curtail: 0.20, labor: 0.25, fiber: 0.35 },
  ME: { coop: 0.15, grid: 0.60, curtail: 0.40, labor: 0.35, fiber: 0.45 },
  VT: { coop: 0.15, grid: 0.65, curtail: 0.30, labor: 0.35, fiber: 0.50 },
  NH: { coop: 0.10, grid: 0.65, curtail: 0.25, labor: 0.45, fiber: 0.55 },
  MA: { coop: 0.05, grid: 0.70, curtail: 0.30, labor: 0.70, fiber: 0.80 },
  CT: { coop: 0.05, grid: 0.70, curtail: 0.25, labor: 0.60, fiber: 0.75 },
  RI: { coop: 0.05, grid: 0.65, curtail: 0.30, labor: 0.55, fiber: 0.70 },
  NJ: { coop: 0.05, grid: 0.65, curtail: 0.25, labor: 0.60, fiber: 0.75 },
  DE: { coop: 0.10, grid: 0.65, curtail: 0.25, labor: 0.50, fiber: 0.65 },
  MD: { coop: 0.10, grid: 0.70, curtail: 0.25, labor: 0.65, fiber: 0.75 },
  FL: { coop: 0.20, grid: 0.55, curtail: 0.40, labor: 0.50, fiber: 0.60 },
  HI: { coop: 0.10, grid: 0.50, curtail: 0.60, labor: 0.35, fiber: 0.50 },
  AK: { coop: 0.30, grid: 0.45, curtail: 0.20, labor: 0.25, fiber: 0.25 },
}

// Default for states not in the list
const DEFAULT_BASELINE = { coop: 0.30, grid: 0.60, curtail: 0.35, labor: 0.40, fiber: 0.50 }

function jitter(base: number, amount = 0.15): number {
  const val = base + (Math.random() - 0.5) * 2 * amount
  return Math.max(0, Math.min(1, Math.round(val * 10000) / 10000))
}

async function main() {
  console.log('Fetching FIPS data from Census...')

  // Use Census Bureau FIPS codes list
  const response = await fetch('https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt')
  const text = await response.text()
  const lines = text.trim().split('\n')

  const counties: Array<{
    fips_code: string
    state_fips: string
    county_name: string
    state_abbr: string
    coop_density_score: number
    grid_reliability_score: number
    clipped_curtailed_score: number
    permitting_score: number
    labor_score: number
    fiber_score: number
    data_sources: Record<string, string>
  }> = []

  for (const line of lines.slice(1)) { // Skip header
    const parts = line.split('|')
    if (parts.length < 4) continue

    const stateAbbr = parts[0].trim()
    const stateFips = parts[1].trim()
    const countyFips = parts[2].trim()
    const countyName = parts[3].trim()

    if (!stateFips || !countyFips) continue
    // Skip territories
    if (['AS', 'GU', 'MP', 'PR', 'VI', 'DC'].includes(stateAbbr)) continue

    const fips = stateFips + countyFips
    const baseline = STATE_BASELINES[stateAbbr] || DEFAULT_BASELINE

    counties.push({
      fips_code: fips,
      state_fips: stateFips,
      county_name: countyName.replace(' County', '').replace(' Parish', ''),
      state_abbr: stateAbbr,
      coop_density_score: jitter(baseline.coop),
      grid_reliability_score: jitter(baseline.grid),
      clipped_curtailed_score: jitter(baseline.curtail),
      permitting_score: 0.5, // Neutral default — enriched by skill
      labor_score: jitter(baseline.labor),
      fiber_score: jitter(baseline.fiber),
      data_sources: {
        coop: 'EIA Form 861 (seed estimate)',
        grid: 'EIA Form 861 SAIDI (seed estimate)',
        curtail: 'EIA Form 860 (seed estimate)',
        labor: 'Census CBP (seed estimate)',
        fiber: 'FCC BDC (seed estimate)',
      },
    })
  }

  console.log(`Parsed ${counties.length} counties`)

  // Write static fallback JSON
  writeFileSync(
    'public/data/county-scores.json',
    JSON.stringify(counties, null, 0)
  )
  console.log('Wrote public/data/county-scores.json')

  // Upsert to Supabase in batches
  const BATCH_SIZE = 500
  let inserted = 0

  for (let i = 0; i < counties.length; i += BATCH_SIZE) {
    const batch = counties.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('county_scores')
      .upsert(batch, { onConflict: 'fips_code' })

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message)
    } else {
      inserted += batch.length
      console.log(`Inserted batch ${i / BATCH_SIZE + 1} (${inserted}/${counties.length})`)
    }
  }

  console.log(`Done. ${inserted} counties seeded.`)
}

main().catch(console.error)
