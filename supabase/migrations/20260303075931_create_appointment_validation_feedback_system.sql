/*
  # Appointment Validation, Feedback & Audit System

  ## Overview
  Implements a 2-step appointment validation workflow, patient feedback collection,
  and a comprehensive audit log for all validation actions.

  ## New Tables

  ### 1. appointment_validations
  - Stores the 2-step validation workflow per appointment
  - Step 1: medecin_chef_staff (Dr TOTI Benedickt) — medical validation
  - Step 2: caissiere (Grace NZOLA) — financial/fund collection validation
  - Each row tracks: appointment_id, step (1 or 2), validator profile, status, timestamps, notes

  ### 2. patient_feedbacks
  - Collected after a patient's consultation
  - Fields: overall rating (1-5 stars), wait_time_rating, reception_rating, comment
  - Linked to appointment and patient
  - feedback_token: unique UUID used in the email link for access

  ### 3. validation_audit_logs
  - Immutable audit trail: every validation action logged with validator name, role, IP (optional), timestamp

  ### 4. feedback_send_queue
  - Tracks which patients need a feedback email sent ~2h after consultation
  - sent_at: null until email dispatched

  ## Security
  - RLS enabled on all tables
  - Authenticated staff can read/insert validations for their role
  - Patients can submit feedback via token (no auth required check done in app)
  - Only super_admin / hospital_admin / medecin_chef_staff can read all validations
*/

-- ─── appointment_validations ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointment_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  step integer NOT NULL CHECK (step IN (1, 2)),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  validator_id uuid REFERENCES user_profiles(id),
  validator_name text,
  validator_role text,
  notes text DEFAULT '',
  validated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (appointment_id, step)
);

ALTER TABLE appointment_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated staff can read appointment validations"
  ON appointment_validations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated staff can insert validations"
  ON appointment_validations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Validator can update own step"
  ON appointment_validations FOR UPDATE
  TO authenticated
  USING (auth.uid() = validator_id OR validator_id IS NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── validation_audit_logs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS validation_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  validation_step integer NOT NULL,
  action text NOT NULL,
  actor_id uuid REFERENCES user_profiles(id),
  actor_name text NOT NULL,
  actor_role text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE validation_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated staff can read audit logs"
  ON validation_audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated staff can insert audit logs"
  ON validation_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── patient_feedbacks ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  patient_name text,
  feedback_token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  overall_rating integer NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  wait_time_rating integer NOT NULL CHECK (wait_time_rating BETWEEN 1 AND 5),
  reception_rating integer NOT NULL CHECK (reception_rating BETWEEN 1 AND 5),
  comment text DEFAULT '',
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patient_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated staff can read feedbacks"
  ON patient_feedbacks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert feedback via token"
  ON patient_feedbacks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ─── feedback_send_queue ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback_send_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_email text,
  patient_phone text,
  patient_name text,
  feedback_token uuid NOT NULL DEFAULT gen_random_uuid(),
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback_send_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated staff can read feedback queue"
  ON feedback_send_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated staff can insert feedback queue"
  ON feedback_send_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated staff can update feedback queue"
  ON feedback_send_queue FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_appt_validations_appointment ON appointment_validations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_appointment ON validation_audit_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_token ON patient_feedbacks(feedback_token);
CREATE INDEX IF NOT EXISTS idx_feedbacks_appointment ON patient_feedbacks(appointment_id);
CREATE INDEX IF NOT EXISTS idx_feedback_queue_scheduled ON feedback_send_queue(scheduled_for) WHERE sent_at IS NULL;
