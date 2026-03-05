/*
  # Allow Public Patient Registration for Test Data

  1. Changes
    - Add INSERT policy for patients table to allow public registration
    - This enables the public appointment booking system to create patient records
    - Maintains security by only allowing INSERTs, not reads or updates

  2. Security
    - Policy allows anyone to insert patient records (needed for public booking)
    - Existing SELECT policies remain restrictive (staff only)
    - This matches the requirement for public users to book appointments without authentication
*/

CREATE POLICY "Allow public patient registration"
  ON patients
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
