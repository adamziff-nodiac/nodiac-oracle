/**
 * Check whether a geographic point falls within a co-op or public power
 * service territory using the ArcGIS "America Electrical Coop Service
 * Territories" layer (Oak Ridge / LANL / INL data, public).
 *
 * Layer 10 — 833 polygon features covering co-op + public power districts.
 * Spatial query: point-in-polygon intersection.
 */

const COOP_TERRITORY_URL =
  'https://services5.arcgis.com/ARxOqVFcodl7rmzw/arcgis/rest/services/' +
  'America_Electrical_Coop_Service_Territories/FeatureServer/10/query'

export interface CoopTerritoryResult {
  inCoopTerritory: boolean
  utilityName: string | null
}

/**
 * Check if a single lat/lon point falls within a co-op or public power
 * service territory. Returns the utility name if found.
 */
export async function checkCoopTerritory(
  lat: number,
  lon: number
): Promise<CoopTerritoryResult> {
  try {
    const geometry = JSON.stringify({
      x: lon,
      y: lat,
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

/**
 * Batch check multiple coordinates against co-op territories.
 * Processes in parallel chunks with concurrency limit.
 */
export async function batchCheckCoopTerritory(
  coordinates: Array<{ lat: number; lon: number; index: number }>,
  concurrency = 5
): Promise<Map<number, CoopTerritoryResult>> {
  const results = new Map<number, CoopTerritoryResult>()
  const chunks: Array<typeof coordinates> = []

  for (let i = 0; i < coordinates.length; i += concurrency) {
    chunks.push(coordinates.slice(i, i + concurrency))
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
