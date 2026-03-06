#!/usr/bin/env bun
/**
 * Backfill Powerbank sites with lat/lon, technology, voltage, utility, county, and state.
 *
 * Reads the Fleet CIR CSV, matches sites by name in tracker_sites, and updates:
 *   - latitude, longitude
 *   - site_type (from Technology column)
 *   - interconnection_voltage_kv (from Interconnection Voltage_kV)
 *   - utility_id (via HIFLD lookup for US sites)
 *   - fips_code + address (county/state via FCC API reverse geocoding for US sites)
 *
 * Usage:
 *   DRY_RUN=true bun run scripts/backfill-powerbank-sites.ts   # preview
 *   bun run scripts/backfill-powerbank-sites.ts                 # apply
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { lookupUtilityByPoint } from '../src/lib/geo/utility-territories'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY!
const DRY_RUN = process.env.DRY_RUN === 'true'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CSV_PATH = '/Users/adamziff/Downloads/Fleet CIR Validated - Powerbank Sites.csv'

interface CsvRow {
  name: string
  technology: string
  country: string
  state: string
  voltage: string
  latitude: number
  longitude: number
}

function parseCSV(text: string): CsvRow[] {
  // Headers span multiple lines due to quoted newlines in "Geolocation\n (Latitude)"
  // Normalize: join all text, re-split on actual record boundaries
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Parse CSV properly handling quoted fields with newlines
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]
    if (inQuotes) {
      if (ch === '"' && normalized[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        current.push(field.trim())
        field = ''
      } else if (ch === '\n') {
        current.push(field.trim())
        field = ''
        if (current.length > 1) rows.push(current)
        current = []
      } else {
        field += ch
      }
    }
  }
  // Last row
  if (field || current.length > 0) {
    current.push(field.trim())
    if (current.length > 1) rows.push(current)
  }

  // First row is headers
  const headers = rows[0]
  console.log('CSV headers:', headers)
  console.log(`CSV data rows: ${rows.length - 1}`)

  return rows.slice(1).map(cols => ({
    name: cols[0],
    technology: cols[1],
    country: cols[2],
    state: cols[3],
    voltage: cols[7],
    latitude: parseFloat(cols[8]),
    longitude: parseFloat(cols[9]),
  }))
}

/** Map CSV technology to site_type enum value (Solar | Wind | Solar + BESS | Substation | Other) */
function mapSiteType(tech: string): string | null {
  const t = tech.toLowerCase()
  if (t.includes('solar')) return 'Solar'
  if (t.includes('wind')) return 'Wind'
  return 'Other'
}

/** Parse voltage string like "34.5 kV" to number */
function parseVoltage(v: string): number | null {
  if (!v) return null
  const match = v.match(/([\d.]+)\s*kV/i)
  return match ? parseFloat(match[1]) : null
}

/** Reverse geocode via FCC Area API to get county + state FIPS */
async function reverseGeocode(lat: number, lon: number): Promise<{ county: string; state: string; fips: string } | null> {
  try {
    const url = `https://geo.fcc.gov/api/census/area?lat=${lat}&lon=${lon}&format=json`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const result = data?.results?.[0]
    if (!result) return null
    return {
      county: result.county_name,
      state: result.state_code,
      fips: result.county_fips,
    }
  } catch {
    return null
  }
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== LIVE RUN ===')
  console.log()

  const csvText = readFileSync(CSV_PATH, 'utf-8')
  const csvRows = parseCSV(csvText)

  // Fetch all tracker_sites
  const { data: sites, error: sitesErr } = await supabase
    .from('tracker_sites')
    .select('id, name, latitude, longitude, utility_id, site_type, interconnection_voltage_kv, fips_code')

  if (sitesErr) {
    console.error('Failed to fetch sites:', sitesErr.message)
    process.exit(1)
  }

  // Build name → site map (case-insensitive)
  const siteByName = new Map<string, typeof sites[0]>()
  for (const s of sites!) {
    siteByName.set(s.name.toLowerCase().trim(), s)
  }

  // Fetch existing partners for utility matching
  const { data: partners } = await supabase
    .from('tracker_power_partners')
    .select('id, name')

  const partnerByName = new Map<string, { id: string; name: string }>(
    (partners ?? []).map(p => [p.name.toLowerCase(), p])
  )

  const updated: Array<{ name: string; fields: string[] }> = []
  const notFound: string[] = []
  const skipped: string[] = []

  for (const row of csvRows) {
    const site = siteByName.get(row.name.toLowerCase().trim())
    if (!site) {
      notFound.push(row.name)
      continue
    }

    const updates: Record<string, unknown> = {}
    const fieldNames: string[] = []

    // Lat/lon
    if ((site.latitude == null || site.longitude == null) && !isNaN(row.latitude) && !isNaN(row.longitude)) {
      updates.latitude = row.latitude
      updates.longitude = row.longitude
      fieldNames.push('lat/lon')
    }

    // Technology → site_type
    if (!site.site_type && row.technology) {
      const mapped = mapSiteType(row.technology)
      if (mapped) {
        updates.site_type = mapped
        fieldNames.push(`site_type=${mapped}`)
      }
    }

    // Voltage
    if (!site.interconnection_voltage_kv && row.voltage) {
      const kv = parseVoltage(row.voltage)
      if (kv) {
        updates.interconnection_voltage_kv = kv
        fieldNames.push(`voltage=${kv}kV`)
      }
    }

    // For US sites: utility lookup + county/state
    const lat = updates.latitude as number ?? site.latitude
    const lon = updates.longitude as number ?? site.longitude

    if (row.country === 'US' && lat != null && lon != null) {
      // Utility
      if (!site.utility_id) {
        try {
          const territory = await lookupUtilityByPoint(lat, lon)
          if (territory) {
            const hifldName = territory.name
            // Find existing partner
            let partnerId = partnerByName.get(hifldName.toLowerCase())?.id
            if (!partnerId) {
              // Fuzzy match
              const normalize = (s: string) =>
                s.toLowerCase().replace(/\b(inc|llc|co|corp|cooperative|coop|electric|energy|power|of|the)\b/g, '').replace(/[^a-z0-9]/g, '')
              const hifldNorm = normalize(hifldName)
              for (const [name, p] of partnerByName) {
                if (normalize(name) === hifldNorm) {
                  partnerId = p.id
                  break
                }
              }
            }
            if (partnerId) {
              updates.utility_id = partnerId
              fieldNames.push(`utility=${hifldName}`)
            }
          }
        } catch { /* non-fatal */ }
      }

      // County/state via FCC reverse geocode
      if (!site.fips_code) {
        const geo = await reverseGeocode(lat, lon)
        if (geo) {
          updates.fips_code = geo.fips
          fieldNames.push(`county=${geo.county}, ${geo.state} (FIPS: ${geo.fips})`)
        }
      }
    }

    // For Canadian sites: set address with state/province info
    if (row.country === 'Canada' && row.state) {
      if (!site.fips_code) {
        // Use fips_code field to store province for Canadian sites (CA-ON format)
        updates.fips_code = `CA-${row.state}`
        fieldNames.push(`province=${row.state}`)
      }
    }

    if (Object.keys(updates).length === 0) {
      skipped.push(row.name)
      continue
    }

    updated.push({ name: row.name, fields: fieldNames })
    console.log(`  ${row.name}: ${fieldNames.join(', ')}`)

    if (!DRY_RUN) {
      const { error } = await supabase
        .from('tracker_sites')
        .update(updates)
        .eq('id', site.id)
      if (error) {
        console.error(`    ERROR: ${error.message}`)
      }
    }
  }

  console.log()
  console.log('═══════════════════════════════════════════════')
  console.log('  RESULTS')
  console.log('═══════════════════════════════════════════════')
  console.log()
  console.log(`  Updated: ${updated.length} sites${DRY_RUN ? ' [DRY RUN]' : ''}`)
  console.log(`  Skipped (already populated): ${skipped.length}`)
  console.log(`  Not found in tracker: ${notFound.length}`)

  if (notFound.length > 0) {
    console.log()
    console.log('  Not found:')
    for (const n of notFound) {
      console.log(`    - ${n}`)
    }
  }

  if (skipped.length > 0) {
    console.log()
    console.log('  Skipped:')
    for (const n of skipped) {
      console.log(`    - ${n}`)
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
