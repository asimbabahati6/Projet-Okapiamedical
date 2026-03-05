/*
  # Create Attendance Management System

  ## Overview
  Complete attendance management system for hospital staff with QR code check-in,
  leave management, and comprehensive reporting.

  ## New Tables

  ### 1. `attendance_records`
  Stores daily attendance check-in/check-out records
  - `id` (uuid, primary key)
  - `staff_id` (uuid, references user_profiles)
  - `date` (date) - The date of attendance
  - `check_in_time` (timestamptz) - When employee arrived
  - `check_out_time` (timestamptz) - When employee left
  - `break_start_time` (timestamptz) - When break started
  - `break_end_time` (timestamptz) - When break ended
  - `status` (text) - present, late, absent, on_leave
  - `location_lat` (decimal) - Optional geolocation
  - `location_lng` (decimal) - Optional geolocation
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `leave_requests`
  Manages leave/vacation requests and approvals
  - `id` (uuid, primary key)
  - `staff_id` (uuid, references user_profiles)
  - `leave_type` (text) - annual, sick, emergency, maternity, other
  - `start_date` (date)
  - `end_date` (date)
  - `total_days` (integer)
  - `reason` (text)
  - `status` (text) - pending, approved, rejected
  - `reviewed_by` (uuid, references user_profiles)
  - `reviewed_at` (timestamptz)
  - `review_notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `staff_qr_codes`
  Stores unique QR codes for each staff member
  - `id` (uuid, primary key)
  - `staff_id` (uuid, references user_profiles, unique)
  - `qr_code_data` (text, unique) - Encrypted token for QR
  - `is_active` (boolean) - Whether QR code is valid
  - `expires_at` (timestamptz) - Optional expiration
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `attendance_settings`
  System-wide attendance configuration
  - `id` (uuid, primary key)
  - `work_start_time` (time) - Official start time
  - `work_end_time` (time) - Official end time
  - `grace_period_minutes` (integer) - Minutes before marked late
  - `break_duration_minutes` (integer) - Expected break duration
  - `require_geolocation` (boolean) - Whether location is mandatory
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Staff can view their own records
  - Admins can view and manage all records
  - Only admins can approve leave requests

  ## Indexes
  - Index on staff_id for quick lookups
  - Index on date for time-based queries
  - Index on status for filtering
*/

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  check_in_time timestamptz,
  check_out_time timestamptz,
  break_start_time timestamptz,
  break_end_time timestamptz,
  status text NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'late', 'absent', 'on_leave')),
  location_lat decimal(10, 8),
  location_lng decimal(11, 8),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, date)
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  leave_type text NOT NULL CHECK (leave_type IN ('annual', 'sick', 'emergency', 'maternity', 'paternity', 'other')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES user_profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (end_date >= start_date),
  CHECK (total_days > 0)
);

-- Create staff_qr_codes table
CREATE TABLE IF NOT EXISTS staff_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  qr_code_data text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attendance_settings table
CREATE TABLE IF NOT EXISTS attendance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_start_time time NOT NULL DEFAULT '08:00:00',
  work_end_time time NOT NULL DEFAULT '17:00:00',
  grace_period_minutes integer NOT NULL DEFAULT 15,
  break_duration_minutes integer NOT NULL DEFAULT 60,
  require_geolocation boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_staff_id ON attendance_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_leave_staff_id ON leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_dates ON leave_requests(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance_records
CREATE POLICY "Staff can view own attendance records"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ));

CREATE POLICY "Staff can create own attendance records"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Staff can update own attendance records"
  ON attendance_records FOR UPDATE
  TO authenticated
  USING (staff_id = auth.uid())
  WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Admins can manage all attendance records"
  ON attendance_records FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ));

-- RLS Policies for leave_requests
CREATE POLICY "Staff can view own leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ));

CREATE POLICY "Staff can create own leave requests"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Staff can update own pending leave requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (staff_id = auth.uid() AND status = 'pending')
  WITH CHECK (staff_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage all leave requests"
  ON leave_requests FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ));

-- RLS Policies for staff_qr_codes
CREATE POLICY "Staff can view own QR code"
  ON staff_qr_codes FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ));

CREATE POLICY "Admins can manage QR codes"
  ON staff_qr_codes FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ));

-- RLS Policies for attendance_settings
CREATE POLICY "Everyone can view attendance settings"
  ON attendance_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify attendance settings"
  ON attendance_settings FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ));

-- Insert default attendance settings
INSERT INTO attendance_settings (
  work_start_time,
  work_end_time,
  grace_period_minutes,
  break_duration_minutes,
  require_geolocation
)
VALUES (
  '08:00:00',
  '17:00:00',
  15,
  60,
  false
)
ON CONFLICT DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_qr_codes_updated_at
  BEFORE UPDATE ON staff_qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_settings_updated_at
  BEFORE UPDATE ON attendance_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
