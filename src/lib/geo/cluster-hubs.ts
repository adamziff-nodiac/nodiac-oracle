/**
 * Hub cluster detection: Union-find + Haversine + Convex hull + naming.
 * Groups high-scoring neighboring counties into labeled hub regions.
 * Zero external dependencies.
 */

import type { CountyCentroid } from './compute-centroids'

export interface HubCluster {
  id: number
  name: string
  counties: CountyCentroid[]
  avgScore: number
  countyCount: number
  centroid: { lng: number; lat: number }
  hull: [number, number][]  // [lng, lat] pairs forming convex hull polygon
  states: string[]
}

interface ClusterOptions {
  topPercent?: number     // default 20
  maxDistKm?: number      // default 150
  minClusterSize?: number // default 3
}

// --- Union-Find ---

class UnionFind {
  private parent: number[]
  private rank: number[]

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i)
    this.rank = new Array(n).fill(0)
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x])
    }
    return this.parent[x]
  }

  union(a: number, b: number) {
    const ra = this.find(a)
    const rb = this.find(b)
    if (ra === rb) return
    if (this.rank[ra] < this.rank[rb]) {
      this.parent[ra] = rb
    } else if (this.rank[ra] > this.rank[rb]) {
      this.parent[rb] = ra
    } else {
      this.parent[rb] = ra
      this.rank[ra]++
    }
  }
}

// --- Haversine distance ---

const R_KM = 6371

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = Math.PI / 180
  const dLat = (lat2 - lat1) * toRad
  const dLng = (lng2 - lng1) * toRad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2
  return 2 * R_KM * Math.asin(Math.sqrt(a))
}

// --- Convex hull (Andrew's monotone chain) ---

function cross(o: [number, number], a: [number, number], b: [number, number]): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
}

function convexHull(points: [number, number][]): [number, number][] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (sorted.length <= 2) return sorted

  const lower: [number, number][] = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop()
    }
    lower.push(p)
  }

  const upper: [number, number][] = []
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop()
    }
    upper.push(p)
  }

  // Remove last point of each half because it's repeated
  lower.pop()
  upper.pop()
  return [...lower, ...upper]
}

// --- Buffer hull outward ---

function bufferHull(hull: [number, number][], factor: number): [number, number][] {
  // Compute centroid
  let cx = 0, cy = 0
  for (const [x, y] of hull) {
    cx += x
    cy += y
  }
  cx /= hull.length
  cy /= hull.length

  // Scale each point outward from centroid
  return hull.map(([x, y]) => [
    cx + (x - cx) * factor,
    cy + (y - cy) * factor,
  ] as [number, number])
}

// --- State lookup from FIPS ---

const STATE_ABBRS: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY',
}

function deriveClusterName(centroids: CountyCentroid[]): { name: string; states: string[] } {
  // Count states
  const stateCounts = new Map<string, number>()
  let avgLat = 0, avgLng = 0
  for (const c of centroids) {
    const stateFips = c.fips.slice(0, 2)
    const abbr = STATE_ABBRS[stateFips] || stateFips
    stateCounts.set(abbr, (stateCounts.get(abbr) || 0) + 1)
    avgLat += c.lat
    avgLng += c.lng
  }
  avgLat /= centroids.length
  avgLng /= centroids.length

  // Sort by frequency
  const sorted = [...stateCounts.entries()].sort((a, b) => b[1] - a[1])
  const states = sorted.map(([s]) => s)
  const topStates = states.slice(0, 2)

  // Geographic descriptor based on centroid position
  let descriptor = ''
  if (avgLat > 43 && avgLng < -85) descriptor = 'Upper Midwest'
  else if (avgLat > 43 && avgLng > -85) descriptor = 'Northeast'
  else if (avgLat > 37 && avgLng < -100) descriptor = 'Northern Plains'
  else if (avgLat < 33 && avgLng > -90) descriptor = 'Southeast'
  else if (avgLat < 33 && avgLng < -100) descriptor = 'Southwest'
  else if (avgLng < -110) descriptor = 'Mountain West'
  else if (avgLat > 37 && avgLng > -85) descriptor = 'Mid-Atlantic'
  else descriptor = 'Central'

  // Build name
  if (topStates.length === 1) {
    return { name: `${descriptor} ${topStates[0]}`, states }
  }
  return { name: `${descriptor} (${topStates.join('/')})`, states }
}

// --- Main clustering function ---

export function clusterHubs(
  centroids: CountyCentroid[],
  scoreLookup: Map<string, number>,
  options: ClusterOptions = {}
): HubCluster[] {
  const {
    topPercent = 20,
    maxDistKm = 150,
    minClusterSize = 3,
  } = options

  // 1. Compute score threshold
  const allScores = [...scoreLookup.values()].sort((a, b) => a - b)
  if (allScores.length === 0) return []
  const thresholdIdx = Math.floor(allScores.length * (1 - topPercent / 100))
  const threshold = allScores[thresholdIdx]

  // 2. Filter to top N% centroids
  const topCentroids = centroids.filter(c => {
    const s = scoreLookup.get(c.fips)
    return s != null && s >= threshold
  })

  if (topCentroids.length < minClusterSize) return []

  // 3. Union-find: link centroids within maxDistKm
  const uf = new UnionFind(topCentroids.length)
  for (let i = 0; i < topCentroids.length; i++) {
    for (let j = i + 1; j < topCentroids.length; j++) {
      const dist = haversineKm(
        topCentroids[i].lat, topCentroids[i].lng,
        topCentroids[j].lat, topCentroids[j].lng
      )
      if (dist <= maxDistKm) {
        uf.union(i, j)
      }
    }
  }

  // 4. Group by connected component
  const groups = new Map<number, number[]>()
  for (let i = 0; i < topCentroids.length; i++) {
    const root = uf.find(i)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root)!.push(i)
  }

  // 5. Build cluster objects
  const clusters: HubCluster[] = []
  let clusterId = 0

  for (const indices of groups.values()) {
    if (indices.length < minClusterSize) continue

    const members = indices.map(i => topCentroids[i])
    const scores = members.map(c => scoreLookup.get(c.fips) || 0)
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length

    // Centroid
    let cx = 0, cy = 0
    for (const c of members) {
      cx += c.lng
      cy += c.lat
    }

    // Convex hull
    const points: [number, number][] = members.map(c => [c.lng, c.lat])
    const hull = convexHull(points)
    const bufferedHull = bufferHull(hull, 1.15)

    // Name
    const { name, states } = deriveClusterName(members)

    clusters.push({
      id: clusterId++,
      name,
      counties: members,
      avgScore,
      countyCount: members.length,
      centroid: { lng: cx / members.length, lat: cy / members.length },
      hull: bufferedHull,
      states,
    })
  }

  // Sort by score descending
  clusters.sort((a, b) => b.avgScore - a.avgScore)
  return clusters
}
