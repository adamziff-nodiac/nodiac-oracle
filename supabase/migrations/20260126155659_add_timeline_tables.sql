-- Timeline tables for project timeline builder
-- Supports creating visual timelines with rows, milestones, phases, and annotations

-- Timelines table (parent entity)
CREATE TABLE timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Timeline',
  start_year INTEGER NOT NULL DEFAULT 2024,
  end_year INTEGER NOT NULL DEFAULT 2030,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timelines_user_id ON timelines(user_id);
CREATE INDEX idx_timelines_user_updated ON timelines(user_id, updated_at DESC);

-- Timeline rows (technology rows like Solar, BESS, Gas, etc.)
CREATE TABLE timeline_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_rows_timeline ON timeline_rows(timeline_id, position);

-- Timeline milestones (markers on bars with labels)
CREATE TABLE timeline_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id UUID NOT NULL REFERENCES timeline_rows(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  date DATE NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_milestones_row ON timeline_milestones(row_id, position);

-- Timeline phases (vertical dividers like "Phase 1", "Phase 2")
CREATE TABLE timeline_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  date DATE NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_phases_timeline ON timeline_phases(timeline_id, position);

-- Timeline annotations (special labels on bars like "IX Request Filed")
CREATE TABLE timeline_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id UUID NOT NULL REFERENCES timeline_rows(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_annotations_row ON timeline_annotations(row_id);

-- Enable Row Level Security
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_annotations ENABLE ROW LEVEL SECURITY;

-- Timelines: users can CRUD their own timelines
CREATE POLICY "Users can view own timelines" ON timelines
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own timelines" ON timelines
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own timelines" ON timelines
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own timelines" ON timelines
  FOR DELETE USING (auth.uid() = user_id);

-- Timeline rows: cascade through timeline ownership
CREATE POLICY "Users can view rows in own timelines" ON timeline_rows
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM timelines WHERE timelines.id = timeline_rows.timeline_id AND timelines.user_id = auth.uid())
  );
CREATE POLICY "Users can create rows in own timelines" ON timeline_rows
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM timelines WHERE timelines.id = timeline_rows.timeline_id AND timelines.user_id = auth.uid())
  );
CREATE POLICY "Users can update rows in own timelines" ON timeline_rows
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM timelines WHERE timelines.id = timeline_rows.timeline_id AND timelines.user_id = auth.uid())
  );
CREATE POLICY "Users can delete rows in own timelines" ON timeline_rows
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM timelines WHERE timelines.id = timeline_rows.timeline_id AND timelines.user_id = auth.uid())
  );

-- Timeline milestones: cascade through row -> timeline ownership
CREATE POLICY "Users can view milestones in own timelines" ON timeline_milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM timeline_rows r
      JOIN timelines t ON t.id = r.timeline_id
      WHERE r.id = timeline_milestones.row_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create milestones in own timelines" ON timeline_milestones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM timeline_rows r
      JOIN timelines t ON t.id = r.timeline_id
      WHERE r.id = timeline_milestones.row_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update milestones in own timelines" ON timeline_milestones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM timeline_rows r
      JOIN timelines t ON t.id = r.timeline_id
      WHERE r.id = timeline_milestones.row_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete milestones in own timelines" ON timeline_milestones
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM timeline_rows r
      JOIN timelines t ON t.id = r.timeline_id
      WHERE r.id = timeline_milestones.row_id AND t.user_id = auth.uid()
    )
  );

-- Timeline phases: cascade through timeline ownership
CREATE POLICY "Users can view phases in own timelines" ON timeline_phases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM timelines WHERE timelines.id = timeline_phases.timeline_id AND timelines.user_id = auth.uid())
  );
CREATE POLICY "Users can create phases in own timelines" ON timeline_phases
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM timelines WHERE timelines.id = timeline_phases.timeline_id AND timelines.user_id = auth.uid())
  );
CREATE POLICY "Users can update phases in own timelines" ON timeline_phases
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM timelines WHERE timelines.id = timeline_phases.timeline_id AND timelines.user_id = auth.uid())
  );
CREATE POLICY "Users can delete phases in own timelines" ON timeline_phases
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM timelines WHERE timelines.id = timeline_phases.timeline_id AND timelines.user_id = auth.uid())
  );

-- Timeline annotations: cascade through row -> timeline ownership
CREATE POLICY "Users can view annotations in own timelines" ON timeline_annotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM timeline_rows r
      JOIN timelines t ON t.id = r.timeline_id
      WHERE r.id = timeline_annotations.row_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create annotations in own timelines" ON timeline_annotations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM timeline_rows r
      JOIN timelines t ON t.id = r.timeline_id
      WHERE r.id = timeline_annotations.row_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update annotations in own timelines" ON timeline_annotations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM timeline_rows r
      JOIN timelines t ON t.id = r.timeline_id
      WHERE r.id = timeline_annotations.row_id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete annotations in own timelines" ON timeline_annotations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM timeline_rows r
      JOIN timelines t ON t.id = r.timeline_id
      WHERE r.id = timeline_annotations.row_id AND t.user_id = auth.uid()
    )
  );

-- Auto-update timestamps
CREATE TRIGGER update_timelines_updated_at
  BEFORE UPDATE ON timelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_timeline_rows_updated_at
  BEFORE UPDATE ON timeline_rows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_timeline_milestones_updated_at
  BEFORE UPDATE ON timeline_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_timeline_phases_updated_at
  BEFORE UPDATE ON timeline_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_timeline_annotations_updated_at
  BEFORE UPDATE ON timeline_annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Realtime for all timeline tables
ALTER PUBLICATION supabase_realtime ADD TABLE timelines;
ALTER PUBLICATION supabase_realtime ADD TABLE timeline_rows;
ALTER PUBLICATION supabase_realtime ADD TABLE timeline_milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE timeline_phases;
ALTER PUBLICATION supabase_realtime ADD TABLE timeline_annotations;
