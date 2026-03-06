import { NextRequest, NextResponse } from 'next/server'
import { lookupUtilityByPoint } from '@/lib/geo/utility-territories'

/**
 * GET /api/utilities/lookup?lat=39.74&lon=-104.99
 * Returns the utility territory containing the given point.
 */
export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get('lat'))
  const lon = Number(req.nextUrl.searchParams.get('lon'))

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'lat and lon parameters required' }, { status: 400 })
  }

  try {
    const result = await lookupUtilityByPoint(lat, lon)
    if (!result) {
      return NextResponse.json({ utility: null })
    }
    return NextResponse.json({ utility: result }, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    })
  } catch {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 502 })
  }
}
