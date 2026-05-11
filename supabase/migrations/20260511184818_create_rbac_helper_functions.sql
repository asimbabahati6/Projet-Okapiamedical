/*
  # Create RBAC Helper Functions

  1. Functions
    - `public.get_user_role()` - Returns the current user's role name
    - `public.user_has_permission(permission_code)` - Checks if user has a specific permission
    - `public.get_user_permissions()` - Returns all permission codes for the current user

  2. Notes
    - These functions use SECURITY DEFINER to access user_profiles/roles
    - They are designed for use in RLS policies and application queries
    - The functions short-circuit for admin roles (level <= 2) returning true for all permissions
*/

-- Function: Get current user's role name
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid();
$$;

-- Function: Check if current user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(p_permission_code text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_level integer;
  v_role_id uuid;
BEGIN
  -- Get user's role info
  SELECT r.level, r.id INTO v_role_level, v_role_id
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid();

  -- Admin roles (level 1-2) have all permissions
  IF v_role_level IS NOT NULL AND v_role_level <= 2 THEN
    RETURN true;
  END IF;

  -- Check permission in role_permissions
  RETURN EXISTS (
    SELECT 1
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = v_role_id
    AND p.code = p_permission_code
  );
END;
$$;

-- Function: Get all permission codes for current user
CREATE OR REPLACE FUNCTION public.get_user_permissions()
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_level integer;
  v_role_id uuid;
  v_permissions text[];
BEGIN
  -- Get user's role info
  SELECT r.level, r.id INTO v_role_level, v_role_id
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid();

  -- Admin roles (level 1-2) get wildcard
  IF v_role_level IS NOT NULL AND v_role_level <= 2 THEN
    RETURN ARRAY['*'];
  END IF;

  -- Get all permissions for this role
  SELECT array_agg(p.code) INTO v_permissions
  FROM role_permissions rp
  JOIN permissions p ON rp.permission_id = p.id
  WHERE rp.role_id = v_role_id;

  RETURN COALESCE(v_permissions, ARRAY[]::text[]);
END;
$$;
