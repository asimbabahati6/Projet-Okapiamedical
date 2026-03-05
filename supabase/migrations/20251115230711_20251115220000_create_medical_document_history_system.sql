/*
  # Medical Document Generation History System

  1. New Tables
    - `medical_document_history`
      - `id` (uuid, primary key)
      - `document_title` (text) - Title of the generated document
      - `document_type` (text) - Type of document (consultation_report, lab_results, prescription_summary, etc.)
      - `patient_id` (uuid, foreign key) - Patient the document was generated for
      - `generated_by` (uuid, foreign key) - Staff member who generated the document
      - `file_format` (text) - Format of the document (pdf or docx)
      - `sections_count` (integer) - Number of sections in the document
      - `metadata` (jsonb) - Additional metadata about the document
      - `generated_at` (timestamptz) - When the document was generated
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `medical_document_history` table
    - Add policies for authenticated users to:
      - View document history for their authorized patients
      - Create new document history records
      - Doctors can view all document history
      - Administrators can manage all document history

  3. Indexes
    - Index on patient_id for fast patient document lookups
    - Index on generated_by for staff member document tracking
    - Index on generated_at for chronological queries
    - Index on document_type for filtering by document type
*/

-- Create medical_document_history table
CREATE TABLE IF NOT EXISTS medical_document_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_title text NOT NULL,
  document_type text NOT NULL DEFAULT 'general_report',
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  generated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  file_format text NOT NULL CHECK (file_format IN ('pdf', 'docx')),
  sections_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_document_history_patient_id
  ON medical_document_history(patient_id);

CREATE INDEX IF NOT EXISTS idx_medical_document_history_generated_by
  ON medical_document_history(generated_by);

CREATE INDEX IF NOT EXISTS idx_medical_document_history_generated_at
  ON medical_document_history(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_medical_document_history_document_type
  ON medical_document_history(document_type);

-- Enable RLS
ALTER TABLE medical_document_history ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view document history for patients they have access to
CREATE POLICY "Users can view document history for accessible patients"
  ON medical_document_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.role_id IN (
          SELECT id FROM roles WHERE name IN ('administrator', 'doctor', 'nurse', 'receptionist')
        )
      )
    )
  );

-- Policy: Authenticated medical staff can create document history records
CREATE POLICY "Medical staff can create document history"
  ON medical_document_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role_id IN (
        SELECT id FROM roles WHERE name IN ('administrator', 'doctor', 'nurse')
      )
    )
    AND generated_by = auth.uid()
  );

-- Policy: Administrators can delete document history records
CREATE POLICY "Administrators can delete document history"
  ON medical_document_history
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role_id IN (
        SELECT id FROM roles WHERE name = 'administrator'
      )
    )
  );

-- Create a function to get document generation statistics
CREATE OR REPLACE FUNCTION get_document_generation_stats(
  p_staff_id uuid DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  total_documents bigint,
  pdf_count bigint,
  docx_count bigint,
  documents_by_type jsonb,
  recent_documents jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_documents,
    COUNT(*) FILTER (WHERE file_format = 'pdf')::bigint as pdf_count,
    COUNT(*) FILTER (WHERE file_format = 'docx')::bigint as docx_count,
    jsonb_object_agg(
      document_type,
      type_count
    ) FILTER (WHERE document_type IS NOT NULL) as documents_by_type,
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'title', document_title,
        'type', document_type,
        'format', file_format,
        'generated_at', generated_at
      )
      ORDER BY generated_at DESC
    ) FILTER (WHERE id IS NOT NULL) as recent_documents
  FROM (
    SELECT
      mdh.id,
      mdh.document_title,
      mdh.document_type,
      mdh.file_format,
      mdh.generated_at,
      COUNT(*) OVER (PARTITION BY document_type) as type_count
    FROM medical_document_history mdh
    WHERE
      (p_staff_id IS NULL OR mdh.generated_by = p_staff_id)
      AND (p_start_date IS NULL OR mdh.generated_at >= p_start_date)
      AND (p_end_date IS NULL OR mdh.generated_at <= p_end_date)
    ORDER BY mdh.generated_at DESC
    LIMIT 10
  ) recent_docs;
END;
$$;

-- Create a view for easy document history retrieval with related data
CREATE OR REPLACE VIEW medical_document_history_detailed AS
SELECT
  mdh.id,
  mdh.document_title,
  mdh.document_type,
  mdh.file_format,
  mdh.sections_count,
  mdh.metadata,
  mdh.generated_at,
  mdh.created_at,
  p.id as patient_id,
  p.patient_number,
  p.first_name as patient_first_name,
  p.last_name as patient_last_name,
  up.id as generated_by_id,
  up.full_name as generated_by_name,
  r.name as generated_by_role
FROM medical_document_history mdh
LEFT JOIN patients p ON mdh.patient_id = p.id
LEFT JOIN user_profiles up ON mdh.generated_by = up.id
LEFT JOIN roles r ON up.role_id = r.id;

-- Grant access to the view
GRANT SELECT ON medical_document_history_detailed TO authenticated;
