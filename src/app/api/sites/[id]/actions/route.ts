import { NextResponse, type NextRequest } from 'next/server'
import { getSiteActionItems } from '@/lib/tracker/queries'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const items = await getSiteActionItems(id)
    return NextResponse.json(items)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
