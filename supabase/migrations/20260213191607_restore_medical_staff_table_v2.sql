/*
  # Restore medical_staff Table

  ## Overview
  This migration restores the medical_staff table that was inadvertently removed during 
  system consolidation. The table is required by multiple components across the application.

  ## Changes Made
  1. Recreate medical_staff table with all necessary columns
  2. Enable Row Level Security (RLS)
  3. Create appropriate access policies for authenticated users and admins
  4. Create performance indexes

  ## Tables Created
  - `medical_staff` - Core medical staff information table
    - id (uuid, FK to user_profiles)
    - license_number (text)
    - specialization (text)
    - qualifications (text[])
    - years_of_experience (integer)
    - consultation_fee (numeric)
    - bio (text)
    - is_accepting_patients (boolean)
    - staff_type (text)
    - staff_category (text)
    - telemedicine_enabled (boolean)
    - rpps_number (text, unique)
    - adeli_number (text)
    - can_prescribe_controlled_substances (boolean)
    - average_rating (numeric)
    - total_consultations (integer)
    - current_status (text)
    - created_at, updated_at (timestamptz)

  ## Security
  - RLS enabled on medical_staff
  - SELECT policy for all authenticated users
  - Full access policy for admins only
*/

-- =====================================================
-- STEP 1: Create medical_staff table
-- =====================================================

CREATE TABLE IF NOT EXISTS medical_staff (
  id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  license_number text,
  specialization text,
  qualifications text[] DEFAULT '{}',
  years_of_experience integer DEFAULT 0,
  consultation_fee numeric(10,2),
  bio text,
  is_accepting_patients boolean DEFAULT true,
  staff_type text DEFAULT 'medecin',
  staff_category text DEFAULT 'medical',
  telemedicine_enabled boolean DEFAULT false,
  rpps_number text UNIQUE,
  adeli_number text,
  can_prescribe_controlled_substances boolean DEFAULT false,
  average_rating numeric(3,2) DEFAULT 0,
  total_consultations integer DEFAULT 0,
  current_status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- STEP 2: Enable Row Level Security
-- =====================================================

ALTER TABLE medical_staff ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Create RLS Policies
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Medical staff viewable by authenticated users" ON medical_staff;
DROP POLICY IF EXISTS "Medical staff manageable by admins" ON medical_staff;
DROP POLICY IF EXISTS "Medical staff can update own record" ON medical_staff;

-- Policy: Allow all authenticated users to view medical staff
CREATE POLICY "Medical staff viewable by authenticated users"
  ON medical_staff FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow admins to manage medical staff records
CREATE POLICY "Medical staff manageable by admins"
  ON medical_staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Policy: Allow medical staff to update their own records
CREATE POLICY "Medical staff can update own record"
  ON medical_staff FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =====================================================
-- STEP 4: Create Performance Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_medical_staff_specialization 
  ON medical_staff(specialization);

CREATE INDEX IF NOT EXISTS idx_medical_staff_status 
  ON medical_staff(current_status);

CREATE INDEX IF NOT EXISTS idx_medical_staff_accepting_patients 
  ON medical_staff(is_accepting_patients) 
  WHERE is_accepting_patients = true;

CREATE INDEX IF NOT EXISTS idx_medical_staff_staff_type 
  ON medical_staff(staff_type);

-- =====================================================
-- STEP 5: Migrate Existing Data from medical_staff_extension
-- =====================================================

-- Migrate data from medical_staff_extension if it exists
INSERT INTO medical_staff (
  id, 
  license_number, 
  specialization, 
  qualifications,
  staff_type,
  years_of_experience,
  consultation_fee,
  bio,
  is_accepting_patients,
  telemedicine_enabled,
  rpps_number,
  adeli_number,
  can_prescribe_controlled_substances,
  average_rating,
  total_consultations,
  current_status,
  staff_category,
  created_at,
  updated_at
)
SELECT 
  mse.id,
  mse.license_number,
  mse.specialization,
  mse.qualifications,
  COALESCE(mse.staff_type, 'medecin'),
  COALESCE(mse.years_of_experience, 0),
  mse.consultation_fee,
  mse.bio,
  COALESCE(mse.is_accepting_patients, true),
  COALESCE(mse.telemedicine_enabled, false),
  mse.rpps_number,
  mse.adeli_number,
  COALESCE(mse.can_prescribe_controlled_substances, false),
  COALESCE(mse.average_rating, 0),
  COALESCE(mse.total_consultations, 0),
  COALESCE(mse.current_status, 'active'),
  COALESCE(mse.staff_category, 'medical'),
  mse.created_at,
  mse.updated_at
FROM medical_staff_extension mse
WHERE NOT EXISTS (
  SELECT 1 FROM medical_staff ms WHERE ms.id = mse.id
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 6: Create Update Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_medical_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS medical_staff_updated_at ON medical_staff;

CREATE TRIGGER medical_staff_updated_at
  BEFORE UPDATE ON medical_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_staff_updated_at();
