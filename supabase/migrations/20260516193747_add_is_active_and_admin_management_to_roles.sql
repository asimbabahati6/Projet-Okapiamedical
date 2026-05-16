/*
  # Add is_active to roles table and admin management policies

  1. Modified Tables
    - `roles`
      - `is_active` (boolean, default true) - Allows soft-deleting (archiving) roles

  2. Security
    - Added policy for admin/medical_director to insert new roles
    - Added policy for admin/medical_director to update roles
    - Added policy for admin/medical_director to delete roles (hard delete)

  3. Notes
    - System roles (admin, medical_director, super_admin, hospital_admin) should be protected at the application level
    - Existing roles will default to is_active = true
*/

-- Add is_active column to roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE roles ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Policy: admins can insert roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert roles'
  ) THEN
    CREATE POLICY "Admins can insert roles" ON roles
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid()
          AND r.name IN ('super_admin', 'hospital_admin', 'admin', 'medical_director')
        )
      );
  END IF;
END $$;

-- Policy: admins can update roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update roles'
  ) THEN
    CREATE POLICY "Admins can update roles" ON roles
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid()
          AND r.name IN ('super_admin', 'hospital_admin', 'admin', 'medical_director')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid()
          AND r.name IN ('super_admin', 'hospital_admin', 'admin', 'medical_director')
        )
      );
  END IF;
END $$;

-- Policy: admins can delete roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete roles'
  ) THEN
    CREATE POLICY "Admins can delete roles" ON roles
      FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid()
          AND r.name IN ('super_admin', 'hospital_admin', 'admin', 'medical_director')
        )
      );
  END IF;
END $$;
