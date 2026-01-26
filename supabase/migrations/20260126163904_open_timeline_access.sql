-- Update RLS policies to allow all authenticated users to view and edit all timelines
-- This enables collaborative editing across the organization

-- Drop existing user-scoped policies on timelines
DROP POLICY IF EXISTS "Users can view own timelines" ON timelines;
DROP POLICY IF EXISTS "Users can create own timelines" ON timelines;
DROP POLICY IF EXISTS "Users can update own timelines" ON timelines;
DROP POLICY IF EXISTS "Users can delete own timelines" ON timelines;

-- Create new policies allowing all authenticated users
CREATE POLICY "Authenticated users can view all timelines" ON timelines
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create timelines" ON timelines
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update all timelines" ON timelines
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete all timelines" ON timelines
  FOR DELETE USING (auth.role() = 'authenticated');

-- Drop existing policies on timeline_rows
DROP POLICY IF EXISTS "Users can view rows in own timelines" ON timeline_rows;
DROP POLICY IF EXISTS "Users can create rows in own timelines" ON timeline_rows;
DROP POLICY IF EXISTS "Users can update rows in own timelines" ON timeline_rows;
DROP POLICY IF EXISTS "Users can delete rows in own timelines" ON timeline_rows;

-- Create new policies for timeline_rows
CREATE POLICY "Authenticated users can view all rows" ON timeline_rows
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create rows" ON timeline_rows
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update all rows" ON timeline_rows
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete all rows" ON timeline_rows
  FOR DELETE USING (auth.role() = 'authenticated');

-- Drop existing policies on timeline_milestones
DROP POLICY IF EXISTS "Users can view milestones in own timelines" ON timeline_milestones;
DROP POLICY IF EXISTS "Users can create milestones in own timelines" ON timeline_milestones;
DROP POLICY IF EXISTS "Users can update milestones in own timelines" ON timeline_milestones;
DROP POLICY IF EXISTS "Users can delete milestones in own timelines" ON timeline_milestones;

-- Create new policies for timeline_milestones
CREATE POLICY "Authenticated users can view all milestones" ON timeline_milestones
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create milestones" ON timeline_milestones
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update all milestones" ON timeline_milestones
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete all milestones" ON timeline_milestones
  FOR DELETE USING (auth.role() = 'authenticated');

-- Drop existing policies on timeline_phases
DROP POLICY IF EXISTS "Users can view phases in own timelines" ON timeline_phases;
DROP POLICY IF EXISTS "Users can create phases in own timelines" ON timeline_phases;
DROP POLICY IF EXISTS "Users can update phases in own timelines" ON timeline_phases;
DROP POLICY IF EXISTS "Users can delete phases in own timelines" ON timeline_phases;

-- Create new policies for timeline_phases
CREATE POLICY "Authenticated users can view all phases" ON timeline_phases
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create phases" ON timeline_phases
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update all phases" ON timeline_phases
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete all phases" ON timeline_phases
  FOR DELETE USING (auth.role() = 'authenticated');

-- Drop existing policies on timeline_annotations
DROP POLICY IF EXISTS "Users can view annotations in own timelines" ON timeline_annotations;
DROP POLICY IF EXISTS "Users can create annotations in own timelines" ON timeline_annotations;
DROP POLICY IF EXISTS "Users can update annotations in own timelines" ON timeline_annotations;
DROP POLICY IF EXISTS "Users can delete annotations in own timelines" ON timeline_annotations;

-- Create new policies for timeline_annotations
CREATE POLICY "Authenticated users can view all annotations" ON timeline_annotations
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create annotations" ON timeline_annotations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update all annotations" ON timeline_annotations
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete all annotations" ON timeline_annotations
  FOR DELETE USING (auth.role() = 'authenticated');
