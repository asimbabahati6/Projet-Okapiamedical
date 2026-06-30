-- Add missing columns to radiology_reports that the UI expects
ALTER TABLE radiology_reports
  ADD COLUMN IF NOT EXISTS exam_id uuid REFERENCES radiology_exams(id),
  ADD COLUMN IF NOT EXISTS performed_by uuid REFERENCES user_profiles(id),
  ADD COLUMN IF NOT EXISTS technique text,
  ADD COLUMN IF NOT EXISTS impression text,
  ADD COLUMN IF NOT EXISTS recommendations text,
  ADD COLUMN IF NOT EXISTS performed_at timestamptz;

-- Create index on exam_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_radiology_reports_exam_id ON radiology_reports(exam_id);
CREATE INDEX IF NOT EXISTS idx_radiology_reports_performed_by ON radiology_reports(performed_by);

NOTIFY pgrst, 'reload schema';