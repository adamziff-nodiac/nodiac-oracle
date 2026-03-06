import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseFleetCSV } from '@/lib/csv/parse-fleet-csv'

/** Find a value in raw_data by checking multiple possible key names (case-insensitive). */
function findRawValue(rd: Record<string, string>, keys: string[]): string | undefined {
  for (const [k, v] of Object.entries(rd)) {
    if (keys.includes(k.toLowerCase().trim()) && v.trim()) return v.trim()
  }
  return undefined
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const name = (formData.get('name') as string) || file?.name || 'Untitled Upload'
    const partnerName = (formData.get('ipp_name') as string)?.trim() || null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const csvText = await file.text()
    const parsedSites = parseFleetCSV(csvText)

    if (parsedSites.length === 0) {
      return NextResponse.json({ error: 'No valid sites found in CSV' }, { status: 400 })
    }

    // Find partner by name if provided
    let partnerId: string | null = null
    if (partnerName) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const { data: existing } = await sb
        .from('tracker_power_partners')
        .select('id')
        .ilike('name', partnerName)
        .maybeSingle()

      if (existing) {
        partnerId = existing.id
      }
    }

    // Create portfolio upload
    const uploadRow: Record<string, unknown> = {
      user_id: user.id,
      name,
      site_count: parsedSites.length,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: upload, error: uploadError } = await (supabase as any)
      .from('portfolio_uploads')
      .insert(uploadRow)
      .select()
      .single()

    if (uploadError || !upload) {
      return NextResponse.json({ error: uploadError?.message || 'Failed to create upload' }, { status: 500 })
    }

    // Insert sites — extract county/state from raw_data when available
    const sitesToInsert = parsedSites.map((site) => {
      const rd = site.raw_data
      const county = findRawValue(rd, ['county', 'county name', 'county_name']) || null
      const state = findRawValue(rd, ['state', 'state name', 'state_name', 'state abbreviation']) || null

      return {
        upload_id: upload.id,
        site_name: site.site_name,
        latitude: site.latitude,
        longitude: site.longitude,
        county,
        state,
        raw_data: site.raw_data,
      }
    })

    const { error: sitesError } = await supabase
      .from('portfolio_sites')
      .insert(sitesToInsert)

    if (sitesError) {
      return NextResponse.json({ error: sitesError.message }, { status: 500 })
    }

    return NextResponse.json({
      upload_id: upload.id,
      site_count: parsedSites.length,
      partner_id: partnerId,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
