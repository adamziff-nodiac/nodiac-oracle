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
}
