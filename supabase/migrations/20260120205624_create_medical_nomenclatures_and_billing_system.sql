/*
  # Create Medical Nomenclatures and Act Billing System
  
  1. New Tables
    - `medical_nomenclatures`
      - Central repository of medical nomenclatures (CCAM, NGAP, LPP)
      - Codes, descriptions, base prices in USD
    
    - `doctor_act_pricing`
      - Custom pricing per doctor (dépassements d'honoraires)
      - Sector management (sector 1, 2, 3)
    
    - `consultation_acts`
      - Medical acts performed during consultations
      - Detailed billing with modifiers
    
    - `act_modifiers`
      - Pricing modifiers (night, weekend, emergency)
      - Multiplicative coefficients
    
    - `insurance_reimbursement_rules`
      - Reimbursement rules per insurance and act
      - Prior authorization requirements
  
  2. Security
    - Enable RLS on all tables
    - Doctors can view their own pricing
    - Only admins and billing staff can modify
*/

-- Medical Nomenclatures Table (CCAM, NGAP, LPP)
CREATE TABLE IF NOT EXISTS medical_nomenclatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomenclature_type text NOT NULL CHECK (nomenclature_type IN ('CCAM', 'NGAP', 'LPP', 'OTHER')),
  code text NOT NULL,
  description_fr text NOT NULL,
  description_en text,
  base_price_usd numeric(10,2) NOT NULL DEFAULT 0,
  coefficient numeric(5,2) DEFAULT 1.0,
  category text,
  sub_category text,
  valid_from date DEFAULT CURRENT_DATE,
  valid_until date,
  is_active boolean DEFAULT true,
  requires_specialist boolean DEFAULT false,
  requires_authorization boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(nomenclature_type, code)
);

-- Doctor Act Pricing (custom pricing per doctor)
CREATE TABLE IF NOT EXISTS doctor_act_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  nomenclature_id uuid NOT NULL REFERENCES medical_nomenclatures(id) ON DELETE CASCADE,
  custom_price numeric(10,2) NOT NULL,
  sector text NOT NULL CHECK (sector IN ('sector_1', 'sector_2', 'sector_3', 'non_conventionne')),
  price_justification text,
  effective_from date DEFAULT CURRENT_DATE,
  effective_until date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, nomenclature_id, effective_from)
);

-- Consultation Acts (acts performed during consultations)
CREATE TABLE IF NOT EXISTS consultation_acts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid REFERENCES consultations(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES medical_staff(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  nomenclature_id uuid NOT NULL REFERENCES medical_nomenclatures(id),
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  modifiers text[],
  technical_coefficient numeric(5,2) DEFAULT 1.0,
  performed_at timestamptz DEFAULT now(),
  billed_to text NOT NULL CHECK (billed_to IN ('patient', 'insurance', 'both')),
  reimbursement_rate numeric(5,2) DEFAULT 0,
  patient_share numeric(10,2) DEFAULT 0,
  insurance_share numeric(10,2) DEFAULT 0,
  is_billed boolean DEFAULT false,
  invoice_id uuid REFERENCES invoices(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Act Modifiers (night, weekend, emergency surcharges)
CREATE TABLE IF NOT EXISTS act_modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text NOT NULL,
  multiplier numeric(5,2) NOT NULL DEFAULT 1.0,
  applies_to_nomenclatures text[],
  conditions text,
  valid_from date DEFAULT CURRENT_DATE,
  valid_until date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insurance Reimbursement Rules
CREATE TABLE IF NOT EXISTS insurance_reimbursement_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_provider_id uuid NOT NULL REFERENCES insurance_providers(id) ON DELETE CASCADE,
  nomenclature_id uuid NOT NULL REFERENCES medical_nomenclatures(id) ON DELETE CASCADE,
  reimbursement_percentage numeric(5,2) NOT NULL DEFAULT 70.0 CHECK (reimbursement_percentage BETWEEN 0 AND 100),
  max_reimbursement_amount numeric(10,2),
  requires_prior_authorization boolean DEFAULT false,
  authorization_delay_days integer DEFAULT 0,
  restrictions text,
  valid_from date DEFAULT CURRENT_DATE,
  valid_until date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(insurance_provider_id, nomenclature_id, valid_from)
);

-- Enable RLS
ALTER TABLE medical_nomenclatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_act_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE act_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_reimbursement_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_nomenclatures
CREATE POLICY "Anyone can read active nomenclatures"
  ON medical_nomenclatures FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage nomenclatures"
  ON medical_nomenclatures FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for doctor_act_pricing
CREATE POLICY "Doctors can view their own pricing"
  ON doctor_act_pricing FOR SELECT
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

CREATE POLICY "Only admins can manage doctor pricing"
  ON doctor_act_pricing FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for consultation_acts
CREATE POLICY "Staff can view consultation acts"
  ON consultation_acts FOR SELECT
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR patient_id IN (SELECT id FROM patients WHERE patients.id = patient_id)
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

CREATE POLICY "Doctors can create consultation acts"
  ON consultation_acts FOR INSERT
  TO authenticated
  WITH CHECK (
    doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

CREATE POLICY "Authorized staff can update consultation acts"
  ON consultation_acts FOR UPDATE
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

-- RLS Policies for act_modifiers
CREATE POLICY "Anyone can read active modifiers"
  ON act_modifiers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage modifiers"
  ON act_modifiers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for insurance_reimbursement_rules
CREATE POLICY "Anyone can read active reimbursement rules"
  ON insurance_reimbursement_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage reimbursement rules"
  ON insurance_reimbursement_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Insert sample medical nomenclatures (CCAM/NGAP codes)
INSERT INTO medical_nomenclatures (nomenclature_type, code, description_fr, description_en, base_price_usd, category) VALUES
  ('NGAP', 'C', 'Consultation au cabinet', 'Office consultation', 25.00, 'Consultation'),
  ('NGAP', 'V', 'Visite au domicile', 'Home visit', 35.00, 'Consultation'),
  ('NGAP', 'CS', 'Consultation de spécialiste', 'Specialist consultation', 50.00, 'Consultation'),
  ('CCAM', 'YYYY001', 'Examen clinique complet', 'Complete clinical examination', 30.00, 'Examen'),
  ('CCAM', 'YYYY002', 'Électrocardiogramme', 'Electrocardiogram', 40.00, 'Examen Technique'),
  ('CCAM', 'YYYY003', 'Échographie abdominale', 'Abdominal ultrasound', 75.00, 'Imagerie'),
  ('CCAM', 'YYYY004', 'Radio thoracique', 'Chest X-ray', 45.00, 'Imagerie'),
  ('CCAM', 'YYYY005', 'Prise de sang', 'Blood draw', 15.00, 'Prélèvement'),
  ('CCAM', 'YYYY006', 'Suture simple', 'Simple suture', 35.00, 'Chirurgie Mineure'),
  ('CCAM', 'YYYY007', 'Pansement complexe', 'Complex dressing', 25.00, 'Soins')
ON CONFLICT (nomenclature_type, code) DO NOTHING;

-- Insert sample act modifiers
INSERT INTO act_modifiers (code, description, multiplier) VALUES
  ('NIGHT', 'Majoration nuit (20h-8h)', 1.50),
  ('SUNDAY', 'Majoration dimanche et jours fériés', 2.00),
  ('EMERGENCY', 'Majoration urgence', 1.75),
  ('HOME', 'Majoration déplacement domicile', 1.25),
  ('PEDIATRIC', 'Majoration pédiatrie', 1.20)
ON CONFLICT (code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_nomenclatures_type_code ON medical_nomenclatures(nomenclature_type, code);
CREATE INDEX IF NOT EXISTS idx_nomenclatures_category ON medical_nomenclatures(category);
CREATE INDEX IF NOT EXISTS idx_nomenclatures_active ON medical_nomenclatures(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_doctor_pricing_doctor ON doctor_act_pricing(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_pricing_nomenclature ON doctor_act_pricing(nomenclature_id);
CREATE INDEX IF NOT EXISTS idx_consultation_acts_consultation ON consultation_acts(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_acts_doctor ON consultation_acts(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_acts_patient ON consultation_acts(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_acts_nomenclature ON consultation_acts(nomenclature_id);
CREATE INDEX IF NOT EXISTS idx_consultation_acts_billed ON consultation_acts(is_billed);
CREATE INDEX IF NOT EXISTS idx_act_modifiers_code ON act_modifiers(code);
CREATE INDEX IF NOT EXISTS idx_reimbursement_insurance ON insurance_reimbursement_rules(insurance_provider_id);
CREATE INDEX IF NOT EXISTS idx_reimbursement_nomenclature ON insurance_reimbursement_rules(nomenclature_id);
