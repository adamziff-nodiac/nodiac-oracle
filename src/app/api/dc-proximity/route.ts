import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PHASE_VIEW_COLUMNS } from '@/lib/tracker/constants'

export interface DCProximityPartner {
  id: string
  name: string
  type: string | null
  relationship_stage: string | null
}

export interface DCProximitySite {
  id: string
  name: string
  latitude: number
  longitude: number
  utility_name: string | null
  asset_owner_name: string | null
  priority: string
  mw_current: number | null
  site_type: string | null
  hub_name: string | null
  // Phase statuses — keys derived from PHASES constant (e.g. site_control_phase, power_phase, ...)
  [key: string]: unknown
}

export interface DCProximityResponse {
  partners: DCProximityPartner[]
  sites: DCProximitySite[]
}

const SITE_BASE_COLUMNS = 'id, name, latitude, longitude, utility_name, asset_owner_name, priority, mw_current, site_type, hub_name, address, ahj, interconnection_voltage_kv'
const SITE_SELECT = [SITE_BASE_COLUMNS, ...PHASE_VIEW_COLUMNS].join(', ')

export async function GET() {
  try {
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [partnersResult, sitesResult] = await Promise.all([
      (supabase as any)
        .from('tracker_power_partners')
        .select('id, name, type, relationship_stage'),
      (supabase as any)
        .from('tracker_site_overview')
        .select(SITE_SELECT)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null),
    ])

    if (partnersResult.error) throw partnersResult.error
    if (sitesResult.error) throw sitesResult.error

    return NextResponse.json({
      partners: (partnersResult.data ?? []) as DCProximityPartner[],
      sites: (sitesResult.data ?? []) as DCProximitySite[],
    })
  } catch (err) {
    console.error('[dc-proximity] Failed to fetch tracker data:', err)
    return NextResponse.json({ partners: [], sites: [] })
  }
}
