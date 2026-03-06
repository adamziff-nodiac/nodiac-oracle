-- Phase 1: Action Items & Team Members tables
-- GTD-inspired action item tracking for site development

-- Team members table (maps Supabase auth users to display names)
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  display_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: authenticated users can read all, only admins can insert/update/delete
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage team members"
  ON team_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Action items table
CREATE TABLE tracker_action_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES tracker_sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'next' CHECK (status IN ('next', 'waiting', 'done')),
  flagged BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES team_members(id),
  waiting_on TEXT,
  waiting_since TIMESTAMPTZ,
  defer_until DATE,
  hard_deadline DATE,
  notes TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'call')),
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_action_items_site_id ON tracker_action_items(site_id);
CREATE INDEX idx_action_items_assigned_to ON tracker_action_items(assigned_to);
CREATE INDEX idx_action_items_status ON tracker_action_items(status);
CREATE INDEX idx_action_items_defer_until ON tracker_action_items(defer_until);

-- RLS
ALTER TABLE tracker_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read action items"
  ON tracker_action_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage action items"
  ON tracker_action_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- View: action items with context (site name, hub name, assignee name, creator name)
CREATE OR REPLACE VIEW tracker_action_items_with_context AS
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

-- Data migration: convert site_notes JSONB arrays to action items
-- next_steps[] → status='next'
INSERT INTO tracker_action_items (site_id, title, status, source)
SELECT
  ts.id,
  step.value::text,
  'next',
  'manual'
FROM tracker_sites ts,
  jsonb_array_elements_text(ts.site_notes->'next_steps') AS step(value)
WHERE ts.site_notes->'next_steps' IS NOT NULL
  AND jsonb_array_length(ts.site_notes->'next_steps') > 0;

-- blockers[] → status='waiting', waiting_on=contact, notes=issue
INSERT INTO tracker_action_items (site_id, title, status, waiting_on, notes, source)
SELECT
  ts.id,
  (b.val)->>'issue',
  'waiting',
  (b.val)->>'contact',
  (b.val)->>'issue',
  'manual'
FROM tracker_sites ts,
  jsonb_array_elements(ts.site_notes->'blockers') AS b(val)
WHERE ts.site_notes->'blockers' IS NOT NULL
  AND jsonb_array_length(ts.site_notes->'blockers') > 0;

-- waiting_on[] → status='waiting', waiting_on=who, notes=what
INSERT INTO tracker_action_items (site_id, title, status, waiting_on, waiting_since, notes, source)
SELECT
  ts.id,
  (w.val)->>'what',
  'waiting',
  (w.val)->>'who',
  CASE WHEN (w.val)->>'since' IS NOT NULL THEN ((w.val)->>'since')::timestamptz ELSE NULL END,
  ((w.val)->>'who') || ': ' || ((w.val)->>'what'),
  'manual'
FROM tracker_sites ts,
  jsonb_array_elements(ts.site_notes->'waiting_on') AS w(val)
WHERE ts.site_notes->'waiting_on' IS NOT NULL
  AND jsonb_array_length(ts.site_notes->'waiting_on') > 0;
