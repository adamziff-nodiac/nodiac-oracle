import { NextResponse } from 'next/server'
import { getTrackerIPPs } from '@/lib/tracker/queries'

export async function GET() {
  try {
    const ipps = await getTrackerIPPs()
    return NextResponse.json(ipps)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
