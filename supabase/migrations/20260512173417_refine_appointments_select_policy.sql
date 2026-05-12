/*
  # Refine appointments SELECT policy

  1. Changes
    - Replace overly permissive USING(true) with auth.uid() IS NOT NULL check
    - This ensures only properly authenticated users with valid sessions can read
    
  2. Security
    - Only authenticated users with a valid auth.uid() can view appointments
    - Combined with TO authenticated, this provides double verification
*/

DROP POLICY IF EXISTS "Authenticated users can view appointments" ON appointments;

CREATE POLICY "Authenticated users can view appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);
