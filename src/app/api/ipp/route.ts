import { NextResponse } from 'next/server'
import { getTrackerPartners } from '@/lib/tracker/queries'

export async function GET() {
  try {
    const partners = await getTrackerPartners()
    return NextResponse.json(partners)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
