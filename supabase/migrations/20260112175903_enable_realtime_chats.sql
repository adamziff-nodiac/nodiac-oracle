-- Enable Realtime for the chats table
-- This allows the ChatHistory component to receive live updates when chats are created/modified
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
