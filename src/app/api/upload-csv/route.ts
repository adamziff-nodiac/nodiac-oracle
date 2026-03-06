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

    // Insert directly into tracker_sites (upsert on name conflict)
    const sitesToInsert = parsedSites.map((site) => {
      const rd = site.raw_data
      findRawValue(rd, ['county', 'county name', 'county_name'])
      findRawValue(rd, ['state', 'state name', 'state_name', 'state abbreviation'])

      const row: Record<string, unknown> = {
        name: site.site_name,
        latitude: site.latitude,
        longitude: site.longitude,
        priority: 'Pipeline',
      }

      // Only set partner FK if found
      if (partnerId) {
        row.ipp_id = partnerId
      }

      return row
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertedSites, error: insertError } = await (supabase as any)
      .from('tracker_sites')
      .upsert(sitesToInsert, { onConflict: 'name', ignoreDuplicates: true })
      .select('id, name')

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Build a virtual "upload" identifier for the client flow
    // Use a deterministic ID based on upload name + timestamp
    const uploadId = `upload_${Date.now()}`

    return NextResponse.json({
      upload_id: uploadId,
      upload_name: name,
      site_count: parsedSites.length,
      partner_id: partnerId,
      site_names: (insertedSites ?? []).map((s: { name: string }) => s.name),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
