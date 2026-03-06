import { NextResponse } from 'next/server'
import { getTrackerHubs } from '@/lib/tracker/queries'

export async function GET() {
  try {
    const hubs = await getTrackerHubs()
    return NextResponse.json(hubs)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
