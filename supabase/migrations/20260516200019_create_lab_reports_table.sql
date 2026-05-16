/*
  # Create Lab Reports Table

  1. New Tables
    - `lab_reports`
      - `id` (uuid, primary key)
      - `order_number` (text) - Report/order number
      - `report_date` (date) - Date of the report
      - `patient_name` (text) - Patient full name
      - `patient_number` (text) - Patient file number
      - `patient_dob` (text) - Patient date of birth
      - `patient_gender` (text) - Patient gender
      - `patient_id` (uuid, optional FK to patients)
      - `analysis_name` (text) - Name of analysis
      - `specimen_type` (text) - Type of specimen
      - `priority` (text) - Priority level
      - `requested_date` (text) - When the analysis was requested
      - `prescriber` (text) - Prescribing doctor name
      - `biologist` (text) - Biologist name
      - `parameters` (jsonb) - Array of result rows
      - `interpretation` (text) - Biologist interpretation
      - `status` (text) - brouillon, valide, envoye
      - `lab_order_id` (uuid, optional FK to lab_orders)
      - `created_by` (uuid, FK to user_profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - RLS enabled
    - Authenticated users with medical roles can select
    - Medical roles can insert and update
    - Only admins can delete
*/

CREATE TABLE IF NOT EXISTS lab_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL DEFAULT '',
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  patient_name text NOT NULL DEFAULT '',
  patient_number text NOT NULL DEFAULT '',
  patient_dob text NOT NULL DEFAULT '',
  patient_gender text NOT NULL DEFAULT '',
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  analysis_name text NOT NULL DEFAULT '',
  specimen_type text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'normal',
  requested_date text NOT NULL DEFAULT '',
  prescriber text NOT NULL DEFAULT '',
  biologist text NOT NULL DEFAULT '',
  parameters jsonb NOT NULL DEFAULT '[]',
  interpretation text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'brouillon',
  lab_order_id uuid,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_reports_status ON lab_reports(status);
CREATE INDEX IF NOT EXISTS idx_lab_reports_created_by ON lab_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_lab_reports_patient_id ON lab_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_created_at ON lab_reports(created_at DESC);

ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated medical staff can view all reports
CREATE POLICY "Medical staff can view lab reports"
  ON lab_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'super_admin', 'hospital_admin', 'doctor', 'medecin', 'nurse', 'biologist', 'biologiste', 'lab_technician', 'directeur_general')
    )
  );

-- Medical staff can insert lab reports
CREATE POLICY "Medical staff can create lab reports"
  ON lab_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'super_admin', 'hospital_admin', 'doctor', 'medecin', 'biologist', 'biologiste', 'lab_technician', 'directeur_general')
    )
  );

-- Medical staff can update lab reports
CREATE POLICY "Medical staff can update lab reports"
  ON lab_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'super_admin', 'hospital_admin', 'doctor', 'medecin', 'biologist', 'biologiste', 'lab_technician', 'directeur_general')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'super_admin', 'hospital_admin', 'doctor', 'medecin', 'biologist', 'biologiste', 'lab_technician', 'directeur_general')
    )
  );

-- Only admins can delete
CREATE POLICY "Admins can delete lab reports"
  ON lab_reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'super_admin', 'hospital_admin')
    )
  );
