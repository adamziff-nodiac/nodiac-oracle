import { NextRequest, NextResponse } from 'next/server'
import { getHubPartners } from '@/lib/tracker/queries'

export async function GET(request: NextRequest) {
  const hubId = request.nextUrl.searchParams.get('hubId')
  if (!hubId) {
    return NextResponse.json([], { status: 400 })
  }

  try {
    const partners = await getHubPartners(hubId)
    return NextResponse.json(partners)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
