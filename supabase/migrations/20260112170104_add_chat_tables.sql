-- Chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  model_id TEXT NOT NULL,
  perspectives TEXT[] NOT NULL DEFAULT '{}',
  is_archived BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_user_updated ON chats(user_id, updated_at DESC);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  perspective TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sequence_num SERIAL
);

CREATE INDEX idx_messages_chat_sequence ON messages(chat_id, sequence_num);

-- RLS Policies
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chats" ON chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats" ON chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON chats
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in own chats" ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
  );

CREATE POLICY "Users can create messages in own chats" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
  );

CREATE POLICY "Users can delete messages in own chats" ON messages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
  );

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update chat's updated_at when a message is added
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats SET updated_at = NOW() WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_timestamp();
