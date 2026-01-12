-- Context prompts table for Nodiac context (team info, thesis, etc.)
-- Supports both global prompts (visible to all users) and personal prompts (per user)
CREATE TABLE context_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_global BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Global prompts have no user_id, personal prompts require user_id
  CONSTRAINT valid_ownership CHECK (
    (is_global = TRUE AND user_id IS NULL) OR
    (is_global = FALSE AND user_id IS NOT NULL)
  )
);

-- Index for fetching user's personal prompts
CREATE INDEX idx_context_prompts_user_id ON context_prompts(user_id) WHERE user_id IS NOT NULL;

-- Index for fetching global prompts
CREATE INDEX idx_context_prompts_global ON context_prompts(is_global) WHERE is_global = TRUE;

-- Enable RLS
ALTER TABLE context_prompts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read global prompts
CREATE POLICY "Authenticated users can read global prompts" ON context_prompts
  FOR SELECT
  USING (is_global = TRUE AND auth.role() = 'authenticated');

-- Policy: Anyone authenticated can update global prompts
CREATE POLICY "Authenticated users can update global prompts" ON context_prompts
  FOR UPDATE
  USING (is_global = TRUE AND auth.role() = 'authenticated')
  WITH CHECK (is_global = TRUE);

-- Policy: Users can CRUD their own personal prompts
CREATE POLICY "Users can read own personal prompts" ON context_prompts
  FOR SELECT
  USING (is_global = FALSE AND auth.uid() = user_id);

CREATE POLICY "Users can insert own personal prompts" ON context_prompts
  FOR INSERT
  WITH CHECK (is_global = FALSE AND auth.uid() = user_id);

CREATE POLICY "Users can update own personal prompts" ON context_prompts
  FOR UPDATE
  USING (is_global = FALSE AND auth.uid() = user_id)
  WITH CHECK (is_global = FALSE AND auth.uid() = user_id);

CREATE POLICY "Users can delete own personal prompts" ON context_prompts
  FOR DELETE
  USING (is_global = FALSE AND auth.uid() = user_id);

-- Auto-update timestamps
CREATE TRIGGER update_context_prompts_updated_at
  BEFORE UPDATE ON context_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Realtime for context_prompts
ALTER PUBLICATION supabase_realtime ADD TABLE context_prompts;

-- Seed default global prompts
INSERT INTO context_prompts (name, content, is_global, position) VALUES
(
  'Team',
  E'Nodiac Team:\n\n- Robert Sher (Chief Executive Officer): Nodiac''s CEO, Robert Sher is a co-founder of Greenbacker Capital and a seasoned operator/consultant (founding principal of CEO to CEO) focused on helping organizations scale, and he leads Nodiac''s overall strategy and execution.\n\n- Marcus Marcuson (Global Business Development): Marcus Marcuson leads business development at Nodiac and brings a renewables/commercial background including senior roles at Greenbacker.\n\n- Ken Fricklas (Chief Technology Officer): Nodiac''s CTO, Ken Fricklas is an experienced technology leader (including prior work at Google Search per public speaker bio) with a background spanning AI/product leadership and engineering.\n\n- Pedro Henriques (VP, Corporate Development): Pedro Henriques leads corporate development at Nodiac and has a finance/deal background including corporate development at Greenbacker and M&A investment banking experience.\n\n- Adam Ziff (Product Engineer): Adam Ziff is a product engineer at Nodiac with public evidence of applied AI/software interest (e.g., presenting internally on local LLMs and building Princeton CS course projects).\n\n- Joshua Nemser-Sher (Engineering Associate): Joshua Nemser-Sher is an engineering associate at Nodiac with an academic background at the University of Wisconsin-Madison and a stated focus on work at the intersection of energy and AI.\n\n- Adam Stratton (VP of Development): Adam Stratton is Nodiac''s VP of Development; he comes from ACCIONA, where he has been described publicly as a Director of Solar Development leading utility-scale solar development work.\n\n- Eric Shannon (Head of Development): Eric Shannon is Nodiac''s Head of Development and comes from Stellera, where he has been publicly profiled as leading renewable development and previously managed utility-scale solar/wind/storage projects (including multi-GW portfolios) earlier in his career.\n\nWhat Nodiac has:\n- A partnership with Greenbacker Capital to build data centers on site at their solar/wind/BESS sites\n- 6 sites where 50MW+ is possible\n- 129 sites where 1-10MW is possible\n- A preliminary partnership with Armada to procure their Galleon and Leviathan modular data centers\n- Relationships across the IPP power and finance world to get access to more sites and funding',
  TRUE,
  0
),
(
  'Thesis',
  E'Nodiac Thesis:\n\n1. Small, distributed, grid-powered data centers are the future for consumer/enterprise inference (not RL inference). Big data centers are becoming untenable in most markets and inference compute demand is rising.\n\n2. IPP assets are great sites for data centers because they have permits already in place, grid infrastructure on site, low community pushback risk because they''re already developed, and excess renewable power (clipped/curtailed) to tap into.\n\n3. Instead of slow, dirty, and expensive backup power on-site, we can provide high uptime through a Regional SLA by building out additional sites. When power goes out at one site, power will be up at another site and the jobs can be moved.',
  TRUE,
  1
);
