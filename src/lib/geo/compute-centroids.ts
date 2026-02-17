/**
 * Compute polygon centroids from county GeoJSON.
 * Uses coordinate-mean of the largest polygon ring (for MultiPolygon).
 * No turf dependency — pure arithmetic.
 */

export interface CountyCentroid {
  fips: string
  lng: number
  lat: number
  area: number // CENSUSAREA in sq miles
}

type Position = [number, number, ...number[]]

function ringCentroid(ring: Position[]): { lng: number; lat: number } {
  let lngSum = 0
  let latSum = 0
  // Skip the closing vertex (identical to first)
  const n = ring.length - 1
  for (let i = 0; i < n; i++) {
    lngSum += ring[i][0]
    latSum += ring[i][1]
  }
  return { lng: lngSum / n, lat: latSum / n }
}

function largestPolygonRing(geometry: GeoJSON.Geometry): Position[] | null {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates[0] as Position[]
  }
  if (geometry.type === 'MultiPolygon') {
    let largest: Position[] | null = null
    let maxLen = 0
    for (const poly of geometry.coordinates) {
      const ring = poly[0] as Position[]
      if (ring.length > maxLen) {
        maxLen = ring.length
        largest = ring
      }
    }
    return largest
  }
  return null
}

export function computeCentroids(
  geojson: GeoJSON.FeatureCollection
): CountyCentroid[] {
  const results: CountyCentroid[] = []

  for (const feature of geojson.features) {
    const fips = feature.properties?.FIPS as string | undefined
    const area = feature.properties?.CENSUSAREA as number | undefined
    if (!fips || area == null || !feature.geometry) continue

    const ring = largestPolygonRing(feature.geometry)
    if (!ring || ring.length < 3) continue

    const { lng, lat } = ringCentroid(ring)
    results.push({ fips, lng, lat, area })
  }

  return results
}
