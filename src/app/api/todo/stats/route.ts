import { NextResponse, type NextRequest } from 'next/server'
import { getActionItemStats } from '@/lib/tracker/queries'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assigned_to = searchParams.get('assigned_to') ?? undefined
    const stats = await getActionItemStats(assigned_to)
    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ next: 0, waiting: 0, stalled: 0, flaggedNext: null }, { status: 500 })
  }
}
