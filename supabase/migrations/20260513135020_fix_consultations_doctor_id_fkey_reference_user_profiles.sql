/*
  # Fix consultations.doctor_id foreign key

  1. Problem
    - consultations.doctor_id references medical_staff_extension.id
    - medical_staff_extension table is empty, so no consultation can be created
    - The application uses auth.uid() (which maps to user_profiles.id) as doctor_id

  2. Fix
    - Drop the FK constraint referencing medical_staff_extension
    - Add a new FK constraint referencing user_profiles.id
    - This allows any user with a profile to be assigned as a doctor

  3. Security
    - RLS policies still enforce role-based access for inserts/updates
*/

ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_doctor_id_fkey;

ALTER TABLE consultations
  ADD CONSTRAINT consultations_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES user_profiles(id) ON DELETE SET NULL;
