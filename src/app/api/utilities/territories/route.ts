import { NextRequest, NextResponse } from 'next/server'
import { fetchTerritoryGeoJSON } from '@/lib/geo/utility-territories'

/**
 * GET /api/utilities/territories?bbox=west,south,east,north
 * Returns GeoJSON FeatureCollection of utility territory polygons for the viewport.
 */
export async function GET(req: NextRequest) {
  const bboxParam = req.nextUrl.searchParams.get('bbox')
  if (!bboxParam) {
    return NextResponse.json({ error: 'bbox parameter required (west,south,east,north)' }, { status: 400 })
  }

  const parts = bboxParam.split(',').map(Number)
  if (parts.length !== 4 || parts.some(isNaN)) {
    return NextResponse.json({ error: 'bbox must be 4 comma-separated numbers' }, { status: 400 })
  }

  const bbox = parts as [number, number, number, number]

  try {
    const geojson = await fetchTerritoryGeoJSON(bbox)
    return NextResponse.json(geojson, {
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch territory data' }, { status: 502 })
  }
}
