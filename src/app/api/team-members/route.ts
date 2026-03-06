import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTeamMembers } from '@/lib/tracker/queries'

export async function GET() {
  try {
    const members = await getTeamMembers()
    return NextResponse.json(members)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { display_name, email } = body

    if (!display_name) {
      return NextResponse.json({ error: 'display_name is required' }, { status: 400 })
    }

    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('team_members')
      .insert({ display_name, email: email ?? null })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}
