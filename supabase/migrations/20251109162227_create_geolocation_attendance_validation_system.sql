/*
  # Create Geolocation-Based Attendance Validation System

  ## Overview
  Implements GPS-based attendance validation to ensure employees are physically present
  within 5 meters of OKAPIA Medical clinic before allowing check-in.

  ## Schema Updates

  ### 1. Update `attendance_settings` table
  Add geolocation validation configuration:
  - `clinic_latitude` (decimal) - Clinic reference GPS latitude coordinate
  - `clinic_longitude` (decimal) - Clinic reference GPS longitude coordinate
  - `max_distance_meters` (integer) - Maximum allowed distance in meters (default: 5)
  - `min_gps_accuracy_meters` (decimal) - Minimum required GPS accuracy in meters (default: 3)
  - `geolocation_enabled` (boolean) - Master switch to enable/disable geolocation validation

  ### 2. Create `attendance_check_attempts` table
  Comprehensive audit log for all check-in attempts:
  - `id` (uuid, primary key)
  - `staff_id` (uuid, references user_profiles)
  - `attempt_time` (timestamptz) - When the check-in was attempted
  - `gps_latitude` (decimal) - GPS latitude at attempt time
  - `gps_longitude` (decimal) - GPS longitude at attempt time
  - `gps_accuracy` (decimal) - GPS accuracy reading in meters
  - `calculated_distance` (decimal) - Distance from clinic in meters
  - `validation_result` (text) - success, rejected_distance, rejected_accuracy, gps_error
  - `rejection_reason` (text) - Detailed reason if rejected
  - `device_info` (jsonb) - Browser/device information
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on attendance_check_attempts table
  - Staff can view only their own check-in attempts
  - Admins can view all attempts for audit purposes
  - Only authenticated users can create check-in attempts

  ## Indexes
  - Index on staff_id for quick staff-specific lookups
  - Index on attempt_time for chronological queries
  - Index on validation_result for filtering by outcome

  ## Default Configuration
  - Clinic coordinates: -4.37° S, 15.25° E (OKAPIA Medical)
  - Maximum distance: 5 meters
  - Minimum GPS accuracy: 3 meters
  - Geolocation validation: enabled by default
*/

-- Add geolocation validation columns to attendance_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_settings' AND column_name = 'clinic_latitude'
  ) THEN
    ALTER TABLE attendance_settings ADD COLUMN clinic_latitude decimal(10, 8) DEFAULT -4.37;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_settings' AND column_name = 'clinic_longitude'
  ) THEN
    ALTER TABLE attendance_settings ADD COLUMN clinic_longitude decimal(11, 8) DEFAULT 15.25;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_settings' AND column_name = 'max_distance_meters'
  ) THEN
    ALTER TABLE attendance_settings ADD COLUMN max_distance_meters integer DEFAULT 5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_settings' AND column_name = 'min_gps_accuracy_meters'
  ) THEN
    ALTER TABLE attendance_settings ADD COLUMN min_gps_accuracy_meters decimal(5, 2) DEFAULT 3.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_settings' AND column_name = 'geolocation_enabled'
  ) THEN
    ALTER TABLE attendance_settings ADD COLUMN geolocation_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Update existing attendance_settings record with default geolocation values
UPDATE attendance_settings
SET 
  clinic_latitude = -4.37,
  clinic_longitude = 15.25,
  max_distance_meters = 5,
  min_gps_accuracy_meters = 3.0,
  geolocation_enabled = true
WHERE clinic_latitude IS NULL OR clinic_longitude IS NULL;

-- Create attendance_check_attempts audit table
CREATE TABLE IF NOT EXISTS attendance_check_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  attempt_time timestamptz NOT NULL DEFAULT now(),
  gps_latitude decimal(10, 8),
  gps_longitude decimal(11, 8),
  gps_accuracy decimal(6, 2),
  calculated_distance decimal(8, 2),
  validation_result text NOT NULL CHECK (validation_result IN ('success', 'rejected_distance', 'rejected_accuracy', 'gps_error', 'gps_disabled', 'network_error')),
  rejection_reason text,
  device_info jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_check_attempts_staff_id ON attendance_check_attempts(staff_id);
CREATE INDEX IF NOT EXISTS idx_check_attempts_time ON attendance_check_attempts(attempt_time DESC);
CREATE INDEX IF NOT EXISTS idx_check_attempts_result ON attendance_check_attempts(validation_result);
CREATE INDEX IF NOT EXISTS idx_check_attempts_staff_time ON attendance_check_attempts(staff_id, attempt_time DESC);

-- Enable Row Level Security
ALTER TABLE attendance_check_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance_check_attempts
CREATE POLICY "Staff can view own check-in attempts"
  ON attendance_check_attempts FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ));

CREATE POLICY "Staff can create own check-in attempts"
  ON attendance_check_attempts FOR INSERT
  TO authenticated
  WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Admins can view all check-in attempts"
  ON attendance_check_attempts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ));

-- Create function to calculate distance between two GPS coordinates using Haversine formula
-- This is a backup server-side calculation for validation
CREATE OR REPLACE FUNCTION calculate_distance_meters(
  lat1 decimal,
  lon1 decimal,
  lat2 decimal,
  lon2 decimal
)
RETURNS decimal AS $$
DECLARE
  earth_radius_km constant decimal := 6371.0;
  dlat decimal;
  dlon decimal;
  a decimal;
  c decimal;
  distance_km decimal;
BEGIN
  -- Convert degrees to radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Haversine formula
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  distance_km := earth_radius_km * c;
  
  -- Convert to meters and round to 2 decimal places
  RETURN ROUND((distance_km * 1000)::numeric, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create view for attendance audit reports with distance calculations
CREATE OR REPLACE VIEW attendance_audit_report AS
SELECT 
  aca.id,
  aca.staff_id,
  up.full_name as staff_name,
  r.name as staff_role,
  aca.attempt_time,
  aca.gps_latitude,
  aca.gps_longitude,
  aca.gps_accuracy,
  aca.calculated_distance,
  aca.validation_result,
  aca.rejection_reason,
  aca.device_info,
  aca.created_at,
  CASE 
    WHEN aca.validation_result = 'success' THEN 'Validé'
    WHEN aca.validation_result = 'rejected_distance' THEN 'Refusé - Distance'
    WHEN aca.validation_result = 'rejected_accuracy' THEN 'Refusé - Précision GPS'
    WHEN aca.validation_result = 'gps_error' THEN 'Erreur GPS'
    WHEN aca.validation_result = 'gps_disabled' THEN 'GPS Désactivé'
    WHEN aca.validation_result = 'network_error' THEN 'Erreur Réseau'
    ELSE 'Inconnu'
  END as validation_result_fr
FROM attendance_check_attempts aca
JOIN user_profiles up ON aca.staff_id = up.id
LEFT JOIN roles r ON up.role_id = r.id
ORDER BY aca.attempt_time DESC;

-- Grant access to the view
GRANT SELECT ON attendance_audit_report TO authenticated;
