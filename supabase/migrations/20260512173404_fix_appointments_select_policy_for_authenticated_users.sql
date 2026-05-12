/*
  # Fix appointments SELECT policy

  1. Changes
    - Drop the existing "Staff can view appointments" policy which requires a user_profiles entry
    - Create a new policy that allows any authenticated user to view appointments
    - This fixes the issue where users could create appointments but not see them
    
  2. Security
    - SELECT is now allowed for any authenticated user (no anonymous access)
    - INSERT remains open (existing policy)
    - UPDATE remains restricted to staff roles
*/

DROP POLICY IF EXISTS "Staff can view appointments" ON appointments;

CREATE POLICY "Authenticated users can view appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (true);
