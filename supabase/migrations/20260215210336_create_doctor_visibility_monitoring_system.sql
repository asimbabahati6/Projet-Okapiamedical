/*
  # Doctor Visibility Monitoring and Fix System

  1. New Views
    - `doctors_visibility_status` - Comprehensive view showing all doctor visibility states
    - `invisible_doctors_report` - Quick report of doctors who should be visible but aren't
  
  2. Database Improvements
    - Add helper function to bulk activate doctors
    - Add function to create default availability schedule
  
  3. Security
    - Views accessible to authenticated users
    - Functions restricted to admins
*/

-- =============================================
-- 1. DOCTOR VISIBILITY STATUS VIEW
-- =============================================
CREATE OR REPLACE VIEW doctors_visibility_status AS
SELECT 
  up.id,
  up.full_name,
  au.email,
  ms.specialization,
  ms.staff_type,
  ms.is_accepting_patients,
  ms.current_status,
  ms.years_of_experience,
  ms.consultation_fee,
  ms.total_consultations,
  d.id as department_id,
  d.name as department_name,
  d.is_public as dept_is_public,
  d.is_active as dept_is_active,
  up.is_active as user_is_active,
  r.name as role_name,
  au.confirmed_at,
  au.banned_until,
  CASE 
    WHEN au.banned_until IS NOT NULL AND au.banned_until > now() THEN 'Banned'
    WHEN au.confirmed_at IS NULL THEN 'Email not confirmed'
    WHEN NOT up.is_active THEN 'User inactive'
    WHEN NOT ms.is_accepting_patients THEN 'Not accepting patients'
    WHEN d.id IS NOT NULL AND NOT d.is_public THEN 'Private department'
    WHEN d.id IS NOT NULL AND NOT d.is_active THEN 'Inactive department'
    WHEN ms.current_status IN ('off_duty', 'unavailable', 'inactive') THEN 'Status: ' || ms.current_status
    ELSE 'Visible'
  END as visibility_status,
  CASE 
    WHEN au.banned_until IS NOT NULL AND au.banned_until > now() THEN 1
    WHEN au.confirmed_at IS NULL THEN 2
    WHEN NOT up.is_active THEN 3
    WHEN NOT ms.is_accepting_patients THEN 4
    WHEN d.id IS NOT NULL AND NOT d.is_public THEN 5
    WHEN d.id IS NOT NULL AND NOT d.is_active THEN 6
    WHEN ms.current_status IN ('off_duty', 'unavailable', 'inactive') THEN 7
    ELSE 0
  END as visibility_priority,
  COUNT(dac.id) FILTER (WHERE dac.is_available = true) as available_days_count,
  ms.created_at,
  ms.updated_at
FROM medical_staff ms
JOIN user_profiles up ON ms.id = up.id
LEFT JOIN departments d ON up.department_id = d.id
LEFT JOIN roles r ON up.role_id = r.id
LEFT JOIN auth.users au ON up.id = au.id
LEFT JOIN doctor_availability_calendar dac ON dac.doctor_id = ms.id
WHERE ms.staff_type IN ('medecin', 'dentiste', 'kinesitherapeute')
GROUP BY 
  up.id, up.full_name, au.email, ms.specialization, ms.staff_type,
  ms.is_accepting_patients, ms.current_status, ms.years_of_experience,
  ms.consultation_fee, ms.total_consultations, d.id, d.name, d.is_public, d.is_active,
  up.is_active, r.name, au.confirmed_at, au.banned_until,
  ms.created_at, ms.updated_at;

-- =============================================
-- 2. INVISIBLE DOCTORS REPORT VIEW
-- =============================================
CREATE OR REPLACE VIEW invisible_doctors_report AS
SELECT 
  id,
  full_name,
  email,
  specialization,
  department_name,
  visibility_status,
  visibility_priority,
  available_days_count,
  is_accepting_patients,
  dept_is_public,
  user_is_active,
  current_status
FROM doctors_visibility_status
WHERE visibility_status != 'Visible'
ORDER BY visibility_priority ASC, full_name ASC;

-- =============================================
-- 3. FUNCTION: ACTIVATE DOCTOR
-- =============================================
CREATE OR REPLACE FUNCTION activate_doctor(doctor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  dept_id uuid;
  activation_steps jsonb[] := '{}';
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Step 1: Activate user profile
  UPDATE user_profiles
  SET is_active = true,
      updated_at = now()
  WHERE id = doctor_id;
  
  IF FOUND THEN
    activation_steps := activation_steps || jsonb_build_object(
      'step', 'user_profile',
      'action', 'activated',
      'success', true
    );
  END IF;

  -- Step 2: Enable patient acceptance in medical_staff
  UPDATE medical_staff
  SET is_accepting_patients = true,
      current_status = CASE 
        WHEN current_status IN ('inactive', 'unavailable', 'off_duty') 
        THEN 'available' 
        ELSE current_status 
      END,
      updated_at = now()
  WHERE id = doctor_id;
  
  IF FOUND THEN
    activation_steps := activation_steps || jsonb_build_object(
      'step', 'medical_staff',
      'action', 'enabled_patient_acceptance',
      'success', true
    );
  END IF;

  -- Step 3: Get and activate department
  SELECT department_id INTO dept_id
  FROM user_profiles
  WHERE id = doctor_id;
  
  IF dept_id IS NOT NULL THEN
    UPDATE departments
    SET is_public = true,
        is_active = true,
        updated_at = now()
    WHERE id = dept_id;
    
    activation_steps := activation_steps || jsonb_build_object(
      'step', 'department',
      'action', 'activated_and_made_public',
      'success', true
    );
  END IF;

  -- Step 4: Activate doctor-department junctions
  UPDATE doctor_departments
  SET is_active = true
  WHERE doctor_id = doctor_id;
  
  IF FOUND THEN
    activation_steps := activation_steps || jsonb_build_object(
      'step', 'department_junctions',
      'action', 'activated',
      'success', true
    );
  END IF;

  -- Step 5: Create default availability (Mon-Fri) if missing
  INSERT INTO doctor_availability_calendar (
    doctor_id, 
    day_of_week, 
    is_available, 
    capacity_percentage
  )
  SELECT 
    doctor_id,
    day,
    true,
    100
  FROM generate_series(1, 5) as day
  ON CONFLICT (doctor_id, day_of_week) 
  DO UPDATE SET 
    is_available = true, 
    capacity_percentage = 100;
  
  activation_steps := activation_steps || jsonb_build_object(
    'step', 'availability_schedule',
    'action', 'created_default_schedule',
    'success', true
  );

  -- Return summary
  result := jsonb_build_object(
    'doctor_id', doctor_id,
    'activation_steps', activation_steps,
    'total_steps', array_length(activation_steps, 1),
    'timestamp', now()
  );

  RETURN result;
END;
$$;

-- =============================================
-- 4. FUNCTION: BULK ACTIVATE INVISIBLE DOCTORS
-- =============================================
CREATE OR REPLACE FUNCTION bulk_activate_invisible_doctors()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doctor_record RECORD;
  results jsonb[] := '{}';
  activation_result jsonb;
  total_activated integer := 0;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Loop through invisible doctors (excluding banned and unconfirmed)
  FOR doctor_record IN 
    SELECT id, full_name, visibility_status
    FROM invisible_doctors_report
    WHERE visibility_status NOT IN ('Banned', 'Email not confirmed')
    ORDER BY visibility_priority ASC
  LOOP
    BEGIN
      activation_result := activate_doctor(doctor_record.id);
      total_activated := total_activated + 1;
      
      results := results || jsonb_build_object(
        'doctor_id', doctor_record.id,
        'doctor_name', doctor_record.full_name,
        'previous_status', doctor_record.visibility_status,
        'activation_result', activation_result,
        'success', true
      );
    EXCEPTION WHEN OTHERS THEN
      results := results || jsonb_build_object(
        'doctor_id', doctor_record.id,
        'doctor_name', doctor_record.full_name,
        'previous_status', doctor_record.visibility_status,
        'error', SQLERRM,
        'success', false
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'total_processed', array_length(results, 1),
    'total_activated', total_activated,
    'results', results,
    'timestamp', now()
  );
END;
$$;

-- =============================================
-- 5. GRANT PERMISSIONS
-- =============================================

-- Allow authenticated users to view visibility status
GRANT SELECT ON doctors_visibility_status TO authenticated;
GRANT SELECT ON invisible_doctors_report TO authenticated;

-- Functions are SECURITY DEFINER and check admin role internally

-- =============================================
-- 6. CREATE HELPFUL INDEXES
-- =============================================

-- Index for faster visibility checks
CREATE INDEX IF NOT EXISTS idx_medical_staff_visibility 
ON medical_staff(is_accepting_patients, current_status) 
WHERE is_accepting_patients = true;

CREATE INDEX IF NOT EXISTS idx_departments_public 
ON departments(is_public, is_active) 
WHERE is_public = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_profiles_active 
ON user_profiles(is_active) 
WHERE is_active = true;

COMMENT ON VIEW doctors_visibility_status IS 'Comprehensive view showing all doctor visibility states with diagnostic information';
COMMENT ON VIEW invisible_doctors_report IS 'Quick report of doctors who should be visible but are not, ordered by priority';
COMMENT ON FUNCTION activate_doctor IS 'Activates a doctor across all systems: user profile, medical staff, department, and availability schedule';
COMMENT ON FUNCTION bulk_activate_invisible_doctors IS 'Bulk activates all invisible doctors (except banned/unconfirmed)';
