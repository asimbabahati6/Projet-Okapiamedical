/*
  # Create Doctor Availability and Scheduling System
  
  1. New Tables
    - `doctor_availability_calendar` - Detailed daily availability calendar
    - `doctor_leave_requests` - Leave requests and planned absences
    - `doctor_on_call_schedule` - On-call and guard duty schedule
  
  2. Security
    - Enable RLS on all tables
    - Doctors can view and manage their own schedules
    - Admins can manage all schedules
  
  3. Constraints
    - No overlapping leave periods
    - No overlapping on-call shifts
    - Valid time ranges
*/

-- Doctor Availability Calendar Table
CREATE TABLE IF NOT EXISTS doctor_availability_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean DEFAULT true,
  available_from time,
  available_until time,
  location text,
  capacity_percentage integer DEFAULT 100 CHECK (capacity_percentage BETWEEN 0 AND 200),
  override_reason text CHECK (override_reason IN (
    'vacation', 'training', 'conference', 'personal', 'sick', 'emergency', 'other'
  )),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, date),
  CONSTRAINT check_time_range CHECK (available_until > available_from OR NOT is_available)
);

-- Doctor Leave Requests Table
CREATE TABLE IF NOT EXISTS doctor_leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  leave_type text NOT NULL CHECK (leave_type IN (
    'vacation', 'sick_leave', 'training', 'conference', 'personal', 
    'maternity', 'paternity', 'bereavement', 'unpaid', 'other'
  )),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  status text DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'cancelled', 'withdrawn'
  )),
  requested_at timestamptz DEFAULT now(),
  approved_by uuid REFERENCES user_profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  has_replacement boolean DEFAULT false,
  replacement_doctor_id uuid REFERENCES medical_staff(id),
  patient_impact_count integer DEFAULT 0,
  urgency text DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'emergency')),
  reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_leave_dates CHECK (end_date >= start_date)
);

-- Doctor On-Call Schedule Table
CREATE TABLE IF NOT EXISTS doctor_on_call_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  on_call_type text NOT NULL CHECK (on_call_type IN (
    'day_shift', 'night_shift', 'weekend', 'holiday', 'emergency', '24h'
  )),
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  location text,
  specialty_required text,
  compensation_rate numeric(10,2),
  compensation_type text CHECK (compensation_type IN ('hourly', 'daily', 'flat', 'none')),
  actual_calls_received integer DEFAULT 0,
  actual_emergencies_handled integer DEFAULT 0,
  status text DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'active', 'completed', 'cancelled', 'no_show'
  )),
  notes text,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_oncall_datetime CHECK (end_datetime > start_datetime)
);

-- Enable RLS
ALTER TABLE doctor_availability_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_on_call_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctor_availability_calendar
CREATE POLICY "Anyone can view doctor availability"
  ON doctor_availability_calendar FOR SELECT
  USING (is_available = true);

CREATE POLICY "Doctors can manage their own availability"
  ON doctor_availability_calendar FOR ALL
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

-- RLS Policies for doctor_leave_requests
CREATE POLICY "Doctors can view their own leave requests"
  ON doctor_leave_requests FOR SELECT
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

CREATE POLICY "Doctors can create their own leave requests"
  ON doctor_leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

CREATE POLICY "Doctors can update their pending leave requests"
  ON doctor_leave_requests FOR UPDATE
  TO authenticated
  USING (
    (doctor_id = auth.uid() AND status IN ('pending', 'approved'))
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

-- RLS Policies for doctor_on_call_schedule
CREATE POLICY "Doctors can view their own on-call schedule"
  ON doctor_on_call_schedule FOR SELECT
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

CREATE POLICY "Admins can manage on-call schedules"
  ON doctor_on_call_schedule FOR ALL
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
CREATE INDEX IF NOT EXISTS idx_availability_doctor ON doctor_availability_calendar(doctor_id);
CREATE INDEX IF NOT EXISTS idx_availability_date ON doctor_availability_calendar(date);
CREATE INDEX IF NOT EXISTS idx_availability_doctor_date ON doctor_availability_calendar(doctor_id, date);
CREATE INDEX IF NOT EXISTS idx_availability_available ON doctor_availability_calendar(doctor_id, is_available, date) 
  WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_leave_doctor ON doctor_leave_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_leave_dates ON doctor_leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_status ON doctor_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_type ON doctor_leave_requests(leave_type);
CREATE INDEX IF NOT EXISTS idx_leave_pending ON doctor_leave_requests(doctor_id, status) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_leave_approved ON doctor_leave_requests(doctor_id, status, start_date, end_date) 
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_oncall_doctor ON doctor_on_call_schedule(doctor_id);
CREATE INDEX IF NOT EXISTS idx_oncall_dates ON doctor_on_call_schedule(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_oncall_type ON doctor_on_call_schedule(on_call_type);
CREATE INDEX IF NOT EXISTS idx_oncall_status ON doctor_on_call_schedule(status);
CREATE INDEX IF NOT EXISTS idx_oncall_active ON doctor_on_call_schedule(doctor_id, status, start_datetime) 
  WHERE status IN ('scheduled', 'active');

-- Function to check for overlapping leave requests
CREATE OR REPLACE FUNCTION check_leave_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('approved', 'pending') THEN
    IF EXISTS (
      SELECT 1 FROM doctor_leave_requests
      WHERE doctor_id = NEW.doctor_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status IN ('approved', 'pending')
      AND (
        (NEW.start_date BETWEEN start_date AND end_date)
        OR (NEW.end_date BETWEEN start_date AND end_date)
        OR (start_date BETWEEN NEW.start_date AND NEW.end_date)
      )
    ) THEN
      RAISE EXCEPTION 'Overlapping leave period detected for this doctor';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_leave_overlap_trigger
  BEFORE INSERT OR UPDATE ON doctor_leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION check_leave_overlap();

-- Function to check for overlapping on-call shifts
CREATE OR REPLACE FUNCTION check_oncall_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('scheduled', 'active') THEN
    IF EXISTS (
      SELECT 1 FROM doctor_on_call_schedule
      WHERE doctor_id = NEW.doctor_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status IN ('scheduled', 'active')
      AND (
        (NEW.start_datetime, NEW.end_datetime) OVERLAPS (start_datetime, end_datetime)
      )
    ) THEN
      RAISE EXCEPTION 'Overlapping on-call shift detected for this doctor';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_oncall_overlap_trigger
  BEFORE INSERT OR UPDATE ON doctor_on_call_schedule
  FOR EACH ROW
  EXECUTE FUNCTION check_oncall_overlap();

-- Function to auto-update availability calendar when leave is approved
CREATE OR REPLACE FUNCTION update_availability_on_leave()
RETURNS TRIGGER AS $$
DECLARE
  leave_date date;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Mark all dates in leave period as unavailable
    FOR leave_date IN 
      SELECT generate_series(NEW.start_date, NEW.end_date, '1 day'::interval)::date
    LOOP
      INSERT INTO doctor_availability_calendar (
        doctor_id, date, is_available, override_reason, notes
      ) VALUES (
        NEW.doctor_id, leave_date, false, NEW.leave_type, 
        'Auto-generated from approved leave request'
      )
      ON CONFLICT (doctor_id, date) 
      DO UPDATE SET 
        is_available = false,
        override_reason = NEW.leave_type,
        updated_at = now();
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_availability_on_leave_trigger
  AFTER INSERT OR UPDATE ON doctor_leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_availability_on_leave();
