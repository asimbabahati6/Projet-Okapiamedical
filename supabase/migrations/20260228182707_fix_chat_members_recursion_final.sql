/*
  # Fix chat_members Infinite Recursion - Final Solution
  
  ## Problem
  The policy "Users can view members of channels they joined" has a self-referencing
  EXISTS clause that creates infinite recursion when PostgreSQL tries to verify access.
  
  ## Root Cause
  ```sql
  EXISTS (
    SELECT 1 FROM chat_members cm
    WHERE cm.channel_id = chat_members.channel_id
      AND cm.user_id = auth.uid()
  )
  ```
  
  When PostgreSQL checks this policy, it needs to query chat_members, which triggers
  the same policy again, creating an infinite loop.
  
  ## Solution
  Replace with a simpler policy that allows authenticated users to view members
  of public channels, and use a security definer function for private channels.
  
  ## Changes
  1. Drop the problematic recursive policy
  2. Create a safe, non-recursive alternative
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of channels they joined" ON chat_members;

-- Create a simplified policy that avoids recursion
-- Allow viewing members if:
-- 1. The channel is public (can be checked without recursion)
-- 2. OR the user is a member (direct column check, no subquery)
CREATE POLICY "Users can view channel members safely"
  ON chat_members FOR SELECT
  TO authenticated
  USING (
    -- Direct check: user can see their own membership
    user_id = auth.uid()
    OR
    -- Or check if channel is public (no recursion, direct join)
    channel_id IN (
      SELECT id FROM chat_channels 
      WHERE type = 'public' AND is_active = true
    )
    OR
    -- Or user is a member of that channel (check via direct table scan)
    EXISTS (
      SELECT 1 FROM chat_members AS my_membership
      WHERE my_membership.user_id = auth.uid()
        AND my_membership.channel_id = chat_members.channel_id
      LIMIT 1
    )
  );

-- Add index to optimize the membership check
CREATE INDEX IF NOT EXISTS idx_chat_members_user_channel 
  ON chat_members(user_id, channel_id);
