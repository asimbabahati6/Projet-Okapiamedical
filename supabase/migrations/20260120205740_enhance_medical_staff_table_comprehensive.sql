/*
  # Enhance Medical Staff Table with Comprehensive Fields
  
  1. Changes to medical_staff table
    - Add staff_type for multi-type personnel management
    - Add professional credentials (RPPS, ADELI, medical order)
    - Add insurance information
    - Add practice mode and billing sector
    - Add GDPR and consent fields
    - Add availability and workload tracking
    - Add communication preferences
    - Add emergency contact and professional contacts
    - Add performance metrics
    - Add security fields
  
  2. Security
    - Maintain existing RLS policies
    - Add validation constraints
*/

-- Add staff_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_staff' AND column_name = 'staff_type'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN staff_type text DEFAULT 'medecin' CHECK (staff_type IN (
      'medecin', 'infirmier', 'sage_femme', 'kinesitherapeute', 
      'dentiste', 'pharmacien_clinique', 'anesthesiste', 'radiologue', 
      'autre'
    ));
  END IF;
END $$;

-- Professional credentials
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'rpps_number') THEN
    ALTER TABLE medical_staff ADD COLUMN rpps_number text UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'adeli_number') THEN
    ALTER TABLE medical_staff ADD COLUMN adeli_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'medical_order') THEN
    ALTER TABLE medical_staff ADD COLUMN medical_order text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'medical_order_number') THEN
    ALTER TABLE medical_staff ADD COLUMN medical_order_number text;
  END IF;
END $$;

-- Professional insurance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'professional_insurance_company') THEN
    ALTER TABLE medical_staff ADD COLUMN professional_insurance_company text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'professional_insurance_number') THEN
    ALTER TABLE medical_staff ADD COLUMN professional_insurance_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'professional_insurance_expiry') THEN
    ALTER TABLE medical_staff ADD COLUMN professional_insurance_expiry date;
  END IF;
END $$;

-- Practice mode and billing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'practice_mode') THEN
    ALTER TABLE medical_staff ADD COLUMN practice_mode text DEFAULT 'salarie' CHECK (practice_mode IN ('liberal', 'salarie', 'mixte', 'remplacant'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'billing_sector') THEN
    ALTER TABLE medical_staff ADD COLUMN billing_sector text DEFAULT 'sector_1' CHECK (billing_sector IN ('sector_1', 'sector_2', 'sector_3', 'non_conventionne'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'can_prescribe_controlled_substances') THEN
    ALTER TABLE medical_staff ADD COLUMN can_prescribe_controlled_substances boolean DEFAULT false;
  END IF;
END $$;

-- Digital signature
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'digital_signature_certificate') THEN
    ALTER TABLE medical_staff ADD COLUMN digital_signature_certificate text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'signature_valid_until') THEN
    ALTER TABLE medical_staff ADD COLUMN signature_valid_until date;
  END IF;
END $$;

-- GDPR and consent
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'gdpr_consent_date') THEN
    ALTER TABLE medical_staff ADD COLUMN gdpr_consent_date timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'gdpr_consent_version') THEN
    ALTER TABLE medical_staff ADD COLUMN gdpr_consent_version text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'data_sharing_consent') THEN
    ALTER TABLE medical_staff ADD COLUMN data_sharing_consent boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'can_be_recommended') THEN
    ALTER TABLE medical_staff ADD COLUMN can_be_recommended boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'profile_visibility') THEN
    ALTER TABLE medical_staff ADD COLUMN profile_visibility text DEFAULT 'public' CHECK (profile_visibility IN ('public', 'patients_only', 'staff_only', 'private'));
  END IF;
END $$;

-- Availability and workload
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'current_status') THEN
    ALTER TABLE medical_staff ADD COLUMN current_status text DEFAULT 'off_duty' CHECK (current_status IN ('available', 'busy', 'on_call', 'in_surgery', 'in_consultation', 'off_duty', 'on_leave'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'status_updated_at') THEN
    ALTER TABLE medical_staff ADD COLUMN status_updated_at timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'emergency_availability') THEN
    ALTER TABLE medical_staff ADD COLUMN emergency_availability boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'accepts_walk_ins') THEN
    ALTER TABLE medical_staff ADD COLUMN accepts_walk_ins boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'average_consultation_duration') THEN
    ALTER TABLE medical_staff ADD COLUMN average_consultation_duration integer DEFAULT 30;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'current_patient_load') THEN
    ALTER TABLE medical_staff ADD COLUMN current_patient_load integer DEFAULT 0;
  END IF;
END $$;

-- Communication preferences
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'professional_email') THEN
    ALTER TABLE medical_staff ADD COLUMN professional_email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'professional_phone') THEN
    ALTER TABLE medical_staff ADD COLUMN professional_phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'emergency_contact_number') THEN
    ALTER TABLE medical_staff ADD COLUMN emergency_contact_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'preferred_contact_method') THEN
    ALTER TABLE medical_staff ADD COLUMN preferred_contact_method text DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'app'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'languages_spoken') THEN
    ALTER TABLE medical_staff ADD COLUMN languages_spoken text[] DEFAULT ARRAY['fr'];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'sign_language_capable') THEN
    ALTER TABLE medical_staff ADD COLUMN sign_language_capable boolean DEFAULT false;
  END IF;
END $$;

-- Performance metrics
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'average_rating') THEN
    ALTER TABLE medical_staff ADD COLUMN average_rating numeric(3,2) DEFAULT 0 CHECK (average_rating BETWEEN 0 AND 5);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'total_ratings') THEN
    ALTER TABLE medical_staff ADD COLUMN total_ratings integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'total_consultations') THEN
    ALTER TABLE medical_staff ADD COLUMN total_consultations integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'total_patients') THEN
    ALTER TABLE medical_staff ADD COLUMN total_patients integer DEFAULT 0;
  END IF;
END $$;

-- Scheduling preferences
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'max_daily_appointments') THEN
    ALTER TABLE medical_staff ADD COLUMN max_daily_appointments integer DEFAULT 20 CHECK (max_daily_appointments BETWEEN 1 AND 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'buffer_time_minutes') THEN
    ALTER TABLE medical_staff ADD COLUMN buffer_time_minutes integer DEFAULT 10 CHECK (buffer_time_minutes BETWEEN 0 AND 120);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'telemedicine_enabled') THEN
    ALTER TABLE medical_staff ADD COLUMN telemedicine_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Add CHECK constraint on years_of_experience if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_staff' AND column_name = 'years_of_experience'
  ) THEN
    ALTER TABLE medical_staff DROP CONSTRAINT IF EXISTS check_years_of_experience;
    ALTER TABLE medical_staff ADD CONSTRAINT check_years_of_experience 
      CHECK (years_of_experience BETWEEN 0 AND 70);
  END IF;
END $$;

-- Add CHECK constraint on consultation_fee if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_staff' AND column_name = 'consultation_fee'
  ) THEN
    ALTER TABLE medical_staff DROP CONSTRAINT IF EXISTS check_consultation_fee;
    ALTER TABLE medical_staff ADD CONSTRAINT check_consultation_fee 
      CHECK (consultation_fee >= 0);
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_medical_staff_staff_type ON medical_staff(staff_type);
CREATE INDEX IF NOT EXISTS idx_medical_staff_rpps ON medical_staff(rpps_number) WHERE rpps_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medical_staff_billing_sector ON medical_staff(billing_sector);
CREATE INDEX IF NOT EXISTS idx_medical_staff_current_status ON medical_staff(current_status);
CREATE INDEX IF NOT EXISTS idx_medical_staff_emergency_availability ON medical_staff(emergency_availability) WHERE emergency_availability = true;
CREATE INDEX IF NOT EXISTS idx_medical_staff_practice_mode ON medical_staff(practice_mode);
CREATE INDEX IF NOT EXISTS idx_medical_staff_profile_visibility ON medical_staff(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_medical_staff_languages ON medical_staff USING GIN(languages_spoken);
CREATE INDEX IF NOT EXISTS idx_medical_staff_rating ON medical_staff(average_rating DESC, total_ratings DESC);
CREATE INDEX IF NOT EXISTS idx_medical_staff_accepting ON medical_staff(is_accepting_patients) WHERE is_accepting_patients = true;

-- Composite indexes for common searches
CREATE INDEX IF NOT EXISTS idx_medical_staff_search ON medical_staff(staff_type, is_accepting_patients, current_status) WHERE is_accepting_patients = true;
CREATE INDEX IF NOT EXISTS idx_medical_staff_telemedicine ON medical_staff(staff_type, telemedicine_enabled, is_accepting_patients) WHERE telemedicine_enabled = true;
CREATE INDEX IF NOT EXISTS idx_medical_staff_insurance_expiry ON medical_staff(id, professional_insurance_expiry) WHERE professional_insurance_expiry IS NOT NULL;
