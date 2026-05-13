/*
  # Fix Chat Notifications Unique Constraint for NULL handling

  1. Changes
    - Drop existing unique constraint that doesn't handle NULLs properly
    - Add two partial unique indexes:
      - One for channel notifications (where channel_id IS NOT NULL)
      - One for conversation notifications (where conversation_id IS NOT NULL)
    - Update trigger function to use proper conflict targets

  2. Notes
    - PostgreSQL treats NULLs as distinct in unique constraints
    - Partial indexes properly enforce uniqueness per (user, channel) and (user, conversation)
*/

-- Drop the existing constraint that doesn't handle NULLs well
ALTER TABLE chat_notifications 
  DROP CONSTRAINT IF EXISTS chat_notifications_user_id_channel_id_conversation_id_key;

-- Create partial unique indexes that properly handle the two cases
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_notifications_user_channel 
  ON chat_notifications (user_id, channel_id) 
  WHERE channel_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_notifications_user_conversation 
  ON chat_notifications (user_id, conversation_id) 
  WHERE conversation_id IS NOT NULL;

-- Update the trigger function to use the correct conflict targets
CREATE OR REPLACE FUNCTION handle_new_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.channel_id IS NOT NULL THEN
    INSERT INTO chat_notifications (user_id, channel_id, unread_count, last_message_at)
    SELECT 
      cm.user_id,
      NEW.channel_id,
      1,
      NEW.created_at
    FROM chat_members cm
    WHERE cm.channel_id = NEW.channel_id
      AND cm.user_id != NEW.sender_id
    ON CONFLICT (user_id, channel_id) WHERE channel_id IS NOT NULL
    DO UPDATE SET 
      unread_count = chat_notifications.unread_count + 1,
      last_message_at = NEW.created_at,
      updated_at = now();

  ELSIF NEW.conversation_id IS NOT NULL THEN
    INSERT INTO chat_notifications (user_id, conversation_id, unread_count, last_message_at)
    SELECT 
      CASE 
        WHEN c.participant_1 = NEW.sender_id THEN c.participant_2
        ELSE c.participant_1
      END,
      NEW.conversation_id,
      1,
      NEW.created_at
    FROM chat_direct_conversations c
    WHERE c.id = NEW.conversation_id
    ON CONFLICT (user_id, conversation_id) WHERE conversation_id IS NOT NULL
    DO UPDATE SET 
      unread_count = chat_notifications.unread_count + 1,
      last_message_at = NEW.created_at,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;
