-- Create Automated Break Management System with Email Notifications
-- 
-- Overview:
-- Implements intelligent break management workflow with automatic time-based controls,
-- email notifications at 30-minute threshold, forced break ending at 60 minutes,
-- and supervisor escalation system.

-- Add break management columns to attendance_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_settings' AND column_name = 'break_warning_threshold_minutes'
  ) THEN
    ALTER TABLE attendance_settings ADD COLUMN break_warning_threshold_minutes integer DEFAULT 30;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_settings' AND column_name = 'max_break_duration_minutes'
  ) THEN
    ALTER TABLE attendance_settings ADD COLUMN max_break_duration_minutes integer DEFAULT 60;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_settings' AND column_name = 'minimum_work_hours_before_break'
  ) THEN
    ALTER TABLE attendance_settings ADD COLUMN minimum_work_hours_before_break decimal(4, 2) DEFAULT 4.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_settings' AND column_name = 'minimum_work_hours_after_break'
  ) THEN
    ALTER TABLE attendance_settings ADD COLUMN minimum_work_hours_after_break decimal(4, 2) DEFAULT 4.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_settings' AND column_name = 'checkout_grace_window_hours'
  ) THEN
    ALTER TABLE attendance_settings ADD COLUMN checkout_grace_window_hours decimal(4, 2) DEFAULT 2.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_settings' AND column_name = 'early_break_warning_enabled'
  ) THEN
    ALTER TABLE attendance_settings ADD COLUMN early_break_warning_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Update existing attendance_settings record with default break values
UPDATE attendance_settings
SET 
  break_warning_threshold_minutes = COALESCE(break_warning_threshold_minutes, 30),
  max_break_duration_minutes = COALESCE(max_break_duration_minutes, 60),
  minimum_work_hours_before_break = COALESCE(minimum_work_hours_before_break, 4.0),
  minimum_work_hours_after_break = COALESCE(minimum_work_hours_after_break, 4.0),
  checkout_grace_window_hours = COALESCE(checkout_grace_window_hours, 2.0),
  early_break_warning_enabled = COALESCE(early_break_warning_enabled, true);

-- Add break tracking columns to attendance_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'break_warning_sent'
  ) THEN
    ALTER TABLE attendance_records ADD COLUMN break_warning_sent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'break_exceeded_notification_sent'
  ) THEN
    ALTER TABLE attendance_records ADD COLUMN break_exceeded_notification_sent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'break_forced_end_time'
  ) THEN
    ALTER TABLE attendance_records ADD COLUMN break_forced_end_time timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'forced_by_system'
  ) THEN
    ALTER TABLE attendance_records ADD COLUMN forced_by_system boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'supervisor_notified'
  ) THEN
    ALTER TABLE attendance_records ADD COLUMN supervisor_notified boolean DEFAULT false;
  END IF;
END $$;

-- Create break_notifications table
CREATE TABLE IF NOT EXISTS break_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  attendance_record_id uuid REFERENCES attendance_records(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('warning_30min', 'exceeded_60min', 'supervisor_escalation', 'early_break_warning')),
  recipient_email text NOT NULL,
  notification_content text NOT NULL,
  sent_at timestamptz,
  delivery_status text NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create break_escalations table
CREATE TABLE IF NOT EXISTS break_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  supervisor_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  attendance_record_id uuid REFERENCES attendance_records(id) ON DELETE CASCADE NOT NULL,
  break_exceeded_minutes integer NOT NULL,
  escalated_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES user_profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create break_audit_log table
CREATE TABLE IF NOT EXISTS break_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  attendance_record_id uuid REFERENCES attendance_records(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('break_start', 'break_warning', 'break_exceeded', 'break_forced_end', 'break_end', 'early_break_taken')),
  action_timestamp timestamptz NOT NULL DEFAULT now(),
  system_triggered boolean DEFAULT false,
  work_hours_at_action decimal(6, 2),
  break_duration_at_action integer,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create email_queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES break_notifications(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  priority integer DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_break_notifications_staff_id ON break_notifications(staff_id);
CREATE INDEX IF NOT EXISTS idx_break_notifications_type ON break_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_break_notifications_status ON break_notifications(delivery_status);
CREATE INDEX IF NOT EXISTS idx_break_notifications_record ON break_notifications(attendance_record_id);

CREATE INDEX IF NOT EXISTS idx_break_escalations_staff_id ON break_escalations(staff_id);
CREATE INDEX IF NOT EXISTS idx_break_escalations_supervisor_id ON break_escalations(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_break_escalations_escalated_at ON break_escalations(escalated_at DESC);
CREATE INDEX IF NOT EXISTS idx_break_escalations_acknowledged ON break_escalations(acknowledged_at) WHERE acknowledged_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_break_audit_staff_id ON break_audit_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_break_audit_action_type ON break_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_break_audit_timestamp ON break_audit_log(action_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(processed_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_queue_retry ON email_queue(next_retry_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority DESC, created_at ASC) WHERE processed_at IS NULL;

-- Enable Row Level Security
ALTER TABLE break_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for break_notifications
CREATE POLICY "Staff can view own break notifications"
  ON break_notifications FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ));

CREATE POLICY "System can insert break notifications"
  ON break_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage break notifications"
  ON break_notifications FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ));

-- RLS Policies for break_escalations
CREATE POLICY "Staff can view own break escalations"
  ON break_escalations FOR SELECT
  TO authenticated
  USING (
    staff_id = auth.uid() 
    OR supervisor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

CREATE POLICY "System can create break escalations"
  ON break_escalations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Supervisors can acknowledge escalations"
  ON break_escalations FOR UPDATE
  TO authenticated
  USING (
    supervisor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for break_audit_log
CREATE POLICY "Staff can view own break audit logs"
  ON break_audit_log FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ));

CREATE POLICY "System can insert audit logs"
  ON break_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for email_queue
CREATE POLICY "Admins can view email queue"
  ON email_queue FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ));

CREATE POLICY "System can manage email queue"
  ON email_queue FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to calculate work hours from check-in
CREATE OR REPLACE FUNCTION calculate_work_hours(
  check_in_time timestamptz,
  end_time timestamptz DEFAULT now()
)
RETURNS decimal AS $$
BEGIN
  RETURN ROUND(EXTRACT(EPOCH FROM (end_time - check_in_time)) / 3600.0, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to calculate break duration in minutes
CREATE OR REPLACE FUNCTION calculate_break_duration_minutes(
  break_start_time timestamptz,
  break_end_time timestamptz DEFAULT NULL,
  reference_time timestamptz DEFAULT now()
)
RETURNS integer AS $$
BEGIN
  IF break_end_time IS NOT NULL THEN
    RETURN EXTRACT(EPOCH FROM (break_end_time - break_start_time))::integer / 60;
  ELSE
    RETURN EXTRACT(EPOCH FROM (reference_time - break_start_time))::integer / 60;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to find supervisor for a staff member
CREATE OR REPLACE FUNCTION find_staff_supervisor(staff_user_id uuid)
RETURNS uuid AS $$
DECLARE
  supervisor_id uuid;
BEGIN
  SELECT up.id INTO supervisor_id
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE r.name IN ('hospital_admin', 'super_admin')
  AND up.is_active = true
  ORDER BY r.level DESC
  LIMIT 1;
  
  RETURN supervisor_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for break compliance monitoring
CREATE OR REPLACE VIEW break_compliance_report AS
SELECT 
  ar.staff_id,
  up.full_name as staff_name,
  ar.date,
  ar.check_in_time,
  ar.break_start_time,
  ar.break_end_time,
  calculate_work_hours(ar.check_in_time, COALESCE(ar.break_start_time, now())) as hours_before_break,
  calculate_break_duration_minutes(ar.break_start_time, ar.break_end_time) as break_duration_minutes,
  ar.break_warning_sent,
  ar.break_exceeded_notification_sent,
  ar.forced_by_system,
  ar.supervisor_notified,
  CASE 
    WHEN ar.forced_by_system THEN 'Pause terminée automatiquement'
    WHEN calculate_break_duration_minutes(ar.break_start_time, ar.break_end_time) > 60 THEN 'Pause dépassée'
    WHEN calculate_break_duration_minutes(ar.break_start_time, ar.break_end_time) >= 30 THEN 'Avertissement envoyé'
    ELSE 'Conforme'
  END as compliance_status
FROM attendance_records ar
JOIN user_profiles up ON ar.staff_id = up.id
WHERE ar.break_start_time IS NOT NULL
ORDER BY ar.date DESC, ar.check_in_time DESC;

GRANT SELECT ON break_compliance_report TO authenticated;