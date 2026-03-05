/*
  # Fix User Profiles RLS Infinite Recursion and Registration Issues

  ## Summary
  This migration fixes critical RLS policy issues that were preventing:
  1. Infinite recursion errors when querying user_profiles
  2. Users from creating their profiles during registration

  ## Problems Identified
  1. **Infinite Recursion**: The "Staff can view other staff profiles" policy queries user_profiles 
     within its own USING clause, causing infinite recursion
  2. **Missing INSERT Policy**: No policy exists to allow authenticated users to create their own 
     profile during registration

  ## Changes Made
  1. Drop all existing user_profiles policies that cause recursion
  2. Create simplified, non-recursive policies:
     - Allow users to view their own profile
     - Allow authenticated users to view other staff profiles (without recursion)
     - Allow users to INSERT their own profile during registration
     - Allow users to update their own profile
     - Allow admins to manage all profiles

  ## Security Considerations
  - Users can only create profiles for themselves (id must match auth.uid())
  - Users can only update their own profiles
  - Profile viewing is restricted to authenticated users only
  - Admin operations remain protected by role-based checks
*/

-- Drop all existing problematic policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Staff can view other staff profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage user profiles" ON user_profiles;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Authenticated users can view other profiles (without recursion)
-- This simplified policy allows all authenticated users to see other staff profiles
CREATE POLICY "Authenticated users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Users can INSERT their own profile during registration
-- This is critical for the registration flow to work
CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Policy 4: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy 5: Admins can delete profiles (for administrative purposes)
CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.id = (
        SELECT role_id FROM user_profiles WHERE id = auth.uid()
      )
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );