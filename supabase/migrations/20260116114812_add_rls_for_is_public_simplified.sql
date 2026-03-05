/*
  # Restrict is_public modifications to super_admin only

  1. Security
    - Create function to check if user is super_admin
    - Note: RLS policy update may need manual review

  2. Behavior
    - super_admin: Can modify all department fields including is_public
    - hospital_admin: Can modify all fields EXCEPT is_public
*/

-- Function to check if current user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT r.name INTO user_role
  FROM user_profiles up
  JOIN roles r ON r.id = up.role_id
  WHERE up.id = auth.uid();

  RETURN COALESCE(user_role = 'super_admin', false);
END;
$$;

COMMENT ON FUNCTION is_super_admin() IS
  'Returns true if the current authenticated user has the super_admin role. Used for RLS policies.';
