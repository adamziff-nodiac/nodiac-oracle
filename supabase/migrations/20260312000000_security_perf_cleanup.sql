-- =============================================================================
-- Security & Performance Cleanup
-- =============================================================================
-- 1. Drop redundant SELECT policies on team_members & tracker_action_items
-- 2. Fix auth_rls_initplan: wrap auth.uid()/role()/jwt() in (select ...)
-- 3. Consolidate context_prompts & perspectives policies (merge global+personal)
-- 4. Add deny-all policies on mcp_oauth_clients & mcp_oauth_tokens
-- 5. Add missing FK index on tracker_power_partners.parent_gt_id
-- 6. Drop unused portfolio_uploads & portfolio_sites tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Drop redundant SELECT policies (leftovers from before PR #20)
--    These allow ANY authenticated user to read, bypassing the nodiac check.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read team members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can read action items" ON tracker_action_items;
-- Also drop the old "manage" policies if they still exist
DROP POLICY IF EXISTS "Authenticated users can manage team members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can manage action items" ON tracker_action_items;

-- ---------------------------------------------------------------------------
-- 2. Fix auth_rls_initplan on ALL policies
--    Wrap auth.uid(), auth.role(), auth.jwt() in (select ...) so Postgres
--    evaluates them once per query instead of once per row.
-- ---------------------------------------------------------------------------

-- ── chats ──
DROP POLICY IF EXISTS "Users can view own chats" ON chats;
CREATE POLICY "Users can view own chats" ON chats FOR SELECT
  TO public USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own chats" ON chats;
CREATE POLICY "Users can create own chats" ON chats FOR INSERT
  TO public WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own chats" ON chats;
CREATE POLICY "Users can update own chats" ON chats FOR UPDATE
  TO public USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own chats" ON chats;
CREATE POLICY "Users can delete own chats" ON chats FOR DELETE
  TO public USING ((select auth.uid()) = user_id);

-- ── messages ──
DROP POLICY IF EXISTS "Users can view messages in own chats" ON messages;
CREATE POLICY "Users can view messages in own chats" ON messages FOR SELECT
  TO public USING (EXISTS (
    SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can create messages in own chats" ON messages;
CREATE POLICY "Users can create messages in own chats" ON messages FOR INSERT
  TO public WITH CHECK (EXISTS (
    SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can delete messages in own chats" ON messages;
CREATE POLICY "Users can delete messages in own chats" ON messages FOR DELETE
  TO public USING (EXISTS (
    SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = (select auth.uid())
  ));

-- ── timelines ──
DROP POLICY IF EXISTS "Authenticated users can view all timelines" ON timelines;
CREATE POLICY "Authenticated users can view all timelines" ON timelines FOR SELECT
  TO public USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can create timelines" ON timelines;
CREATE POLICY "Authenticated users can create timelines" ON timelines FOR INSERT
  TO public WITH CHECK ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update all timelines" ON timelines;
CREATE POLICY "Authenticated users can update all timelines" ON timelines FOR UPDATE
  TO public USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete all timelines" ON timelines;
CREATE POLICY "Authenticated users can delete all timelines" ON timelines FOR DELETE
  TO public USING ((select auth.role()) = 'authenticated');

-- ── timeline_rows ──
DROP POLICY IF EXISTS "Authenticated users can view all rows" ON timeline_rows;
CREATE POLICY "Authenticated users can view all rows" ON timeline_rows FOR SELECT
  TO public USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can create rows" ON timeline_rows;
CREATE POLICY "Authenticated users can create rows" ON timeline_rows FOR INSERT
  TO public WITH CHECK ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update all rows" ON timeline_rows;
CREATE POLICY "Authenticated users can update all rows" ON timeline_rows FOR UPDATE
  TO public USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete all rows" ON timeline_rows;
CREATE POLICY "Authenticated users can delete all rows" ON timeline_rows FOR DELETE
  TO public USING ((select auth.role()) = 'authenticated');

-- ── timeline_milestones ──
DROP POLICY IF EXISTS "Authenticated users can view all milestones" ON timeline_milestones;
CREATE POLICY "Authenticated users can view all milestones" ON timeline_milestones FOR SELECT
  TO public USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can create milestones" ON timeline_milestones;
CREATE POLICY "Authenticated users can create milestones" ON timeline_milestones FOR INSERT
  TO public WITH CHECK ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update all milestones" ON timeline_milestones;
CREATE POLICY "Authenticated users can update all milestones" ON timeline_milestones FOR UPDATE
  TO public USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete all milestones" ON timeline_milestones;
CREATE POLICY "Authenticated users can delete all milestones" ON timeline_milestones FOR DELETE
  TO public USING ((select auth.role()) = 'authenticated');

-- ── timeline_phases ──
DROP POLICY IF EXISTS "Authenticated users can view all phases" ON timeline_phases;
CREATE POLICY "Authenticated users can view all phases" ON timeline_phases FOR SELECT
  TO public USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can create phases" ON timeline_phases;
CREATE POLICY "Authenticated users can create phases" ON timeline_phases FOR INSERT
  TO public WITH CHECK ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update all phases" ON timeline_phases;
CREATE POLICY "Authenticated users can update all phases" ON timeline_phases FOR UPDATE
  TO public USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete all phases" ON timeline_phases;
CREATE POLICY "Authenticated users can delete all phases" ON timeline_phases FOR DELETE
  TO public USING ((select auth.role()) = 'authenticated');

-- ── timeline_annotations ──
DROP POLICY IF EXISTS "Authenticated users can view all annotations" ON timeline_annotations;
CREATE POLICY "Authenticated users can view all annotations" ON timeline_annotations FOR SELECT
  TO public USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can create annotations" ON timeline_annotations;
CREATE POLICY "Authenticated users can create annotations" ON timeline_annotations FOR INSERT
  TO public WITH CHECK ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update all annotations" ON timeline_annotations;
CREATE POLICY "Authenticated users can update all annotations" ON timeline_annotations FOR UPDATE
  TO public USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete all annotations" ON timeline_annotations;
CREATE POLICY "Authenticated users can delete all annotations" ON timeline_annotations FOR DELETE
  TO public USING ((select auth.role()) = 'authenticated');

-- ── tracker tables (fix auth.jwt() initplan) ──
DROP POLICY IF EXISTS "tracker_hubs_nodiac" ON tracker_regional_hubs;
CREATE POLICY "tracker_hubs_nodiac" ON tracker_regional_hubs FOR ALL
  TO authenticated
  USING (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai')
  WITH CHECK (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai');

DROP POLICY IF EXISTS "tracker_partners_nodiac" ON tracker_power_partners;
CREATE POLICY "tracker_partners_nodiac" ON tracker_power_partners FOR ALL
  TO authenticated
  USING (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai')
  WITH CHECK (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai');

DROP POLICY IF EXISTS "tracker_partner_hubs_nodiac" ON tracker_partner_hubs;
CREATE POLICY "tracker_partner_hubs_nodiac" ON tracker_partner_hubs FOR ALL
  TO authenticated
  USING (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai')
  WITH CHECK (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai');

DROP POLICY IF EXISTS "tracker_landowners_nodiac" ON tracker_landowners;
CREATE POLICY "tracker_landowners_nodiac" ON tracker_landowners FOR ALL
  TO authenticated
  USING (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai')
  WITH CHECK (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai');

DROP POLICY IF EXISTS "tracker_sites_nodiac" ON tracker_sites;
CREATE POLICY "tracker_sites_nodiac" ON tracker_sites FOR ALL
  TO authenticated
  USING (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai')
  WITH CHECK (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai');

DROP POLICY IF EXISTS "tracker_parcels_nodiac" ON tracker_parcels;
CREATE POLICY "tracker_parcels_nodiac" ON tracker_parcels FOR ALL
  TO authenticated
  USING (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai')
  WITH CHECK (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai');

DROP POLICY IF EXISTS "tracker_site_landowners_nodiac" ON tracker_site_landowners;
CREATE POLICY "tracker_site_landowners_nodiac" ON tracker_site_landowners FOR ALL
  TO authenticated
  USING (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai')
  WITH CHECK (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai');

DROP POLICY IF EXISTS "tracker_activity_nodiac" ON tracker_activity_log;
CREATE POLICY "tracker_activity_nodiac" ON tracker_activity_log FOR ALL
  TO authenticated
  USING (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai')
  WITH CHECK (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai');

DROP POLICY IF EXISTS "tracker_action_items_nodiac" ON tracker_action_items;
CREATE POLICY "tracker_action_items_nodiac" ON tracker_action_items FOR ALL
  TO authenticated
  USING (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai')
  WITH CHECK (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai');

DROP POLICY IF EXISTS "team_members_nodiac" ON team_members;
CREATE POLICY "team_members_nodiac" ON team_members FOR ALL
  TO authenticated
  USING (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai')
  WITH CHECK (split_part((select auth.jwt()) ->> 'email', '@', 2) = 'nodiac.ai');

-- ---------------------------------------------------------------------------
-- 3. Consolidate context_prompts & perspectives policies
--    Merge global + personal into single per-action policies scoped to
--    {authenticated} instead of {public}. Eliminates multiple_permissive_policies.
-- ---------------------------------------------------------------------------

-- ── context_prompts ──
DROP POLICY IF EXISTS "Authenticated users can read global prompts" ON context_prompts;
DROP POLICY IF EXISTS "Users can read own personal prompts" ON context_prompts;
CREATE POLICY "context_prompts_select" ON context_prompts FOR SELECT
  TO authenticated
  USING (
    (is_global = true)
    OR (is_global = false AND (select auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Users can insert own personal prompts" ON context_prompts;
CREATE POLICY "context_prompts_insert" ON context_prompts FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_global = false AND (select auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Authenticated users can update global prompts" ON context_prompts;
DROP POLICY IF EXISTS "Users can update own personal prompts" ON context_prompts;
CREATE POLICY "context_prompts_update" ON context_prompts FOR UPDATE
  TO authenticated
  USING (
    (is_global = true)
    OR (is_global = false AND (select auth.uid()) = user_id)
  )
  WITH CHECK (
    (is_global = true)
    OR (is_global = false AND (select auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Users can delete own personal prompts" ON context_prompts;
CREATE POLICY "context_prompts_delete" ON context_prompts FOR DELETE
  TO authenticated
  USING (
    (is_global = false AND (select auth.uid()) = user_id)
  );

-- ── perspectives ──
DROP POLICY IF EXISTS "Authenticated users can read global perspectives" ON perspectives;
DROP POLICY IF EXISTS "Users can read own personal perspectives" ON perspectives;
CREATE POLICY "perspectives_select" ON perspectives FOR SELECT
  TO authenticated
  USING (
    (is_global = true)
    OR (is_global = false AND (select auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Authenticated users can insert global perspectives" ON perspectives;
DROP POLICY IF EXISTS "Users can insert own personal perspectives" ON perspectives;
CREATE POLICY "perspectives_insert" ON perspectives FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_global = true AND user_id IS NULL)
    OR (is_global = false AND (select auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Authenticated users can update global perspectives" ON perspectives;
DROP POLICY IF EXISTS "Users can update own personal perspectives" ON perspectives;
CREATE POLICY "perspectives_update" ON perspectives FOR UPDATE
  TO authenticated
  USING (
    (is_global = true)
    OR (is_global = false AND (select auth.uid()) = user_id)
  )
  WITH CHECK (
    (is_global = true)
    OR (is_global = false AND (select auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Authenticated users can delete global perspectives" ON perspectives;
DROP POLICY IF EXISTS "Users can delete own personal perspectives" ON perspectives;
CREATE POLICY "perspectives_delete" ON perspectives FOR DELETE
  TO authenticated
  USING (
    (is_global = true)
    OR (is_global = false AND (select auth.uid()) = user_id)
  );

-- ---------------------------------------------------------------------------
-- 4. Deny-all policies on MCP OAuth tables
--    These tables are only accessed via service role key (bypasses RLS).
--    Explicit deny-all prevents any other access path.
-- ---------------------------------------------------------------------------
CREATE POLICY "deny_all" ON mcp_oauth_clients FOR ALL
  TO public USING (false) WITH CHECK (false);

CREATE POLICY "deny_all" ON mcp_oauth_tokens FOR ALL
  TO public USING (false) WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- 5. Missing FK index on tracker_power_partners.parent_gt_id
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tracker_partners_parent_gt_id
  ON tracker_power_partners(parent_gt_id);

-- ---------------------------------------------------------------------------
-- 6. Drop unused portfolio tables
--    All data was migrated to tracker_sites. No app code references these.
--    Must drop the view first since it uses s.* which includes portfolio_site_id.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS tracker_site_overview;

ALTER TABLE tracker_sites DROP COLUMN IF EXISTS portfolio_site_id;

DROP TABLE IF EXISTS portfolio_sites;
DROP TABLE IF EXISTS portfolio_uploads;

-- Recreate the view (same definition, minus portfolio_site_id which no longer exists)
CREATE VIEW tracker_site_overview AS
SELECT
  s.*,
  h.name AS hub_name,
  pp.name AS utility_name,
  ao.name AS asset_owner_name,

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
    LEAST(s.power_capacity_check_completed, s.permit_requirements_completed, s.fiber_identified_completed)
  ) AS dev_start_date,

  -- Financial rollups
  COALESCE(s.power_deposit_amount, 0) + COALESCE(s.permit_approved_amount, 0)
    + COALESCE(s.fiber_secured_amount, 0) + COALESCE(s.eng_equip_ordered_amount, 0) AS total_capex,

  CASE WHEN s.mw_current > 0 THEN
    (COALESCE(s.power_deposit_amount, 0) + COALESCE(s.permit_approved_amount, 0)
      + COALESCE(s.fiber_secured_amount, 0) + COALESCE(s.eng_equip_ordered_amount, 0))
    / s.mw_current
  ELSE NULL END AS capex_per_mw,

  -- Next step (from action items)
  (SELECT ai.title FROM tracker_action_items ai
   WHERE ai.site_id = s.id AND ai.status = 'next'
     AND (ai.defer_until IS NULL OR ai.defer_until <= CURRENT_DATE)
   ORDER BY ai.flagged DESC, ai.created_at LIMIT 1) AS next_step,

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

  (s.archived_at IS NOT NULL) AS is_archived

FROM tracker_sites s
LEFT JOIN tracker_regional_hubs h ON s.regional_hub_id = h.id
LEFT JOIN tracker_power_partners pp ON s.utility_id = pp.id
LEFT JOIN tracker_power_partners ao ON s.asset_owner_id = ao.id;

-- Re-apply security_invoker on the recreated view
ALTER VIEW tracker_site_overview SET (security_invoker = true);
