import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const [hubsResult, sitesResult] = await Promise.all([
      sb.from('tracker_regional_hubs').select('id, name, status'),
      sb.from('tracker_site_overview').select('id, name, priority, latitude, longitude, hub_name, has_activity, site_control_phase, power_phase, permitting_phase, fiber_phase, engineering_phase, construction_phase')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('has_activity', true),
    ])

    // If tables/columns don't exist yet (migration not applied), return empty
    if (hubsResult.error || sitesResult.error) {
      return NextResponse.json({ hubs: [], trackerSites: [] })
    }

    const allSites = (sitesResult.data ?? []) as Array<{
      id: string; name: string; priority: string; latitude: number; longitude: number;
      hub_name: string | null;
      site_control_phase: string; power_phase: string;
      permitting_phase: string; fiber_phase: string; engineering_phase: string; construction_phase: string;
    }>

    // Compute hub centroids from their sites
    const hubs = ((hubsResult.data ?? []) as Array<{ id: string; name: string; status: string | null }>).map(hub => {
      const hubSites = allSites.filter(s => s.hub_name === hub.name)
      if (hubSites.length === 0) return null
      return {
        id: hub.id,
        name: hub.name,
        status: hub.status,
        lat: hubSites.reduce((sum, s) => sum + Number(s.latitude), 0) / hubSites.length,
        lng: hubSites.reduce((sum, s) => sum + Number(s.longitude), 0) / hubSites.length,
        site_count: hubSites.length,
      }
    }).filter(Boolean)

    const trackerSites = allSites.map(s => ({
      id: s.id,
      name: s.name,
      priority: s.priority,
      lat: Number(s.latitude),
      lng: Number(s.longitude),
      hub_name: s.hub_name,
      phase_summary: [
        s.site_control_phase, s.power_phase,
        s.permitting_phase, s.fiber_phase, s.engineering_phase, s.construction_phase,
      ].filter(p => p === 'Complete').length + '/6 phases',
    }))

    return NextResponse.json({ hubs, trackerSites })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load overlay data' },
      { status: 500 }
    )
  }
}
