/*
  # Create exam_requests table

  1. New Tables
    - `exam_requests`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patients)
      - `exam_type` (text, not null) - Laboratoire, Radiologie, Echographie, Consultation Specialisee, etc.
      - `status` (text, default 'en_attente') - en_attente, en_cours, termine
      - `notes` (text, optional)
      - `department_id` (uuid, optional foreign key to departments)
      - `created_by` (uuid, optional - who created the request)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `exam_requests` table
    - Allow authenticated users to insert, select, and update
*/

CREATE TABLE IF NOT EXISTS exam_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  exam_type text NOT NULL,
  status text NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'en_cours', 'termine')),
  notes text,
  department_id uuid REFERENCES departments(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_requests_patient ON exam_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_exam_requests_status ON exam_requests(status);
CREATE INDEX IF NOT EXISTS idx_exam_requests_created_at ON exam_requests(created_at DESC);

ALTER TABLE exam_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view exam requests"
  ON exam_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert exam requests"
  ON exam_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can update exam requests"
  ON exam_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );
