/**
 * Write MCP tools — modify tracker data with enum validation and auto-logging.
 */
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  CHECKPOINT_PREFIXES, STATUS_OPTIONS, AMOUNT_STATUS_OPTIONS,
  PRIORITY_OPTIONS, SITE_TYPE_OPTIONS, OWNER_OPTIONS,
  PARTNER_TYPE_OPTIONS, RELATIONSHIP_STAGE_OPTIONS,
  HUB_STATUS_OPTIONS, ACTIVITY_SOURCE_OPTIONS,
  LANDOWNER_PROXIMITY_OPTIONS, LANDOWNER_PURPOSE_OPTIONS, LEASE_STATUS_OPTIONS,
  isFinancialCheckpoint,
} from './constants.js'
import { getCurrentUserEmail } from './auth.js'

/** Update existing record — idempotent (same input → same result) */
const WRITE_MUTATE = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const
/** Create new record — NOT idempotent (calling twice creates duplicates) */
const WRITE_CREATE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } as const
/** Archive/delete — destructive but idempotent */
const WRITE_DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false } as const

async function logActivity(
  supabase: SupabaseClient,
  siteId: string,
  title: string,
  summary: string,
  source: string = 'manual'
) {
  await supabase.from('tracker_activity_log').insert({
    site_id: siteId,
    title,
    summary,
    source_type: source,
    logged_by: getCurrentUserEmail(),
  })
}

export function registerWriteTools(server: McpServer, getClient: () => SupabaseClient) {

  // ── create_site ───────────────────────────────────────────────────────
  server.tool(
    'create_site',
    'Create a new tracker site. Requires a name at minimum. Use list_hubs and list_partners first to get hub_id, utility_id, and asset_owner_id if needed.',
    {
      name: z.string().describe('Site name'),
      priority: z.enum(PRIORITY_OPTIONS).optional().describe('Site priority (default: Pipeline)'),
      site_type: z.enum(SITE_TYPE_OPTIONS).optional().describe('Site type'),
      mw_current: z.number().optional().describe('Current MW capacity'),
      mw_potential: z.number().optional().describe('Target/potential MW capacity'),
      regional_hub_id: z.string().uuid().optional().describe('Regional hub UUID'),
      utility_id: z.string().uuid().optional().describe('Utility partner UUID'),
      asset_owner_id: z.string().uuid().optional().describe('Asset owner partner UUID'),
      address: z.string().optional().describe('Site address'),
      ahj: z.string().optional().describe('Authority Having Jurisdiction'),
    },
    WRITE_CREATE,
    async ({ name, priority, site_type, mw_current, mw_potential, regional_hub_id, utility_id, asset_owner_id, address, ahj }) => {
      const supabase = getClient()

      const { data, error } = await supabase
        .from('tracker_sites')
        .insert({
          name,
          priority: priority ?? 'Pipeline',
          site_type: site_type ?? null,
          mw_current: mw_current ?? null,
          mw_potential: mw_potential ?? null,
          regional_hub_id: regional_hub_id ?? null,
          utility_id: utility_id ?? null,
          asset_owner_id: asset_owner_id ?? null,
          address: address ?? null,
          ahj: ahj ?? null,
        })
        .select('id, name')
        .single()

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
      return {
        content: [{ type: 'text' as const, text: `Created site "${(data as Record<string, unknown>).name}" (${(data as Record<string, unknown>).id})` }],
      }
    }
  )

  // ── create_partner ────────────────────────────────────────────────────
  server.tool(
    'create_partner',
    'Create a new power partner (utility, co-op, IPP). Requires a name at minimum.',
    {
      name: z.string().describe('Partner name'),
      type: z.enum(PARTNER_TYPE_OPTIONS).optional().describe('Partner type'),
      relationship_stage: z.enum(RELATIONSHIP_STAGE_OPTIONS).optional().describe('Relationship stage (default: Identified)'),
      available_capacity: z.string().optional().describe('Available capacity description'),
      rate_structure: z.string().optional().describe('Rate structure details'),
      notes: z.string().optional().describe('Partner notes (JSON or plain text)'),
    },
    WRITE_CREATE,
    async ({ name, type, relationship_stage, available_capacity, rate_structure, notes }) => {
      const supabase = getClient()

      const { data, error } = await supabase
        .from('tracker_power_partners')
        .insert({
          name,
          type: type ?? null,
          relationship_stage: relationship_stage ?? 'Identified',
          available_capacity: available_capacity ?? null,
          rate_structure: rate_structure ?? null,
          notes: notes ? { summary: notes } : null,
        })
        .select('id, name')
        .single()

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
      return {
        content: [{ type: 'text' as const, text: `Created partner "${(data as Record<string, unknown>).name}" (${(data as Record<string, unknown>).id})` }],
      }
    }
  )

  // ── create_hub ────────────────────────────────────────────────────────
  server.tool(
    'create_hub',
    'Create a new regional hub. Requires a name at minimum.',
    {
      name: z.string().describe('Hub name'),
      status: z.enum(HUB_STATUS_OPTIONS).optional().describe('Hub status (default: Planning)'),
      target_mw: z.number().optional().describe('Target MW for this hub'),
      notes: z.string().optional().describe('Hub notes'),
    },
    WRITE_CREATE,
    async ({ name, status, target_mw, notes }) => {
      const supabase = getClient()

      const { data, error } = await supabase
        .from('tracker_regional_hubs')
        .insert({
          name,
          status: status ?? 'Planning',
          target_mw: target_mw ?? null,
          notes: notes ?? null,
        })
        .select('id, name')
        .single()

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
      return {
        content: [{ type: 'text' as const, text: `Created hub "${(data as Record<string, unknown>).name}" (${(data as Record<string, unknown>).id})` }],
      }
    }
  )

  // ── create_parcel ─────────────────────────────────────────────────────
  server.tool(
    'create_parcel',
    'Create a new parcel record linked to a site. Use get_site first to confirm the site_id.',
    {
      site_id: z.string().uuid().describe('The site UUID this parcel belongs to'),
      apn: z.string().describe('Assessor Parcel Number (required)'),
      area_acres: z.number().optional().describe('Area in acres'),
      landowner_id: z.string().uuid().optional().describe('Landowner UUID'),
      notes: z.string().optional().describe('Parcel notes'),
    },
    WRITE_CREATE,
    async ({ site_id, apn, area_acres, landowner_id, notes }) => {
      const supabase = getClient()

      const { data, error } = await supabase
        .from('tracker_parcels')
        .insert({
          site_id,
          apn,
          area_acres: area_acres ?? null,
          landowner_id: landowner_id ?? null,
          notes: notes ?? null,
        })
        .select('id')
        .single()

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      await logActivity(supabase, site_id, 'Parcel added', `APN: ${apn ?? 'N/A'}, ${area_acres ?? '?'} acres`)

      return {
        content: [{ type: 'text' as const, text: `Created parcel (${(data as Record<string, unknown>).id})${apn ? ` APN: ${apn}` : ''}` }],
      }
    }
  )

  // ── link_partner_hub ──────────────────────────────────────────────────
  server.tool(
    'link_partner_hub',
    'Link a power partner to a regional hub. Use list_partners and list_hubs to get the IDs.',
    {
      partner_id: z.string().uuid().describe('The partner UUID'),
      hub_id: z.string().uuid().describe('The hub UUID'),
    },
    WRITE_CREATE,
    async ({ partner_id, hub_id }) => {
      const supabase = getClient()

      const { error } = await supabase
        .from('tracker_partner_hubs')
        .insert({ partner_id, hub_id })

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
      return {
        content: [{ type: 'text' as const, text: `Linked partner ${partner_id} to hub ${hub_id}` }],
      }
    }
  )

  // ── unlink_partner_hub ────────────────────────────────────────────────
  server.tool(
    'unlink_partner_hub',
    'Remove a partner-hub link. Use list_partners (which includes hub_names) to find existing links.',
    {
      partner_id: z.string().uuid().describe('The partner UUID'),
      hub_id: z.string().uuid().describe('The hub UUID'),
    },
    WRITE_DESTRUCTIVE,
    async ({ partner_id, hub_id }) => {
      const supabase = getClient()

      const { error } = await supabase
        .from('tracker_partner_hubs')
        .delete()
        .eq('partner_id', partner_id)
        .eq('hub_id', hub_id)

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
      return {
        content: [{ type: 'text' as const, text: `Unlinked partner ${partner_id} from hub ${hub_id}` }],
      }
    }
  )

  // ── update_checkpoint ───────────────────────────────────────────────
  server.tool(
    'update_checkpoint',
    `Update a checkpoint on a site. Each checkpoint has status, forecast date, completed date, and owner. Financial checkpoints (power_deposit, permit_approved, fiber_secured, eng_equip_ordered) also have amount and amount_status fields. Provide at least one field to update. Valid checkpoints: ${CHECKPOINT_PREFIXES.join(', ')}`,
    {
      site_id: z.string().uuid().describe('The site UUID'),
      checkpoint: z.enum(CHECKPOINT_PREFIXES).describe('The checkpoint prefix'),
      status: z.enum(STATUS_OPTIONS).optional().describe('Checkpoint status'),
      forecast: z.string().optional().describe('Forecast date (YYYY-MM-DD)'),
      completed: z.string().optional().describe('Completed date (YYYY-MM-DD)'),
      owner: z.enum(OWNER_OPTIONS).optional().describe('Checkpoint owner'),
      amount: z.number().optional().describe('Financial amount (only for financial checkpoints)'),
      amount_status: z.enum(AMOUNT_STATUS_OPTIONS).optional().describe('Amount status (only for financial checkpoints)'),
      note: z.string().optional().describe('Optional note to attach to this checkpoint'),
    },
    WRITE_MUTATE,
    async ({ site_id, checkpoint, status, forecast, completed, owner, amount, amount_status, note }) => {
      const supabase = getClient()

      // Validate financial fields
      if ((amount !== undefined || amount_status !== undefined) && !isFinancialCheckpoint(checkpoint)) {
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `Error: amount/amount_status only valid for financial checkpoints (power_deposit, permit_approved, fiber_secured, eng_equip_ordered). Got: ${checkpoint}` }],
        }
      }

      // Build the update object
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
      const changes: string[] = []

      if (status !== undefined) {
        update[`${checkpoint}_status`] = status
        changes.push(`status → ${status}`)
      }
      if (forecast !== undefined) {
        update[`${checkpoint}_forecast`] = forecast
        changes.push(`forecast → ${forecast}`)
      }
      if (completed !== undefined) {
        update[`${checkpoint}_completed`] = completed
        changes.push(`completed → ${completed}`)
      }
      if (owner !== undefined) {
        update[`${checkpoint}_owner`] = owner
        changes.push(`owner → ${owner}`)
      }
      if (amount !== undefined) {
        update[`${checkpoint}_amount`] = amount
        changes.push(`amount → $${amount.toLocaleString()}`)
      }
      if (amount_status !== undefined) {
        update[`${checkpoint}_amount_status`] = amount_status
        changes.push(`amount status → ${amount_status}`)
      }

      if (note) {
        const { data: current } = await supabase
          .from('tracker_sites')
          .select('checkpoint_notes')
          .eq('id', site_id)
          .single()

        const existing = (current?.checkpoint_notes as Record<string, unknown>) ?? {}
        existing[checkpoint] = { note, updated: new Date().toISOString() }
        update.checkpoint_notes = existing
        changes.push(`note updated`)
      }

      if (changes.length === 0) {
        return { isError: true, content: [{ type: 'text' as const, text: 'Error: No fields to update. Provide at least one of: status, forecast, completed, owner, amount, amount_status, note.' }] }
      }

      const { data, error } = await supabase
        .from('tracker_sites')
        .update(update)
        .eq('id', site_id)
        .select('id, name')
        .single()

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      // Auto-log the change
      await logActivity(
        supabase,
        site_id,
        `Checkpoint updated: ${checkpoint}`,
        `${changes.join(', ')}${note ? ` | Note: ${note}` : ''}`,
      )

      return {
        content: [{ type: 'text' as const, text: `Updated ${checkpoint} on "${(data as Record<string, unknown>).name}": ${changes.join(', ')}` }],
      }
    }
  )

  // ── update_site ─────────────────────────────────────────────────────
  server.tool(
    'update_site',
    'Update site metadata: name, MW, priority, type, hub, utility, asset owner, notes, or archive status. Use list_sites or get_site first to find the site_id. Setting archive=true is destructive (hides site from default views).',
    {
      site_id: z.string().uuid().describe('The site UUID'),
      name: z.string().optional().describe('Site name'),
      mw_current: z.number().optional().describe('Current MW capacity'),
      mw_potential: z.number().optional().describe('Target/potential MW capacity'),
      priority: z.enum(PRIORITY_OPTIONS).optional().describe('Site priority'),
      site_type: z.enum(SITE_TYPE_OPTIONS).optional().describe('Site type'),
      regional_hub_id: z.string().uuid().optional().describe('Regional hub UUID'),
      utility_id: z.string().uuid().optional().describe('Utility partner UUID'),
      asset_owner_id: z.string().uuid().optional().describe('Asset owner partner UUID'),
      address: z.string().optional().describe('Site address'),
      ahj: z.string().optional().describe('Authority Having Jurisdiction'),
      summary_note: z.string().optional().describe('Update the site summary note'),
      archive: z.boolean().optional().describe('Set true to archive, false to unarchive'),
      archive_reason: z.string().optional().describe('Reason for archiving'),
    },
    WRITE_DESTRUCTIVE, // archive=true is destructive
    async ({ site_id, name, mw_current, mw_potential, priority, site_type, regional_hub_id, utility_id, asset_owner_id, address, ahj, summary_note, archive, archive_reason }) => {
      const supabase = getClient()
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
      const changes: string[] = []

      if (name !== undefined) { update.name = name; changes.push(`name → ${name}`) }
      if (mw_current !== undefined) { update.mw_current = mw_current; changes.push(`mw_current → ${mw_current}`) }
      if (mw_potential !== undefined) { update.mw_potential = mw_potential; changes.push(`mw_potential → ${mw_potential}`) }
      if (priority !== undefined) { update.priority = priority; changes.push(`priority → ${priority}`) }
      if (site_type !== undefined) { update.site_type = site_type; changes.push(`type → ${site_type}`) }
      if (regional_hub_id !== undefined) { update.regional_hub_id = regional_hub_id; changes.push('hub updated') }
      if (utility_id !== undefined) { update.utility_id = utility_id; changes.push('utility updated') }
      if (asset_owner_id !== undefined) { update.asset_owner_id = asset_owner_id; changes.push('asset owner updated') }
      if (address !== undefined) { update.address = address; changes.push('address updated') }
      if (ahj !== undefined) { update.ahj = ahj; changes.push(`AHJ → ${ahj}`) }

      if (summary_note !== undefined) {
        const { data: current } = await supabase.from('tracker_sites').select('site_notes').eq('id', site_id).single()
        const existing = (current?.site_notes as Record<string, unknown>) ?? {}
        existing.summary = summary_note
        existing.updated_at = new Date().toISOString()
        update.site_notes = existing
        changes.push('summary note updated')
      }

      if (archive === true) {
        update.archived_at = new Date().toISOString()
        update.archived_reason = archive_reason ?? null
        changes.push('archived')
      } else if (archive === false) {
        update.archived_at = null
        update.archived_reason = null
        changes.push('unarchived')
      }

      if (changes.length === 0) {
        return { isError: true, content: [{ type: 'text' as const, text: 'Error: No fields to update.' }] }
      }

      const { data, error } = await supabase
        .from('tracker_sites')
        .update(update)
        .eq('id', site_id)
        .select('id, name')
        .single()

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      await logActivity(supabase, site_id, 'Site updated', changes.join(', '))

      return {
        content: [{ type: 'text' as const, text: `Updated "${(data as Record<string, unknown>).name}": ${changes.join(', ')}` }],
      }
    }
  )

  // ── log_activity ────────────────────────────────────────────────────
  server.tool(
    'log_activity',
    'Log an activity (call, email, meeting, etc.) against a site. Use this to record interactions, meeting notes, or status updates. Each log is timestamped and attributed to the authenticated user.',
    {
      site_id: z.string().uuid().describe('The site UUID'),
      title: z.string().describe('Short title for the activity'),
      summary: z.string().optional().describe('Detailed summary of the activity'),
      source: z.enum(ACTIVITY_SOURCE_OPTIONS).optional().describe('Source type: call, email, slack, meeting, manual, other'),
      source_link: z.string().optional().describe('Link to source (e.g., Gmail thread URL, Google Doc URL)'),
    },
    WRITE_CREATE,
    async ({ site_id, title, summary, source, source_link }) => {
      const supabase = getClient()

      const { data, error } = await supabase
        .from('tracker_activity_log')
        .insert({
          site_id,
          title,
          summary: summary ?? null,
          source_type: source ?? 'manual',
          source_link: source_link ?? null,
          logged_by: getCurrentUserEmail(),
        })
        .select()
        .single()

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
      return {
        content: [{ type: 'text' as const, text: `Logged activity: "${title}" (${(data as Record<string, unknown>).id})` }],
      }
    }
  )

  // ── delete_activity ──────────────────────────────────────────────────
  server.tool(
    'delete_activity',
    'Delete an activity log entry by its ID. Use get_recent_activity or get_site to find the activity_id. This is destructive and cannot be undone.',
    {
      activity_id: z.string().uuid().describe('The activity log entry UUID'),
    },
    WRITE_DESTRUCTIVE,
    async ({ activity_id }) => {
      const supabase = getClient()

      const { data, error } = await supabase
        .from('tracker_activity_log')
        .delete()
        .eq('id', activity_id)
        .select('id, title')
        .single()

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
      return {
        content: [{ type: 'text' as const, text: `Deleted activity: "${(data as Record<string, unknown>).title}" (${activity_id})` }],
      }
    }
  )

  // ── update_partner ──────────────────────────────────────────────────
  server.tool(
    'update_partner',
    'Update a power partner: relationship stage, type, LOI status, capacity, rate structure, notes. Use list_partners first to find the partner_id.',
    {
      partner_id: z.string().uuid().describe('The partner UUID'),
      name: z.string().optional().describe('Partner name'),
      type: z.enum(PARTNER_TYPE_OPTIONS).optional().describe('Partner type'),
      relationship_stage: z.enum(RELATIONSHIP_STAGE_OPTIONS).optional().describe('Relationship stage'),
      loi_signed: z.boolean().optional().describe('Whether LOI has been signed'),
      available_capacity: z.string().optional().describe('Available capacity description'),
      rate_structure: z.string().optional().describe('Rate structure details'),
      ix_process_notes: z.string().optional().describe('IX process notes'),
      attio_link: z.string().optional().describe('Link to Attio CRM record'),
      notes: z.string().optional().describe('Partner notes (replaces existing notes.summary)'),
    },
    WRITE_MUTATE,
    async ({ partner_id, name, type, relationship_stage, loi_signed, available_capacity, rate_structure, ix_process_notes, attio_link, notes }) => {
      const supabase = getClient()
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
      const changes: string[] = []

      if (name !== undefined) { update.name = name; changes.push(`name → ${name}`) }
      if (type !== undefined) { update.type = type; changes.push(`type → ${type}`) }
      if (relationship_stage !== undefined) { update.relationship_stage = relationship_stage; changes.push(`stage → ${relationship_stage}`) }
      if (loi_signed !== undefined) { update.loi_signed = loi_signed; changes.push(`LOI signed → ${loi_signed}`) }
      if (available_capacity !== undefined) { update.available_capacity = available_capacity; changes.push('capacity updated') }
      if (rate_structure !== undefined) { update.rate_structure = rate_structure; changes.push('rate structure updated') }
      if (ix_process_notes !== undefined) { update.ix_process_notes = ix_process_notes; changes.push('IX notes updated') }
      if (attio_link !== undefined) { update.attio_link = attio_link; changes.push('Attio link updated') }
      if (notes !== undefined) {
        const { data: current } = await supabase.from('tracker_power_partners').select('notes').eq('id', partner_id).single()
        const existing = (current?.notes as Record<string, unknown>) ?? {}
        existing.summary = notes
        existing.updated_at = new Date().toISOString()
        update.notes = existing
        changes.push('notes updated')
      }

      if (changes.length === 0) {
        return { isError: true, content: [{ type: 'text' as const, text: 'Error: No fields to update.' }] }
      }

      const { data, error } = await supabase
        .from('tracker_power_partners')
        .update(update)
        .eq('id', partner_id)
        .select('id, name')
        .single()

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
      return {
        content: [{ type: 'text' as const, text: `Updated partner "${(data as Record<string, unknown>).name}": ${changes.join(', ')}` }],
      }
    }
  )

  // ── update_hub ──────────────────────────────────────────────────────
  server.tool(
    'update_hub',
    'Update a regional hub: name, status, target MW, notes. Use list_hubs first to find the hub_id.',
    {
      hub_id: z.string().uuid().describe('The hub UUID'),
      name: z.string().optional().describe('Hub name'),
      status: z.enum(HUB_STATUS_OPTIONS).optional().describe('Hub status'),
      target_mw: z.number().optional().describe('Target MW for this hub'),
      notes: z.string().optional().describe('Hub notes'),
    },
    WRITE_MUTATE,
    async ({ hub_id, name, status, target_mw, notes }) => {
      const supabase = getClient()
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
      const changes: string[] = []

      if (name !== undefined) { update.name = name; changes.push(`name → ${name}`) }
      if (status !== undefined) { update.status = status; changes.push(`status → ${status}`) }
      if (target_mw !== undefined) { update.target_mw = target_mw; changes.push(`target MW → ${target_mw}`) }
      if (notes !== undefined) { update.notes = notes; changes.push('notes updated') }

      if (changes.length === 0) {
        return { isError: true, content: [{ type: 'text' as const, text: 'Error: No fields to update.' }] }
      }

      const { data, error } = await supabase
        .from('tracker_regional_hubs')
        .update(update)
        .eq('id', hub_id)
        .select('id, name')
        .single()

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
      return {
        content: [{ type: 'text' as const, text: `Updated hub "${(data as Record<string, unknown>).name}": ${changes.join(', ')}` }],
      }
    }
  )

  // ── add_landowner ───────────────────────────────────────────────────
  server.tool(
    'add_landowner',
    'Add a new landowner and optionally link them to a site. If site_id is provided, also creates the site-landowner relationship with proximity, purpose, and lease status.',
    {
      name: z.string().describe('Landowner name'),
      email: z.string().optional().describe('Email address'),
      phone: z.string().optional().describe('Phone number'),
      mailing_address: z.string().optional().describe('Mailing address'),
      notes: z.string().optional().describe('Notes about this landowner'),
      site_id: z.string().uuid().optional().describe('Link to this site (creates a site_landowner record)'),
      proximity: z.enum(LANDOWNER_PROXIMITY_OPTIONS).optional().describe('Proximity to site: Collocated or Adjacent'),
      purpose: z.array(z.enum(LANDOWNER_PURPOSE_OPTIONS)).optional().describe('Purpose(s): DC Location, Fiber Route, Access Easement, Utility Easement'),
      lease_status: z.enum(LEASE_STATUS_OPTIONS).optional().describe('Lease status'),
    },
    WRITE_CREATE,
    async ({ name, email, phone, mailing_address, notes, site_id, proximity, purpose, lease_status }) => {
      const supabase = getClient()

      const { data: landowner, error } = await supabase
        .from('tracker_landowners')
        .insert({
          name,
          email: email ?? null,
          phone: phone ?? null,
          mailing_address: mailing_address ?? null,
          notes: notes ?? null,
        })
        .select()
        .single()

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      const landownerData = landowner as Record<string, unknown>

      // Link to site if provided
      if (site_id) {
        const { error: linkError } = await supabase
          .from('tracker_site_landowners')
          .insert({
            site_id,
            landowner_id: landownerData.id,
            proximity: proximity ?? null,
            purpose: purpose ?? null,
            lease_status: lease_status ?? 'No Contact',
          })

        if (linkError) {
          return { isError: true, content: [{ type: 'text' as const, text: `Landowner created (${landownerData.id}) but failed to link to site: ${linkError.message}` }] }
        }

        await logActivity(supabase, site_id, 'Landowner added', `Added ${name}${proximity ? ` (${proximity})` : ''}`)
      }

      return {
        content: [{ type: 'text' as const, text: `Created landowner "${name}" (${landownerData.id})${site_id ? ' and linked to site' : ''}` }],
      }
    }
  )

  // ── update_landowner_lease ──────────────────────────────────────────
  server.tool(
    'update_landowner_lease',
    'Update the lease status, proximity, or purpose for a landowner-site relationship. Use list_landowners with a site_id to find the landowner_id.',
    {
      site_id: z.string().uuid().describe('The site UUID'),
      landowner_id: z.string().uuid().describe('The landowner UUID'),
      lease_status: z.enum(LEASE_STATUS_OPTIONS).optional().describe('New lease status'),
      proximity: z.enum(LANDOWNER_PROXIMITY_OPTIONS).optional().describe('Updated proximity'),
      purpose: z.array(z.enum(LANDOWNER_PURPOSE_OPTIONS)).optional().describe('Updated purpose(s)'),
    },
    WRITE_MUTATE,
    async ({ site_id, landowner_id, lease_status, proximity, purpose }) => {
      const supabase = getClient()
      const update: Record<string, unknown> = {}
      const changes: string[] = []

      if (lease_status !== undefined) { update.lease_status = lease_status; changes.push(`lease → ${lease_status}`) }
      if (proximity !== undefined) { update.proximity = proximity; changes.push(`proximity → ${proximity}`) }
      if (purpose !== undefined) { update.purpose = purpose; changes.push(`purpose → ${purpose.join(', ')}`) }

      if (changes.length === 0) {
        return { isError: true, content: [{ type: 'text' as const, text: 'Error: No fields to update.' }] }
      }

      const { error } = await supabase
        .from('tracker_site_landowners')
        .update(update)
        .eq('site_id', site_id)
        .eq('landowner_id', landowner_id)

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      await logActivity(supabase, site_id, 'Landowner lease updated', changes.join(', '))

      return {
        content: [{ type: 'text' as const, text: `Updated landowner lease: ${changes.join(', ')}` }],
      }
    }
  )

  // ── update_parcel ───────────────────────────────────────────────────
  server.tool(
    'update_parcel',
    'Update a parcel record: APN, acreage, landowner, or notes.',
    {
      parcel_id: z.string().uuid().describe('The parcel UUID'),
      apn: z.string().optional().describe('Assessor Parcel Number'),
      area_acres: z.number().optional().describe('Area in acres'),
      landowner_id: z.string().uuid().optional().describe('Assign a landowner to this parcel'),
      notes: z.string().optional().describe('Parcel notes'),
    },
    WRITE_MUTATE,
    async ({ parcel_id, apn, area_acres, landowner_id, notes }) => {
      const supabase = getClient()
      const update: Record<string, unknown> = {}
      const changes: string[] = []

      if (apn !== undefined) { update.apn = apn; changes.push(`APN → ${apn}`) }
      if (area_acres !== undefined) { update.area_acres = area_acres; changes.push(`area → ${area_acres} acres`) }
      if (landowner_id !== undefined) { update.landowner_id = landowner_id; changes.push('landowner updated') }
      if (notes !== undefined) { update.notes = notes; changes.push('notes updated') }

      if (changes.length === 0) {
        return { isError: true, content: [{ type: 'text' as const, text: 'Error: No fields to update.' }] }
      }

      const { data, error } = await supabase
        .from('tracker_parcels')
        .update(update)
        .eq('id', parcel_id)
        .select('id, site_id')
        .single()

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      const parcel = data as Record<string, unknown>
      if (parcel.site_id) {
        await logActivity(supabase, parcel.site_id as string, 'Parcel updated', changes.join(', '))
      }

      return {
        content: [{ type: 'text' as const, text: `Updated parcel: ${changes.join(', ')}` }],
      }
    }
  )

  // ── update_landowner ────────────────────────────────────────────────
  server.tool(
    'update_landowner',
    'Update a landowner record.',
    {
      landowner_id: z.string().uuid().describe('The landowner UUID'),
      name: z.string().optional().describe('Landowner name'),
      email: z.string().optional().describe('Email address'),
      phone: z.string().optional().describe('Phone number'),
      mailing_address: z.string().optional().describe('Mailing address'),
      notes: z.string().optional().describe('Notes about the landowner'),
    },
    WRITE_MUTATE,
    async ({ landowner_id, name, email, phone, mailing_address, notes }) => {
      const supabase = getClient()
      const update: Record<string, unknown> = {}
      const changes: string[] = []

      if (name !== undefined) { update.name = name; changes.push(`name → ${name}`) }
      if (email !== undefined) { update.email = email; changes.push(`email → ${email}`) }
      if (phone !== undefined) { update.phone = phone; changes.push(`phone → ${phone}`) }
      if (mailing_address !== undefined) { update.mailing_address = mailing_address; changes.push('mailing address updated') }
      if (notes !== undefined) { update.notes = notes; changes.push('notes updated') }

      if (changes.length === 0) {
        return { isError: true, content: [{ type: 'text' as const, text: 'Error: No fields to update.' }] }
      }

      const { error } = await supabase
        .from('tracker_landowners')
        .update(update)
        .eq('id', landowner_id)

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      return {
        content: [{ type: 'text' as const, text: `Updated landowner: ${changes.join(', ')}` }],
      }
    }
  )

  // ── delete_landowner ────────────────────────────────────────────────
  server.tool(
    'delete_landowner',
    'Delete a landowner record. Will fail if there are site_landowner links referencing it — unlink them first.',
    {
      landowner_id: z.string().uuid().describe('The landowner UUID'),
    },
    WRITE_DESTRUCTIVE,
    async ({ landowner_id }) => {
      const supabase = getClient()

      const { error } = await supabase
        .from('tracker_landowners')
        .delete()
        .eq('id', landowner_id)

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      return {
        content: [{ type: 'text' as const, text: `Deleted landowner ${landowner_id}` }],
      }
    }
  )

  // ── delete_parcel ───────────────────────────────────────────────────
  server.tool(
    'delete_parcel',
    'Delete a parcel record from a site.',
    {
      parcel_id: z.string().uuid().describe('The parcel UUID'),
    },
    WRITE_DESTRUCTIVE,
    async ({ parcel_id }) => {
      const supabase = getClient()

      // Get site_id for activity log before deleting
      const { data: parcel } = await supabase
        .from('tracker_parcels')
        .select('id, site_id')
        .eq('id', parcel_id)
        .single()

      const { error } = await supabase
        .from('tracker_parcels')
        .delete()
        .eq('id', parcel_id)

      if (error) return { isError: true, content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      if (parcel?.site_id) {
        await logActivity(supabase, parcel.site_id, 'Parcel deleted', `Parcel ${parcel_id} removed`)
      }

      return {
        content: [{ type: 'text' as const, text: `Deleted parcel ${parcel_id}` }],
      }
    }
  )
}
