/*
  # Chat Notification Trigger System

  1. New Functions
    - `handle_new_chat_message()` - Trigger function that auto-increments unread_count
      for all relevant participants when a new message is inserted
    - `mark_chat_messages_read(p_user_id uuid, p_channel_id uuid, p_conversation_id uuid)` 
      - Resets unread_count to 0 when a user opens a channel/conversation

  2. New Triggers
    - `on_new_chat_message` - Fires AFTER INSERT on chat_messages

  3. Security
    - Function uses SECURITY DEFINER to bypass RLS for notification updates
    - mark_chat_messages_read validates that the caller is the user being modified

  4. Notes
    - For channel messages: notifies all members of the channel except the sender
    - For direct conversations: notifies the other participant
    - Uses UPSERT to create or increment notification records
*/

-- Function to handle new chat messages and create notifications
CREATE OR REPLACE FUNCTION handle_new_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.channel_id IS NOT NULL THEN
    -- Channel message: notify all channel members except sender
    INSERT INTO chat_notifications (user_id, channel_id, unread_count, last_message_at)
    SELECT 
      cm.user_id,
      NEW.channel_id,
      1,
      NEW.created_at
    FROM chat_members cm
    WHERE cm.channel_id = NEW.channel_id
      AND cm.user_id != NEW.sender_id
    ON CONFLICT (user_id, channel_id, conversation_id) 
    DO UPDATE SET 
      unread_count = chat_notifications.unread_count + 1,
      last_message_at = NEW.created_at,
      updated_at = now();

  ELSIF NEW.conversation_id IS NOT NULL THEN
    -- Direct message: notify the other participant
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
    ON CONFLICT (user_id, channel_id, conversation_id)
    DO UPDATE SET 
      unread_count = chat_notifications.unread_count + 1,
      last_message_at = NEW.created_at,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on chat_messages
DROP TRIGGER IF EXISTS on_new_chat_message ON chat_messages;
CREATE TRIGGER on_new_chat_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_chat_message();

-- Function to mark messages as read (reset unread count)
CREATE OR REPLACE FUNCTION mark_chat_messages_read(
  p_user_id uuid,
  p_channel_id uuid DEFAULT NULL,
  p_conversation_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate caller is the user
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized to mark messages for another user';
  END IF;

  IF p_channel_id IS NOT NULL THEN
    UPDATE chat_notifications
    SET unread_count = 0, updated_at = now()
    WHERE user_id = p_user_id AND channel_id = p_channel_id;
  ELSIF p_conversation_id IS NOT NULL THEN
    UPDATE chat_notifications
    SET unread_count = 0, updated_at = now()
    WHERE user_id = p_user_id AND conversation_id = p_conversation_id;
  END IF;
END;
$$;
