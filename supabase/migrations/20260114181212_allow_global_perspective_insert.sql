-- Allow authenticated users to insert global perspectives
CREATE POLICY "Authenticated users can insert global perspectives" ON perspectives
  FOR INSERT
  WITH CHECK (is_global = TRUE AND user_id IS NULL AND auth.role() = 'authenticated');

-- Allow authenticated users to delete global perspectives
CREATE POLICY "Authenticated users can delete global perspectives" ON perspectives
  FOR DELETE
  USING (is_global = TRUE AND auth.role() = 'authenticated');
