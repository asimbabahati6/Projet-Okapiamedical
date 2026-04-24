/*
  # Enable Realtime for Chat System + Typing Indicator

  1. Changes
    - Add `chat_messages` table to Supabase Realtime publication for live message delivery
    - Add `chat_user_status` table to Supabase Realtime publication for typing indicators
    - Add `typing_in_channel` column to `chat_user_status` to track which channel/conversation a user is typing in
    - Add `typing_in_conversation` column to `chat_user_status` for direct message typing detection

  2. Purpose
    - Enables real-time message delivery without polling
    - Supports typing indicator ("User is typing...") feature
    - Both channel messages and direct messages get instant delivery

  3. Security
    - No RLS changes needed, existing policies already protect chat_user_status
*/

-- Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Enable Realtime for chat_user_status
ALTER PUBLICATION supabase_realtime ADD TABLE chat_user_status;

-- Add typing indicator columns to chat_user_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_user_status' AND column_name = 'typing_in_channel'
  ) THEN
    ALTER TABLE chat_user_status ADD COLUMN typing_in_channel uuid REFERENCES chat_channels(id) ON DELETE SET NULL DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_user_status' AND column_name = 'typing_in_conversation'
  ) THEN
    ALTER TABLE chat_user_status ADD COLUMN typing_in_conversation uuid REFERENCES chat_direct_conversations(id) ON DELETE SET NULL DEFAULT NULL;
  END IF;
END $$;
