/*
  # Receptionist Check-In and Patient Routing System

  ## Overview
  This migration creates the infrastructure for a comprehensive receptionist check-in system 
  that intelligently routes patients based on their medical history status.

  ## New Tables Created
  
  ### 1. `patient_checkins`
  Tracks patient arrival and check-in events
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key to patients)
  - `appointment_id` (uuid, foreign key to appointments, nullable)
  - `checkin_time` (timestamptz) - When patient arrived
  - `checkin_type` (text) - 'scheduled_appointment', 'walk_in', 'emergency'
  - `is_new_patient` (boolean) - Whether patient has medical history
  - `routing_decision` (text) - 'to_reception', 'to_physician', 'to_emergency'
  - `assigned_to` (uuid) - Staff member or physician ID
  - `queue_number` (text) - Generated queue ticket number
  - `status` (text) - 'checked_in', 'in_registration', 'waiting', 'in_consultation', 'completed'
  - `reception_notes` (text) - Notes from receptionist
  - `intake_forms_completed` (boolean) - For new patients
  - `completed_at` (timestamptz) - When process completed
  - `checked_in_by` (uuid) - Receptionist who processed check-in
  - `created_at`, `updated_at` (timestamptz)

  ### 2. `intake_forms`
  Tracks required forms for new patient registration
  - `id` (uuid, primary key)
  - `checkin_id` (uuid, foreign key to patient_checkins)
  - `patient_id` (uuid, foreign key to patients)
  - `form_type` (text) - Type of form ('personal_info', 'medical_history', 'insurance', 'consent')
  - `form_name` (text) - Display name of the form
  - `is_required` (boolean) - Whether form is mandatory
  - `is_completed` (boolean) - Completion status
  - `completed_at` (timestamptz)
  - `completed_by` (uuid) - Staff member who marked as complete
  - `notes` (text)
  - `created_at`, `updated_at` (timestamptz)

  ### 3. `waiting_queue`
  Manages patient waiting queue and flow
  - `id` (uuid, primary key)
  - `checkin_id` (uuid, foreign key to patient_checkins)
  - `patient_id` (uuid, foreign key to patients)
  - `physician_id` (uuid, foreign key to user_profiles)
  - `queue_number` (text) - Display queue number
  - `priority_level` (integer) - 1=emergency, 2=urgent, 3=normal
  - `estimated_wait_minutes` (integer)
  - `queue_position` (integer)
  - `room_number` (text, nullable)
  - `status` (text) - 'waiting', 'called', 'in_progress', 'completed', 'cancelled'
  - `joined_queue_at` (timestamptz)
  - `called_at` (timestamptz, nullable)
  - `started_at` (timestamptz, nullable)
  - `completed_at` (timestamptz, nullable)
  - `created_at`, `updated_at` (timestamptz)

  ## Security (RLS Policies)
  - All tables have RLS enabled
  - Receptionists can insert and update check-in records
  - Physicians can view their assigned queue entries
  - Admins have full access
  - Patients cannot directly access these tables

  ## Important Notes
  - Queue numbers are generated automatically
  - New patient detection is based on appointment history
  - Routing decisions are made automatically but can be overridden
  - All timestamps are tracked for performance metrics
*/

-- Create patient check-ins table
CREATE TABLE IF NOT EXISTS patient_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  checkin_time timestamptz NOT NULL DEFAULT now(),
  checkin_type text NOT NULL DEFAULT 'scheduled_appointment' CHECK (checkin_type IN ('scheduled_appointment', 'walk_in', 'emergency')),
  is_new_patient boolean NOT NULL DEFAULT false,
  routing_decision text NOT NULL CHECK (routing_decision IN ('to_reception', 'to_physician', 'to_emergency')),
  assigned_to uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  queue_number text NOT NULL,
  status text NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'in_registration', 'waiting', 'in_consultation', 'completed', 'cancelled')),
  reception_notes text,
  intake_forms_completed boolean DEFAULT false,
  completed_at timestamptz,
  checked_in_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create intake forms table
CREATE TABLE IF NOT EXISTS intake_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id uuid NOT NULL REFERENCES patient_checkins(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  form_type text NOT NULL CHECK (form_type IN ('personal_info', 'medical_history', 'insurance', 'consent', 'emergency_contact')),
  form_name text NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create waiting queue table
CREATE TABLE IF NOT EXISTS waiting_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id uuid NOT NULL REFERENCES patient_checkins(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  physician_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  queue_number text NOT NULL,
  priority_level integer NOT NULL DEFAULT 3 CHECK (priority_level BETWEEN 1 AND 3),
  estimated_wait_minutes integer DEFAULT 15,
  queue_position integer,
  room_number text,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'in_progress', 'completed', 'cancelled')),
  joined_queue_at timestamptz NOT NULL DEFAULT now(),
  called_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_checkins_patient_id ON patient_checkins(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_checkins_appointment_id ON patient_checkins(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_checkins_checkin_time ON patient_checkins(checkin_time DESC);
CREATE INDEX IF NOT EXISTS idx_patient_checkins_status ON patient_checkins(status);
CREATE INDEX IF NOT EXISTS idx_patient_checkins_assigned_to ON patient_checkins(assigned_to);

CREATE INDEX IF NOT EXISTS idx_intake_forms_checkin_id ON intake_forms(checkin_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_patient_id ON intake_forms(patient_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_completed ON intake_forms(is_completed);

CREATE INDEX IF NOT EXISTS idx_waiting_queue_patient_id ON waiting_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_physician_id ON waiting_queue(physician_id);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_status ON waiting_queue(status);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_position ON waiting_queue(queue_position);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_joined_at ON waiting_queue(joined_queue_at DESC);

-- Enable Row Level Security
ALTER TABLE patient_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_checkins

CREATE POLICY "Receptionists can view all check-ins"
  ON patient_checkins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('receptionist', 'hospital_admin', 'super_admin')
    )
  );

CREATE POLICY "Receptionists can insert check-ins"
  ON patient_checkins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('receptionist', 'hospital_admin', 'super_admin')
    )
  );

CREATE POLICY "Receptionists can update check-ins"
  ON patient_checkins
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('receptionist', 'hospital_admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('receptionist', 'hospital_admin', 'super_admin')
    )
  );

CREATE POLICY "Physicians can view their assigned check-ins"
  ON patient_checkins
  FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('doctor', 'nurse')
    )
  );

-- RLS Policies for intake_forms

CREATE POLICY "Staff can view intake forms"
  ON intake_forms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('receptionist', 'doctor', 'nurse', 'hospital_admin', 'super_admin')
    )
  );

CREATE POLICY "Receptionists can insert intake forms"
  ON intake_forms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('receptionist', 'hospital_admin', 'super_admin')
    )
  );

CREATE POLICY "Staff can update intake forms"
  ON intake_forms
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('receptionist', 'doctor', 'nurse', 'hospital_admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('receptionist', 'doctor', 'nurse', 'hospital_admin', 'super_admin')
    )
  );

-- RLS Policies for waiting_queue

CREATE POLICY "Staff can view waiting queue"
  ON waiting_queue
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('receptionist', 'doctor', 'nurse', 'hospital_admin', 'super_admin')
    )
  );

CREATE POLICY "Physicians can view their queue"
  ON waiting_queue
  FOR SELECT
  TO authenticated
  USING (
    physician_id = auth.uid()
  );

CREATE POLICY "Receptionists can insert queue entries"
  ON waiting_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('receptionist', 'hospital_admin', 'super_admin')
    )
  );

CREATE POLICY "Staff can update queue entries"
  ON waiting_queue
  FOR UPDATE
  TO authenticated
  USING (
    physician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('receptionist', 'doctor', 'nurse', 'hospital_admin', 'super_admin')
    )
  )
  WITH CHECK (
    physician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('receptionist', 'doctor', 'nurse', 'hospital_admin', 'super_admin')
    )
  );

-- Function to generate queue numbers
CREATE OR REPLACE FUNCTION generate_queue_number()
RETURNS text AS $$
DECLARE
  today_count integer;
  queue_num text;
BEGIN
  SELECT COUNT(*) INTO today_count
  FROM patient_checkins
  WHERE DATE(checkin_time) = CURRENT_DATE;
  
  queue_num := 'Q' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((today_count + 1)::text, 4, '0');
  RETURN queue_num;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate queue position
CREATE OR REPLACE FUNCTION update_queue_positions()
RETURNS trigger AS $$
BEGIN
  WITH numbered_queue AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY physician_id 
        ORDER BY priority_level ASC, joined_queue_at ASC
      ) as new_position
    FROM waiting_queue
    WHERE status = 'waiting'
    AND physician_id = NEW.physician_id
  )
  UPDATE waiting_queue
  SET queue_position = numbered_queue.new_position
  FROM numbered_queue
  WHERE waiting_queue.id = numbered_queue.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update queue positions
CREATE TRIGGER trigger_update_queue_positions
  AFTER INSERT OR UPDATE ON waiting_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_positions();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_patient_checkins_updated_at
  BEFORE UPDATE ON patient_checkins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intake_forms_updated_at
  BEFORE UPDATE ON intake_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waiting_queue_updated_at
  BEFORE UPDATE ON waiting_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
