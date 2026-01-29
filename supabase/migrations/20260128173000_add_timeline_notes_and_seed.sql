-- Migration that was previously applied: added notes column to timelines
-- and seeded Cider (Appendix) and Appaloosa II (Appendix) timeline records

-- Add notes column (already exists in remote DB)
ALTER TABLE timelines ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
