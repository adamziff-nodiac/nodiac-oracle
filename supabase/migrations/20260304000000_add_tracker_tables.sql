-- =============================================================================
-- Tracker Tables — Site-Centric Denormalized Schema
-- =============================================================================
-- 11 enums, 8 tables, 1 view
-- All shared team data — authenticated users get full CRUD.
-- NOTE: update_updated_at() function already exists from migration
-- 20260210170000_add_regional_hub_tables.sql — we just reference it here.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE checkpoint_status AS ENUM ('Not Started', 'In Progress', 'Complete', 'Blocked', 'N/A');
CREATE TYPE amount_status AS ENUM ('Estimated', 'Quoted', 'Approved', 'Paid');
CREATE TYPE site_priority AS ENUM ('Lead', 'Active', 'Pipeline', 'On Hold', 'Deprioritized');
CREATE TYPE site_type_enum AS ENUM ('Solar', 'Wind', 'Solar + BESS', 'Substation', 'Other');
CREATE TYPE partner_type AS ENUM ('Distribution Co-op', 'G&T Co-op', 'Municipal Utility', 'IOU', 'IPP');
CREATE TYPE relationship_stage AS ENUM ('Identified', 'Initial Contact', 'Capacity Discussion', 'Under Contract');
CREATE TYPE hub_status AS ENUM ('Planning', 'Active Development', 'Operational');
CREATE TYPE activity_source AS ENUM ('call', 'email', 'slack', 'meeting', 'manual', 'other');
CREATE TYPE landowner_proximity AS ENUM ('Collocated', 'Adjacent');
CREATE TYPE landowner_purpose AS ENUM ('DC Location', 'Fiber Route', 'Access Easement', 'Utility Easement');
CREATE TYPE lease_status AS ENUM ('No Contact', 'Engaged', 'Amendment In Progress', 'Signed');

-- ---------------------------------------------------------------------------
-- Table 1: tracker_regional_hubs
-- ---------------------------------------------------------------------------
CREATE TABLE tracker_regional_hubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  target_mw NUMERIC,
  status hub_status,
  notes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER tracker_regional_hubs_updated_at
  BEFORE UPDATE ON tracker_regional_hubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Table 2: tracker_power_partners
-- ---------------------------------------------------------------------------
CREATE TABLE tracker_power_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type partner_type,
  relationship_stage relationship_stage,
  loi_signed BOOLEAN DEFAULT false,
  parent_gt_id UUID REFERENCES tracker_power_partners(id),
  ix_process_notes TEXT,
  rate_structure TEXT,
  available_capacity TEXT,
  attio_link TEXT,
  notes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER tracker_power_partners_updated_at
  BEFORE UPDATE ON tracker_power_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Junction: tracker_partner_hubs (many-to-many: partners <-> hubs)
-- ---------------------------------------------------------------------------
CREATE TABLE tracker_partner_hubs (
  partner_id UUID NOT NULL REFERENCES tracker_power_partners(id) ON DELETE CASCADE,
  hub_id UUID NOT NULL REFERENCES tracker_regional_hubs(id) ON DELETE CASCADE,
  PRIMARY KEY (partner_id, hub_id)
);

-- ---------------------------------------------------------------------------
-- Table 3: tracker_landowners
-- ---------------------------------------------------------------------------
CREATE TABLE tracker_landowners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mailing_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER tracker_landowners_updated_at
  BEFORE UPDATE ON tracker_landowners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Table 4: tracker_sites
-- ---------------------------------------------------------------------------
CREATE TABLE tracker_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  regional_hub_id UUID REFERENCES tracker_regional_hubs(id),
  utility_id UUID REFERENCES tracker_power_partners(id),
  asset_owner_id UUID REFERENCES tracker_power_partners(id),
  mw_current NUMERIC,
  mw_potential NUMERIC,
  site_type site_type_enum,
  priority site_priority,
  address TEXT,
  coordinates TEXT,
  ahj TEXT,
  interested_offtakers TEXT[] DEFAULT '{}',
  site_notes JSONB DEFAULT '{}',
  checkpoint_notes JSONB DEFAULT '{}',
  archived_at DATE,
  archived_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- =========================================================================
  -- CHECKPOINT COLUMNS — 21 checkpoints, 4 base columns each
  -- Financial checkpoints (8, 12, 15, 17) get 2 extra columns
  -- All _status columns use checkpoint_status enum (default 'Not Started')
  -- All _amount_status columns use amount_status enum
  -- =========================================================================

  -- Phase 1: Site Qualification
  site_identified_status checkpoint_status DEFAULT 'Not Started',
  site_identified_forecast DATE,
  site_identified_completed DATE,
  site_identified_owner TEXT,

  site_qualified_status checkpoint_status DEFAULT 'Not Started',
  site_qualified_forecast DATE,
  site_qualified_completed DATE,
  site_qualified_owner TEXT,

  -- Phase 2: Site Control
  control_engaged_status checkpoint_status DEFAULT 'Not Started',
  control_engaged_forecast DATE,
  control_engaged_completed DATE,
  control_engaged_owner TEXT,

  control_secured_status checkpoint_status DEFAULT 'Not Started',
  control_secured_forecast DATE,
  control_secured_completed DATE,
  control_secured_owner TEXT,

  -- Phase 3: Power
  power_capacity_check_status checkpoint_status DEFAULT 'Not Started',
  power_capacity_check_forecast DATE,
  power_capacity_check_completed DATE,
  power_capacity_check_owner TEXT,

  power_capacity_indication_status checkpoint_status DEFAULT 'Not Started',
  power_capacity_indication_forecast DATE,
  power_capacity_indication_completed DATE,
  power_capacity_indication_owner TEXT,

  power_service_request_status checkpoint_status DEFAULT 'Not Started',
  power_service_request_forecast DATE,
  power_service_request_completed DATE,
  power_service_request_owner TEXT,

  power_deposit_status checkpoint_status DEFAULT 'Not Started',
  power_deposit_forecast DATE,
  power_deposit_completed DATE,
  power_deposit_owner TEXT,
  power_deposit_amount NUMERIC,
  power_deposit_amount_status amount_status,

  power_utility_design_status checkpoint_status DEFAULT 'Not Started',
  power_utility_design_forecast DATE,
  power_utility_design_completed DATE,
  power_utility_design_owner TEXT,

  power_connection_status checkpoint_status DEFAULT 'Not Started',
  power_connection_forecast DATE,
  power_connection_completed DATE,
  power_connection_owner TEXT,

  -- Phase 4: Permitting
  permit_requirements_status checkpoint_status DEFAULT 'Not Started',
  permit_requirements_forecast DATE,
  permit_requirements_completed DATE,
  permit_requirements_owner TEXT,

  permit_approved_status checkpoint_status DEFAULT 'Not Started',
  permit_approved_forecast DATE,
  permit_approved_completed DATE,
  permit_approved_owner TEXT,
  permit_approved_amount NUMERIC,
  permit_approved_amount_status amount_status,

  -- Phase 5: Fiber
  fiber_identified_status checkpoint_status DEFAULT 'Not Started',
  fiber_identified_forecast DATE,
  fiber_identified_completed DATE,
  fiber_identified_owner TEXT,

  fiber_capacity_status checkpoint_status DEFAULT 'Not Started',
  fiber_capacity_forecast DATE,
  fiber_capacity_completed DATE,
  fiber_capacity_owner TEXT,

  fiber_secured_status checkpoint_status DEFAULT 'Not Started',
  fiber_secured_forecast DATE,
  fiber_secured_completed DATE,
  fiber_secured_owner TEXT,
  fiber_secured_amount NUMERIC,
  fiber_secured_amount_status amount_status,

  -- Phase 6: Engineering & Procurement
  eng_design_status checkpoint_status DEFAULT 'Not Started',
  eng_design_forecast DATE,
  eng_design_completed DATE,
  eng_design_owner TEXT,

  eng_equip_ordered_status checkpoint_status DEFAULT 'Not Started',
  eng_equip_ordered_forecast DATE,
  eng_equip_ordered_completed DATE,
  eng_equip_ordered_owner TEXT,
  eng_equip_ordered_amount NUMERIC,
  eng_equip_ordered_amount_status amount_status,

  -- Phase 7: Construction & Commissioning
  construction_equip_delivered_status checkpoint_status DEFAULT 'Not Started',
  construction_equip_delivered_forecast DATE,
  construction_equip_delivered_completed DATE,
  construction_equip_delivered_owner TEXT,

  construction_complete_status checkpoint_status DEFAULT 'Not Started',
  construction_complete_forecast DATE,
  construction_complete_completed DATE,
  construction_complete_owner TEXT,

  construction_energized_status checkpoint_status DEFAULT 'Not Started',
  construction_energized_forecast DATE,
  construction_energized_completed DATE,
  construction_energized_owner TEXT,

  construction_commissioned_status checkpoint_status DEFAULT 'Not Started',
  construction_commissioned_forecast DATE,
  construction_commissioned_completed DATE,
  construction_commissioned_owner TEXT
);

CREATE INDEX idx_tracker_sites_priority ON tracker_sites(priority);
CREATE INDEX idx_tracker_sites_hub ON tracker_sites(regional_hub_id);
CREATE INDEX idx_tracker_sites_deposit ON tracker_sites(power_deposit_status);
CREATE INDEX idx_tracker_sites_archived ON tracker_sites(archived_at);

CREATE TRIGGER tracker_sites_updated_at
  BEFORE UPDATE ON tracker_sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Table 5: tracker_parcels
-- ---------------------------------------------------------------------------
CREATE TABLE tracker_parcels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES tracker_sites(id) ON DELETE CASCADE,
  landowner_id UUID REFERENCES tracker_landowners(id),
  apn TEXT NOT NULL,
  area_acres NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tracker_parcels_site ON tracker_parcels(site_id);
CREATE INDEX idx_tracker_parcels_landowner ON tracker_parcels(landowner_id);
CREATE INDEX idx_tracker_parcels_apn ON tracker_parcels(apn);

CREATE TRIGGER tracker_parcels_updated_at
  BEFORE UPDATE ON tracker_parcels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Junction: tracker_site_landowners (many-to-many: sites <-> landowners)
-- ---------------------------------------------------------------------------
CREATE TABLE tracker_site_landowners (
  site_id UUID NOT NULL REFERENCES tracker_sites(id) ON DELETE CASCADE,
  landowner_id UUID NOT NULL REFERENCES tracker_landowners(id) ON DELETE CASCADE,
  PRIMARY KEY (site_id, landowner_id),
  proximity landowner_proximity NOT NULL,
  purpose landowner_purpose[] NOT NULL DEFAULT '{}',
  lease_status lease_status DEFAULT 'No Contact',
  notes TEXT
);

-- ---------------------------------------------------------------------------
-- Table 6: tracker_activity_log
-- ---------------------------------------------------------------------------
CREATE TABLE tracker_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  source_type activity_source,
  source_link TEXT,
  site_id UUID REFERENCES tracker_sites(id),
  logged_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tracker_activity_site ON tracker_activity_log(site_id, created_at DESC);
CREATE INDEX idx_tracker_activity_recent ON tracker_activity_log(created_at DESC);

-- ---------------------------------------------------------------------------
-- View: tracker_site_overview
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW tracker_site_overview AS
SELECT
  s.*,
  h.name AS hub_name,
  pp.name AS utility_name,
  ao.name AS asset_owner_name,

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

  -- Next step (first element of site_notes.next_steps array)
  s.site_notes->'next_steps'->>0 AS next_step,

  -- Construction Ready: composite milestone — all pre-construction phases complete
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
LEFT JOIN tracker_power_partners ao ON s.asset_owner_id = ao.id;

-- ---------------------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------------------
ALTER TABLE tracker_regional_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_power_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_partner_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_landowners ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_site_landowners ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tracker_hubs_all" ON tracker_regional_hubs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "tracker_partners_all" ON tracker_power_partners
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "tracker_partner_hubs_all" ON tracker_partner_hubs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "tracker_landowners_all" ON tracker_landowners
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "tracker_sites_all" ON tracker_sites
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "tracker_parcels_all" ON tracker_parcels
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "tracker_site_landowners_all" ON tracker_site_landowners
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "tracker_activity_all" ON tracker_activity_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE tracker_sites;
ALTER PUBLICATION supabase_realtime ADD TABLE tracker_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE tracker_power_partners;
ALTER PUBLICATION supabase_realtime ADD TABLE tracker_regional_hubs;
