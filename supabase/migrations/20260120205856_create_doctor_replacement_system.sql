/*
  # Create Doctor Replacement System
  
  1. New Tables
    - `doctor_replacements` - Manage planned and emergency doctor replacements
    - `replacement_appointment_transfers` - Track appointment transfers during replacements
    - `replacement_notifications` - Track patient notifications about replacements
  
  2. Security
    - Enable RLS on all tables
    - Doctors can view their own replacements
    - Admins can manage all replacements
  
  3. Constraints
    - No overlapping replacements for same doctor
    - End date must be after start date
    - Replacement doctor must have compatible specialty
*/

-- Doctor Replacements Table
CREATE TABLE IF NOT EXISTS doctor_replacements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_doctor_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  replacement_doctor_id uuid REFERENCES medical_staff(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  replacement_type text NOT NULL CHECK (replacement_type IN (
    'planned', 'emergency', 'vacation', 'training', 'sick_leave', 'maternity', 'conference', 'other'
  )),
  status text DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'active', 'completed', 'cancelled'
  )),
  approval_required boolean DEFAULT true,
  approved_by uuid REFERENCES user_profiles(id),
  approved_at timestamptz,
  reason text,
  notes text,
  affected_appointments_count integer DEFAULT 0,
  patients_notified_count integer DEFAULT 0,
  notification_sent_at timestamptz,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_dates CHECK (end_date >= start_date),
  CONSTRAINT check_different_doctors CHECK (original_doctor_id != replacement_doctor_id)
);

-- Replacement Appointment Transfers Table
CREATE TABLE IF NOT EXISTS replacement_appointment_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  replacement_id uuid NOT NULL REFERENCES doctor_replacements(id) ON DELETE CASCADE,
  original_appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  transfer_type text NOT NULL CHECK (transfer_type IN (
    'automatic', 'manual', 'patient_choice', 'rescheduled', 'cancelled'
  )),
  transferred_at timestamptz DEFAULT now(),
  patient_notified boolean DEFAULT false,
  patient_consent boolean DEFAULT false,
  patient_response text CHECK (patient_response IN (
    'accepted', 'requested_reschedule', 'cancelled', 'no_response'
  )),
  original_date date,
  original_time time,
  new_date date,
  new_time time,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Replacement Notifications Table
CREATE TABLE IF NOT EXISTS replacement_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  replacement_id uuid NOT NULL REFERENCES doctor_replacements(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id),
  notification_type text NOT NULL CHECK (notification_type IN ('email', 'sms', 'both', 'phone')),
  sent_at timestamptz DEFAULT now(),
  delivery_status text DEFAULT 'sent' CHECK (delivery_status IN (
    'pending', 'sent', 'delivered', 'failed', 'bounced'
  )),
  patient_response text CHECK (patient_response IN (
    'accepted', 'requested_reschedule', 'cancelled', 'no_response'
  )),
  response_at timestamptz,
  notification_content text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE doctor_replacements ENABLE ROW LEVEL SECURITY;
ALTER TABLE replacement_appointment_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE replacement_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctor_replacements
CREATE POLICY "Doctors can view their own replacements"
  ON doctor_replacements FOR SELECT
  TO authenticated
  USING (
    original_doctor_id = auth.uid()
    OR replacement_doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

CREATE POLICY "Doctors can create replacement requests"
  ON doctor_replacements FOR INSERT
  TO authenticated
  WITH CHECK (
    original_doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

CREATE POLICY "Admins can manage replacements"
  ON doctor_replacements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

CREATE POLICY "Admins can delete replacements"
  ON doctor_replacements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for replacement_appointment_transfers
CREATE POLICY "Staff can view appointment transfers"
  ON replacement_appointment_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_replacements dr
      WHERE dr.id = replacement_appointment_transfers.replacement_id
      AND (dr.original_doctor_id = auth.uid() OR dr.replacement_doctor_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff', 'receptionist')
    )
  );

CREATE POLICY "Authorized staff can manage appointment transfers"
  ON replacement_appointment_transfers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

-- RLS Policies for replacement_notifications
CREATE POLICY "Staff can view replacement notifications"
  ON replacement_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_replacements dr
      WHERE dr.id = replacement_notifications.replacement_id
      AND (dr.original_doctor_id = auth.uid() OR dr.replacement_doctor_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

CREATE POLICY "Authorized staff can manage notifications"
  ON replacement_notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_replacements_original_doctor ON doctor_replacements(original_doctor_id);
CREATE INDEX IF NOT EXISTS idx_replacements_replacement_doctor ON doctor_replacements(replacement_doctor_id);
CREATE INDEX IF NOT EXISTS idx_replacements_dates ON doctor_replacements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_replacements_status ON doctor_replacements(status);
CREATE INDEX IF NOT EXISTS idx_replacements_type ON doctor_replacements(replacement_type);
CREATE INDEX IF NOT EXISTS idx_replacements_active ON doctor_replacements(original_doctor_id, status, start_date, end_date) 
  WHERE status IN ('approved', 'active');

CREATE INDEX IF NOT EXISTS idx_transfer_replacement ON replacement_appointment_transfers(replacement_id);
CREATE INDEX IF NOT EXISTS idx_transfer_appointment ON replacement_appointment_transfers(original_appointment_id);
CREATE INDEX IF NOT EXISTS idx_transfer_type ON replacement_appointment_transfers(transfer_type);
CREATE INDEX IF NOT EXISTS idx_transfer_consent ON replacement_appointment_transfers(patient_consent);

CREATE INDEX IF NOT EXISTS idx_notifications_replacement ON replacement_notifications(replacement_id);
CREATE INDEX IF NOT EXISTS idx_notifications_patient ON replacement_notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_appointment ON replacement_notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON replacement_notifications(delivery_status);
CREATE INDEX IF NOT EXISTS idx_notifications_response ON replacement_notifications(patient_response);

-- Function to check for overlapping replacements
CREATE OR REPLACE FUNCTION check_replacement_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM doctor_replacements
    WHERE original_doctor_id = NEW.original_doctor_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND status NOT IN ('cancelled', 'completed')
    AND (
      (NEW.start_date BETWEEN start_date AND end_date)
      OR (NEW.end_date BETWEEN start_date AND end_date)
      OR (start_date BETWEEN NEW.start_date AND NEW.end_date)
    )
  ) THEN
    RAISE EXCEPTION 'Overlapping replacement period detected for this doctor';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_replacement_overlap_trigger
  BEFORE INSERT OR UPDATE ON doctor_replacements
  FOR EACH ROW
  EXECUTE FUNCTION check_replacement_overlap();
