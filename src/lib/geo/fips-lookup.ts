import type { FipsLookupResult } from '@/types/screening'

/**
 * Look up county FIPS code from latitude/longitude via the FCC Area API.
 * Should be called server-side to avoid CORS issues.
 */
export async function lookupFips(
  lat: number,
  lon: number
): Promise<FipsLookupResult | null> {
  try {
    const url = `https://geo.fcc.gov/api/census/area?lat=${lat}&lon=${lon}&format=json`
    const response = await fetch(url)

    if (!response.ok) return null

    const data = await response.json()
    if (!data.results || data.results.length === 0) return null

    const result = data.results[0]
    return {
      fips: result.county_fips,
      county_name: result.county_name,
      state_code: result.state_fips,
      state_name: result.state_name,
    }
  } catch {
    return null
  }
}

/**
 * Batch lookup FIPS codes for multiple coordinates.
 * Processes in parallel with concurrency limit to avoid overloading the API.
 */
export async function batchLookupFips(
  coordinates: Array<{ lat: number; lon: number; index: number }>,
  concurrency = 5
): Promise<Map<number, FipsLookupResult>> {
  const results = new Map<number, FipsLookupResult>()
  const chunks: Array<typeof coordinates> = []

  for (let i = 0; i < coordinates.length; i += concurrency) {
    chunks.push(coordinates.slice(i, i + concurrency))
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async ({ lat, lon, index }) => {
      const result = await lookupFips(lat, lon)
      if (result) results.set(index, result)
    })
    await Promise.all(promises)
  }

  return results
}
