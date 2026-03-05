/*
  # Laboratory Audit Logs Table

  1. Overview
    Creates a comprehensive audit logging system for laboratory module actions
    Tracks all access attempts, successful operations, and security violations

  2. Table Structure
    - id: Unique identifier for each audit entry
    - user_id: Reference to the user who performed the action
    - user_role: Role of the user at the time of action (for historical tracking)
    - action_type: Type of action performed (create, update, delete, view, export, denied)
    - order_id: Optional reference to the lab order affected
    - success: Boolean indicating if the action was successful
    - error_message: Optional error message for failed actions
    - timestamp: When the action occurred
    - ip_address: Optional IP address of the user

  3. Security
    - RLS enabled to protect audit logs
    - Only admins and medical directors can read audit logs
    - System can insert logs regardless of user permissions

  4. Performance
    - Indexes on user_id, timestamp, and action_type for fast queries
*/

-- Create laboratory_audit_logs table
CREATE TABLE IF NOT EXISTS laboratory_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  user_role TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'view', 'export', 'denied')),
  order_id UUID REFERENCES lab_orders(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  
  CONSTRAINT valid_action_type CHECK (action_type IN ('create', 'update', 'delete', 'view', 'export', 'denied'))
);

-- Enable Row Level Security
ALTER TABLE laboratory_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins and medical directors can read audit logs
CREATE POLICY "audit_logs_select_admin_only"
ON laboratory_audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin', 'medical_director')
  )
);

-- Policy: System can always insert audit logs (bypassed via service role)
CREATE POLICY "audit_logs_insert_system"
ON laboratory_audit_logs FOR INSERT
WITH CHECK (true);

-- No update or delete policies - audit logs are immutable

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_lab_audit_user_id ON laboratory_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_audit_timestamp ON laboratory_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lab_audit_action_type ON laboratory_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_lab_audit_order_id ON laboratory_audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_audit_success ON laboratory_audit_logs(success);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_lab_audit_user_timestamp ON laboratory_audit_logs(user_id, timestamp DESC);

-- Add table comment
COMMENT ON TABLE laboratory_audit_logs IS 'Audit trail for all laboratory module actions, including permission violations and security events';

-- Add column comments
COMMENT ON COLUMN laboratory_audit_logs.user_role IS 'Role stored for historical tracking, as user roles may change over time';
COMMENT ON COLUMN laboratory_audit_logs.action_type IS 'Type of action: create, update, delete, view, export, or denied (permission violation)';
COMMENT ON COLUMN laboratory_audit_logs.success IS 'Whether the action completed successfully (false for denied/failed actions)';
