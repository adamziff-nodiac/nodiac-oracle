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

export interface ClusterOptions {
  topPercent?: number     // default 10
  maxDistKm?: number      // default 250
  maxRadiusKm?: number    // default 500 (~310mi) — enforced post-clustering
  minClusterSize?: number // default 10
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
  const dominantState = sorted[0]?.[0] || ''
  const dominantPct = sorted[0] ? sorted[0][1] / centroids.length : 0

  // Geographic descriptor based on centroid position
  let descriptor = ''
  if (avgLat > 43 && avgLng < -85 && avgLng > -100) descriptor = 'Upper Midwest'
  else if (avgLat > 43 && avgLng <= -100) descriptor = 'Northern Plains'
  else if (avgLat > 43 && avgLng >= -85) descriptor = 'Great Lakes'
  else if (avgLat > 40 && avgLng > -80) descriptor = 'Northeast'
  else if (avgLat > 37 && avgLng > -85 && avgLng <= -75) descriptor = 'Mid-Atlantic'
  else if (avgLat > 35 && avgLat <= 40 && avgLng > -90 && avgLng <= -80) descriptor = 'Appalachian'
  else if (avgLat > 35 && avgLat <= 43 && avgLng <= -100 && avgLng > -110) descriptor = 'Great Plains'
  else if (avgLng < -115 && avgLat > 42) descriptor = 'Pacific Northwest'
  else if (avgLng <= -110 && avgLng > -115 && avgLat > 37) descriptor = 'Intermountain'
  else if (avgLng <= -110 && avgLat <= 37) descriptor = 'Southwest'
  else if (avgLat <= 33 && avgLng > -100 && avgLng < -85) descriptor = 'Gulf Coast'
  else if (avgLat <= 35 && avgLng >= -85) descriptor = 'Southeast'
  else if (avgLat <= 35 && avgLng >= -85) descriptor = 'Piedmont'
  else if (avgLng < -100 && avgLng >= -110 && avgLat > 35 && avgLat <= 43) descriptor = 'Front Range'
  else if (avgLat < 33 && avgLng < -100) descriptor = 'Southwest'
  else descriptor = 'Central'

  // Build name: single-state dominant → "Central TX"; multi-state → descriptor only
  if (dominantPct >= 0.65 && states.length <= 2) {
    // Use lat within state for a directional prefix
    const dir = avgLat > 40 ? 'Northern' : avgLat < 33 ? 'Southern' : 'Central'
    return { name: `${dir} ${dominantState}`, states }
  }
  // Multi-state cluster: use regional descriptor alone
  return { name: descriptor, states }
}

// --- Split oversized clusters ---

function computeClusterCentroid(members: CountyCentroid[]): { lng: number; lat: number } {
  let cx = 0, cy = 0
  for (const c of members) { cx += c.lng; cy += c.lat }
  return { lng: cx / members.length, lat: cy / members.length }
}

function splitOversizedCluster(
  members: CountyCentroid[],
  maxRadiusKm: number
): CountyCentroid[][] {
  const centroid = computeClusterCentroid(members)

  // Check if cluster fits within max radius
  let maxDist = 0
  for (const c of members) {
    const d = haversineKm(centroid.lat, centroid.lng, c.lat, c.lng)
    if (d > maxDist) maxDist = d
  }
  if (maxDist <= maxRadiusKm) return [members]

  // Split: find the two most distant members as seeds
  let bestDist = 0
  let seedA = 0, seedB = 1
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const d = haversineKm(members[i].lat, members[i].lng, members[j].lat, members[j].lng)
      if (d > bestDist) { bestDist = d; seedA = i; seedB = j }
    }
  }

  // Assign each member to nearest seed
  const groupA: CountyCentroid[] = []
  const groupB: CountyCentroid[] = []
  for (const c of members) {
    const dA = haversineKm(c.lat, c.lng, members[seedA].lat, members[seedA].lng)
    const dB = haversineKm(c.lat, c.lng, members[seedB].lat, members[seedB].lng)
    if (dA <= dB) groupA.push(c)
    else groupB.push(c)
  }

  // Recursively split if still too large
  const result: CountyCentroid[][] = []
  if (groupA.length >= 3) result.push(...splitOversizedCluster(groupA, maxRadiusKm))
  if (groupB.length >= 3) result.push(...splitOversizedCluster(groupB, maxRadiusKm))
  return result
}

// --- Merge adjacent clusters ---

function minInterClusterDist(a: CountyCentroid[], b: CountyCentroid[]): number {
  let best = Infinity
  for (const ca of a) {
    for (const cb of b) {
      const d = haversineKm(ca.lat, ca.lng, cb.lat, cb.lng)
      if (d < best) best = d
    }
  }
  return best
}

function fitsInRadius(members: CountyCentroid[], maxRadiusKm: number): boolean {
  const centroid = computeClusterCentroid(members)
  for (const c of members) {
    if (haversineKm(centroid.lat, centroid.lng, c.lat, c.lng) > maxRadiusKm) return false
  }
  return true
}

function mergeAdjacentClusters(
  groups: CountyCentroid[][],
  maxDistKm: number,
  maxRadiusKm: number
): CountyCentroid[][] {
  // Merge threshold: clusters whose nearest members are within 3x the link
  // distance are candidates — aggressive enough to bridge sparse gaps.
  const mergeDist = maxDistKm * 3

  let merged = [...groups]
  let changed = true
  while (changed) {
    changed = false
    for (let i = 0; i < merged.length; i++) {
      for (let j = i + 1; j < merged.length; j++) {
        const dist = minInterClusterDist(merged[i], merged[j])
        if (dist <= mergeDist) {
          const combined = [...merged[i], ...merged[j]]
          if (fitsInRadius(combined, maxRadiusKm)) {
            merged[i] = combined
            merged.splice(j, 1)
            changed = true
            break
          }
        }
      }
      if (changed) break
    }
  }
  return merged
}

// --- Main clustering function ---

export function clusterHubs(
  centroids: CountyCentroid[],
  scoreLookup: Map<string, number>,
  options: ClusterOptions = {}
): HubCluster[] {
  const {
    topPercent = 10,
    maxDistKm = 250,
    maxRadiusKm = 500,  // ~310mi
    minClusterSize = 10,
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

  // 5. Split oversized clusters that exceeded maxRadiusKm
  const splitGroups: CountyCentroid[][] = []
  for (const indices of groups.values()) {
    if (indices.length < minClusterSize) continue
    const members = indices.map(i => topCentroids[i])
    splitGroups.push(...splitOversizedCluster(members, maxRadiusKm))
  }

  // 5b. Merge adjacent clusters that fit within maxRadiusKm
  const mergedGroups = mergeAdjacentClusters(splitGroups, maxDistKm, maxRadiusKm)

  // 6. Build cluster objects
  const clusters: HubCluster[] = []
  let clusterId = 0

  for (const members of mergedGroups) {
    if (members.length < minClusterSize) continue

    const scores = members.map(c => scoreLookup.get(c.fips) || 0)
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length

    const centroid = computeClusterCentroid(members)

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
      centroid,
      hull: bufferedHull,
      states,
    })
  }

  // Sort by score descending
  clusters.sort((a, b) => b.avgScore - a.avgScore)
  return clusters
}
