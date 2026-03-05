/**
 * Read-only MCP tools — query tracker data without modifying anything.
 */
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false } as const

export function registerReadTools(server: McpServer, getClient: () => SupabaseClient) {

  // ── list_sites ──────────────────────────────────────────────────────
  server.tool(
    'list_sites',
    'List all tracker sites with phase statuses and metrics. Returns: id, name, hub, priority, MW, utility, asset_owner, phase statuses (Not Started/In Progress/Complete/Blocked), construction_ready flag, and capex. Use get_site for full checkpoint details on a single site.',
    {
      hub_name: z.string().optional().describe('Filter by regional hub name (partial match)'),
      priority: z.string().optional().describe('Filter by priority: Lead, Active, Pipeline, On Hold, Deprioritized'),
      partner_name: z.string().optional().describe('Filter by utility or asset owner name (partial match)'),
      include_archived: z.boolean().optional().describe('Include archived sites (default: false)'),
    },
    READ_ONLY,
    async ({ hub_name, priority, partner_name, include_archived }) => {
      const supabase = getClient()
      let query = supabase.from('tracker_site_overview').select('*').order('priority').order('name')

      if (!include_archived) {
        query = query.is('archived_at', null)
      }
      if (priority) {
        query = query.eq('priority', priority)
      }

      const { data, error } = await query
      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      let sites = data ?? []

      // Client-side filters for computed/joined columns
      if (hub_name) {
        const lower = hub_name.toLowerCase()
        sites = sites.filter((s: Record<string, unknown>) =>
          (s.hub_name as string)?.toLowerCase().includes(lower)
        )
      }
      if (partner_name) {
        const lower = partner_name.toLowerCase()
        sites = sites.filter((s: Record<string, unknown>) =>
          (s.utility_name as string)?.toLowerCase().includes(lower) ||
          (s.asset_owner_name as string)?.toLowerCase().includes(lower)
        )
      }

      // Return a concise summary for each site
      const summary = sites.map((s: Record<string, unknown>) => ({
        id: s.id,
        name: s.name,
        hub: s.hub_name,
        priority: s.priority,
        mw_current: s.mw_current,
        mw_target: s.mw_target,
        utility: s.utility_name,
        asset_owner: s.asset_owner_name,
        phases: {
          site_qualification: s.site_qualification_phase,
          site_control: s.site_control_phase,
          power: s.power_phase,
          permitting: s.permitting_phase,
          fiber: s.fiber_phase,
          engineering: s.engineering_phase,
          construction: s.construction_phase,
        },
        construction_ready: s.construction_ready,
        total_capex: s.total_capex,
        capex_per_mw: s.capex_per_mw,
        is_archived: s.is_archived,
      }))

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }],
      }
    }
  )

  // ── get_site ────────────────────────────────────────────────────────
  server.tool(
    'get_site',
    'Get full details for a single site including all checkpoint statuses, dates, owners, amounts, notes, and the 20 most recent activity log entries. Use list_sites first to find the site_id.',
    {
      site_id: z.string().uuid().describe('The site UUID'),
    },
    READ_ONLY,
    async ({ site_id }) => {
      const supabase = getClient()

      const [siteResult, activityResult] = await Promise.all([
        supabase.from('tracker_site_overview').select('*').eq('id', site_id).single(),
        supabase.from('tracker_activity_log').select('*').eq('site_id', site_id).order('created_at', { ascending: false }).limit(20),
      ])

      if (siteResult.error) {
        return { isError: true, content: [{ type: 'text' as const, text: `Error: ${siteResult.error.message}` }] }
      }

      const result = {
        site: siteResult.data,
        recent_activity: activityResult.data ?? [],
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    }
  )

  // ── get_portfolio_summary ───────────────────────────────────────────
  server.tool(
    'get_portfolio_summary',
    'Get a high-level portfolio summary: total sites, MW by priority, phase distribution, blocked items, and total capex. Good starting point for portfolio-wide questions.',
    {},
    READ_ONLY,
    async () => {
      const supabase = getClient()
      const { data, error } = await supabase
        .from('tracker_site_overview')
        .select('*')
        .is('archived_at', null)

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      const sites = data ?? []

      // Aggregate by priority
      const byPriority: Record<string, { count: number; mw: number }> = {}
      for (const s of sites) {
        const p = (s as Record<string, unknown>).priority as string
        if (!byPriority[p]) byPriority[p] = { count: 0, mw: 0 }
        byPriority[p].count++
        byPriority[p].mw += ((s as Record<string, unknown>).mw_current as number) ?? 0
      }

      // Count blocked phases
      const blockedSites = sites.filter((s: Record<string, unknown>) => {
        const phases = ['site_qualification_phase', 'site_control_phase', 'power_phase', 'permitting_phase', 'fiber_phase', 'engineering_phase', 'construction_phase']
        return phases.some(p => (s as Record<string, unknown>)[p] === 'Blocked')
      })

      // Total capex
      const totalCapex = sites.reduce((sum: number, s: Record<string, unknown>) =>
        sum + (((s as Record<string, unknown>).total_capex as number) ?? 0), 0
      )

      const totalMw = sites.reduce((sum: number, s: Record<string, unknown>) =>
        sum + (((s as Record<string, unknown>).mw_current as number) ?? 0), 0
      )

      const summary = {
        total_sites: sites.length,
        total_mw: totalMw,
        total_capex: totalCapex,
        by_priority: byPriority,
        blocked_count: blockedSites.length,
        blocked_sites: blockedSites.map((s: Record<string, unknown>) => ({
          id: s.id,
          name: s.name,
        })),
        construction_ready_count: sites.filter((s: Record<string, unknown>) => s.construction_ready).length,
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }],
      }
    }
  )

  // ── list_partners ───────────────────────────────────────────────────
  server.tool(
    'list_partners',
    'List all power partners (utilities, co-ops, IPPs) with site counts and hub associations.',
    {
      type: z.string().optional().describe('Filter by partner type: Distribution Co-op, G&T Co-op, Municipal Utility, IOU, IPP'),
      relationship_stage: z.string().optional().describe('Filter by stage: Identified, Initial Contact, Capacity Discussion, Under Contract'),
    },
    READ_ONLY,
    async ({ type, relationship_stage }) => {
      const supabase = getClient()

      const [partnersResult, sitesResult, hubLinksResult, hubsResult] = await Promise.all([
        supabase.from('tracker_power_partners').select('*').order('name'),
        supabase.from('tracker_sites').select('id, utility_id, asset_owner_id'),
        supabase.from('tracker_partner_hubs').select('partner_id, hub_id'),
        supabase.from('tracker_regional_hubs').select('id, name'),
      ])

      if (partnersResult.error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${partnersResult.error.message}` }] }

      // Build hub name map
      const hubMap = new Map<string, string>()
      for (const h of (hubsResult.data ?? []) as Array<{ id: string; name: string }>) {
        hubMap.set(h.id, h.name)
      }

      // Count sites per partner
      const siteCountMap = new Map<string, number>()
      for (const s of (sitesResult.data ?? []) as Array<{ utility_id: string | null; asset_owner_id: string | null }>) {
        if (s.utility_id) siteCountMap.set(s.utility_id, (siteCountMap.get(s.utility_id) ?? 0) + 1)
        if (s.asset_owner_id) siteCountMap.set(s.asset_owner_id, (siteCountMap.get(s.asset_owner_id) ?? 0) + 1)
      }

      // Map hub names per partner
      const partnerHubMap = new Map<string, string[]>()
      for (const link of (hubLinksResult.data ?? []) as Array<{ partner_id: string; hub_id: string }>) {
        const names = partnerHubMap.get(link.partner_id) ?? []
        const hubName = hubMap.get(link.hub_id)
        if (hubName) names.push(hubName)
        partnerHubMap.set(link.partner_id, names)
      }

      let partners = (partnersResult.data ?? []) as Array<Record<string, unknown>>
      if (type) partners = partners.filter(p => p.type === type)
      if (relationship_stage) partners = partners.filter(p => p.relationship_stage === relationship_stage)

      const result = partners.map(p => ({
        ...p,
        site_count: siteCountMap.get(p.id as string) ?? 0,
        hub_names: partnerHubMap.get(p.id as string) ?? [],
      }))

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    }
  )

  // ── get_partner ─────────────────────────────────────────────────────
  server.tool(
    'get_partner',
    'Get full details for a single power partner including their sites. Use list_partners first to find the partner_id.',
    {
      partner_id: z.string().uuid().describe('The partner UUID'),
    },
    READ_ONLY,
    async ({ partner_id }) => {
      const supabase = getClient()

      const [partnerResult, sitesResult] = await Promise.all([
        supabase.from('tracker_power_partners').select('*').eq('id', partner_id).single(),
        supabase.from('tracker_site_overview').select('*').or(`utility_id.eq.${partner_id},asset_owner_id.eq.${partner_id}`).order('name'),
      ])

      if (partnerResult.error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${partnerResult.error.message}` }] }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ partner: partnerResult.data, sites: sitesResult.data ?? [] }, null, 2) }],
      }
    }
  )

  // ── list_hubs ───────────────────────────────────────────────────────
  server.tool(
    'list_hubs',
    'List all regional hubs with their partners and site counts.',
    {},
    READ_ONLY,
    async () => {
      const supabase = getClient()

      const [hubsResult, linksResult, sitesResult] = await Promise.all([
        supabase.from('tracker_regional_hubs').select('*').order('name'),
        supabase.from('tracker_partner_hubs').select('partner_id, hub_id'),
        supabase.from('tracker_sites').select('id, hub_id').is('archived_at', null),
      ])

      if (hubsResult.error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${hubsResult.error.message}` }] }

      const hubs = (hubsResult.data ?? []).map((h: Record<string, unknown>) => {
        const siteCount = (sitesResult.data ?? []).filter((s: Record<string, unknown>) => s.hub_id === h.id).length
        const partnerCount = (linksResult.data ?? []).filter((l: Record<string, unknown>) => l.hub_id === h.id).length
        return { ...h, site_count: siteCount, partner_count: partnerCount }
      })

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(hubs, null, 2) }],
      }
    }
  )

  // ── list_landowners ─────────────────────────────────────────────────
  server.tool(
    'list_landowners',
    'List all landowners with their associated sites and lease statuses. If site_id is provided, returns landowners linked to that specific site with lease details.',
    {
      site_id: z.string().uuid().optional().describe('Filter to landowners for a specific site'),
    },
    READ_ONLY,
    async ({ site_id }) => {
      const supabase = getClient()

      if (site_id) {
        const { data, error } = await supabase
          .from('tracker_site_landowners')
          .select('*, landowner:tracker_landowners(*)')
          .eq('site_id', site_id)

        if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? [], null, 2) }] }
      }

      const { data, error } = await supabase
        .from('tracker_landowners')
        .select('*')
        .order('name')

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
      return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? [], null, 2) }] }
    }
  )

  // ── list_parcels ───────────────────────────────────────────────────
  server.tool(
    'list_parcels',
    'List parcels for a site, including parcel numbers, acreage, landowner info, and notes.',
    {
      site_id: z.string().uuid().describe('The site UUID'),
    },
    READ_ONLY,
    async ({ site_id }) => {
      const supabase = getClient()
      const { data, error } = await supabase
        .from('tracker_parcels')
        .select('*, landowner:tracker_landowners(id, name)')
        .eq('site_id', site_id)
        .order('parcel_number')

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
      return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? [], null, 2) }] }
    }
  )

  // ── get_recent_activity ─────────────────────────────────────────────
  server.tool(
    'get_recent_activity',
    'Get recent activity log entries across all sites, or for a specific site. Each entry has title, summary, source_type, logged_by, and created_at.',
    {
      site_id: z.string().uuid().optional().describe('Filter to a specific site'),
      limit: z.number().min(1).max(100).optional().describe('Number of entries (default: 20)'),
    },
    READ_ONLY,
    async ({ site_id, limit }) => {
      const supabase = getClient()
      let query = supabase
        .from('tracker_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit ?? 20)

      if (site_id) {
        query = query.eq('site_id', site_id)
      }

      const { data, error } = await query
      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
      return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? [], null, 2) }] }
    }
  )
}
