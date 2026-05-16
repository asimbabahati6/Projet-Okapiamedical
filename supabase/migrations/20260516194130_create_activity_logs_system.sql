/*
  # Create Activity Logs System

  1. New Tables
    - `activity_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `user_name` (text) - Cached user name at time of action
      - `user_role` (text) - Cached user role at time of action
      - `action` (text) - Type: login, logout, create, update, delete, validate, cancel, transfer, close, generate, print, approve, return
      - `module` (text) - Module: auth, patients, appointments, consultations, reports, expenses, roles, users, pharmacy, laboratory, radiology
      - `description` (text) - Human-readable description of what happened
      - `ip_address` (text) - Client IP address if available
      - `metadata` (jsonb) - Additional context data
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `activity_logs` table
    - Admin/medical_director can read all logs
    - Authenticated users can insert their own logs
    - No update or delete allowed (immutable audit trail)

  3. Indexes
    - created_at for time-based queries
    - user_id for user filtering
    - module for module filtering
    - action for action filtering
*/

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  user_name text NOT NULL DEFAULT '',
  user_role text NOT NULL DEFAULT '',
  action text NOT NULL,
  module text NOT NULL,
  description text NOT NULL DEFAULT '',
  ip_address text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON activity_logs(module);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_role ON activity_logs(user_role);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'super_admin', 'hospital_admin', 'directeur_general')
    )
  );

-- Authenticated users can insert their own logs
CREATE POLICY "Users can insert own activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
