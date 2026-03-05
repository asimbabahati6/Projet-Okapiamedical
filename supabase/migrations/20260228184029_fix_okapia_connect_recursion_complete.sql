/*
  # Fix OKAPIA Connect - Complete Recursion Fix
  
  ## Critical Issues Identified
  1. chat_channels "Users can view channels they joined" causes recursion with chat_members
  2. chat_members still has recursion issues
  3. user_profiles_with_email view missing 'role' column
  
  ## Solution
  - Drop and recreate all problematic policies without circular references
  - Use direct checks and security definer functions where needed
  - Fix the user_profiles_with_email view
*/

-- ============================================
-- FIX 1: chat_channels policies (NO RECURSION)
-- ============================================

-- Drop the problematic policy that references chat_members
DROP POLICY IF EXISTS "Users can view channels they joined" ON chat_channels;

-- Create a new safe policy that doesn't cause recursion
-- Users can view channels if they are public OR they created them
CREATE POLICY "Users can view accessible channels"
  ON chat_channels FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND (
      type = 'public'  -- Public channels visible to all
      OR created_by = auth.uid()  -- Creator can always see their channel
    )
  );

-- ============================================
-- FIX 2: Create a security definer function for membership check
-- ============================================

-- This function runs with elevated privileges to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_channel_member(channel_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM chat_members 
    WHERE channel_id = channel_uuid 
      AND user_id = user_uuid
    LIMIT 1
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_channel_member(uuid, uuid) TO authenticated;

-- Add an additional policy for members using the security definer function
CREATE POLICY "Users can view channels where they are members"
  ON chat_channels FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND public.is_channel_member(id, auth.uid())
  );

-- ============================================
-- FIX 3: Fix user_profiles_with_email view
-- ============================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS user_profiles_with_email CASCADE;

-- Recreate with correct columns including role name
CREATE OR REPLACE VIEW user_profiles_with_email AS
SELECT 
  up.id,
  up.full_name,
  up.role_id,
  r.name as role,
  au.email
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
LEFT JOIN roles r ON up.role_id = r.id;

-- Grant access to authenticated users
GRANT SELECT ON user_profiles_with_email TO authenticated;

-- ============================================
-- FIX 4: Ensure chat_members has no recursion
-- ============================================

-- Drop any problematic policies
DROP POLICY IF EXISTS "Users can view members of channels they joined" ON chat_members;
DROP POLICY IF EXISTS "Users can view channel members safely" ON chat_members;

-- Create a simple, non-recursive policy
CREATE POLICY "Users can view channel members"
  ON chat_members FOR SELECT
  TO authenticated
  USING (
    -- Can see own membership
    user_id = auth.uid()
    OR
    -- Can see members if they are also a member (using security definer function)
    public.is_channel_member(channel_id, auth.uid())
  );

-- ============================================
-- FIX 5: Add index for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chat_members_lookup 
  ON chat_members(channel_id, user_id);
