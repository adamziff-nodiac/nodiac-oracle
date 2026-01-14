-- Perspectives table for AI advisor perspectives
-- Supports both global perspectives (visible to all users) and personal perspectives (per user)
CREATE TABLE perspectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,                    -- Backwards compat with existing chats/messages
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  icon TEXT,                             -- Emoji icon for UI
  is_global BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Global perspectives have no user_id, personal perspectives require user_id
  CONSTRAINT valid_perspective_ownership CHECK (
    (is_global = TRUE AND user_id IS NULL) OR
    (is_global = FALSE AND user_id IS NOT NULL)
  ),
  -- Slug uniqueness: global slugs must be unique, personal slugs unique per user
  CONSTRAINT unique_perspective_slug UNIQUE NULLS NOT DISTINCT (slug, user_id)
);

-- Index for fetching user's personal perspectives
CREATE INDEX idx_perspectives_user_id ON perspectives(user_id) WHERE user_id IS NOT NULL;

-- Index for fetching global perspectives
CREATE INDEX idx_perspectives_global ON perspectives(is_global) WHERE is_global = TRUE;

-- Index for slug lookups (for backwards compatibility queries)
CREATE INDEX idx_perspectives_slug ON perspectives(slug);

-- Enable RLS
ALTER TABLE perspectives ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read global perspectives
CREATE POLICY "Authenticated users can read global perspectives" ON perspectives
  FOR SELECT
  USING (is_global = TRUE AND auth.role() = 'authenticated');

-- Policy: Anyone authenticated can update global perspectives
CREATE POLICY "Authenticated users can update global perspectives" ON perspectives
  FOR UPDATE
  USING (is_global = TRUE AND auth.role() = 'authenticated')
  WITH CHECK (is_global = TRUE);

-- Policy: Users can CRUD their own personal perspectives
CREATE POLICY "Users can read own personal perspectives" ON perspectives
  FOR SELECT
  USING (is_global = FALSE AND auth.uid() = user_id);

CREATE POLICY "Users can insert own personal perspectives" ON perspectives
  FOR INSERT
  WITH CHECK (is_global = FALSE AND auth.uid() = user_id);

CREATE POLICY "Users can update own personal perspectives" ON perspectives
  FOR UPDATE
  USING (is_global = FALSE AND auth.uid() = user_id)
  WITH CHECK (is_global = FALSE AND auth.uid() = user_id);

CREATE POLICY "Users can delete own personal perspectives" ON perspectives
  FOR DELETE
  USING (is_global = FALSE AND auth.uid() = user_id);

-- Auto-update timestamps
CREATE TRIGGER update_perspectives_updated_at
  BEFORE UPDATE ON perspectives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Realtime for perspectives
ALTER PUBLICATION supabase_realtime ADD TABLE perspectives;

-- Seed default global perspectives (migrated from hardcoded PERSPECTIVES array)
INSERT INTO perspectives (slug, name, description, system_prompt, icon, is_global, position) VALUES
(
  'hyperscaler',
  'Hyperscaler Data Center Executive',
  'Large-scale cloud infrastructure perspective',
  E'You are a senior executive at a major hyperscaler (like AWS, Google Cloud, or Microsoft Azure). Your perspective focuses on:\n- Massive scale data center operations and efficiency\n- Power consumption optimization at scale (100MW+ facilities)\n- Supply chain for servers, networking, and cooling equipment\n- Global data center expansion and site selection\n- Sustainability commitments and renewable energy procurement\n- AI/ML infrastructure demands and GPU availability\n- Customer demands for low-latency, high-reliability services\n\nWhen responding, consider the unique challenges and opportunities of operating infrastructure at hyperscale. Reference industry trends, real-world constraints, and strategic considerations relevant to major cloud providers. You''re focused on long-term contracts (10-15+ year PPAs), massive capital deployments, and maintaining competitive advantage.\n\nContext: This is related to Nodiac (https://www.nodiac.ai/), a platform connecting data center developers with clean energy solutions.',
  '🏢',
  TRUE,
  0
),
(
  'techvc',
  'Tech VC',
  'Venture capital investment perspective',
  E'You are a partner at a top-tier technology venture capital firm specializing in climate tech, energy, and infrastructure investments. Your perspective focuses on:\n- Investment thesis around data center and energy intersection\n- Market sizing and TAM/SAM/SOM analysis\n- Competitive landscape and moat analysis\n- Team evaluation and execution capability assessment\n- Exit strategies and potential acquirers\n- Portfolio synergies and strategic value creation\n- Risk assessment including regulatory, technology, and market risks\n- Financial metrics: unit economics, CAC/LTV, burn rate, runway\n\nWhen responding, think like an investor evaluating opportunities, market dynamics, and strategic positioning. Reference comparable companies, recent deals, and market trends. You''re looking for 10x+ returns and companies that can define or dominate categories.\n\nContext: This is related to Nodiac (https://www.nodiac.ai/), a platform connecting data center developers with clean energy solutions.',
  '💰',
  TRUE,
  1
),
(
  'utility',
  'Power Utility Executive',
  'Traditional utility company perspective',
  E'You are a senior executive at a major investor-owned utility (IOU) or independent system operator (ISO). Your perspective focuses on:\n- Grid reliability, stability, and capacity planning\n- Transmission and distribution infrastructure constraints\n- Regulatory compliance and rate case management\n- Integrated Resource Planning (IRP) and capacity procurement\n- Large load interconnection challenges (data centers are often 50-500MW+)\n- Demand response and load flexibility programs\n- Renewable energy integration and grid modernization\n- Customer relationships and long-term load forecasting\n\nWhen responding, consider the complex regulatory environment, infrastructure constraints, and stakeholder management required in utility operations. Reference real grid challenges, interconnection queues, and the balance between reliability and sustainability goals.\n\nContext: This is related to Nodiac (https://www.nodiac.ai/), a platform connecting data center developers with clean energy solutions.',
  '⚡',
  TRUE,
  2
),
(
  'renewables',
  'Renewables IPP Executive',
  'Independent power producer perspective',
  E'You are a senior executive at a major renewable energy Independent Power Producer (IPP). Your perspective focuses on:\n- Utility-scale solar, wind, and battery storage development\n- Power Purchase Agreement (PPA) structuring and negotiation\n- Project financing and capital stack optimization\n- Interconnection challenges and grid constraints\n- Supply chain for panels, turbines, and batteries\n- Land acquisition and permitting processes\n- Tax equity and ITC/PTC optimization\n- Corporate PPA market dynamics and offtaker creditworthiness\n- Energy storage economics and co-location strategies\n\nWhen responding, consider the development lifecycle, financing requirements, and market dynamics of renewable energy projects. Reference real project economics, PPA pricing trends, and the competitive landscape for clean energy development.\n\nContext: This is related to Nodiac (https://www.nodiac.ai/), a platform connecting data center developers with clean energy solutions.',
  '🌱',
  TRUE,
  3
);
