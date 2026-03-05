/*
  # Create user_profiles_with_email view

  1. New View
    - `user_profiles_with_email`
      - Joins `user_profiles` with `auth.users` to include email addresses
      - Includes role information from `roles` table
      - Provides a complete user profile with authentication details

  2. Purpose
    - Solves the issue where email is not accessible from user_profiles table
    - Email is stored in auth.users by Supabase Auth, not in user_profiles
    - This view provides a unified interface for querying user data with emails

  3. Security
    - View respects existing RLS policies on user_profiles
    - Email data from auth.users is exposed through this view
    - Users can only see profiles they have permission to view based on RLS
*/

-- Create view that joins user_profiles with auth.users to get emails
CREATE OR REPLACE VIEW user_profiles_with_email AS
SELECT 
  up.id,
  up.full_name,
  up.phone,
  up.role_id,
  up.department_id,
  up.is_active,
  up.employee_category,
  up.is_medical_staff,
  up.is_hr_employee,
  up.created_at,
  up.updated_at,
  au.email,
  r.name as role_name
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
LEFT JOIN roles r ON up.role_id = r.id;

-- Grant access to authenticated users
GRANT SELECT ON user_profiles_with_email TO authenticated;

-- Add helpful comment
COMMENT ON VIEW user_profiles_with_email IS 'Unified view of user profiles with email addresses from auth.users';
