/*
  Doctor Visibility Testing and Troubleshooting Script

  This script provides quick queries to test and troubleshoot doctor visibility issues.
*/

-- ============================================
-- 1. CHECK OVERALL VISIBILITY STATUS
-- ============================================

-- Get summary of all doctors
SELECT
  visibility_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM doctors_visibility_status
GROUP BY visibility_status
ORDER BY COUNT(*) DESC;

-- Get total counts
SELECT
  COUNT(*) as total_doctors,
  COUNT(*) FILTER (WHERE visibility_status = 'Visible') as visible,
  COUNT(*) FILTER (WHERE visibility_status != 'Visible') as invisible,
  COUNT(*) FILTER (WHERE visibility_priority BETWEEN 1 AND 2) as critical,
  COUNT(*) FILTER (WHERE available_days_count = 0) as no_availability
FROM doctors_visibility_status;

-- ============================================
-- 2. VIEW INVISIBLE DOCTORS
-- ============================================

-- Quick view of all invisible doctors
SELECT
  full_name,
  email,
  specialization,
  department_name,
  visibility_status,
  visibility_priority,
  available_days_count
FROM invisible_doctors_report
ORDER BY visibility_priority ASC, full_name ASC;

-- Detailed view with all diagnostic info
SELECT * FROM doctors_visibility_status
WHERE visibility_status != 'Visible'
ORDER BY visibility_priority ASC;

-- ============================================
-- 3. FIND SPECIFIC ISSUES
-- ============================================

-- Doctors not accepting patients
SELECT
  full_name,
  email,
  specialization,
  department_name
FROM doctors_visibility_status
WHERE visibility_status = 'Not accepting patients';

-- Doctors in private departments
SELECT
  full_name,
  email,
  department_name,
  dept_is_public
FROM doctors_visibility_status
WHERE visibility_status = 'Private department';

-- Inactive users
SELECT
  full_name,
  email,
  user_is_active
FROM doctors_visibility_status
WHERE visibility_status = 'User inactive';

-- Doctors without availability schedule
SELECT
  full_name,
  email,
  available_days_count
FROM doctors_visibility_status
WHERE available_days_count = 0;

-- ============================================
-- 4. DEPARTMENT ANALYSIS
-- ============================================

-- Count doctors by department with visibility
SELECT
  d.name as department_name,
  d.is_public,
  d.is_active,
  COUNT(dvs.id) as total_doctors,
  COUNT(*) FILTER (WHERE dvs.visibility_status = 'Visible') as visible,
  COUNT(*) FILTER (WHERE dvs.visibility_status != 'Visible') as invisible
FROM departments d
LEFT JOIN doctors_visibility_status dvs ON dvs.department_id = d.id
GROUP BY d.id, d.name, d.is_public, d.is_active
ORDER BY invisible DESC, d.name;

-- Find private departments with doctors
SELECT
  d.name,
  d.is_public,
  COUNT(up.id) as doctor_count
FROM departments d
JOIN user_profiles up ON up.department_id = d.id
JOIN medical_staff ms ON ms.id = up.id
WHERE d.is_public = false
  AND ms.staff_type IN ('medecin', 'dentiste', 'kinesitherapeute')
GROUP BY d.id, d.name, d.is_public;

-- ============================================
-- 5. ACTIVATION TESTING
-- ============================================

-- Test activate_doctor function (replace DOCTOR_ID)
-- SELECT activate_doctor('DOCTOR_ID_HERE');

-- Example with result parsing:
/*
SELECT
  result->>'doctor_id' as doctor_id,
  result->>'total_steps' as steps_completed,
  result->'activation_steps' as details
FROM (
  SELECT activate_doctor('DOCTOR_ID_HERE') as result
) t;
*/

-- Test bulk activation (dry run - see who would be activated)
SELECT
  id,
  full_name,
  visibility_status,
  visibility_priority
FROM invisible_doctors_report
WHERE visibility_status NOT IN ('Banned', 'Email not confirmed')
ORDER BY visibility_priority ASC;

-- Actually run bulk activation (uncomment to use)
-- SELECT bulk_activate_invisible_doctors();

-- ============================================
-- 6. CHECK SPECIFIC DOCTOR
-- ============================================

-- Replace 'Doctor Name' or email with actual values
SELECT * FROM doctors_visibility_status
WHERE full_name ILIKE '%Doctor Name%'
   OR email ILIKE '%email%';

-- Full diagnostic for specific doctor
SELECT
  'User Profile' as check_type,
  CASE WHEN up.is_active THEN '✓ Active' ELSE '✗ Inactive' END as status,
  up.full_name,
  d.name as department
FROM user_profiles up
LEFT JOIN departments d ON d.id = up.department_id
WHERE up.id = 'DOCTOR_ID_HERE'

UNION ALL

SELECT
  'Medical Staff' as check_type,
  CASE WHEN ms.is_accepting_patients THEN '✓ Accepting' ELSE '✗ Not Accepting' END as status,
  ms.specialization,
  ms.current_status
FROM medical_staff ms
WHERE ms.id = 'DOCTOR_ID_HERE'

UNION ALL

SELECT
  'Department' as check_type,
  CASE WHEN d.is_public THEN '✓ Public' ELSE '✗ Private' END as status,
  d.name,
  CASE WHEN d.is_active THEN 'Active' ELSE 'Inactive' END
FROM user_profiles up
JOIN departments d ON d.id = up.department_id
WHERE up.id = 'DOCTOR_ID_HERE'

UNION ALL

SELECT
  'Availability' as check_type,
  COUNT(*)::text || ' days available',
  '',
  ''
FROM doctor_availability_calendar dac
WHERE dac.doctor_id = 'DOCTOR_ID_HERE'
  AND dac.is_available = true;

-- ============================================
-- 7. MANUAL FIXES
-- ============================================

-- Fix 1: Activate user profile
-- UPDATE user_profiles
-- SET is_active = true, updated_at = now()
-- WHERE id = 'DOCTOR_ID_HERE';

-- Fix 2: Enable patient acceptance
-- UPDATE medical_staff
-- SET is_accepting_patients = true,
--     current_status = 'available',
--     updated_at = now()
-- WHERE id = 'DOCTOR_ID_HERE';

-- Fix 3: Make department public
-- UPDATE departments d
-- SET is_public = true,
--     is_active = true,
--     updated_at = now()
-- FROM user_profiles up
-- WHERE up.department_id = d.id
--   AND up.id = 'DOCTOR_ID_HERE';

-- Fix 4: Create availability schedule (Mon-Fri)
-- INSERT INTO doctor_availability_calendar (doctor_id, day_of_week, is_available, capacity_percentage)
-- SELECT
--   'DOCTOR_ID_HERE',
--   day,
--   true,
--   100
-- FROM generate_series(1, 5) as day
-- ON CONFLICT (doctor_id, day_of_week)
-- DO UPDATE SET is_available = true, capacity_percentage = 100;

-- ============================================
-- 8. MONITORING QUERIES
-- ============================================

-- Daily monitoring - run this regularly
SELECT
  NOW() as check_time,
  COUNT(*) as total_doctors,
  COUNT(*) FILTER (WHERE visibility_status = 'Visible') as visible,
  COUNT(*) FILTER (WHERE visibility_status != 'Visible') as invisible,
  COUNT(*) FILTER (WHERE visibility_priority <= 2) as critical_issues
FROM doctors_visibility_status;

-- Trend by department
SELECT
  department_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE visibility_status = 'Visible') as visible,
  ROUND(
    COUNT(*) FILTER (WHERE visibility_status = 'Visible') * 100.0 / NULLIF(COUNT(*), 0),
    1
  ) as visibility_percentage
FROM doctors_visibility_status
WHERE department_name IS NOT NULL
GROUP BY department_name
ORDER BY visibility_percentage ASC;

-- Recently created doctors without visibility
SELECT
  dvs.full_name,
  dvs.email,
  dvs.visibility_status,
  ms.created_at
FROM doctors_visibility_status dvs
JOIN medical_staff ms ON ms.id = dvs.id
WHERE dvs.visibility_status != 'Visible'
  AND ms.created_at > NOW() - INTERVAL '7 days'
ORDER BY ms.created_at DESC;

-- ============================================
-- 9. PERFORMANCE CHECKS
-- ============================================

-- Check view performance
EXPLAIN ANALYZE
SELECT * FROM doctors_visibility_status;

-- Check invisible doctors report performance
EXPLAIN ANALYZE
SELECT * FROM invisible_doctors_report;

-- ============================================
-- 10. CLEANUP AND MAINTENANCE
-- ============================================

-- Find orphaned records (medical_staff without user_profiles)
SELECT ms.id, ms.specialization, ms.created_at
FROM medical_staff ms
LEFT JOIN user_profiles up ON up.id = ms.id
WHERE up.id IS NULL
  AND ms.staff_type IN ('medecin', 'dentiste', 'kinesitherapeute');

-- Find doctors without department
SELECT
  up.full_name,
  ms.specialization,
  up.department_id
FROM user_profiles up
JOIN medical_staff ms ON ms.id = up.id
WHERE up.department_id IS NULL
  AND ms.staff_type IN ('medecin', 'dentiste', 'kinesitherapeute');

-- Find doctors with no availability at all
SELECT
  dvs.full_name,
  dvs.email,
  dvs.specialization
FROM doctors_visibility_status dvs
LEFT JOIN doctor_availability_calendar dac ON dac.doctor_id = dvs.id
WHERE dac.id IS NULL;

-- ============================================
-- NOTES
-- ============================================

/*
Common Issues and Quick Fixes:

1. NOT ACCEPTING PATIENTS
   → Run: SELECT activate_doctor('doctor_id');

2. PRIVATE DEPARTMENT
   → Option A: Make department public
   → Option B: Reassign doctor to public department
   → Option C: Run activate_doctor (will make dept public)

3. NO AVAILABILITY
   → Run: SELECT activate_doctor('doctor_id');

4. INACTIVE USER
   → Run: SELECT activate_doctor('doctor_id');

5. BULK ISSUES
   → Run: SELECT bulk_activate_invisible_doctors();

Always verify after fixes:
SELECT * FROM doctors_visibility_status WHERE id = 'doctor_id';
*/
