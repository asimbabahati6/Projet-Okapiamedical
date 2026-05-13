/*
  # Fix consultations UPDATE policy - Allow admins and the assigned doctor

  1. Changes
    - Drop existing UPDATE policy that only allows the assigned doctor
    - Create new UPDATE policy that allows the assigned doctor OR admin roles to update consultations

  2. Security
    - UPDATE access granted to: the doctor assigned to the consultation (doctor_id = auth.uid())
      OR users with roles: super_admin, hospital_admin, medical_director, medecin_chef_staff
    - All users must be authenticated
*/

DROP POLICY IF EXISTS "Doctors can update own consultations" ON consultations;

CREATE POLICY "Authorized staff can update consultations"
  ON consultations
  FOR UPDATE
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'medical_director', 'medecin_chef_staff')
    )
  )
  WITH CHECK (
    doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'medical_director', 'medecin_chef_staff')
    )
  );
