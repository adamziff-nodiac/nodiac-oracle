import { NextRequest, NextResponse } from 'next/server'
import { getHubSites } from '@/lib/tracker/queries'

export async function GET(request: NextRequest) {
  const hubName = request.nextUrl.searchParams.get('hubName')
  if (!hubName) {
    return NextResponse.json([], { status: 400 })
  }

  try {
    const sites = await getHubSites(hubName)
    return NextResponse.json(sites)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
