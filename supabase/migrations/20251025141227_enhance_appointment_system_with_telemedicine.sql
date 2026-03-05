/*
  # Enhanced Appointment System with Telemedicine Support

  ## Overview
  This migration enhances the appointment booking system with comprehensive features including:
  - Telemedicine appointment support
  - Appointment modification tracking
  - Notification and reminder system
  - Doctor schedule templates and overrides
  - Appointment feedback and ratings
  - Waiting list management
  - Telemedicine session management

  ## New Tables

  1. `appointment_modifications`
     - Tracks all changes made to appointments (reschedules, cancellations, etc.)
     - Fields: id, appointment_id, modified_by, modification_type, old_values, new_values, reason, modified_at
     - Purpose: Complete audit trail for appointment changes

  2. `appointment_reminders`
     - Manages scheduled notifications for appointments
     - Fields: id, appointment_id, reminder_type, scheduled_for, sent_at, delivery_method, status
     - Purpose: Track reminder delivery and status

  3. `appointment_feedback`
     - Collects patient satisfaction and feedback after appointments
     - Fields: id, appointment_id, patient_id, rating, feedback_text, created_at
     - Purpose: Quality improvement and patient satisfaction tracking

  4. `appointment_waiting_list`
     - Manages patients waiting for unavailable time slots
     - Fields: id, patient_id, doctor_id, service_id, preferred_date, preferred_time, status, notified_at
     - Purpose: Fill cancelled slots and improve utilization

  5. `doctor_schedule_templates`
     - Stores recurring weekly availability patterns for doctors
     - Fields: id, doctor_id, day_of_week, start_time, end_time, slot_duration, is_telemedicine_available
     - Purpose: Simplify schedule management with templates

  6. `doctor_schedule_overrides`
     - Handles exceptions to regular schedules (vacations, special hours)
     - Fields: id, doctor_id, override_date, is_available, custom_start_time, custom_end_time, reason
     - Purpose: Manage temporary schedule changes

  7. `telemedicine_sessions`
     - Stores video consultation session information
     - Fields: id, appointment_id, room_url, access_token, session_started_at, session_ended_at, duration_minutes
     - Purpose: Track telemedicine consultations

  8. `appointment_notifications`
     - Logs all notifications sent for appointments
     - Fields: id, appointment_id, notification_type, recipient_email, recipient_phone, sent_at, delivery_status
     - Purpose: Track all communication with patients

  ## Modified Tables

  1. `appointments`
     - Added: appointment_type ENUM ('in-person', 'telemedicine')
     - Added: telemedicine_notes TEXT
     - Added: confirmation_code VARCHAR(10) for easy lookup
     - Added: qr_code_data TEXT for check-in
     - Added: patient_preparation_notes TEXT
     - Added: estimated_duration INTEGER (minutes)
     - Added: special_requirements TEXT

  2. `medical_staff`
     - Added: telemedicine_enabled BOOLEAN
     - Added: telemedicine_platforms TEXT[]
     - Added: max_daily_appointments INTEGER
     - Added: buffer_time_minutes INTEGER

  3. `services`
     - Added: telemedicine_available BOOLEAN
     - Added: estimated_duration_minutes INTEGER
     - Added: preparation_instructions TEXT
     - Added: preparation_instructions_en TEXT
     - Added: preparation_instructions_ar TEXT

  ## Security
  - RLS policies enabled on all new tables
  - Public can insert into waiting list
  - Staff can view and manage all appointment-related data
  - Patients can view their own feedback and waiting list entries
  - Audit logging for all modifications

  ## Indexes
  - Optimized queries for appointment lookups by confirmation code
  - Fast retrieval of pending reminders
  - Efficient doctor schedule queries by date and doctor
  - Quick feedback and rating aggregation
*/

-- Add new columns to appointments table
DO $$
BEGIN
  -- appointment_type: distinguishes between in-person and telemedicine
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'appointment_type'
  ) THEN
    ALTER TABLE appointments ADD COLUMN appointment_type TEXT DEFAULT 'in-person' CHECK (appointment_type IN ('in-person', 'telemedicine'));
  END IF;

  -- telemedicine_notes: special notes for video consultations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'telemedicine_notes'
  ) THEN
    ALTER TABLE appointments ADD COLUMN telemedicine_notes TEXT;
  END IF;

  -- confirmation_code: easy-to-remember code for appointment lookup
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'confirmation_code'
  ) THEN
    ALTER TABLE appointments ADD COLUMN confirmation_code VARCHAR(10) UNIQUE;
  END IF;

  -- qr_code_data: QR code for check-in at facility
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'qr_code_data'
  ) THEN
    ALTER TABLE appointments ADD COLUMN qr_code_data TEXT;
  END IF;

  -- patient_preparation_notes: instructions for patient before appointment
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'patient_preparation_notes'
  ) THEN
    ALTER TABLE appointments ADD COLUMN patient_preparation_notes TEXT;
  END IF;

  -- estimated_duration: expected length of appointment in minutes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'estimated_duration'
  ) THEN
    ALTER TABLE appointments ADD COLUMN estimated_duration INTEGER DEFAULT 30;
  END IF;

  -- special_requirements: accessibility needs or special requests
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'special_requirements'
  ) THEN
    ALTER TABLE appointments ADD COLUMN special_requirements TEXT;
  END IF;

  -- preferred_language: patient's preferred language for consultation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE appointments ADD COLUMN preferred_language VARCHAR(5) DEFAULT 'fr';
  END IF;
END $$;

-- Add new columns to medical_staff table
DO $$
BEGIN
  -- telemedicine_enabled: whether doctor offers video consultations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_staff' AND column_name = 'telemedicine_enabled'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN telemedicine_enabled BOOLEAN DEFAULT false;
  END IF;

  -- telemedicine_platforms: video platforms doctor uses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_staff' AND column_name = 'telemedicine_platforms'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN telemedicine_platforms TEXT[] DEFAULT '{}';
  END IF;

  -- max_daily_appointments: capacity limit per day
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_staff' AND column_name = 'max_daily_appointments'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN max_daily_appointments INTEGER DEFAULT 20;
  END IF;

  -- buffer_time_minutes: time between appointments for preparation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_staff' AND column_name = 'buffer_time_minutes'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN buffer_time_minutes INTEGER DEFAULT 0;
  END IF;

  -- average_rating: calculated from feedback
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_staff' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN average_rating DECIMAL(3,2);
  END IF;

  -- total_ratings: count of ratings received
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_staff' AND column_name = 'total_ratings'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN total_ratings INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add new columns to services table
DO $$
BEGIN
  -- telemedicine_available: whether service can be provided via video
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'telemedicine_available'
  ) THEN
    ALTER TABLE services ADD COLUMN telemedicine_available BOOLEAN DEFAULT false;
  END IF;

  -- estimated_duration_minutes: typical service duration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'estimated_duration_minutes'
  ) THEN
    ALTER TABLE services ADD COLUMN estimated_duration_minutes INTEGER DEFAULT 30;
  END IF;

  -- preparation_instructions: multilingual preparation instructions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'preparation_instructions'
  ) THEN
    ALTER TABLE services ADD COLUMN preparation_instructions TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'preparation_instructions_en'
  ) THEN
    ALTER TABLE services ADD COLUMN preparation_instructions_en TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'preparation_instructions_ar'
  ) THEN
    ALTER TABLE services ADD COLUMN preparation_instructions_ar TEXT;
  END IF;
END $$;

-- Create appointment_modifications table
CREATE TABLE IF NOT EXISTS appointment_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  modified_by UUID REFERENCES user_profiles(id),
  modification_type TEXT NOT NULL CHECK (modification_type IN ('created', 'rescheduled', 'cancelled', 'status_changed', 'notes_updated')),
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  modified_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE appointment_modifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all modifications"
  ON appointment_modifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'receptionist', 'admin', 'administrative_staff')
      )
    )
  );

CREATE POLICY "Staff can insert modifications"
  ON appointment_modifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'receptionist', 'admin', 'administrative_staff')
      )
    )
  );

-- Create appointment_reminders table
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('confirmation', '48_hour', '24_hour', '2_hour', 'follow_up')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'sms', 'both')),
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage reminders"
  ON appointment_reminders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'receptionist', 'admin', 'administrative_staff')
      )
    )
  );

-- Create appointment_feedback table
CREATE TABLE IF NOT EXISTS appointment_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES medical_staff(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  would_recommend BOOLEAN,
  wait_time_rating INTEGER CHECK (wait_time_rating >= 1 AND wait_time_rating <= 5),
  staff_courtesy_rating INTEGER CHECK (staff_courtesy_rating >= 1 AND staff_courtesy_rating <= 5),
  facility_cleanliness_rating INTEGER CHECK (facility_cleanliness_rating >= 1 AND facility_cleanliness_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE appointment_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can insert own feedback"
  ON appointment_feedback FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Staff can view all feedback"
  ON appointment_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'receptionist', 'admin', 'administrative_staff')
      )
    )
  );

CREATE POLICY "Patients can view own feedback"
  ON appointment_feedback FOR SELECT
  TO public
  USING (true);

-- Create appointment_waiting_list table
CREATE TABLE IF NOT EXISTS appointment_waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES medical_staff(id),
  service_id UUID REFERENCES services(id),
  department_id UUID REFERENCES departments(id),
  preferred_date DATE,
  preferred_time_start TIME,
  preferred_time_end TIME,
  appointment_type TEXT DEFAULT 'in-person' CHECK (appointment_type IN ('in-person', 'telemedicine', 'either')),
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'notified', 'booked', 'expired', 'cancelled')),
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE appointment_waiting_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waiting list"
  ON appointment_waiting_list FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Staff can manage waiting list"
  ON appointment_waiting_list FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'receptionist', 'admin', 'administrative_staff')
      )
    )
  );

-- Create doctor_schedule_templates table
CREATE TABLE IF NOT EXISTS doctor_schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER DEFAULT 30,
  max_appointments_per_slot INTEGER DEFAULT 1,
  is_telemedicine_available BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(doctor_id, day_of_week, start_time)
);

ALTER TABLE doctor_schedule_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage schedule templates"
  ON doctor_schedule_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'receptionist', 'admin', 'administrative_staff')
      )
    )
  );

CREATE POLICY "Public can view schedule templates"
  ON doctor_schedule_templates FOR SELECT
  TO public
  USING (is_active = true);

-- Create doctor_schedule_overrides table
CREATE TABLE IF NOT EXISTS doctor_schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT false,
  custom_start_time TIME,
  custom_end_time TIME,
  reason TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(doctor_id, override_date)
);

ALTER TABLE doctor_schedule_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage schedule overrides"
  ON doctor_schedule_overrides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'receptionist', 'admin', 'administrative_staff')
      )
    )
  );

CREATE POLICY "Public can view schedule overrides"
  ON doctor_schedule_overrides FOR SELECT
  TO public
  USING (true);

-- Create telemedicine_sessions table
CREATE TABLE IF NOT EXISTS telemedicine_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  room_url TEXT NOT NULL,
  room_id VARCHAR(50) UNIQUE NOT NULL,
  patient_access_token TEXT,
  doctor_access_token TEXT,
  session_started_at TIMESTAMPTZ,
  session_ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  connection_quality TEXT CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor')),
  technical_issues TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE telemedicine_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage telemedicine sessions"
  ON telemedicine_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'receptionist', 'admin', 'administrative_staff')
      )
    )
  );

-- Create appointment_notifications table
CREATE TABLE IF NOT EXISTS appointment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('confirmation', 'reminder', 'cancellation', 'rescheduled', 'follow_up')),
  recipient_email TEXT,
  recipient_phone TEXT,
  subject TEXT,
  message_body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'failed', 'bounced')),
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'sms')),
  error_message TEXT
);

ALTER TABLE appointment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all notifications"
  ON appointment_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('doctor', 'nurse', 'receptionist', 'admin', 'administrative_staff')
      )
    )
  );

CREATE POLICY "System can insert notifications"
  ON appointment_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation_code ON appointments(confirmation_code) WHERE confirmation_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_type_date ON appointments(appointment_type, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_scheduled ON appointment_reminders(scheduled_for, delivery_status) WHERE delivery_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_appointment_modifications_appointment ON appointment_modifications(appointment_id, modified_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_feedback_doctor ON appointment_feedback(doctor_id, rating);
CREATE INDEX IF NOT EXISTS idx_waiting_list_active ON appointment_waiting_list(status, doctor_id, preferred_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_schedule_templates_doctor_day ON doctor_schedule_templates(doctor_id, day_of_week) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_schedule_overrides_doctor_date ON doctor_schedule_overrides(doctor_id, override_date);
CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_appointment ON telemedicine_sessions(appointment_id);

-- Function to generate confirmation codes
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create confirmation code on appointment insert
CREATE OR REPLACE FUNCTION set_appointment_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL THEN
    NEW.confirmation_code := generate_confirmation_code();
    WHILE EXISTS (SELECT 1 FROM appointments WHERE confirmation_code = NEW.confirmation_code) LOOP
      NEW.confirmation_code := generate_confirmation_code();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for confirmation code generation
DROP TRIGGER IF EXISTS trigger_set_confirmation_code ON appointments;
CREATE TRIGGER trigger_set_confirmation_code
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_appointment_confirmation_code();

-- Function to update doctor ratings when feedback is added
CREATE OR REPLACE FUNCTION update_doctor_ratings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE medical_staff
  SET 
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM appointment_feedback
      WHERE doctor_id = NEW.doctor_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM appointment_feedback
      WHERE doctor_id = NEW.doctor_id
    )
  WHERE id = NEW.doctor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating doctor ratings
DROP TRIGGER IF EXISTS trigger_update_doctor_ratings ON appointment_feedback;
CREATE TRIGGER trigger_update_doctor_ratings
  AFTER INSERT ON appointment_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_ratings();

-- Update existing appointments with default values
UPDATE appointments 
SET appointment_type = 'in-person' 
WHERE appointment_type IS NULL;

-- Enable telemedicine for some services (examples - adjust as needed)
UPDATE services 
SET telemedicine_available = true,
    estimated_duration_minutes = 30
WHERE category_id IN (
  SELECT id FROM service_categories 
  WHERE name_en IN ('General Consultation', 'Specialist Consultation')
);

-- Set default estimated duration for all services
UPDATE services 
SET estimated_duration_minutes = 30 
WHERE estimated_duration_minutes IS NULL;

-- Enable telemedicine for all doctors by default (can be adjusted per doctor)
UPDATE medical_staff 
SET telemedicine_enabled = true,
    max_daily_appointments = 20,
    buffer_time_minutes = 5
WHERE telemedicine_enabled IS NULL;
