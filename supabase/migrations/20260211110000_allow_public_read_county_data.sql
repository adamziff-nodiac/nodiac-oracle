-- Allow unauthenticated (anon) users to read county scores, hub regions,
-- and permitting sentiment. This data is public reference data, not user-owned.

-- county_scores: add anon read
CREATE POLICY "county_scores_read_anon" ON county_scores
  FOR SELECT TO anon USING (true);

-- hub_regions: add anon read
CREATE POLICY "hub_regions_read_anon" ON hub_regions
  FOR SELECT TO anon USING (true);

-- permitting_sentiment: add anon read
CREATE POLICY "permitting_sentiment_read_anon" ON permitting_sentiment
  FOR SELECT TO anon USING (true);
