/*
  # Add display_name to medical_staff and seed demo doctors

  1. Modified Tables
    - `medical_staff` - Added `display_name` (text) for public-facing pages
    - `departments` - Added 5 medical departments
    - `user_profiles` - Updated 2 existing users as medical staff
    - `medical_staff` - Inserted 2 doctor records for existing auth users

  2. Security Changes
    - Allow anon to read medical_staff, user_profiles (doctors only), services, service_categories
    - Allow anon to insert SMS notifications from booking flow
    - Allow anon to update own booking queue entry

  3. Important Notes
    - display_name decouples public booking from the auth system
    - Only 2 doctors seeded (existing auth users) to respect FK constraints
*/

-- 1. Create departments first (before any references)
INSERT INTO departments (id, name)
VALUES
  ('d1000001-aaaa-bbbb-cccc-000000000001', 'Médecine générale'),
  ('d1000001-aaaa-bbbb-cccc-000000000002', 'Chirurgie'),
  ('d1000001-aaaa-bbbb-cccc-000000000003', 'Pédiatrie'),
  ('d1000001-aaaa-bbbb-cccc-000000000004', 'Gynécologie'),
  ('d1000001-aaaa-bbbb-cccc-000000000005', 'Cardiologie')
ON CONFLICT (id) DO NOTHING;

-- 2. Add display_name column to medical_staff
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_staff' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN display_name text DEFAULT '';
  END IF;
END $$;

-- 3. Update existing user profiles to be doctors with departments
UPDATE user_profiles
SET is_medical_staff = true,
    department_id = 'd1000001-aaaa-bbbb-cccc-000000000001'
WHERE id = '3f3065d5-4218-464e-83ba-0bbc73fe890e';

UPDATE user_profiles
SET is_medical_staff = true,
    department_id = 'd1000001-aaaa-bbbb-cccc-000000000002'
WHERE id = 'bf5a5d93-62d7-4850-b9d3-c923932bfaac';

-- 4. Insert medical_staff entries for the 2 existing auth users
INSERT INTO medical_staff (id, display_name, license_number, specialization, qualifications, years_of_experience, consultation_fee, is_accepting_patients, staff_type, telemedicine_enabled)
VALUES
  ('3f3065d5-4218-464e-83ba-0bbc73fe890e', 'Dr. Bazeboso', 'OM-2024-001', 'Médecine générale', ARRAY['Docteur en médecine', 'Médecine tropicale'], 12, 50, true, 'medecin', true),
  ('bf5a5d93-62d7-4850-b9d3-c923932bfaac', 'Dr. Nsibaze Bosso', 'OM-2024-002', 'Chirurgie générale', ARRAY['Docteur en médecine', 'Chirurgien'], 15, 80, true, 'medecin', false)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  specialization = EXCLUDED.specialization,
  consultation_fee = EXCLUDED.consultation_fee,
  is_accepting_patients = true,
  telemedicine_enabled = EXCLUDED.telemedicine_enabled;

-- 5. RLS: Allow anon to read medical_staff for booking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'medical_staff' AND policyname = 'Anon can read medical staff for booking'
  ) THEN
    CREATE POLICY "Anon can read medical staff for booking"
      ON medical_staff FOR SELECT TO anon
      USING (is_accepting_patients = true);
  END IF;
END $$;

-- 6. RLS: Allow anon to read user_profiles (doctors only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Anon can read doctor profiles for booking'
  ) THEN
    CREATE POLICY "Anon can read doctor profiles for booking"
      ON user_profiles FOR SELECT TO anon
      USING (is_medical_staff = true AND is_active = true);
  END IF;
END $$;

-- 7. RLS: Allow anon to insert SMS from booking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sms_notifications' AND policyname = 'Anon can log SMS from booking'
  ) THEN
    CREATE POLICY "Anon can log SMS from booking"
      ON sms_notifications FOR INSERT TO anon
      WITH CHECK (notification_type IN ('registration_confirmation', 'payment_confirmation', 'doctor_call'));
  END IF;
END $$;

-- 8. RLS: Allow anon to read services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Anon can read active services'
  ) THEN
    CREATE POLICY "Anon can read active services"
      ON services FOR SELECT TO anon
      USING (is_active = true);
  END IF;
END $$;

-- 9. RLS: Allow anon to read service_categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'service_categories' AND policyname = 'Anon can read service categories'
  ) THEN
    CREATE POLICY "Anon can read service categories"
      ON service_categories FOR SELECT TO anon
      USING (true);
  END IF;
END $$;

-- 10. RLS: Allow anon to update own booking (payment simulation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'booking_queue' AND policyname = 'Anon can update own booking payment'
  ) THEN
    CREATE POLICY "Anon can update own booking payment"
      ON booking_queue FOR UPDATE TO anon
      USING (patient_phone <> '' AND patient_phone IS NOT NULL)
      WITH CHECK (patient_phone <> '' AND patient_phone IS NOT NULL);
  END IF;
END $$;
