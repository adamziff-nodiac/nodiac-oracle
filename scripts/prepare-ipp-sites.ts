/**
 * Reads IPP site CSVs from nodiac-hq and outputs compact JSON for the regional hubs map.
 *
 * Outputs:
 *   public/data/prospective-ipp-dist.json  — distribution-connected sites only (~4,400)
 *   public/data/prospective-ipp-all.json   — all IPP renewable sites (~6,900)
 *
 * Compact format per site:
 *   { id, n, y, x, s, t, kv, vt }
 *   id = plant_code, n = plant_name, y = latitude, x = longitude,
 *   s = state, t = technology_type, kv = min_kv, vt = voltage_tier (dist only)
 *
 * Run: bun run scripts/prepare-ipp-sites.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const HQ_CSV_DIR = resolve(
  process.env.HOME!,
  'dev/nodiac-hq/reference/research/tam-analysis/outputs-sonnet/csv-sonnet'
)
const OUT_DIR = resolve(__dirname, '../public/data')

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map((line) => {
    const values = line.split(',')
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => (obj[h] = values[i] ?? ''))
    return obj
  })
}

// --- All IPP sites ---
const allCSV = readFileSync(resolve(HQ_CSV_DIR, 'ipp_sites_inventory.csv'), 'utf-8')
const allRows = parseCSV(allCSV)

const allSites = allRows
  .filter((r) => r.latitude && r.longitude && !isNaN(+r.latitude) && !isNaN(+r.longitude))
  .map((r) => ({
    id: +r.plant_code,
    n: r.plant_name,
    y: +parseFloat(r.latitude).toFixed(4),
    x: +parseFloat(r.longitude).toFixed(4),
    s: r.state,
    t: r.technology_type,
    kv: r.min_kv ? +parseFloat(r.min_kv).toFixed(1) : null,
  }))

// --- Distribution-connected sites ---
const distCSV = readFileSync(resolve(HQ_CSV_DIR, 'sites_distribution_connected.csv'), 'utf-8')
const distRows = parseCSV(distCSV)

const distSites = distRows
  .filter((r) => r.latitude && r.longitude && !isNaN(+r.latitude) && !isNaN(+r.longitude))
  .map((r) => ({
    id: +r.plant_code,
    n: r.plant_name,
    y: +parseFloat(r.latitude).toFixed(4),
    x: +parseFloat(r.longitude).toFixed(4),
    s: r.state,
    t: r.technology_type,
    kv: r.min_kv ? +parseFloat(r.min_kv).toFixed(1) : null,
    vt: r.voltage_tier || null,
  }))

mkdirSync(OUT_DIR, { recursive: true })

writeFileSync(resolve(OUT_DIR, 'prospective-ipp-all.json'), JSON.stringify(allSites))
writeFileSync(resolve(OUT_DIR, 'prospective-ipp-dist.json'), JSON.stringify(distSites))

console.log(`Wrote ${allSites.length} all-IPP sites → public/data/prospective-ipp-all.json`)
console.log(`Wrote ${distSites.length} dist-connected sites → public/data/prospective-ipp-dist.json`)
