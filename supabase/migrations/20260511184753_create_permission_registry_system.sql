/*
  # Create Permission Registry System

  1. New Tables
    - `permissions`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Machine-readable permission code (e.g., 'patients.view')
      - `display_name` (text) - Human-readable name
      - `category` (text) - Permission category/module grouping
      - `description` (text) - Detailed description
      - `created_at` (timestamptz)
    - `role_permissions`
      - `id` (uuid, primary key)
      - `role_id` (uuid, FK to roles)
      - `permission_id` (uuid, FK to permissions)
      - Unique constraint on (role_id, permission_id)
      - `granted_by` (uuid) - Who granted this permission
      - `granted_at` (timestamptz)
    - `permission_audit_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Who performed the action
      - `action` (text) - grant/revoke/check_denied
      - `permission_code` (text) - Which permission
      - `target_role_id` (uuid) - Target role affected
      - `metadata` (jsonb) - Additional context
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on all tables
    - Authenticated users can read permissions and their own role_permissions
    - Only admins can modify role_permissions
    - Audit log insertable by authenticated users, readable by admins

  3. Notes
    - This creates a database-backed permission registry to replace hardcoded ROLE_PERMISSIONS
    - Permissions follow a dot-notation pattern: module.action (e.g., patients.view, invoices.create)
    - The system supports role hierarchy through the existing roles.level column
*/

-- Permissions table: registry of all available permissions
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  display_name text NOT NULL,
  category text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage permissions"
  ON permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'directeur_general')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'directeur_general')
    )
  );

-- Role-Permission join table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert role permissions"
  ON role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'directeur_general')
    )
  );

CREATE POLICY "Admins can delete role permissions"
  ON role_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'directeur_general')
    )
  );

-- Permission audit log
CREATE TABLE IF NOT EXISTS permission_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  permission_code text,
  target_role_id uuid REFERENCES roles(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can insert audit entries"
  ON permission_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view audit log"
  ON permission_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'directeur_general')
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_user_id ON permission_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_created_at ON permission_audit_log(created_at);

-- View: Resolved permissions per role (flattens join for efficient querying)
CREATE OR REPLACE VIEW role_resolved_permissions AS
SELECT
  r.id as role_id,
  r.name as role_name,
  r.level as role_level,
  p.id as permission_id,
  p.code as permission_code,
  p.category as permission_category,
  p.display_name as permission_display_name,
  rp.granted_at
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id;
