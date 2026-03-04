-- =============================================================================
-- Tracker Seed Data — Migrated from Notion Project Tracker
-- =============================================================================
-- Source: Notion databases (Regional Hubs, Power Partners, Sites, Milestones, Updates Log)
-- Date: 2026-03-04
-- All milestone statuses are "Not Started" (fresh tracker initialization)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Regional Hubs (3)
-- ---------------------------------------------------------------------------
INSERT INTO tracker_regional_hubs (name, target_mw, status, notes)
VALUES
  ('Upper Midwest Hub', 500, 'Active Development', '{}'::jsonb),
  ('Colorado Hub', NULL, 'Active Development', '{}'::jsonb),
  ('Minnesota Hub', NULL, 'Planning', '{}'::jsonb);

-- ---------------------------------------------------------------------------
-- 2. Power Partners (12) — G&Ts and IOUs first, then Distribution Co-ops
-- ---------------------------------------------------------------------------

-- G&T Co-op (no parent_gt_id)
INSERT INTO tracker_power_partners (name, type, relationship_stage, loi_signed, notes)
VALUES
  ('Dairyland Power Cooperative', 'G&T Co-op', 'Under Contract', false, '{}'::jsonb);

-- IOUs (no parent_gt_id)
INSERT INTO tracker_power_partners (name, type, relationship_stage, loi_signed, notes)
VALUES
  ('Xcel Energy (Minnesota)', 'IOU', 'Identified', false, '{}'::jsonb),
  ('Xcel Energy (Denver/DIA)', 'IOU', 'Capacity Discussion', false, '{}'::jsonb);

-- IPPs (no parent_gt_id)
INSERT INTO tracker_power_partners (name, type, relationship_stage, loi_signed, notes)
VALUES
  ('ALTUS', 'IPP', 'Initial Contact', false, '{}'::jsonb),
  ('Powerbank', 'IPP', 'Initial Contact', false, '{}'::jsonb);

-- Distribution Co-ops with parent_gt_id (Dairyland children)
INSERT INTO tracker_power_partners (name, type, relationship_stage, loi_signed, parent_gt_id, notes)
VALUES
  ('Jump River Electric Cooperative', 'Distribution Co-op', 'Capacity Discussion', false,
   (SELECT id FROM tracker_power_partners WHERE name = 'Dairyland Power Cooperative'), '{}'::jsonb),
  ('Dunn Electric Co-op', 'Distribution Co-op', 'Capacity Discussion', false,
   (SELECT id FROM tracker_power_partners WHERE name = 'Dairyland Power Cooperative'), '{}'::jsonb);

-- Distribution Co-ops without parent_gt_id
INSERT INTO tracker_power_partners (name, type, relationship_stage, loi_signed, notes)
VALUES
  ('Benco', 'Distribution Co-op', 'Initial Contact', false, '{}'::jsonb),
  ('Chippewa Valley', 'Distribution Co-op', 'Initial Contact', false, '{}'::jsonb),
  ('Eau Claire', 'Distribution Co-op', 'Initial Contact', false, '{}'::jsonb),
  ('United Power (Colorado)', 'Distribution Co-op', 'Initial Contact', false, '{}'::jsonb),
  ('Annandale / Riot Hefen', 'Distribution Co-op', 'Identified', false, '{}'::jsonb);

-- ---------------------------------------------------------------------------
-- 3. Partner <-> Hub Links (tracker_partner_hubs)
-- ---------------------------------------------------------------------------

-- Upper Midwest Hub partners
INSERT INTO tracker_partner_hubs (partner_id, hub_id)
VALUES
  ((SELECT id FROM tracker_power_partners WHERE name = 'Dairyland Power Cooperative'),
   (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub')),
  ((SELECT id FROM tracker_power_partners WHERE name = 'Jump River Electric Cooperative'),
   (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub')),
  ((SELECT id FROM tracker_power_partners WHERE name = 'Dunn Electric Co-op'),
   (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub')),
  ((SELECT id FROM tracker_power_partners WHERE name = 'Benco'),
   (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub')),
  ((SELECT id FROM tracker_power_partners WHERE name = 'Chippewa Valley'),
   (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub')),
  ((SELECT id FROM tracker_power_partners WHERE name = 'Eau Claire'),
   (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub')),
  ((SELECT id FROM tracker_power_partners WHERE name = 'Annandale / Riot Hefen'),
   (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub')),
  ((SELECT id FROM tracker_power_partners WHERE name = 'ALTUS'),
   (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub')),
  ((SELECT id FROM tracker_power_partners WHERE name = 'Powerbank'),
   (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub'));

-- Colorado Hub partners
INSERT INTO tracker_partner_hubs (partner_id, hub_id)
VALUES
  ((SELECT id FROM tracker_power_partners WHERE name = 'United Power (Colorado)'),
   (SELECT id FROM tracker_regional_hubs WHERE name = 'Colorado Hub')),
  ((SELECT id FROM tracker_power_partners WHERE name = 'Xcel Energy (Denver/DIA)'),
   (SELECT id FROM tracker_regional_hubs WHERE name = 'Colorado Hub'));

-- Minnesota Hub partners
INSERT INTO tracker_partner_hubs (partner_id, hub_id)
VALUES
  ((SELECT id FROM tracker_power_partners WHERE name = 'Xcel Energy (Minnesota)'),
   (SELECT id FROM tracker_regional_hubs WHERE name = 'Minnesota Hub'));

-- ---------------------------------------------------------------------------
-- 4. Sites (16) — all milestones default to 'Not Started'
-- Owner assignments come from Notion Milestones database
-- Site notes extracted from Notion page body content
-- ---------------------------------------------------------------------------

-- Site 1: Hay River (Lead, Upper Midwest, Dunn Electric)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  mw_current, mw_potential, priority,
  site_notes
)
VALUES (
  'Hay River',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Dunn Electric Co-op'),
  2, 6, 'Lead',
  '{"summary": "2MW available from Dunn Electric/Dairyland Power; expansion to 5-6MW with grid upgrades. Utility cost estimates below model. 10% site designs in progress. Need to amend existing special use permits for DC use. Dunn County political sensitivity. Greenbacker data room access established. Lead pilot site for Google.", "next_steps": ["Proceed with minimal load to avoid application fees", "Amend existing special use permits for DC use", "Complete fiber connectivity story"], "blockers": ["Dunn County political sensitivity — prior large DC opposition"], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 2: Walleye (Lead, Upper Midwest, Dunn Electric)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  mw_current, mw_potential, priority,
  site_notes
)
VALUES (
  'Walleye',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Dunn Electric Co-op'),
  1.25, 6, 'Lead',
  '{"summary": "1.25MW available from Dunn Electric/Dairyland Power. Utility cost estimates below model. 10% site designs in progress. Need to amend existing special use permits for DC use. Dunn County political sensitivity. Lead pilot site for Google. Deprioritize deposit strategy here — focus deposits on Jump River.", "next_steps": ["Proceed with minimal load to avoid application fees", "Amend solar leases with landowners"], "blockers": ["Dunn County political sensitivity — prior large DC opposition"], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 3: Conrath (Active, Upper Midwest, Jump River)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  mw_current, priority,
  site_notes
)
VALUES (
  'Conrath',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Jump River Electric Cooperative'),
  2, 'Active',
  '{"summary": "2 MW immediately available at substation. Part of Jump River Electric Cooperative cluster (6 sites total, ~12 MW aggregate). Use-by-right zoning — no special use permits required. Greenfield site on Dairyland Power-owned property.", "next_steps": ["Focus interconnection deposits on Jump River cluster"], "blockers": [], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 4: Gilman (Active, Upper Midwest, Jump River)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  mw_current, priority,
  site_notes
)
VALUES (
  'Gilman',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Jump River Electric Cooperative'),
  2, 'Active',
  '{"summary": "2 MW immediately available at substation. Part of Jump River Electric Cooperative cluster (6 sites total, ~12 MW aggregate). Use-by-right zoning. Greenfield site on Dairyland Power-owned property. Targeted for 6-9 month deployment timeline.", "next_steps": ["Focus interconnection deposits on Jump River cluster"], "blockers": [], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 5: Hawkins (Active, Upper Midwest, Jump River)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  mw_current, priority,
  site_notes
)
VALUES (
  'Hawkins',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Jump River Electric Cooperative'),
  2, 'Active',
  '{"summary": "2 MW immediately available at substation. Part of Jump River Electric Cooperative cluster (6 sites total, ~12 MW aggregate). Use-by-right zoning. Greenfield site on Dairyland Power-owned property.", "next_steps": ["Focus interconnection deposits on Jump River cluster"], "blockers": [], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 6: Weyerhaeuser (Active, Upper Midwest, Jump River)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  mw_current, priority,
  site_notes
)
VALUES (
  'Weyerhaeuser',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Jump River Electric Cooperative'),
  2, 'Active',
  '{"summary": "2 MW immediately available at substation. Part of Jump River Electric Cooperative cluster (6 sites total, ~12 MW aggregate). Use-by-right zoning. Greenfield site on Dairyland Power-owned property.", "next_steps": ["Focus interconnection deposits on Jump River cluster"], "blockers": [], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 7: Flambeau (Active, Upper Midwest, Jump River)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  mw_current, mw_potential, priority,
  site_notes
)
VALUES (
  'Flambeau',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Jump River Electric Cooperative'),
  2, 10, 'Active',
  '{"summary": "2MW immediately available. Transmission capacity up to 10MW with substation upgrades (Dairyland plans upgrade within 3 years). Largest expansion potential in the Jump River cluster. Priority site for $2.5M interconnection deposit allocation.", "next_steps": ["Focus interconnection deposits on Jump River cluster", "Monitor Dairyland substation upgrade timeline"], "blockers": [], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 8: Hannibal (Active, Upper Midwest, Jump River)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  mw_current, priority,
  site_notes
)
VALUES (
  'Hannibal',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Jump River Electric Cooperative'),
  1.9, 'Active',
  '{"summary": "Just under 2 MW available. Will require substation upgrade to reach full capacity — unlike other Jump River sites. Part of Jump River Electric Cooperative cluster (6 sites total, ~12 MW aggregate). Use-by-right zoning. Slightly lower priority than other Jump River sites due to substation upgrade requirement.", "next_steps": ["Evaluate substation upgrade cost and timeline"], "blockers": ["Substation upgrade needed for expansion"], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 9: DIA9 (Active, Colorado, Xcel Denver)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  priority,
  site_notes
)
VALUES (
  'DIA9',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Colorado Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Xcel Energy (Denver/DIA)'),
  'Active',
  '{"summary": "Xcel Energy territory. Authorization letter needed from DIA/Denver before Xcel proceeds. Site visit completed — textbook site for deployment. Could accommodate dozens of shells. Land owned by City and County of Denver. Nearest fiber ~2 miles away (considering Starlink). Denver Mayor meeting scheduled March 4.", "next_steps": ["Denver Mayor meeting March 4", "Get DIA authorization letter for Xcel", "Evaluate Starlink vs fiber"], "blockers": ["Need DIA/Denver authorization letter", "Denver data center moratorium announced Mar 2 2026"], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 10: Benco Site 1 (Pipeline, Upper Midwest, Benco)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  mw_current, priority,
  site_notes
)
VALUES (
  'Benco Site 1',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Benco'),
  2, 'Pipeline',
  '{"summary": "2 MW capacity identified. Benco Electric is the utility cooperative. Pipeline priority — early-stage opportunity identified through co-op outreach. Positive reception to Nodiac co-location approach.", "next_steps": ["Advance utility discussions"], "blockers": [], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 11: Benco Site 2 (Pipeline, Upper Midwest, Benco)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  mw_current, priority,
  site_notes
)
VALUES (
  'Benco Site 2',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Benco'),
  3, 'Pipeline',
  '{"summary": "3 MW capacity identified. Benco Electric is the utility cooperative. Pipeline priority. Two Benco sites total — 5 MW aggregate potential.", "next_steps": ["Advance utility discussions"], "blockers": [], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 12: Chippewa Valley Sites (Pipeline, Upper Midwest, Chippewa Valley)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  priority,
  site_notes
)
VALUES (
  'Chippewa Valley Sites',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Chippewa Valley'),
  'Pipeline',
  '{"summary": "Capacity TBD — not yet quantified. Chippewa Valley Cooperative has expressed strong interest in partnering with Nodiac. Universal positive reception from co-op outreach.", "next_steps": ["Quantify available capacity", "Identify specific site locations"], "blockers": [], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 13: Eau Claire Sites (Pipeline, Upper Midwest, Eau Claire)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  mw_current, priority,
  site_notes
)
VALUES (
  'Eau Claire Sites',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Eau Claire'),
  2.5, 'Pipeline',
  '{"summary": "3-4 sites with 2-3 MW each (~8-10 MW aggregate potential). Includes a decommissioned substation — existing infrastructure that could accelerate deployment. Eau Claire Cooperative has expressed strong interest.", "next_steps": ["Evaluate decommissioned substation opportunity", "Quantify per-site capacity"], "blockers": [], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 14: Annandale Site (Pipeline, Upper Midwest, Annandale/Riot Hefen)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  priority,
  site_notes
)
VALUES (
  'Annandale Site',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Upper Midwest Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Annandale / Riot Hefen'),
  'Pipeline',
  '{"summary": "Several MW available (exact capacity TBD). Pipeline priority. Primary blocker: utility contact has been difficult to reach. Lower priority than Jump River sites.", "next_steps": ["Eric following up with generic interconnection language"], "blockers": ["Utility contact difficult to reach"], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 15: United Power Sites (On Hold, Colorado, United Power)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  priority,
  site_notes
)
VALUES (
  'United Power Sites',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Colorado Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'United Power (Colorado)'),
  'On Hold',
  '{"summary": "United Power joining Southwest Power Pool (SPP) in April 2026. 75 MW threshold for large load classification. During SPP transition, large load discussions paused. Denver data center moratorium (Mar 2, 2026) adds additional regulatory complexity.", "next_steps": ["Revisit after April 2026 SPP transition"], "blockers": ["United Power SPP transition blocking large load discussions", "Denver data center moratorium"], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- Site 16: Xcel MN Sites (Pipeline, Minnesota, Xcel MN)
INSERT INTO tracker_sites (
  name, regional_hub_id, utility_id,
  priority,
  site_notes
)
VALUES (
  'Xcel MN Sites',
  (SELECT id FROM tracker_regional_hubs WHERE name = 'Minnesota Hub'),
  (SELECT id FROM tracker_power_partners WHERE name = 'Xcel Energy (Minnesota)'),
  'Pipeline',
  '{"summary": "~12 project sites in Xcel Energy Minnesota territory. Sites under joint Greenbacker/Xcel co-ownership. Focus on determining available interconnection capacity at each site (1-10 MW modular deployments). Grid draw (not clipped/curtailed solar) is primary power strategy.", "next_steps": ["Josh pulling site control docs from Greenbacker data room", "Clarify grid-draw model with Greenbacker"], "blockers": ["Greenbacker contact does not fully understand grid-draw model"], "updated_at": "2026-03-03T00:00:00Z"}'::jsonb
);

-- ---------------------------------------------------------------------------
-- 5. Activity Log
-- ---------------------------------------------------------------------------
INSERT INTO tracker_activity_log (title, summary, source_type, site_id, logged_by, created_at)
VALUES
  ('[REVERTED] Hay River — max expansion updated to 10MW, possible on-site fiber',
   'REVERTED — Changes rolled back per Adam Z. Original values restored (MW Potential: 6, Notes: original).',
   'other',
   (SELECT id FROM tracker_sites WHERE name = 'Hay River'),
   'Adam Z',
   '2026-03-03T00:00:00Z');
