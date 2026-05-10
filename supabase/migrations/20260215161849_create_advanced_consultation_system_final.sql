/*
  # Advanced Consultation System with ICD-10 and Templates

  1. Consultation Enhancements
    - Add `consultation_number` with auto-increment (format: CONS-YYYYMMDD-XXXX)
    - Add `consultation_status` (draft, in_progress, completed, reviewed, archived)
    - Add `consultation_type` (initial, follow_up, emergency, routine, telemedicine)
    - Add `attachments` JSONB field for medical documents
    - Add `template_used_id` to track which template was used
    - Add `bmi` calculated field
    - Add `duration_minutes` field

  2. Diagnoses Table
    - Create new table for multiple diagnoses per consultation
    - Support ICD-10 codes and free text diagnoses
    - Track primary diagnosis and ordering
    - Link to consultations

  3. ICD-10 Codes Reference Table
    - Create comprehensive ICD-10 codes database
    - Include French and English descriptions
    - Organize by category and subcategory
    - Enable fast autocomplete search

  4. Consultation Templates Table
    - Create specialty-based templates
    - Support system-wide and personal templates
    - Include all template fields (chief complaint, vitals, examination, treatment)
    - Track template usage and versions

  5. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users based on roles
    - Implement audit logging
    - Add consultation locking mechanism

  6. Functions and Triggers
    - Auto-generate consultation numbers
    - Calculate BMI automatically
    - Trigger for diagnosis audit logs
    - Function to get consultation with all diagnoses
*/

-- Add new columns to consultations table
ALTER TABLE consultations
ADD COLUMN IF NOT EXISTS consultation_number text UNIQUE,
ADD COLUMN IF NOT EXISTS consultation_status text DEFAULT 'draft' CHECK (consultation_status IN ('draft', 'in_progress', 'completed', 'reviewed', 'archived')),
ADD COLUMN IF NOT EXISTS consultation_type text DEFAULT 'routine' CHECK (consultation_type IN ('initial', 'follow_up', 'emergency', 'routine', 'telemedicine')),
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS template_used_id uuid,
ADD COLUMN IF NOT EXISTS bmi numeric(4,1),
ADD COLUMN IF NOT EXISTS duration_minutes integer,
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS locked_at timestamptz;

-- Create ICD-10 codes reference table
CREATE TABLE IF NOT EXISTS icd10_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description_fr text NOT NULL,
  description_en text,
  category text NOT NULL,
  subcategory text,
  is_active boolean DEFAULT true,
  search_vector tsvector,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for fast ICD-10 search
CREATE INDEX IF NOT EXISTS idx_icd10_codes_code ON icd10_codes(code);
CREATE INDEX IF NOT EXISTS idx_icd10_codes_category ON icd10_codes(category);
CREATE INDEX IF NOT EXISTS idx_icd10_codes_search ON icd10_codes USING gin(search_vector);

-- Create trigger to update search vector for ICD-10 codes
CREATE OR REPLACE FUNCTION update_icd10_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', COALESCE(NEW.code, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.description_fr, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(NEW.description_en, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_icd10_search_vector ON icd10_codes;
CREATE TRIGGER trigger_update_icd10_search_vector
  BEFORE INSERT OR UPDATE ON icd10_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_icd10_search_vector();

-- Create diagnoses table for multiple diagnoses per consultation
CREATE TABLE IF NOT EXISTS consultation_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  icd10_code_id uuid REFERENCES icd10_codes(id),
  icd10_code text,
  icd10_description text,
  free_text_diagnosis text,
  is_primary boolean DEFAULT false,
  diagnosis_order integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create indexes for diagnoses
CREATE INDEX IF NOT EXISTS idx_consultation_diagnoses_consultation_id ON consultation_diagnoses(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_diagnoses_icd10_code ON consultation_diagnoses(icd10_code);
CREATE INDEX IF NOT EXISTS idx_consultation_diagnoses_primary ON consultation_diagnoses(consultation_id, is_primary);

-- Create consultation templates table
CREATE TABLE IF NOT EXISTS consultation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL,
  description text,
  is_system_template boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),

  -- Template content
  chief_complaint_template text,
  history_template text,
  examination_template text,
  treatment_template text,
  notes_template text,

  -- Default vital signs
  vital_signs_defaults jsonb DEFAULT '{}'::jsonb,

  -- Suggested diagnoses
  suggested_diagnoses jsonb DEFAULT '[]'::jsonb,

  -- Usage tracking
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,

  -- Sharing
  is_shared boolean DEFAULT false,
  shared_with_department uuid REFERENCES departments(id),

  -- Version control
  version integer DEFAULT 1,
  parent_template_id uuid REFERENCES consultation_templates(id),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for templates
CREATE INDEX IF NOT EXISTS idx_consultation_templates_specialty ON consultation_templates(specialty);
CREATE INDEX IF NOT EXISTS idx_consultation_templates_created_by ON consultation_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_consultation_templates_shared ON consultation_templates(is_shared, shared_with_department);

-- Add foreign key for template_used_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_consultations_template'
    AND table_name = 'consultations'
  ) THEN
    ALTER TABLE consultations
    ADD CONSTRAINT fk_consultations_template
    FOREIGN KEY (template_used_id) REFERENCES consultation_templates(id);
  END IF;
END $$;

-- Create sequence for consultation numbers
CREATE SEQUENCE IF NOT EXISTS consultation_number_seq START WITH 1;

-- Function to generate consultation number
CREATE OR REPLACE FUNCTION generate_consultation_number()
RETURNS text AS $$
DECLARE
  date_part text;
  seq_part text;
  new_number text;
BEGIN
  date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  seq_part := LPAD(nextval('consultation_number_seq')::text, 4, '0');
  new_number := 'CONS-' || date_part || '-' || seq_part;

  -- Reset sequence daily
  IF NOT EXISTS (
    SELECT 1 FROM consultations
    WHERE consultation_number LIKE 'CONS-' || date_part || '%'
  ) THEN
    ALTER SEQUENCE consultation_number_seq RESTART WITH 1;
    seq_part := LPAD(nextval('consultation_number_seq')::text, 4, '0');
    new_number := 'CONS-' || date_part || '-' || seq_part;
  END IF;

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate consultation number
CREATE OR REPLACE FUNCTION set_consultation_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consultation_number IS NULL THEN
    NEW.consultation_number := generate_consultation_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_consultation_number ON consultations;
CREATE TRIGGER trigger_set_consultation_number
  BEFORE INSERT ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION set_consultation_number();

-- Function to calculate BMI
CREATE OR REPLACE FUNCTION calculate_consultation_bmi()
RETURNS TRIGGER AS $$
DECLARE
  weight_kg numeric;
  height_m numeric;
BEGIN
  -- Extract weight and height from vital_signs JSONB
  IF NEW.vital_signs IS NOT NULL THEN
    weight_kg := (NEW.vital_signs->>'weight')::numeric;
    height_m := (NEW.vital_signs->>'height')::numeric / 100.0; -- Convert cm to m

    IF weight_kg IS NOT NULL AND height_m IS NOT NULL AND height_m > 0 THEN
      NEW.bmi := ROUND(weight_kg / (height_m * height_m), 1);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_bmi ON consultations;
CREATE TRIGGER trigger_calculate_bmi
  BEFORE INSERT OR UPDATE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_consultation_bmi();

-- Create consultation audit log table
CREATE TABLE IF NOT EXISTS consultation_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'status_changed', 'viewed', 'shared', 'locked', 'unlocked', 'deleted')),
  changed_fields jsonb,
  old_values jsonb,
  new_values jsonb,
  performed_by uuid REFERENCES auth.users(id),
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create index for audit log
CREATE INDEX IF NOT EXISTS idx_consultation_audit_log_consultation_id ON consultation_audit_log(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_audit_log_created_at ON consultation_audit_log(created_at DESC);

-- Function to log consultation changes
CREATE OR REPLACE FUNCTION log_consultation_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO consultation_audit_log (consultation_id, action, new_values, performed_by)
    VALUES (NEW.id, 'created', to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO consultation_audit_log (consultation_id, action, old_values, new_values, performed_by)
    VALUES (NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO consultation_audit_log (consultation_id, action, old_values, performed_by)
    VALUES (OLD.id, 'deleted', to_jsonb(OLD), auth.uid());
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_consultation_change ON consultations;
CREATE TRIGGER trigger_log_consultation_change
  AFTER INSERT OR UPDATE OR DELETE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION log_consultation_change();

-- Function to get consultation with diagnoses
CREATE OR REPLACE FUNCTION get_consultation_with_diagnoses(consultation_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'consultation', to_jsonb(c.*),
    'diagnoses', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(cd.*) ORDER BY cd.is_primary DESC, cd.diagnosis_order)
        FROM consultation_diagnoses cd
        WHERE cd.consultation_id = c.id
      ),
      '[]'::jsonb
    ),
    'patient', to_jsonb(p.*),
    'doctor', to_jsonb(ms.*)
  )
  INTO result
  FROM consultations c
  LEFT JOIN patients p ON c.patient_id = p.id
  LEFT JOIN medical_staff ms ON c.doctor_id = ms.id
  WHERE c.id = consultation_uuid;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on new tables
ALTER TABLE icd10_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for icd10_codes (read-only for authenticated users)
CREATE POLICY "Authenticated users can view ICD-10 codes"
  ON icd10_codes FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for consultation_diagnoses
CREATE POLICY "Users can view consultation diagnoses"
  ON consultation_diagnoses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consultations c
      WHERE c.id = consultation_diagnoses.consultation_id
      AND (
        c.doctor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN roles r ON r.id = up.role_id
          WHERE up.id = auth.uid()
          AND r.name IN ('admin', 'receptionist', 'nurse', 'doctor')
        )
      )
    )
  );

CREATE POLICY "Doctors can insert consultation diagnoses"
  ON consultation_diagnoses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultations c
      WHERE c.id = consultation_diagnoses.consultation_id
      AND c.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update their consultation diagnoses"
  ON consultation_diagnoses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consultations c
      WHERE c.id = consultation_diagnoses.consultation_id
      AND c.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can delete their consultation diagnoses"
  ON consultation_diagnoses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consultations c
      WHERE c.id = consultation_diagnoses.consultation_id
      AND c.doctor_id = auth.uid()
    )
  );

-- RLS Policies for consultation_templates
CREATE POLICY "Users can view templates"
  ON consultation_templates FOR SELECT
  TO authenticated
  USING (
    is_system_template = true
    OR created_by = auth.uid()
    OR is_shared = true
  );

CREATE POLICY "Users can create personal templates"
  ON consultation_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates"
  ON consultation_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates"
  ON consultation_templates FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() AND is_system_template = false);

-- RLS Policies for consultation_audit_log
CREATE POLICY "Users can view audit logs for their consultations"
  ON consultation_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM consultations c
      WHERE c.id = consultation_audit_log.consultation_id
      AND (
        c.doctor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN roles r ON r.id = up.role_id
          WHERE up.id = auth.uid()
          AND r.name = 'admin'
        )
      )
    )
  );

-- Insert sample ICD-10 codes (French medical codes - Common diagnoses)
INSERT INTO icd10_codes (code, description_fr, description_en, category, subcategory) VALUES
-- Infectious diseases
('A00', 'Choléra', 'Cholera', 'Maladies infectieuses', 'Infections intestinales'),
('A09', 'Diarrhée et gastro-entérite', 'Diarrhea and gastroenteritis', 'Maladies infectieuses', 'Infections intestinales'),
('B34.9', 'Infection virale, sans précision', 'Viral infection, unspecified', 'Maladies infectieuses', 'Infections virales'),

-- Respiratory diseases
('J00', 'Rhinopharyngite aiguë (rhume banal)', 'Acute nasopharyngitis (common cold)', 'Maladies respiratoires', 'Infections respiratoires'),
('J02.9', 'Pharyngite aiguë, sans précision', 'Acute pharyngitis, unspecified', 'Maladies respiratoires', 'Infections respiratoires'),
('J06.9', 'Infection des voies respiratoires supérieures', 'Upper respiratory infection', 'Maladies respiratoires', 'Infections respiratoires'),
('J18.9', 'Pneumonie, sans précision', 'Pneumonia, unspecified', 'Maladies respiratoires', 'Infections respiratoires'),
('J20.9', 'Bronchite aiguë, sans précision', 'Acute bronchitis, unspecified', 'Maladies respiratoires', 'Infections respiratoires'),
('J45.9', 'Asthme, sans précision', 'Asthma, unspecified', 'Maladies respiratoires', 'Asthme'),

-- Cardiovascular diseases
('I10', 'Hypertension essentielle (primaire)', 'Essential (primary) hypertension', 'Maladies cardiovasculaires', 'Hypertension'),
('I11.9', 'Cardiopathie hypertensive', 'Hypertensive heart disease', 'Maladies cardiovasculaires', 'Hypertension'),
('I25.10', 'Cardiopathie ischémique', 'Ischemic heart disease', 'Maladies cardiovasculaires', 'Cardiopathie ischémique'),
('I50.9', 'Insuffisance cardiaque', 'Heart failure', 'Maladies cardiovasculaires', 'Insuffisance cardiaque'),

-- Digestive diseases
('K21.9', 'Reflux gastro-œsophagien', 'Gastroesophageal reflux disease', 'Maladies digestives', 'Œsophage'),
('K29.7', 'Gastrite, sans précision', 'Gastritis, unspecified', 'Maladies digestives', 'Estomac'),
('K59.0', 'Constipation', 'Constipation', 'Maladies digestives', 'Intestin'),

-- Endocrine diseases
('E11.9', 'Diabète sucré de type 2', 'Type 2 diabetes mellitus', 'Maladies endocriniennes', 'Diabète'),
('E66.9', 'Obésité', 'Obesity', 'Maladies endocriniennes', 'Troubles nutritionnels'),
('E78.5', 'Hyperlipidémie', 'Hyperlipidemia', 'Maladies endocriniennes', 'Troubles lipidiques'),

-- Musculoskeletal diseases
('M25.50', 'Douleur articulaire', 'Joint pain', 'Maladies musculo-squelettiques', 'Articulations'),
('M54.5', 'Lombalgie', 'Low back pain', 'Maladies musculo-squelettiques', 'Colonne vertébrale'),
('M79.3', 'Myalgie', 'Myalgia', 'Maladies musculo-squelettiques', 'Muscles'),

-- Nervous system diseases
('G43.9', 'Migraine, sans précision', 'Migraine, unspecified', 'Maladies du système nerveux', 'Céphalées'),
('G44.2', 'Céphalée de tension', 'Tension-type headache', 'Maladies du système nerveux', 'Céphalées'),

-- Skin diseases
('L20.9', 'Dermatite atopique', 'Atopic dermatitis', 'Maladies de la peau', 'Dermatite'),
('L30.9', 'Dermatite, sans précision', 'Dermatitis, unspecified', 'Maladies de la peau', 'Dermatite'),

-- Mental health
('F41.9', 'Trouble anxieux, sans précision', 'Anxiety disorder, unspecified', 'Troubles mentaux', 'Anxiété'),
('F32.9', 'Épisode dépressif', 'Depressive episode', 'Troubles mentaux', 'Dépression'),

-- Symptoms and signs
('R50.9', 'Fièvre, sans précision', 'Fever, unspecified', 'Symptômes', 'Fièvre'),
('R51', 'Céphalée', 'Headache', 'Symptômes', 'Douleur'),
('R05', 'Toux', 'Cough', 'Symptômes', 'Respiratoire'),
('R10.4', 'Douleur abdominale', 'Abdominal pain', 'Symptômes', 'Digestif')
ON CONFLICT (code) DO NOTHING;

-- Insert sample consultation templates
INSERT INTO consultation_templates (
  name,
  specialty,
  description,
  is_system_template,
  chief_complaint_template,
  examination_template,
  treatment_template,
  vital_signs_defaults,
  suggested_diagnoses
) VALUES
(
  'Consultation Générale',
  'Médecine Générale',
  'Template standard pour consultation de médecine générale',
  true,
  'Motif de consultation: ',
  'Examen général:\n- État général: \n- Cardiovasculaire: \n- Respiratoire: \n- Abdomen: ',
  'Traitement:\n- Médicaments: \n- Recommandations: \n- Suivi: ',
  '{"temperature": "37.0", "blood_pressure_systolic": "120", "blood_pressure_diastolic": "80", "heart_rate": "75"}',
  '[{"code": "J06.9", "description": "Infection des voies respiratoires supérieures"}]'
),
(
  'Consultation Cardiologique',
  'Cardiologie',
  'Template pour consultation de cardiologie',
  true,
  'Symptômes cardiovasculaires: ',
  'Examen cardiaque:\n- Auscultation: \n- Pouls: \n- TA: \n- ECG: ',
  'Plan de traitement cardiovasculaire:\n- Antihypertenseurs: \n- Anticoagulants: \n- Examens complémentaires: ',
  '{"temperature": "36.8", "blood_pressure_systolic": "130", "blood_pressure_diastolic": "85", "heart_rate": "70"}',
  '[{"code": "I10", "description": "Hypertension essentielle"}]'
),
(
  'Consultation Pédiatrique',
  'Pédiatrie',
  'Template pour consultation pédiatrique',
  true,
  'Motif de consultation (enfant): ',
  'Examen pédiatrique:\n- Croissance: \n- Développement: \n- Examen clinique: ',
  'Traitement pédiatrique:\n- Posologie adaptée: \n- Conseils aux parents: ',
  '{"temperature": "37.2", "heart_rate": "90"}',
  '[{"code": "J00", "description": "Rhinopharyngite aiguë"}]'
)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultations_number ON consultations(consultation_number);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(consultation_status);
CREATE INDEX IF NOT EXISTS idx_consultations_type ON consultations(consultation_type);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(consultation_date DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_date ON consultations(doctor_id, consultation_date DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_date ON consultations(patient_id, consultation_date DESC);
