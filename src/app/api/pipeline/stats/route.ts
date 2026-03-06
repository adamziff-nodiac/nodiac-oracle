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

    // Fetch data — gracefully handle missing tables/columns (migration not yet applied)
    // Use safe query helper that always returns an array
    async function safeQuery(table: string, columns: string) {
      try {
        const result = await sb.from(table).select(columns)
        if (result?.error) return []
        return result?.data ?? []
      } catch {
        return []
      }
    }

    const [portfolioSites, trackerSites, ipps, hubs] = await Promise.all([
      safeQuery('portfolio_sites', 'id, tier, upload_id, site_score'),
      safeQuery('tracker_site_overview', 'id, name, priority, ipp_id, ipp_name, hub_name, screening_score, screening_tier, mw_current, site_qualification_phase, site_control_phase, power_phase, permitting_phase, fiber_phase, engineering_phase, construction_phase, construction_ready, latitude, longitude'),
      safeQuery('tracker_ipps', 'id, name'),
      safeQuery('tracker_regional_hubs', 'id, name, status'),
    ])

    // Funnel numbers
    const screened = portfolioSites.length
    const strongFit = portfolioSites.filter((s: { tier: string }) => s.tier === 'good').length
    const inPipeline = trackerSites.length
    const activeDev = trackerSites.filter((s: { priority: string }) =>
      s.priority === 'Lead' || s.priority === 'Active'
    ).length
    const constructionReady = trackerSites.filter((s: { construction_ready: boolean }) =>
      s.construction_ready
    ).length

    // Stats
    const totalMw = trackerSites.reduce((sum: number, s: { mw_current: number | null }) =>
      sum + (Number(s.mw_current) || 0), 0
    )
    const scoredSites = portfolioSites.filter((s: { site_score: number | null }) => s.site_score != null)
    const avgScore = scoredSites.length > 0
      ? scoredSites.reduce((sum: number, s: { site_score: number }) => sum + Number(s.site_score), 0) / scoredSites.length
      : null

    // IPP breakdown
    // Get upload → ipp_id mapping
    const uploads = await safeQuery('portfolio_uploads', 'id, ipp_id')
    const uploadIppMap = new Map<string, string>()
    for (const u of uploads as Array<{ id: string; ipp_id: string | null }>) {
      if (u.ipp_id) uploadIppMap.set(u.id, u.ipp_id)
    }

    const ippBreakdown = (ipps as Array<{ id: string; name: string }>).map(ipp => {
      const ippPortfolioSites = portfolioSites.filter((s: { upload_id: string }) =>
        uploadIppMap.get(s.upload_id) === ipp.id
      )
      const ippTrackerSites = trackerSites.filter((s: { ipp_id: string | null }) =>
        s.ipp_id === ipp.id
      )
      return {
        id: ipp.id,
        name: ipp.name,
        screened: ippPortfolioSites.length,
        strong_fit: ippPortfolioSites.filter((s: { tier: string }) => s.tier === 'good').length,
        in_pipeline: ippTrackerSites.length,
        active_dev: ippTrackerSites.filter((s: { priority: string }) =>
          s.priority === 'Lead' || s.priority === 'Active'
        ).length,
      }
    })

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
      stats: { total_mw: totalMw, avg_score: avgScore, ipp_count: ipps.length, hub_count: hubs.length },
      ipp_breakdown: ippBreakdown,
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
