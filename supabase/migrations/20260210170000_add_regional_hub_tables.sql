-- Regional Hub Strategy tables
-- county_scores: ~3,200 US counties with 6 normalized criterion scores (0-1)
-- hub_regions: Custom overlay polygons for Nodiac-defined regions
-- permitting_sentiment: Detailed per-county permitting data
-- portfolio_uploads / portfolio_sites: For IPP screening tool

-- County Scores
CREATE TABLE county_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fips_code TEXT UNIQUE NOT NULL,
  state_fips TEXT NOT NULL,
  county_name TEXT NOT NULL,
  state_abbr TEXT NOT NULL,
  coop_density_score NUMERIC(5,4) DEFAULT 0,
  grid_reliability_score NUMERIC(5,4) DEFAULT 0,
  clipped_curtailed_score NUMERIC(5,4) DEFAULT 0,
  permitting_score NUMERIC(5,4) DEFAULT 0.5,
  labor_score NUMERIC(5,4) DEFAULT 0,
  fiber_score NUMERIC(5,4) DEFAULT 0,
  data_sources JSONB DEFAULT '{}',
  last_permitting_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_county_scores_fips ON county_scores(fips_code);
CREATE INDEX idx_county_scores_state ON county_scores(state_fips);

-- Hub Regions
CREATE TABLE hub_regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  geojson JSONB NOT NULL,
  color TEXT DEFAULT '#4de2e4',
  priority_rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Permitting Sentiment
CREATE TABLE permitting_sentiment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fips_code TEXT NOT NULL REFERENCES county_scores(fips_code) ON DELETE CASCADE,
  sentiment_label TEXT NOT NULL CHECK (sentiment_label IN ('favorable', 'neutral', 'hostile')),
  sentiment_score NUMERIC(5,4) DEFAULT 0.5,
  evidence JSONB DEFAULT '[]',
  moratoria_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fips_code)
);

CREATE INDEX idx_permitting_sentiment_fips ON permitting_sentiment(fips_code);

-- Portfolio Uploads
CREATE TABLE portfolio_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  site_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portfolio_uploads_user ON portfolio_uploads(user_id);

-- Portfolio Sites
CREATE TABLE portfolio_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID NOT NULL REFERENCES portfolio_uploads(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  latitude NUMERIC(10,7),
  longitude NUMERIC(11,7),
  county TEXT,
  state TEXT,
  fips_code TEXT,
  raw_data JSONB DEFAULT '{}',
  site_score NUMERIC(5,2),
  tier TEXT CHECK (tier IN ('good', 'okay', 'bad')),
  score_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portfolio_sites_upload ON portfolio_sites(upload_id);
CREATE INDEX idx_portfolio_sites_fips ON portfolio_sites(fips_code);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER county_scores_updated_at
  BEFORE UPDATE ON county_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER hub_regions_updated_at
  BEFORE UPDATE ON hub_regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER permitting_sentiment_updated_at
  BEFORE UPDATE ON permitting_sentiment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER portfolio_uploads_updated_at
  BEFORE UPDATE ON portfolio_uploads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER portfolio_sites_updated_at
  BEFORE UPDATE ON portfolio_sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE county_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permitting_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_sites ENABLE ROW LEVEL SECURITY;

-- county_scores: read-only for authenticated users
CREATE POLICY "county_scores_read" ON county_scores
  FOR SELECT TO authenticated USING (true);

-- hub_regions: read-only for authenticated users
CREATE POLICY "hub_regions_read" ON hub_regions
  FOR SELECT TO authenticated USING (true);

-- permitting_sentiment: read-only for authenticated users
CREATE POLICY "permitting_sentiment_read" ON permitting_sentiment
  FOR SELECT TO authenticated USING (true);

-- portfolio_uploads: user-scoped CRUD
CREATE POLICY "portfolio_uploads_select" ON portfolio_uploads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "portfolio_uploads_insert" ON portfolio_uploads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolio_uploads_update" ON portfolio_uploads
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "portfolio_uploads_delete" ON portfolio_uploads
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- portfolio_sites: user-scoped via upload ownership
CREATE POLICY "portfolio_sites_select" ON portfolio_sites
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM portfolio_uploads
    WHERE portfolio_uploads.id = portfolio_sites.upload_id
    AND portfolio_uploads.user_id = auth.uid()
  ));

CREATE POLICY "portfolio_sites_insert" ON portfolio_sites
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM portfolio_uploads
    WHERE portfolio_uploads.id = portfolio_sites.upload_id
    AND portfolio_uploads.user_id = auth.uid()
  ));

CREATE POLICY "portfolio_sites_update" ON portfolio_sites
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM portfolio_uploads
    WHERE portfolio_uploads.id = portfolio_sites.upload_id
    AND portfolio_uploads.user_id = auth.uid()
  ));

CREATE POLICY "portfolio_sites_delete" ON portfolio_sites
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM portfolio_uploads
    WHERE portfolio_uploads.id = portfolio_sites.upload_id
    AND portfolio_uploads.user_id = auth.uid()
  ));
