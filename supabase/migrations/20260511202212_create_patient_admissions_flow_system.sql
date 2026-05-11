/*
  # Create Patient Admissions Flow System

  1. New Tables
    - `patient_admissions`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `admission_date` (date, defaults to today)
      - `flow_type` (text: 'exam_only' or 'new_patient')
      - `status` (text: 'waiting', 'in_progress', 'completed', 'report_sent')
      - `tag` (text: 'EXTERNE', 'INTERNE', 'NOUVEAU')
      - `prescribing_doctor_name` (text, for exam referrals)
      - `prescribing_doctor_phone` (text)
      - `prescribing_institution` (text)
      - `exam_type` (text, e.g. Radiologie, Laboratoire, etc.)
      - `exam_acts` (text array, specific procedures)
      - `department_id` (uuid, references departments)
      - `assigned_doctor_id` (uuid, references medical_staff)
      - `reason` (text, reason for visit)
      - `report_sent_at` (timestamptz)
      - `report_sent_method` (text: 'phone', 'email', 'pickup')
      - `report_sent_to` (text)
      - `notes` (text)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `patient_admissions` table
    - Policies for authenticated staff to read and manage admissions

  3. Indexes
    - Index on (admission_date, flow_type) for fast daily queries
    - Index on patient_id for patient lookup
    - Index on status for filtering
*/

CREATE TABLE IF NOT EXISTS patient_admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  admission_date date NOT NULL DEFAULT CURRENT_DATE,
  flow_type text NOT NULL CHECK (flow_type IN ('exam_only', 'new_patient')),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'report_sent')),
  tag text NOT NULL DEFAULT 'NOUVEAU' CHECK (tag IN ('EXTERNE', 'INTERNE', 'NOUVEAU')),
  prescribing_doctor_name text,
  prescribing_doctor_phone text,
  prescribing_institution text,
  exam_type text,
  exam_acts text[] DEFAULT '{}',
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  assigned_doctor_id uuid,
  reason text,
  report_sent_at timestamptz,
  report_sent_method text CHECK (report_sent_method IS NULL OR report_sent_method IN ('phone', 'email', 'pickup')),
  report_sent_to text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE patient_admissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_patient_admissions_date_flow 
  ON patient_admissions(admission_date, flow_type);

CREATE INDEX IF NOT EXISTS idx_patient_admissions_patient 
  ON patient_admissions(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_admissions_status 
  ON patient_admissions(status);

-- Authenticated staff can view all admissions
CREATE POLICY "Staff can view admissions"
  ON patient_admissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
    )
  );

-- Authenticated staff can create admissions
CREATE POLICY "Staff can create admissions"
  ON patient_admissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
    )
  );

-- Staff can update admissions they created or any staff with appropriate access
CREATE POLICY "Staff can update admissions"
  ON patient_admissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
    )
  );

-- Staff can delete admissions they created
CREATE POLICY "Staff can delete own admissions"
  ON patient_admissions
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
  );
