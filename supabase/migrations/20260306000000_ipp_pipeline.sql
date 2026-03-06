-- =============================================================================
-- IPP Pipeline: Connect screening to tracker
-- =============================================================================
-- New table: tracker_ipps (IPP entities)
-- Alter: portfolio_uploads (add ipp_id FK)
-- Alter: tracker_sites (add screening link, coords, screening data, ipp_id)
-- Update: tracker_site_overview view (add new columns + ipp_name)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: tracker_ipps
-- ---------------------------------------------------------------------------
CREATE TABLE tracker_ipps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  contact_name TEXT,
  contact_email TEXT,
  notes TEXT,
  attio_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER tracker_ipps_updated_at
  BEFORE UPDATE ON tracker_ipps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE tracker_ipps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tracker_ipps_all" ON tracker_ipps
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tracker_ipps;

-- ---------------------------------------------------------------------------
-- Alter: portfolio_uploads — link to IPP
-- ---------------------------------------------------------------------------
ALTER TABLE portfolio_uploads ADD COLUMN IF NOT EXISTS ipp_id UUID REFERENCES tracker_ipps(id);
CREATE INDEX IF NOT EXISTS idx_portfolio_uploads_ipp ON portfolio_uploads(ipp_id);

-- ---------------------------------------------------------------------------
-- Alter: tracker_sites — screening link, proper coords, screening data, ipp
-- ---------------------------------------------------------------------------
ALTER TABLE tracker_sites ADD COLUMN IF NOT EXISTS portfolio_site_id UUID REFERENCES portfolio_sites(id);
ALTER TABLE tracker_sites ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);
ALTER TABLE tracker_sites ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,7);
ALTER TABLE tracker_sites ADD COLUMN IF NOT EXISTS fips_code TEXT;
ALTER TABLE tracker_sites ADD COLUMN IF NOT EXISTS screening_score NUMERIC(5,2);
ALTER TABLE tracker_sites ADD COLUMN IF NOT EXISTS screening_tier TEXT CHECK (screening_tier IN ('good', 'okay', 'bad'));
ALTER TABLE tracker_sites ADD COLUMN IF NOT EXISTS ipp_id UUID REFERENCES tracker_ipps(id);

CREATE INDEX IF NOT EXISTS idx_tracker_sites_portfolio_site ON tracker_sites(portfolio_site_id);
CREATE INDEX IF NOT EXISTS idx_tracker_sites_ipp ON tracker_sites(ipp_id);

-- ---------------------------------------------------------------------------
-- Recreate view: tracker_site_overview (add new columns + ipp_name)
-- Must DROP first because s.* column order changes with new tracker_sites columns
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS tracker_site_overview;
CREATE VIEW tracker_site_overview AS
SELECT
  s.*,
  h.name AS hub_name,
  pp.name AS utility_name,
  ao.name AS asset_owner_name,
  ipp.name AS ipp_name,

  -- Phase: Site Qualification
  CASE
    WHEN s.site_identified_status = 'Blocked' OR s.site_qualified_status = 'Blocked' THEN 'Blocked'
    WHEN COALESCE(s.site_identified_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.site_qualified_status, 'Not Started') IN ('Complete', 'N/A') THEN 'Complete'
    WHEN s.site_identified_status = 'In Progress' OR s.site_qualified_status = 'In Progress' THEN 'In Progress'
    ELSE 'Not Started'
  END AS site_qualification_phase,

  -- Phase: Site Control
  CASE
    WHEN s.control_engaged_status = 'Blocked' OR s.control_secured_status = 'Blocked' THEN 'Blocked'
    WHEN COALESCE(s.control_engaged_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.control_secured_status, 'Not Started') IN ('Complete', 'N/A') THEN 'Complete'
    WHEN s.control_engaged_status = 'In Progress' OR s.control_secured_status = 'In Progress' THEN 'In Progress'
    ELSE 'Not Started'
  END AS site_control_phase,

  -- Phase: Power
  CASE
    WHEN s.power_capacity_check_status = 'Blocked' OR s.power_capacity_indication_status = 'Blocked'
      OR s.power_service_request_status = 'Blocked' OR s.power_deposit_status = 'Blocked'
      OR s.power_utility_design_status = 'Blocked' OR s.power_connection_status = 'Blocked' THEN 'Blocked'
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
    WHEN s.permit_requirements_status = 'Blocked' OR s.permit_approved_status = 'Blocked' THEN 'Blocked'
    WHEN COALESCE(s.permit_requirements_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.permit_approved_status, 'Not Started') IN ('Complete', 'N/A') THEN 'Complete'
    WHEN s.permit_requirements_status = 'In Progress' OR s.permit_approved_status = 'In Progress' THEN 'In Progress'
    ELSE 'Not Started'
  END AS permitting_phase,

  -- Phase: Fiber
  CASE
    WHEN s.fiber_identified_status = 'Blocked' OR s.fiber_capacity_status = 'Blocked'
      OR s.fiber_secured_status = 'Blocked' THEN 'Blocked'
    WHEN COALESCE(s.fiber_identified_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.fiber_capacity_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.fiber_secured_status, 'Not Started') IN ('Complete', 'N/A') THEN 'Complete'
    WHEN s.fiber_identified_status = 'In Progress' OR s.fiber_capacity_status = 'In Progress'
      OR s.fiber_secured_status = 'In Progress' THEN 'In Progress'
    ELSE 'Not Started'
  END AS fiber_phase,

  -- Phase: Engineering & Procurement
  CASE
    WHEN s.eng_design_status = 'Blocked' OR s.eng_equip_ordered_status = 'Blocked' THEN 'Blocked'
    WHEN COALESCE(s.eng_design_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.eng_equip_ordered_status, 'Not Started') IN ('Complete', 'N/A') THEN 'Complete'
    WHEN s.eng_design_status = 'In Progress' OR s.eng_equip_ordered_status = 'In Progress' THEN 'In Progress'
    ELSE 'Not Started'
  END AS engineering_phase,

  -- Phase: Construction & Commissioning
  CASE
    WHEN s.construction_equip_delivered_status = 'Blocked' OR s.construction_complete_status = 'Blocked'
      OR s.construction_energized_status = 'Blocked' OR s.construction_commissioned_status = 'Blocked' THEN 'Blocked'
    WHEN COALESCE(s.construction_equip_delivered_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.construction_complete_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.construction_energized_status, 'Not Started') IN ('Complete', 'N/A')
     AND COALESCE(s.construction_commissioned_status, 'Not Started') IN ('Complete', 'N/A') THEN 'Complete'
    WHEN s.construction_equip_delivered_status = 'In Progress' OR s.construction_complete_status = 'In Progress'
      OR s.construction_energized_status = 'In Progress' OR s.construction_commissioned_status = 'In Progress' THEN 'In Progress'
    ELSE 'Not Started'
  END AS construction_phase,

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
    WHEN s.site_qualified_completed IS NOT NULL AND s.power_connection_completed IS NOT NULL
      THEN s.power_connection_completed - s.site_qualified_completed
    WHEN s.site_qualified_completed IS NOT NULL AND s.power_connection_status IN ('In Progress', 'Blocked')
      THEN CURRENT_DATE - s.site_qualified_completed
    ELSE NULL
  END AS days_to_ix,

  CASE
    WHEN s.site_qualified_completed IS NOT NULL AND GREATEST(
        s.power_connection_completed, s.permit_approved_completed,
        s.fiber_secured_completed, s.eng_design_completed
      ) IS NOT NULL
      THEN GREATEST(
        s.power_connection_completed, s.permit_approved_completed,
        s.fiber_secured_completed, s.eng_design_completed
      ) - s.site_qualified_completed
    WHEN s.site_qualified_completed IS NOT NULL
      THEN CURRENT_DATE - s.site_qualified_completed
    ELSE NULL
  END AS days_to_construction_ready,

  CASE
    WHEN s.site_qualified_completed IS NOT NULL AND s.construction_commissioned_completed IS NOT NULL
      THEN s.construction_commissioned_completed - s.site_qualified_completed
    WHEN s.site_qualified_completed IS NOT NULL AND s.construction_commissioned_status IN ('In Progress', 'Blocked')
      THEN CURRENT_DATE - s.site_qualified_completed
    ELSE NULL
  END AS days_to_cod,

  -- Archive status
  (s.archived_at IS NOT NULL) AS is_archived

FROM tracker_sites s
LEFT JOIN tracker_regional_hubs h ON s.regional_hub_id = h.id
LEFT JOIN tracker_power_partners pp ON s.utility_id = pp.id
LEFT JOIN tracker_power_partners ao ON s.asset_owner_id = ao.id
LEFT JOIN tracker_ipps ipp ON s.ipp_id = ipp.id;
