/*
  # Fix consultations INSERT policy - Allow all medical and admin staff

  1. Changes
    - Drop existing restrictive INSERT policy that only allows 'doctor' role
    - Create new INSERT policy that allows doctors, admins, nurses, and other medical staff to create consultations

  2. Security
    - INSERT access granted to: super_admin, hospital_admin, doctor, medecin_chef_staff, nurse, medical_director, dentist, physical_therapist
    - All users must be authenticated
    - Policy checks role via user_profiles join with roles table
*/

DROP POLICY IF EXISTS "Doctors can create consultations" ON consultations;

CREATE POLICY "Medical staff can create consultations"
  ON consultations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN (
        'super_admin',
        'hospital_admin',
        'doctor',
        'medecin_chef_staff',
        'medical_director',
        'nurse',
        'dentist',
        'physical_therapist'
      )
    )
  );
