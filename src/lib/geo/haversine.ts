/** Earth's mean radius in kilometers. */
const R_KM = 6371

/** Haversine distance between two (lat, lng) points in kilometers. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = Math.PI / 180
  const dLat = (lat2 - lat1) * toRad
  const dLng = (lng2 - lng1) * toRad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2
  return 2 * R_KM * Math.asin(Math.sqrt(a))
}

const KM_PER_MILE = 1.60934

export function milesToKm(miles: number): number {
  return miles * KM_PER_MILE
}

export function kmToMiles(km: number): number {
  return km / KM_PER_MILE
}
