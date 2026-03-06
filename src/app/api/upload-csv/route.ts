import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseFleetCSV } from '@/lib/csv/parse-fleet-csv'
import { lookupUtilityByPoint } from '@/lib/geo/utility-territories'

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

    // Auto-assign utilities based on HIFLD territory lookup
    const inserted = (insertedSites ?? []) as Array<{ id: string; name: string }>
    if (inserted.length > 0) {
      // Re-fetch the inserted sites to get their coordinates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sitesWithCoords } = await (supabase as any)
        .from('tracker_sites')
        .select('id, name, latitude, longitude, utility_id')
        .in('id', inserted.map(s => s.id))

      const toAssign = (sitesWithCoords ?? []).filter(
        (s: { latitude: number | null; longitude: number | null; utility_id: string | null }) =>
          s.latitude != null && s.longitude != null && !s.utility_id
      )

      // Fetch existing partners for matching
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allPartners } = await (supabase as any)
        .from('tracker_power_partners')
        .select('id, name')

      const partnerByName = new Map<string, string>(
        (allPartners ?? []).map((p: { id: string; name: string }) => [p.name.toLowerCase(), p.id])
      )

      for (const site of toAssign) {
        try {
          const territory = await lookupUtilityByPoint(site.latitude, site.longitude)
          if (!territory) continue

          const hifldName = territory.name
          let utilityPartnerId = partnerByName.get(hifldName.toLowerCase())

          // Try fuzzy match
          if (!utilityPartnerId) {
            const normalized = (s: string) =>
              s.toLowerCase().replace(/\b(inc|llc|co|corp|cooperative|coop|electric|energy|power|of|the)\b/g, '').replace(/[^a-z0-9]/g, '')
            const hifldNorm = normalized(hifldName)
            for (const [name, id] of partnerByName) {
              if (normalized(name) === hifldNorm) {
                utilityPartnerId = id
                break
              }
            }
          }

          // Create new partner if needed
          if (!utilityPartnerId) {
            const displayName = hifldName.toLowerCase().split(/\s+/).map((w, i) => {
              const skip = ['of', 'the', 'and', 'for', 'in', 'at', 'by', 'to', 'or', 'an', 'a', 'co', 'inc', 'llc']
              if (i > 0 && skip.includes(w)) return w
              return w.charAt(0).toUpperCase() + w.slice(1)
            }).join(' ')

            const typeMap: Record<string, string> = {
              'INVESTOR OWNED': 'IOU',
              'COOPERATIVE': 'Distribution Co-op',
              'MUNICIPAL': 'Municipal Utility',
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: newPartner } = await (supabase as any)
              .from('tracker_power_partners')
              .insert({ name: displayName, type: typeMap[territory.type] ?? null })
              .select('id')
              .single()

            if (newPartner) {
              utilityPartnerId = newPartner.id
              partnerByName.set(hifldName.toLowerCase(), newPartner.id)
            }
          }

          if (utilityPartnerId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from('tracker_sites')
              .update({ utility_id: utilityPartnerId })
              .eq('id', site.id)
          }
        } catch {
          // Non-fatal — site was created, utility just wasn't assigned
        }
      }
    }

    // Build a virtual "upload" identifier for the client flow
    const uploadId = `upload_${Date.now()}`

    return NextResponse.json({
      upload_id: uploadId,
      upload_name: name,
      site_count: parsedSites.length,
      partner_id: partnerId,
      site_names: inserted.map(s => s.name),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
