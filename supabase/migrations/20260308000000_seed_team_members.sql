-- Seed team members with correct emails
-- Auto-link: a trigger will automatically set user_id when a matching email signs in

-- Insert team members (skip if already exists by email)
INSERT INTO team_members (display_name, email) VALUES
  ('Robert Sher', 'robert.sher@nodiac.ai'),
  ('Marcus Marcuson', 'marcus.marcuson@nodiac.ai'),
  ('Ken Fricklas', 'ken.fricklas@nodiac.ai'),
  ('Adam Stratton', 'adam.stratton@nodiac.ai'),
  ('Pedro Henriques', 'pedro.henriques@nodiac.ai'),
  ('Evan Koebel', 'evan.koebel@nodiac.ai'),
  ('Eric Shannon', 'eric.shannon@nodiac.ai'),
  ('Sara Stark', 'sara.stark@nodiac.ai'),
  ('Adam Ziff', 'adam.ziff@nodiac.ai'),
  ('Joshua Nemser-Sher', 'joshua.nemser-sher@nodiac.ai'),
  ('Josh Dibble', 'creative@nodiac.ai')
ON CONFLICT DO NOTHING;

-- Auto-link trigger: when a user signs in with a matching email,
-- automatically set their user_id on the team_members row
CREATE OR REPLACE FUNCTION auto_link_team_member()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new auth user is created, check if their email matches a team member
  UPDATE team_members
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert (new sign-up / first login)
DROP TRIGGER IF EXISTS auto_link_team_member_on_signup ON auth.users;
CREATE TRIGGER auto_link_team_member_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_team_member();

-- Also handle existing users who already have accounts but aren't linked yet
-- This runs once on migration to link any existing auth users to team members
UPDATE team_members tm
SET user_id = au.id
FROM auth.users au
WHERE au.email = tm.email
  AND tm.user_id IS NULL;

-- Enable realtime for action items table so the UI can subscribe to changes
ALTER PUBLICATION supabase_realtime ADD TABLE tracker_action_items;
