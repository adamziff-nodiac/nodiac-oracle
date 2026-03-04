import { NextRequest, NextResponse } from 'next/server'
import { getPartnerSites } from '@/lib/tracker/queries'

export async function GET(request: NextRequest) {
  const partnerId = request.nextUrl.searchParams.get('partnerId')
  if (!partnerId) {
    return NextResponse.json([], { status: 400 })
  }

  try {
    const sites = await getPartnerSites(partnerId)
    return NextResponse.json(sites)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
