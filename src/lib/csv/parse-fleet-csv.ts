import type { ParsedSite } from '@/types/screening'

/**
 * Column name mappings from Fleet CIR Validated CSV to internal names.
 * Keys are lowercase trimmed CSV headers, values are internal field names.
 */
const COLUMN_MAP: Record<string, keyof ParsedSite> = {
  // Site identification
  'site name': 'site_name',
  'site': 'site_name',
  'name': 'site_name',
  'project name': 'site_name',

  // Coordinates
  'geolocation (latitude)': 'latitude',
  'latitude': 'latitude',
  'lat': 'latitude',
  'geolocation (longitude)': 'longitude',
  'longitude': 'longitude',
  'lng': 'longitude',
  'lon': 'longitude',

  // Utility
  'interconnecting utility': 'utility_name',
  'utility': 'utility_name',
  'electric infrastructure owner & operator': 'utility_type',
  'utility type': 'utility_type',

  // Zoning
  'existing zoning': 'zoning',
  'zoning': 'zoning',
  'zoning rank': 'zoning_rank',

  // Fiber
  'fiber optics availability': 'fiber',
  'fiber': 'fiber',
  'fiber availability': 'fiber',

  // Grid capacity
  'line available capacity (mw)': 'grid_capacity_mw',
  'available capacity (mw)': 'grid_capacity_mw',
  'line load hosting capacity (mw)': 'load_hosting_capacity_mw',
  'load hosting capacity (mw)': 'load_hosting_capacity_mw',

  // DC capacity
  'line proposed data center capacity (mw)': 'proposed_dc_capacity_mw',
  'proposed data center capacity (mw)': 'proposed_dc_capacity_mw',
  'proposed dc capacity (mw)': 'proposed_dc_capacity_mw',

  // Area
  'net useable area (acres)': 'net_useable_area_acres',
  'net useable area': 'net_useable_area_acres',
  'useable area (acres)': 'net_useable_area_acres',
}

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

function parseNumber(value: string | undefined): number | null {
  if (!value || value.trim() === '' || value === 'N/A' || value === '-') return null
  const cleaned = value.replace(/[,$%]/g, '').trim()
  const num = Number(cleaned)
  return isNaN(num) ? null : num
}

/**
 * Parse a Fleet CIR Validated CSV string into structured site data.
 * Gracefully handles missing columns by leaving fields as null.
 */
export function parseFleetCSV(csvText: string): ParsedSite[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const headerMap = new Map<number, keyof ParsedSite>()

  headers.forEach((header, index) => {
    const normalized = header.toLowerCase().trim()
    const field = COLUMN_MAP[normalized]
    if (field) {
      headerMap.set(index, field)
    }
  })

  const sites: ParsedSite[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.every(v => v === '')) continue

    const raw_data: Record<string, string> = {}
    headers.forEach((header, idx) => {
      if (values[idx]) raw_data[header] = values[idx]
    })

    const site: ParsedSite = {
      site_name: '',
      latitude: null,
      longitude: null,
      utility_name: null,
      utility_type: null,
      zoning: null,
      zoning_rank: null,
      fiber: null,
      grid_capacity_mw: null,
      load_hosting_capacity_mw: null,
      proposed_dc_capacity_mw: null,
      net_useable_area_acres: null,
      raw_data,
    }

    headerMap.forEach((field, colIndex) => {
      const value = values[colIndex]
      if (!value || value.trim() === '') return

      switch (field) {
        case 'latitude':
        case 'longitude':
        case 'grid_capacity_mw':
        case 'load_hosting_capacity_mw':
        case 'proposed_dc_capacity_mw':
        case 'net_useable_area_acres':
          (site as unknown as Record<string, unknown>)[field] = parseNumber(value)
          break
        default:
          (site as unknown as Record<string, unknown>)[field] = value.trim()
      }
    })

    // Fallback: if no site_name, use row index
    if (!site.site_name) {
      site.site_name = `Site ${i}`
    }

    sites.push(site)
  }

  return sites
}
