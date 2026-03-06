import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActionItems } from '@/lib/tracker/queries'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assigned_to = searchParams.get('assigned_to') ?? undefined
    const status = searchParams.get('status')?.split(',') ?? ['next', 'waiting']
    const site_id = searchParams.get('site_id') ?? undefined

    const items = await getActionItems({ assigned_to, status, site_id })
    return NextResponse.json(items)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { site_id, title, status, assigned_to, waiting_on, hard_deadline, defer_until, notes, flagged } = body

    if (!site_id || !title) {
      return NextResponse.json({ error: 'site_id and title are required' }, { status: 400 })
    }

    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('tracker_action_items')
      .insert({
        site_id,
        title,
        status: status ?? 'next',
        assigned_to: assigned_to ?? null,
        waiting_on: waiting_on ?? null,
        waiting_since: status === 'waiting' ? new Date().toISOString() : null,
        hard_deadline: hard_deadline ?? null,
        defer_until: defer_until ?? null,
        notes: notes ?? null,
        flagged: flagged ?? false,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create action item' }, { status: 500 })
  }
}
