/*
  # Activate medical staff profiles for public booking

  1. Changes
    - Set is_active = true for all user_profiles that belong to medical_staff with is_accepting_patients = true
    - This ensures the anon RLS policy allows public users to see doctor names in the booking system

  2. Security
    - Only updates profiles that are already flagged as is_medical_staff = true
    - Required for the public booking flow to display available doctors
*/

UPDATE user_profiles
SET is_active = true
WHERE id IN (
  SELECT id FROM medical_staff WHERE is_accepting_patients = true
)
AND is_medical_staff = true
AND is_active = false;
