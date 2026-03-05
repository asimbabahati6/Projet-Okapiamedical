/*
  # Enhanced Consultation History System
  
  1. Database Optimizations
    - Add indexes for performance on frequently queried columns
    - Add RPC functions for complex queries
  
  2. Permissions System
    - Create permissions_matrix table for granular access control
    - Define role-based permissions (doctor, nurse, admin, reception)
    - Add consultation sharing mechanism
  
  3. Audit System
    - Create consultation_audit_logs table
    - Track all actions (view, edit, export, share)
    - Store user, timestamp, IP, action details
  
  4. Analytics Support
    - Add computed columns for analytics
    - Create functions for statistical calculations
  
  5. Security
    - Row Level Security policies based on roles
    - Granular permissions by department and doctor
    - Audit trail for compliance
*/

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultations_patient_date ON consultations(patient_id, consultation_date DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_date ON consultations(doctor_id, consultation_date DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(consultation_date DESC);

-- Create permissions matrix table
CREATE TABLE IF NOT EXISTS permissions_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  can_view_own boolean DEFAULT false,
  can_view_department boolean DEFAULT false,
  can_view_all boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit_own boolean DEFAULT false,
  can_edit_all boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_export boolean DEFAULT false,
  can_share boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role_id, resource_type)
);

ALTER TABLE permissions_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view permissions for their role"
  ON permissions_matrix FOR SELECT
  TO authenticated
  USING (
    role_id IN (
      SELECT role_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Create consultation sharing table
CREATE TABLE IF NOT EXISTS consultation_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES user_profiles(id),
  shared_with uuid NOT NULL REFERENCES user_profiles(id),
  permission_level text NOT NULL CHECK (permission_level IN ('view', 'edit')),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(consultation_id, shared_with)
);

ALTER TABLE consultation_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares they are part of"
  ON consultation_shares FOR SELECT
  TO authenticated
  USING (shared_with = auth.uid() OR shared_by = auth.uid());

CREATE POLICY "Doctors can share their consultations"
  ON consultation_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    shared_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM consultations c
      WHERE c.id = consultation_id AND c.doctor_id = auth.uid()
    )
  );

-- Create audit logs table
CREATE TABLE IF NOT EXISTS consultation_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id),
  action text NOT NULL CHECK (action IN ('viewed', 'created', 'updated', 'deleted', 'exported_pdf', 'exported_excel', 'exported_csv', 'shared', 'printed')),
  ip_address inet,
  user_agent text,
  details jsonb,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_consultation ON consultation_audit_logs(consultation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON consultation_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON consultation_audit_logs(action, created_at DESC);

ALTER TABLE consultation_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON consultation_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() AND r.name = 'Administrateur'
    )
  );

CREATE POLICY "Users can view their own audit logs"
  ON consultation_audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Insert default permissions for roles
DO $$
DECLARE
  doctor_role_id uuid;
  nurse_role_id uuid;
  admin_role_id uuid;
  reception_role_id uuid;
BEGIN
  -- Get role IDs
  SELECT id INTO doctor_role_id FROM roles WHERE name = 'Médecin' LIMIT 1;
  SELECT id INTO nurse_role_id FROM roles WHERE name = 'Infirmier' LIMIT 1;
  SELECT id INTO admin_role_id FROM roles WHERE name = 'Administrateur' LIMIT 1;
  SELECT id INTO reception_role_id FROM roles WHERE name = 'Réception' LIMIT 1;
  
  -- Doctor permissions
  IF doctor_role_id IS NOT NULL THEN
    INSERT INTO permissions_matrix (role_id, resource_type, can_view_own, can_view_department, can_view_all, can_create, can_edit_own, can_edit_all, can_delete, can_export, can_share)
    VALUES (doctor_role_id, 'consultations', true, true, false, true, true, false, false, true, true)
    ON CONFLICT (role_id, resource_type) DO UPDATE
    SET can_view_own = true, can_view_department = true, can_create = true, can_edit_own = true, can_export = true, can_share = true;
  END IF;
  
  -- Nurse permissions
  IF nurse_role_id IS NOT NULL THEN
    INSERT INTO permissions_matrix (role_id, resource_type, can_view_own, can_view_department, can_view_all, can_create, can_edit_own, can_edit_all, can_delete, can_export, can_share)
    VALUES (nurse_role_id, 'consultations', false, true, false, false, false, false, false, false, false)
    ON CONFLICT (role_id, resource_type) DO UPDATE
    SET can_view_department = true;
  END IF;
  
  -- Admin permissions
  IF admin_role_id IS NOT NULL THEN
    INSERT INTO permissions_matrix (role_id, resource_type, can_view_own, can_view_department, can_view_all, can_create, can_edit_own, can_edit_all, can_delete, can_export, can_share)
    VALUES (admin_role_id, 'consultations', true, true, true, true, true, true, true, true, true)
    ON CONFLICT (role_id, resource_type) DO UPDATE
    SET can_view_all = true, can_edit_all = true, can_delete = true, can_export = true;
  END IF;
  
  -- Reception permissions (limited access)
  IF reception_role_id IS NOT NULL THEN
    INSERT INTO permissions_matrix (role_id, resource_type, can_view_own, can_view_department, can_view_all, can_create, can_edit_own, can_edit_all, can_delete, can_export, can_share)
    VALUES (reception_role_id, 'consultations', false, false, false, false, false, false, false, false, false)
    ON CONFLICT (role_id, resource_type) DO UPDATE
    SET can_view_own = false;
  END IF;
END $$;

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_consultation_audit(
  p_consultation_id uuid,
  p_action text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO consultation_audit_logs (
    consultation_id,
    user_id,
    action,
    ip_address,
    user_agent,
    details
  ) VALUES (
    p_consultation_id,
    auth.uid(),
    p_action,
    p_ip_address,
    p_user_agent,
    p_details
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for consultation statistics
CREATE OR REPLACE FUNCTION get_consultation_statistics(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_stats jsonb;
BEGIN
  WITH filtered_consultations AS (
    SELECT c.*
    FROM consultations c
    WHERE 
      (p_start_date IS NULL OR c.consultation_date >= p_start_date)
      AND (p_end_date IS NULL OR c.consultation_date <= p_end_date)
  )
  SELECT jsonb_build_object(
    'total_consultations', COUNT(*),
    'with_follow_up', COUNT(*) FILTER (WHERE follow_up_date IS NOT NULL),
    'unique_patients', COUNT(DISTINCT patient_id),
    'unique_doctors', COUNT(DISTINCT doctor_id)
  ) INTO v_stats
  FROM filtered_consultations;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;