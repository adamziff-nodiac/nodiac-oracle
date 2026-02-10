import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: upload, error: uploadError } = await supabase
    .from('portfolio_uploads')
    .select('*')
    .eq('id', id)
    .single()

  if (uploadError || !upload) {
    return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
  }

  const { data: sites, error: sitesError } = await supabase
    .from('portfolio_sites')
    .select('*')
    .eq('upload_id', id)
    .order('site_name')

  if (sitesError) {
    return NextResponse.json({ error: sitesError.message }, { status: 500 })
  }

  return NextResponse.json({ upload, sites })
}
