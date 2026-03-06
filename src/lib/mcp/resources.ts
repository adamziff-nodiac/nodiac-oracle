/**
 * MCP Resources — read-only reference data exposed as resources.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  CHECKPOINT_PREFIXES, STATUS_OPTIONS, AMOUNT_STATUS_OPTIONS,
  PRIORITY_OPTIONS, SITE_TYPE_OPTIONS, OWNER_OPTIONS,
  PARTNER_TYPE_OPTIONS, RELATIONSHIP_STAGE_OPTIONS,
  HUB_STATUS_OPTIONS, ACTIVITY_SOURCE_OPTIONS,
  FINANCIAL_CHECKPOINTS,
  LANDOWNER_PROXIMITY_OPTIONS, LANDOWNER_PURPOSE_OPTIONS, LEASE_STATUS_OPTIONS,
  ACTION_ITEM_STATUS_OPTIONS, ACTION_ITEM_SOURCE_OPTIONS,
} from './constants'

export function registerResources(server: McpServer) {

  server.resource(
    'tracker-schema',
    'nodiac://tracker/schema',
    { description: 'Valid enum values for all tracker fields — use this before making updates to ensure correct values.' },
    async () => {
      const schema = {
        checkpoints: {
          all: [...CHECKPOINT_PREFIXES],
          financial: [...FINANCIAL_CHECKPOINTS],
          fields_per_checkpoint: ['status', 'forecast', 'completed', 'owner'],
          financial_extra_fields: ['amount', 'amount_status'],
        },
        enums: {
          status: [...STATUS_OPTIONS],
          amount_status: [...AMOUNT_STATUS_OPTIONS],
          priority: [...PRIORITY_OPTIONS],
          site_type: [...SITE_TYPE_OPTIONS],
          owner: [...OWNER_OPTIONS],
          partner_type: [...PARTNER_TYPE_OPTIONS],
          relationship_stage: [...RELATIONSHIP_STAGE_OPTIONS],
          hub_status: [...HUB_STATUS_OPTIONS],
          activity_source: [...ACTIVITY_SOURCE_OPTIONS],
          landowner_proximity: [...LANDOWNER_PROXIMITY_OPTIONS],
          landowner_purpose: [...LANDOWNER_PURPOSE_OPTIONS],
          lease_status: [...LEASE_STATUS_OPTIONS],
          action_item_status: [...ACTION_ITEM_STATUS_OPTIONS],
          action_item_source: [...ACTION_ITEM_SOURCE_OPTIONS],
        },
        phases: {
          site_control: ['control_engaged', 'control_secured'],
          power: ['power_capacity_check', 'power_capacity_indication', 'power_service_request', 'power_deposit', 'power_utility_design', 'power_connection'],
          permitting: ['permit_requirements', 'permit_approved'],
          fiber: ['fiber_identified', 'fiber_capacity', 'fiber_secured'],
          engineering: ['eng_design', 'eng_equip_ordered'],
          construction: ['construction_equip_delivered', 'construction_complete', 'construction_energized', 'construction_commissioned'],
        },
      }

      return {
        contents: [{
          uri: 'nodiac://tracker/schema',
          mimeType: 'application/json',
          text: JSON.stringify(schema, null, 2),
        }],
      }
    }
  )

  server.resource(
    'workflow-guide',
    'nodiac://tracker/workflow-guide',
    { description: 'How tools relate to each other — read this to understand the correct order of operations.' },
    async () => {
      const guide = `# Nodiac Tracker MCP — Tool Workflow Guide

## Reading Data
1. Start with get_portfolio_summary for high-level stats
2. Use list_sites to find specific sites (filter by hub, priority, or partner)
3. Use get_site with a site_id for full checkpoint details
4. Use list_partners / get_partner for utility relationship details
5. Use list_hubs for regional hub overview
6. Use list_action_items for action items (todos) — filter by site, assignee, or status
7. Use list_team_members to get team member UUIDs for assignment
8. Use get_recent_activity for audit trail

## Action Items (GTD-style todos)
- Every action item belongs to a site — no orphan tasks
- Three statuses: next (actionable), waiting (ball in someone else's court), done
- Use create_action_item with a verb-first title (e.g. "Call Xcel to verify capacity")
- Set waiting_on (WHO) when status=waiting; waiting_since is auto-set
- completed_at is auto-set when status changes to done
- Flag items for top priority (pinned to top of /todo view)
- defer_until hides items until a future date (GTD tickler)
- hard_deadline is for REAL externally-imposed deadlines only (permits, filings)
- source tracks origin: manual, ai, or call

## Updating Checkpoints
1. First call get_site to see current checkpoint values
2. Use update_checkpoint with the checkpoint name and fields to change
3. Financial checkpoints (power_deposit, permit_approved, fiber_secured, eng_equip_ordered) also accept amount/amount_status

## Updating Sites
- Use update_site for metadata changes (priority, MW, hub, utility, voltage, coordinates, etc.)
- Archive sites with update_site(archive=true, archive_reason="...")
- All changes are auto-logged to the activity log

## Logging Activities
- Use log_activity to record calls, emails, meetings, etc.
- Always include a descriptive title and summary
- Set source_type to match the interaction type

## Relationships
- Sites belong to hubs and have utility/asset_owner partners
- Partners can be linked to multiple hubs via partner-hub associations
- Partners can have a parent_gt_id linking distribution co-ops to their G&T
- Landowners are linked to sites with proximity, purpose, and lease status
- Parcels belong to sites and can be assigned to landowners
`

      return {
        contents: [{
          uri: 'nodiac://tracker/workflow-guide',
          mimeType: 'text/markdown',
          text: guide,
        }],
      }
    }
  )
}
