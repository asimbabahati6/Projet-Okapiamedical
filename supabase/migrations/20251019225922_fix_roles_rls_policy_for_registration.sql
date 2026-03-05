/*
  # Fix Roles Table RLS Policy for Registration

  ## Summary
  This migration updates the Row Level Security (RLS) policy on the roles table to allow
  anonymous (unauthenticated) users to read roles. This is necessary because users need to
  view available roles during the registration process before they are authenticated.

  ## Changes Made
  1. Drop the existing restrictive policy that only allows authenticated users to view roles
  2. Create a new policy that allows both anonymous and authenticated users to read roles
  
  ## Security Considerations
  - Only SELECT (read) operations are allowed
  - The roles table contains no sensitive information (only role names, descriptions, and levels)
  - This is a common and safe pattern for registration flows
  - No INSERT, UPDATE, or DELETE operations are permitted for non-admin users
  
  ## Impact
  - Anonymous users visiting the registration page will now be able to see available roles
  - Existing authenticated user access remains unchanged
  - Role management (INSERT, UPDATE, DELETE) remains restricted to admins only
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can view roles" ON roles;

-- Create new policy allowing both anonymous and authenticated users to view roles
CREATE POLICY "Anyone can view roles for registration"
  ON roles FOR SELECT
  TO anon, authenticated
  USING (true);