-- Add utility_type column to portfolio_sites for storing detected utility classification
ALTER TABLE portfolio_sites ADD COLUMN IF NOT EXISTS utility_type text;
