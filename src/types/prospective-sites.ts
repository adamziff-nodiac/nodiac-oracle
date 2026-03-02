/** Compact IPP site from prospective-ipp-*.json */
export interface IPPSiteCompact {
  id: number   // plant_code
  n: string    // plant_name
  y: number    // latitude
  x: number    // longitude
  s: string    // state
  t: string    // technology_type (solar, wind, storage, etc.)
  kv: number | null  // min_kv
  vt?: string | null // voltage_tier (only in dist file)
}

/** Compact substation from prospective-substations.json */
export interface SubstationCompact {
  n: string    // NAME
  y: number    // LATITUDE
  x: number    // LONGITUDE
  s: string    // STATE
  tp: string   // TYPE
  mv: number | null // MAX_VOLT
  c: string    // CITY
  co: string   // COUNTY
  cf: string   // COUNTYFIPS
  ln: number | null // LINES
  mnv: number | null // MIN_VOLT
  u: string | null   // utility name (from enrichment)
  ut: string | null  // utility type
  hc: string | null  // holding company
  cust: number | null // customers served
  sp: number | null   // summer peak MW
}

/** GeoJSON feature properties for prospective site markers */
export interface ProspectiveSiteProperties {
  name: string
  siteType: 'solar' | 'wind' | 'storage' | 'hydro' | 'other' | 'substation'
  state: string
  voltage: number | null
  voltageTier?: string | null
  /** Pre-computed distance to nearest Google DC in miles */
  nearestDCMiles: number
  city?: string | null
  county?: string | null
  countyFips?: string | null
  lines?: number | null
  minVoltage?: number | null
  utility?: string | null
  utilityType?: string | null
  holdingCompany?: string | null
  customers?: number | null
  summerPeakMW?: number | null
}
