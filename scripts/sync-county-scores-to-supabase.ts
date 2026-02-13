/**
 * Sync county-scores.json → Supabase county_scores table.
 *
 * Usage: bun run scripts/sync-county-scores-to-supabase.ts
 *
 * Reads the static JSON (source of truth after build-real-county-scores.py)
 * and upserts all rows into Supabase.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  const raw = JSON.parse(readFileSync('public/data/county-scores.json', 'utf-8'))
  const counties = Array.isArray(raw) ? raw : raw.counties
  
  if (!counties || counties.length === 0) {
    console.error('No counties found in county-scores.json')
    process.exit(1)
  }

  console.log(`Syncing ${counties.length} counties to Supabase...`)

  // Strip citation fields that don't exist in the DB table
  const rows = counties.map((c: Record<string, unknown>) => ({
    fips_code: c.fips_code,
    state_fips: c.state_fips,
    county_name: c.county_name,
    state_abbr: c.state_abbr,
    coop_density_score: c.coop_density_score,
    grid_reliability_score: c.grid_reliability_score,
    clipped_curtailed_score: c.clipped_curtailed_score,
    permitting_score: c.permitting_score,
    labor_score: c.labor_score,
    fiber_score: c.fiber_score,
    data_sources: c.data_sources,
  }))

  const BATCH_SIZE = 500
  let inserted = 0
  let errors = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('county_scores')
      .upsert(batch, { onConflict: 'fips_code' })

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message)
      errors++
    } else {
      inserted += batch.length
      console.log(`Synced batch ${Math.floor(i / BATCH_SIZE) + 1} (${inserted}/${rows.length})`)
    }
  }

  console.log(`Done. ${inserted} counties synced, ${errors} batch errors.`)
}

main().catch(console.error)
