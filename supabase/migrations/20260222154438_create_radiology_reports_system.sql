/*
  # Radiology Reports System with Hierarchical Permissions

  1. Tables
    - radiology_reports - Store radiology examination reports
    - radiology_images - Store associated images
    - radiology_validations - Track validation workflow

  2. Permissions
    - Radio Tech: Upload images, create technical notes
    - Radio Chef: Validate reports, delete records
    - Médecin Chef: View all, validate reports
    - Directeur Général: Full access

  3. Features
    - Validation workflow (draft -> technical_review -> validated)
    - Lock reports after validation
    - Image upload tracking
    - Validation history
*/

CREATE TABLE IF NOT EXISTS radiology_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  exam_type text NOT NULL,
  exam_date timestamptz DEFAULT now(),
  clinical_indication text,
  technical_notes text,
  findings text,
  conclusion text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'technical_review', 'validated', 'cancelled')),
  validated_by uuid REFERENCES auth.users(id),
  validated_at timestamptz,
  is_locked boolean DEFAULT false,
  priority text DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'routine')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS radiology_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES radiology_reports(id) ON DELETE CASCADE NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) NOT NULL,
  image_url text NOT NULL,
  image_type text,
  description text,
  sequence_number integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS radiology_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES radiology_reports(id) ON DELETE CASCADE NOT NULL,
  validator_id uuid REFERENCES auth.users(id) NOT NULL,
  action text CHECK (action IN ('validated', 'rejected', 'requested_revision')),
  comments text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_radiology_reports_patient ON radiology_reports(patient_id);
CREATE INDEX idx_radiology_reports_status ON radiology_reports(status);
CREATE INDEX idx_radiology_reports_created_by ON radiology_reports(created_by);
CREATE INDEX idx_radiology_images_report ON radiology_images(report_id);
CREATE INDEX idx_radiology_validations_report ON radiology_validations(report_id);

ALTER TABLE radiology_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medical staff can view radiology reports" ON radiology_reports FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('directeur_general', 'medecin_chef_staff', 'radio_chef', 'radio_tech', 'doctor', 'nurse')
  )
);

CREATE POLICY "Radio staff can create reports" ON radiology_reports FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('directeur_general', 'medecin_chef_staff', 'radio_chef', 'radio_tech')
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Radio tech can update unlocked draft reports" ON radiology_reports FOR UPDATE TO authenticated
USING (
  is_locked = false
  AND status IN ('draft', 'technical_review')
  AND EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('radio_tech', 'radio_chef', 'directeur_general')
  )
);

CREATE POLICY "Radio chef can update any report" ON radiology_reports FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('radio_chef', 'medecin_chef_staff', 'directeur_general')
  )
);

CREATE POLICY "Only radio chef and above can delete reports" ON radiology_reports FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('radio_chef', 'medecin_chef_staff', 'directeur_general')
  )
);

CREATE POLICY "All can view radiology images" ON radiology_images FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM radiology_reports
    WHERE radiology_reports.id = radiology_images.report_id
  )
);

CREATE POLICY "Radio staff can upload images" ON radiology_images FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('directeur_general', 'radio_chef', 'radio_tech')
  )
  AND uploaded_by = auth.uid()
);

CREATE POLICY "All can view validations" ON radiology_validations FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authorized staff can validate" ON radiology_validations FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('directeur_general', 'medecin_chef_staff', 'radio_chef')
  )
  AND validator_id = auth.uid()
);

CREATE OR REPLACE FUNCTION validate_radiology_report(
  p_report_id uuid,
  p_validator_id uuid,
  p_action text,
  p_comments text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_action = 'validated' THEN
    UPDATE radiology_reports
    SET 
      status = 'validated',
      validated_by = p_validator_id,
      validated_at = now(),
      is_locked = true,
      updated_at = now()
    WHERE id = p_report_id;
  ELSIF p_action = 'rejected' THEN
    UPDATE radiology_reports
    SET 
      status = 'draft',
      updated_at = now()
    WHERE id = p_report_id;
  END IF;

  INSERT INTO radiology_validations (report_id, validator_id, action, comments)
  VALUES (p_report_id, p_validator_id, p_action, p_comments);
END;
$$;

CREATE OR REPLACE FUNCTION update_radiology_report_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_radiology_report_timestamp
  BEFORE UPDATE ON radiology_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_radiology_report_timestamp();

COMMENT ON TABLE radiology_reports IS 'Radiology examination reports with hierarchical validation workflow';
COMMENT ON TABLE radiology_images IS 'Images associated with radiology reports';
COMMENT ON TABLE radiology_validations IS 'Validation history for radiology reports';
