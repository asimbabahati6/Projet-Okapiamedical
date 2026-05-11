/*
  # Enhance Consultations with Nurse/Doctor Workflow

  1. Modified Tables
    - `consultations`
      - `workflow_status` (text: 'nurse_pending', 'nurse_in_progress', 'awaiting_doctor', 'doctor_in_progress', 'completed')
      - `flow_mode` (text: 'new_patient' or 'exam_referral')
      - `prescribing_doctor_name` (text, for exam referral flow)
      - `nurse_id` (uuid, nurse who completed pre-consultation)
      - `nurse_completed_at` (timestamptz)
      - `nurse_complaints` (text, patient complaints recorded by nurse)
      - `medical_history` (text, antecedents)
      - `illness_history` (text, histoire de la maladie)
      - `additional_anamnesis` (text, complement d'anamnese)
      - `paraclinical_exams` (jsonb array, examens paracliniques)
      - `nurse_locked` (boolean, whether nurse section is locked)
      - `doctor_completed_at` (timestamptz)

  2. Notes
    - Uses IF NOT EXISTS patterns for safe re-run
    - Leverages existing vital_signs jsonb column for nurse vitals
    - Leverages existing chief_complaint, physical_examination, diagnosis, treatment_plan
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'workflow_status'
  ) THEN
    ALTER TABLE consultations ADD COLUMN workflow_status text DEFAULT 'nurse_pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'flow_mode'
  ) THEN
    ALTER TABLE consultations ADD COLUMN flow_mode text DEFAULT 'new_patient';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'prescribing_doctor_name'
  ) THEN
    ALTER TABLE consultations ADD COLUMN prescribing_doctor_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'nurse_id'
  ) THEN
    ALTER TABLE consultations ADD COLUMN nurse_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'nurse_completed_at'
  ) THEN
    ALTER TABLE consultations ADD COLUMN nurse_completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'nurse_complaints'
  ) THEN
    ALTER TABLE consultations ADD COLUMN nurse_complaints text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'medical_history'
  ) THEN
    ALTER TABLE consultations ADD COLUMN medical_history text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'illness_history'
  ) THEN
    ALTER TABLE consultations ADD COLUMN illness_history text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'additional_anamnesis'
  ) THEN
    ALTER TABLE consultations ADD COLUMN additional_anamnesis text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'paraclinical_exams'
  ) THEN
    ALTER TABLE consultations ADD COLUMN paraclinical_exams jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'nurse_locked'
  ) THEN
    ALTER TABLE consultations ADD COLUMN nurse_locked boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'doctor_completed_at'
  ) THEN
    ALTER TABLE consultations ADD COLUMN doctor_completed_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consultations_workflow_status
  ON consultations(workflow_status);

CREATE INDEX IF NOT EXISTS idx_consultations_nurse_id
  ON consultations(nurse_id);
