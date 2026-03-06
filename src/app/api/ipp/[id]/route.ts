import { NextRequest, NextResponse } from 'next/server'
import { getTrackerIPP, getIPPPortfolios, getIPPSites } from '@/lib/tracker/queries'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [ipp, portfolios, sites] = await Promise.all([
      getTrackerIPP(id),
      getIPPPortfolios(id),
      getIPPSites(id),
    ])

    if (!ipp) {
      return NextResponse.json({ error: 'IPP not found' }, { status: 404 })
    }

    return NextResponse.json({ ipp, portfolios, sites })
  } catch {
    return NextResponse.json({ error: 'Failed to load IPP' }, { status: 500 })
  }
}
