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

    async function safeQuery(table: string, columns: string) {
      try {
        const result = await sb.from(table).select(columns, { count: 'exact' })
        if (result?.error) return []
        const total = result.count ?? result.data?.length ?? 0
        if (total <= 1000) return result.data ?? []
        const allRows = [...(result.data ?? [])]
        let offset = 1000
        while (offset < total) {
          const page = await sb.from(table).select(columns).range(offset, offset + 999)
          if (page?.error || !page?.data?.length) break
          allRows.push(...page.data)
          offset += 1000
        }
        return allRows
      } catch {
        return []
      }
    }

    const [trackerSites, partners, hubs] = await Promise.all([
      safeQuery('tracker_site_overview', 'id, name, priority, asset_owner_id, asset_owner_name, hub_name, screening_score, screening_tier, mw_current, has_activity, site_control_phase, power_phase, permitting_phase, fiber_phase, engineering_phase, construction_phase, construction_ready, latitude, longitude'),
      safeQuery('tracker_power_partners', 'id, name'),
      safeQuery('tracker_regional_hubs', 'id, name, status'),
    ])

    // Funnel numbers — all from tracker_sites
    const screened = trackerSites.filter((s: { screening_score: number | null }) => s.screening_score != null).length
    const strongFit = trackerSites.filter((s: { screening_tier: string | null }) => s.screening_tier === 'good').length
    const inPipeline = trackerSites.filter((s: { has_activity: boolean }) => s.has_activity).length
    const activeDev = trackerSites.filter((s: { priority: string; has_activity: boolean }) =>
      s.has_activity && (s.priority === 'Lead' || s.priority === 'Active')
    ).length
    const constructionReady = trackerSites.filter((s: { construction_ready: boolean }) =>
      s.construction_ready
    ).length

    // Stats
    const totalMw = trackerSites.reduce((sum: number, s: { mw_current: number | null }) =>
      sum + (Number(s.mw_current) || 0), 0
    )
    const scoredSites = trackerSites.filter((s: { screening_score: number | null }) => s.screening_score != null)
    const avgScore = scoredSites.length > 0
      ? scoredSites.reduce((sum: number, s: { screening_score: number }) => sum + Number(s.screening_score), 0) / scoredSites.length
      : null

    // Partner breakdown from tracker_sites
    const partnerBreakdown = (partners as Array<{ id: string; name: string }>).map(partner => {
      const partnerTrackerSites = trackerSites.filter((s: { asset_owner_id: string | null }) =>
        s.asset_owner_id === partner.id
      )
      const partnerScreened = partnerTrackerSites.filter((s: { screening_score: number | null }) =>
        s.screening_score != null
      )
      return {
        id: partner.id,
        name: partner.name,
        screened: partnerScreened.length,
        strong_fit: partnerScreened.filter((s: { screening_tier: string | null }) => s.screening_tier === 'good').length,
        in_pipeline: partnerTrackerSites.filter((s: { has_activity: boolean }) => s.has_activity).length,
        active_dev: partnerTrackerSites.filter((s: { priority: string; has_activity: boolean }) =>
          s.has_activity && (s.priority === 'Lead' || s.priority === 'Active')
        ).length,
      }
    }).filter(p => p.screened > 0 || p.in_pipeline > 0)

    // Hub centroids for map
    const hubCentroids = (hubs as Array<{ id: string; name: string; status: string | null }>).map(hub => {
      const hubSites = trackerSites.filter((s: { hub_name: string | null; latitude: number; longitude: number }) =>
        s.hub_name === hub.name && s.latitude && s.longitude
      )
      if (hubSites.length === 0) return null
      return {
        id: hub.id,
        name: hub.name,
        status: hub.status,
        lat: hubSites.reduce((sum: number, s: { latitude: number }) => sum + Number(s.latitude), 0) / hubSites.length,
        lng: hubSites.reduce((sum: number, s: { longitude: number }) => sum + Number(s.longitude), 0) / hubSites.length,
        site_count: hubSites.length,
      }
    }).filter(Boolean)

    return NextResponse.json({
      funnel: { screened, strong_fit: strongFit, in_pipeline: inPipeline, active_dev: activeDev, construction_ready: constructionReady },
      stats: { total_mw: totalMw, avg_score: avgScore, partner_count: partners.length, hub_count: hubs.length },
      partner_breakdown: partnerBreakdown,
      hub_centroids: hubCentroids,
      tracker_sites: trackerSites,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load pipeline stats' },
      { status: 500 }
    )
  }
}
