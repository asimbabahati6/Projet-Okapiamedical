/*
  # Create Doctor Junction Tables for N:N Relationships
  
  1. New Tables
    - `doctor_specialties` - Multiple specialties per doctor with priority
    - `doctor_certifications` - Certifications and continuing education
    - `doctor_languages` - Languages spoken with proficiency levels
    - `doctor_insurance_contracts` - Insurance contracts and conventions
    - `doctor_medical_acts` - Authorized medical acts
    - `doctor_hospitals` - Multiple practice locations
  
  2. Security
    - Enable RLS on all tables
    - Doctors can view their own data
    - Admins can manage all data
*/

-- Doctor Specialties (N:N relationship)
CREATE TABLE IF NOT EXISTS doctor_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  specialty_id uuid NOT NULL REFERENCES medical_specialties(id) ON DELETE CASCADE,
  is_primary_specialty boolean DEFAULT false,
  certification_date date,
  certification_number text,
  issuing_authority text,
  recertification_date date,
  competence_level text CHECK (competence_level IN ('expert', 'advanced', 'intermediate', 'basic')),
  years_practicing integer DEFAULT 0,
  case_count integer DEFAULT 0,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, specialty_id)
);

-- Doctor Certifications (N:N relationship)
CREATE TABLE IF NOT EXISTS doctor_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  certification_id uuid NOT NULL REFERENCES medical_certifications(id) ON DELETE CASCADE,
  obtained_date date NOT NULL,
  expiry_date date,
  certificate_number text,
  issuing_organization text,
  continuing_education_hours integer DEFAULT 0,
  renewal_status text CHECK (renewal_status IN ('current', 'expiring_soon', 'expired', 'renewed')),
  document_url text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, certification_id, obtained_date)
);

-- Doctor Languages (N:N relationship)
CREATE TABLE IF NOT EXISTS doctor_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  language_id uuid NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  proficiency_level text NOT NULL CHECK (proficiency_level IN ('native', 'fluent', 'advanced', 'intermediate', 'basic')),
  medical_terminology boolean DEFAULT false,
  certified_medical_interpreter boolean DEFAULT false,
  can_write_reports boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, language_id)
);

-- Doctor Insurance Contracts (N:N relationship)
CREATE TABLE IF NOT EXISTS doctor_insurance_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  insurance_provider_id uuid NOT NULL REFERENCES insurance_providers(id) ON DELETE CASCADE,
  contract_number text,
  contract_type text,
  sector text CHECK (sector IN ('sector_1', 'sector_2', 'sector_3')),
  tiers_payant_enabled boolean DEFAULT false,
  direct_billing_enabled boolean DEFAULT false,
  valid_from date DEFAULT CURRENT_DATE,
  valid_until date,
  reimbursement_rate numeric(5,2) DEFAULT 70.0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated', 'pending')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, insurance_provider_id, valid_from)
);

-- Doctor Medical Acts (N:N relationship)
CREATE TABLE IF NOT EXISTS doctor_medical_acts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  nomenclature_id uuid NOT NULL REFERENCES medical_nomenclatures(id) ON DELETE CASCADE,
  authorized_since date DEFAULT CURRENT_DATE,
  authorization_level text DEFAULT 'full' CHECK (authorization_level IN ('full', 'supervised', 'training', 'restricted')),
  performed_count integer DEFAULT 0,
  average_duration integer,
  custom_pricing numeric(10,2),
  success_rate numeric(5,2),
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, nomenclature_id)
);

-- Doctor Hospitals (multiple practice locations)
CREATE TABLE IF NOT EXISTS doctor_hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  hospital_name text NOT NULL,
  hospital_address text,
  hospital_city text,
  hospital_phone text,
  role text CHECK (role IN ('staff', 'visiting', 'consultant', 'head_of_department', 'resident')),
  department_name text,
  contract_type text CHECK (contract_type IN ('full_time', 'part_time', 'consultant', 'temporary')),
  schedule text,
  primary_location boolean DEFAULT false,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE doctor_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_insurance_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_medical_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_hospitals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctor_specialties
CREATE POLICY "Doctors can view their own specialties"
  ON doctor_specialties FOR SELECT
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

CREATE POLICY "Admins can manage doctor specialties"
  ON doctor_specialties FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for doctor_certifications
CREATE POLICY "Doctors can view their own certifications"
  ON doctor_certifications FOR SELECT
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

CREATE POLICY "Admins can manage doctor certifications"
  ON doctor_certifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for doctor_languages
CREATE POLICY "Anyone can view doctor languages"
  ON doctor_languages FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage doctor languages"
  ON doctor_languages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for doctor_insurance_contracts
CREATE POLICY "Doctors can view their own insurance contracts"
  ON doctor_insurance_contracts FOR SELECT
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

CREATE POLICY "Admins can manage doctor insurance contracts"
  ON doctor_insurance_contracts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for doctor_medical_acts
CREATE POLICY "Anyone can view authorized doctor acts"
  ON doctor_medical_acts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage doctor medical acts"
  ON doctor_medical_acts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for doctor_hospitals
CREATE POLICY "Anyone can view doctor hospitals"
  ON doctor_hospitals FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage doctor hospitals"
  ON doctor_hospitals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_specialties_doctor ON doctor_specialties(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_specialties_specialty ON doctor_specialties(specialty_id);
CREATE INDEX IF NOT EXISTS idx_doctor_specialties_primary ON doctor_specialties(doctor_id, is_primary_specialty) WHERE is_primary_specialty = true;
CREATE INDEX IF NOT EXISTS idx_doctor_certifications_doctor ON doctor_certifications(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_certifications_cert ON doctor_certifications(certification_id);
CREATE INDEX IF NOT EXISTS idx_doctor_certifications_expiry ON doctor_certifications(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_doctor_languages_doctor ON doctor_languages(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_languages_language ON doctor_languages(language_id);
CREATE INDEX IF NOT EXISTS idx_doctor_insurance_doctor ON doctor_insurance_contracts(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_insurance_provider ON doctor_insurance_contracts(insurance_provider_id);
CREATE INDEX IF NOT EXISTS idx_doctor_insurance_status ON doctor_insurance_contracts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_doctor_acts_doctor ON doctor_medical_acts(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_acts_nomenclature ON doctor_medical_acts(nomenclature_id);
CREATE INDEX IF NOT EXISTS idx_doctor_hospitals_doctor ON doctor_hospitals(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_hospitals_primary ON doctor_hospitals(doctor_id, primary_location) WHERE primary_location = true;
