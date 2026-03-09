-- =============================================================================
-- Security Advisor Fixes
-- =============================================================================
-- Resolves warnings from Supabase Advisor Center:
-- 1. Enable RLS on mcp_oauth_clients & mcp_oauth_tokens (no policies = deny all via API)
-- 2. Recreate views with security_invoker = true
-- 3. Fix mutable search_path on trigger functions
-- 4. Add missing indexes on foreign keys
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. mcp_oauth tables: Enable RLS with no policies
--    Service role key (used in token-store.ts) bypasses RLS.
--    This blocks all access via anon/authenticated (PostgREST API).
-- ---------------------------------------------------------------------------
ALTER TABLE mcp_oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Security Definer Views → Security Invoker
--    Ensures RLS on underlying tables is checked against the querying user.
-- ---------------------------------------------------------------------------

-- 2a. tracker_action_items_with_context
DROP VIEW IF EXISTS tracker_action_items_with_context;
CREATE VIEW tracker_action_items_with_context
  WITH (security_invoker = true)
AS
SELECT
  ai.*,
  ts.name AS site_name,
  rh.name AS hub_name,
  tm_assigned.display_name AS assigned_to_name,
  tm_created.display_name AS created_by_name
FROM tracker_action_items ai
JOIN tracker_sites ts ON ai.site_id = ts.id
LEFT JOIN tracker_regional_hubs rh ON ts.regional_hub_id = rh.id
LEFT JOIN team_members tm_assigned ON ai.assigned_to = tm_assigned.id
LEFT JOIN team_members tm_created ON ai.created_by = tm_created.id;

-- 2b. tracker_site_overview
--     Must match the latest definition from 20260310000000_simplify_schema.sql
DROP VIEW IF EXISTS tracker_site_overview;
CREATE VIEW tracker_site_overview
  WITH (security_invoker = true)
AS
SELECT
  s.*,
  h.name AS hub_name,
  pp.name AS utility_name,
  ao.name AS asset_owner_name,
  ipp.name AS ipp_name,

  -- Phase: Site Control
  CASE
    WHEN s.control_engaged_status = 'Waiting' OR s.control_secured_status = 'Waiting' THEN 'Waiting'
    WHEN COALESCE(s.control_engaged_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.control_secured_status, 'Not Started') IN ('Complete', 'N/A') THEN 'Complete'
    WHEN s.control_engaged_status = 'In Progress' OR s.control_secured_status = 'In Progress' THEN 'In Progress'
    ELSE 'Not Started'
  END AS site_control_phase,

  -- Phase: Power
  CASE
    WHEN s.power_capacity_check_status = 'Waiting' OR s.power_capacity_indication_status = 'Waiting'
      OR s.power_service_request_status = 'Waiting' OR s.power_deposit_status = 'Waiting'
      OR s.power_utility_design_status = 'Waiting' OR s.power_connection_status = 'Waiting' THEN 'Waiting'
    WHEN COALESCE(s.power_capacity_check_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.power_capacity_indication_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.power_service_request_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.power_deposit_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.power_utility_design_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.power_connection_status, 'Not Started') IN ('Complete', 'N/A') THEN 'Complete'
    WHEN s.power_capacity_check_status = 'In Progress' OR s.power_capacity_indication_status = 'In Progress'
      OR s.power_service_request_status = 'In Progress' OR s.power_deposit_status = 'In Progress'
      OR s.power_utility_design_status = 'In Progress' OR s.power_connection_status = 'In Progress' THEN 'In Progress'
    ELSE 'Not Started'
  END AS power_phase,

  -- Phase: Permitting
  CASE
    WHEN s.permit_requirements_status = 'Waiting' OR s.permit_approved_status = 'Waiting' THEN 'Waiting'
    WHEN COALESCE(s.permit_requirements_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.permit_approved_status, 'Not Started') IN ('Complete', 'N/A') THEN 'Complete'
    WHEN s.permit_requirements_status = 'In Progress' OR s.permit_approved_status = 'In Progress' THEN 'In Progress'
    ELSE 'Not Started'
  END AS permitting_phase,

  -- Phase: Fiber
  CASE
    WHEN s.fiber_identified_status = 'Waiting' OR s.fiber_capacity_status = 'Waiting'
      OR s.fiber_secured_status = 'Waiting' THEN 'Waiting'
    WHEN COALESCE(s.fiber_identified_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.fiber_capacity_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.fiber_secured_status, 'Not Started') IN ('Complete', 'N/A') THEN 'Complete'
    WHEN s.fiber_identified_status = 'In Progress' OR s.fiber_capacity_status = 'In Progress'
      OR s.fiber_secured_status = 'In Progress' THEN 'In Progress'
    ELSE 'Not Started'
  END AS fiber_phase,

  -- Phase: Engineering & Procurement
  CASE
    WHEN s.eng_design_status = 'Waiting' OR s.eng_equip_ordered_status = 'Waiting' THEN 'Waiting'
    WHEN COALESCE(s.eng_design_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.eng_equip_ordered_status, 'Not Started') IN ('Complete', 'N/A') THEN 'Complete'
    WHEN s.eng_design_status = 'In Progress' OR s.eng_equip_ordered_status = 'In Progress' THEN 'In Progress'
    ELSE 'Not Started'
  END AS engineering_phase,

  -- Phase: Construction & Commissioning
  CASE
    WHEN s.construction_equip_delivered_status = 'Waiting' OR s.construction_complete_status = 'Waiting'
      OR s.construction_energized_status = 'Waiting' OR s.construction_commissioned_status = 'Waiting' THEN 'Waiting'
    WHEN COALESCE(s.construction_equip_delivered_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.construction_complete_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.construction_energized_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.construction_commissioned_status, 'Not Started') IN ('Complete', 'N/A') THEN 'Complete'
    WHEN s.construction_equip_delivered_status = 'In Progress' OR s.construction_complete_status = 'In Progress'
      OR s.construction_energized_status = 'In Progress' OR s.construction_commissioned_status = 'In Progress' THEN 'In Progress'
    ELSE 'Not Started'
  END AS construction_phase,

  -- has_activity
  (
    COALESCE(s.control_engaged_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.control_secured_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.power_capacity_check_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.power_capacity_indication_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.power_service_request_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.power_deposit_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.power_utility_design_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.power_connection_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.permit_requirements_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.permit_approved_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.fiber_identified_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.fiber_capacity_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.fiber_secured_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.eng_design_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.eng_equip_ordered_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.construction_equip_delivered_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.construction_complete_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.construction_energized_status, 'Not Started') NOT IN ('Not Started', 'N/A') OR
    COALESCE(s.construction_commissioned_status, 'Not Started') NOT IN ('Not Started', 'N/A')
  ) AS has_activity,

  -- dev_start_date
  COALESCE(
    s.control_engaged_completed,
    LEAST(
      s.power_capacity_check_completed,
      s.permit_requirements_completed,
      s.fiber_identified_completed
    )
  ) AS dev_start_date,

  -- Financial rollups
  COALESCE(s.power_deposit_amount, 0) + COALESCE(s.permit_approved_amount, 0)
    + COALESCE(s.fiber_secured_amount, 0) + COALESCE(s.eng_equip_ordered_amount, 0) AS total_capex,

  CASE WHEN s.mw_current > 0 THEN
    (COALESCE(s.power_deposit_amount, 0) + COALESCE(s.permit_approved_amount, 0)
      + COALESCE(s.fiber_secured_amount, 0) + COALESCE(s.eng_equip_ordered_amount, 0))
    / s.mw_current
  ELSE NULL END AS capex_per_mw,

  -- Next step
  s.site_notes->'next_steps'->>0 AS next_step,

  -- Construction Ready
  (
    COALESCE(s.power_capacity_check_status, 'Not Started') IN ('Complete', 'N/A')
    AND COALESCE(s.power_capacity_indication_status, 'Not Started') IN ('Complete', 'N/A')
    AND COALESCE(s.power_service_request_status, 'Not Started') IN ('Complete', 'N/A')
    AND COALESCE(s.power_deposit_status, 'Not Started') IN ('Complete', 'N/A')
    AND COALESCE(s.power_utility_design_status, 'Not Started') IN ('Complete', 'N/A')
    AND COALESCE(s.power_connection_status, 'Not Started') IN ('Complete', 'N/A')
    AND COALESCE(s.permit_requirements_status, 'Not Started') IN ('Complete', 'N/A')
    AND COALESCE(s.permit_approved_status, 'Not Started') IN ('Complete', 'N/A')
    AND COALESCE(s.fiber_identified_status, 'Not Started') IN ('Complete', 'N/A')
    AND COALESCE(s.fiber_capacity_status, 'Not Started') IN ('Complete', 'N/A')
    AND COALESCE(s.fiber_secured_status, 'Not Started') IN ('Complete', 'N/A')
    AND COALESCE(s.eng_design_status, 'Not Started') IN ('Complete', 'N/A')
  ) AS construction_ready,

  -- Construction Ready Date
  GREATEST(
    s.power_connection_completed,
    s.permit_approved_completed,
    s.fiber_secured_completed,
    s.eng_design_completed
  ) AS construction_ready_date,

  -- Speed metrics
  CASE
    WHEN COALESCE(s.control_engaged_completed, LEAST(s.power_capacity_check_completed, s.permit_requirements_completed, s.fiber_identified_completed)) IS NOT NULL
      AND s.power_connection_completed IS NOT NULL
      THEN s.power_connection_completed - COALESCE(s.control_engaged_completed, LEAST(s.power_capacity_check_completed, s.permit_requirements_completed, s.fiber_identified_completed))
    WHEN COALESCE(s.control_engaged_completed, LEAST(s.power_capacity_check_completed, s.permit_requirements_completed, s.fiber_identified_completed)) IS NOT NULL
      AND s.power_connection_status IN ('In Progress', 'Waiting')
      THEN CURRENT_DATE - COALESCE(s.control_engaged_completed, LEAST(s.power_capacity_check_completed, s.permit_requirements_completed, s.fiber_identified_completed))
    ELSE NULL
  END AS days_to_ix,

  CASE
    WHEN COALESCE(s.control_engaged_completed, LEAST(s.power_capacity_check_completed, s.permit_requirements_completed, s.fiber_identified_completed)) IS NOT NULL
      AND GREATEST(s.power_connection_completed, s.permit_approved_completed, s.fiber_secured_completed, s.eng_design_completed) IS NOT NULL
      THEN GREATEST(s.power_connection_completed, s.permit_approved_completed, s.fiber_secured_completed, s.eng_design_completed)
        - COALESCE(s.control_engaged_completed, LEAST(s.power_capacity_check_completed, s.permit_requirements_completed, s.fiber_identified_completed))
    WHEN COALESCE(s.control_engaged_completed, LEAST(s.power_capacity_check_completed, s.permit_requirements_completed, s.fiber_identified_completed)) IS NOT NULL
      THEN CURRENT_DATE - COALESCE(s.control_engaged_completed, LEAST(s.power_capacity_check_completed, s.permit_requirements_completed, s.fiber_identified_completed))
    ELSE NULL
  END AS days_to_construction_ready,

  CASE
    WHEN COALESCE(s.control_engaged_completed, LEAST(s.power_capacity_check_completed, s.permit_requirements_completed, s.fiber_identified_completed)) IS NOT NULL
      AND s.construction_commissioned_completed IS NOT NULL
      THEN s.construction_commissioned_completed - COALESCE(s.control_engaged_completed, LEAST(s.power_capacity_check_completed, s.permit_requirements_completed, s.fiber_identified_completed))
    WHEN COALESCE(s.control_engaged_completed, LEAST(s.power_capacity_check_completed, s.permit_requirements_completed, s.fiber_identified_completed)) IS NOT NULL
      AND s.construction_commissioned_status IN ('In Progress', 'Waiting')
      THEN CURRENT_DATE - COALESCE(s.control_engaged_completed, LEAST(s.power_capacity_check_completed, s.permit_requirements_completed, s.fiber_identified_completed))
    ELSE NULL
  END AS days_to_cod,

  -- Archive status
  (s.archived_at IS NOT NULL) AS is_archived

FROM tracker_sites s
LEFT JOIN tracker_regional_hubs h ON s.regional_hub_id = h.id
LEFT JOIN tracker_power_partners pp ON s.utility_id = pp.id
LEFT JOIN tracker_power_partners ao ON s.asset_owner_id = ao.id
LEFT JOIN tracker_ipps ipp ON s.ipp_id = ipp.id;

-- ---------------------------------------------------------------------------
-- 3. Fix mutable search_path on trigger functions
--    update_updated_at: safe to just SET search_path (no table references)
--    update_chat_timestamp: must redefine with fully-qualified public.chats
-- ---------------------------------------------------------------------------
ALTER FUNCTION update_updated_at() SET search_path = '';

CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats SET updated_at = NOW() WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- ---------------------------------------------------------------------------
-- 4. Add missing indexes on foreign keys
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_client_id ON mcp_oauth_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_action_items_created_by ON tracker_action_items(created_by);
CREATE INDEX IF NOT EXISTS idx_partner_hubs_hub_id ON tracker_partner_hubs(hub_id);
CREATE INDEX IF NOT EXISTS idx_site_landowners_landowner_id ON tracker_site_landowners(landowner_id);
CREATE INDEX IF NOT EXISTS idx_sites_utility_id ON tracker_sites(utility_id);
CREATE INDEX IF NOT EXISTS idx_sites_asset_owner_id ON tracker_sites(asset_owner_id);
