-- Add attio_record_id to partners and landowners
ALTER TABLE tracker_power_partners
  ADD COLUMN IF NOT EXISTS attio_record_id UUID;

ALTER TABLE tracker_landowners
  ADD COLUMN IF NOT EXISTS attio_record_id UUID;

-- Partial indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_partners_attio_record_id
  ON tracker_power_partners (attio_record_id)
  WHERE attio_record_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_landowners_attio_record_id
  ON tracker_landowners (attio_record_id)
  WHERE attio_record_id IS NOT NULL;
