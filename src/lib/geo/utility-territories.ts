/**
 * HIFLD Electric Retail Service Territories
 * Source: Homeland Infrastructure Foundation-Level Data (HIFLD)
 * Geometry: Polygon/MultiPolygon boundaries for all US electric utilities
 * Spatial query: point-in-polygon and bounding-box intersection
 */

const FEATURE_SERVER_URL =
  'https://services3.arcgis.com/OYP7N6mAJJCyH6hd/arcgis/rest/services/' +
  'Electric_Retail_Service_Territories_HIFLD/FeatureServer/0/query'

const OUT_FIELDS = 'NAME,STATE,TYPE,CUSTOMERS,ID'

export interface UtilityTerritory {
  name: string
  state: string
  type: string
  customers: number | null
  id: string
}

/**
 * Look up which utility territory contains a given lat/lon point.
 */
export async function lookupUtilityByPoint(
  lat: number,
  lon: number
): Promise<UtilityTerritory | null> {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: OUT_FIELDS,
    returnGeometry: 'false',
    f: 'json',
  })

  const res = await fetch(`${FEATURE_SERVER_URL}?${params}`, {
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) return null

  const data = await res.json()
  const feat = data.features?.[0]
  if (!feat) return null

  const a = feat.attributes
  return {
    name: a.NAME,
    state: a.STATE,
    type: a.TYPE,
    customers: a.CUSTOMERS === -999999 ? null : a.CUSTOMERS,
    id: a.ID,
  }
}

/**
 * Fetch utility territory GeoJSON for a bounding box.
 * Returns a GeoJSON FeatureCollection with polygon boundaries.
 */
export async function fetchTerritoryGeoJSON(
  bbox: [number, number, number, number], // [west, south, east, north]
  maxRecords = 200
): Promise<GeoJSON.FeatureCollection> {
  const [west, south, east, north] = bbox

  const params = new URLSearchParams({
    geometry: `${west},${south},${east},${north}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: OUT_FIELDS,
    returnGeometry: 'true',
    resultRecordCount: String(maxRecords),
    f: 'geojson',
  })

  const res = await fetch(`${FEATURE_SERVER_URL}?${params}`, {
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    return { type: 'FeatureCollection', features: [] }
  }

  return res.json()
}

/**
 * Batch lookup utilities for multiple sites.
 * Returns a map of index → UtilityTerritory.
 */
export async function batchLookupUtilities(
  coordinates: Array<{ lat: number; lon: number; index: number }>,
  concurrency = 5
): Promise<Map<number, UtilityTerritory>> {
  const results = new Map<number, UtilityTerritory>()
  const chunks: Array<typeof coordinates> = []

  for (let i = 0; i < coordinates.length; i += concurrency) {
    chunks.push(coordinates.slice(i, i + concurrency))
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async ({ lat, lon, index }) => {
      const result = await lookupUtilityByPoint(lat, lon)
      if (result) results.set(index, result)
    })
    await Promise.all(promises)
  }

  return results
}
