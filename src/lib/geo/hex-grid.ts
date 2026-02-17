/**
 * Hex grid generation + county-to-hex assignment + score averaging.
 * Flat-top hexagonal tiling over US bounding box.
 * No h3-js dependency — pure coordinate math.
 */

import type { CountyCentroid } from './compute-centroids'

// US continental bounding box
const LNG_MIN = -125
const LNG_MAX = -67
const LAT_MIN = 24
const LAT_MAX = 50

// Approximate conversions at mid-US latitude (~37°N)
const MI_PER_DEG_LAT = 69
const MI_PER_DEG_LNG_37 = 55 // 69 * cos(37°)

/**
 * Generate hex polygons for flat-top hexagons.
 * For a flat-top hex with "radius" r (center to vertex):
 * - width = 2r
 * - height = sqrt(3) * r
 * - col spacing = 1.5r
 * - row spacing = sqrt(3) * r
 * - odd columns shifted up by sqrt(3)/2 * r
 */
function hexCorners(cx: number, cy: number, rx: number, ry: number): [number, number][] {
  const corners: [number, number][] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i
    corners.push([
      cx + rx * Math.cos(angle),
      cy + ry * Math.sin(angle),
    ])
  }
  // Close the polygon
  corners.push(corners[0])
  return corners
}

export function generateHexGrid(
  centroids: CountyCentroid[],
  scoreLookup: Map<string, number>,
  hexRadiusMi: number = 50
): GeoJSON.FeatureCollection {
  // Convert radius to degrees
  const rxDeg = hexRadiusMi / MI_PER_DEG_LNG_37
  const ryDeg = hexRadiusMi / MI_PER_DEG_LAT

  // Flat-top hex spacing
  const colSpacing = 1.5 * rxDeg
  const rowSpacing = Math.sqrt(3) * ryDeg

  // Build hex grid centers
  const hexCenters: { col: number; row: number; cx: number; cy: number }[] = []
  let col = 0
  for (let cx = LNG_MIN; cx <= LNG_MAX; cx += colSpacing) {
    let row = 0
    const yOffset = col % 2 === 1 ? rowSpacing / 2 : 0
    for (let cy = LAT_MIN + yOffset; cy <= LAT_MAX; cy += rowSpacing) {
      hexCenters.push({ col, row, cx, cy })
      row++
    }
    col++
  }

  // Assign centroids to nearest hex
  const hexScores = new Map<string, number[]>()

  for (const c of centroids) {
    const score = scoreLookup.get(c.fips)
    if (score == null) continue

    // Find nearest hex center (brute force is fine for ~200 hexes × ~3000 centroids)
    let bestKey = ''
    let bestDist = Infinity
    for (const h of hexCenters) {
      const dLng = (c.lng - h.cx) / rxDeg
      const dLat = (c.lat - h.cy) / ryDeg
      const dist = dLng * dLng + dLat * dLat
      if (dist < bestDist) {
        bestDist = dist
        bestKey = `${h.col}:${h.row}`
      }
    }
    if (bestDist <= 4) { // Within ~2 hex radii
      if (!hexScores.has(bestKey)) hexScores.set(bestKey, [])
      hexScores.get(bestKey)!.push(score)
    }
  }

  // Build GeoJSON features for hexes with data
  const features: GeoJSON.Feature[] = []
  for (const h of hexCenters) {
    const key = `${h.col}:${h.row}`
    const scores = hexScores.get(key)
    if (!scores || scores.length === 0) continue

    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length
    const corners = hexCorners(h.cx, h.cy, rxDeg, ryDeg)

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [corners],
      },
      properties: {
        avgScore,
        countyCount: scores.length,
      },
    })
  }

  return { type: 'FeatureCollection', features }
}
