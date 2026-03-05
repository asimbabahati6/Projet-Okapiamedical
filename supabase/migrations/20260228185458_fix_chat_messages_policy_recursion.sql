/*
  # Fix chat_messages Policy - Prevent Recursion
  
  ## Problem
  The policy "Users can view messages in their channels" uses a subquery to chat_members
  which can cause recursion issues when viewing messages.
  
  ## Solution
  Use the security definer function is_channel_member() to safely check membership
  without triggering RLS recursion.
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view messages in their channels" ON chat_messages;

-- Create a new safe policy using the security definer function
CREATE POLICY "Users can view accessible messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    -- Can view messages in channels where they are members
    (
      channel_id IS NOT NULL 
      AND public.is_channel_member(channel_id, auth.uid())
    )
    OR
    -- Can view messages in their direct conversations
    (
      conversation_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM chat_direct_conversations
        WHERE id = conversation_id
          AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
      )
    )
  );
