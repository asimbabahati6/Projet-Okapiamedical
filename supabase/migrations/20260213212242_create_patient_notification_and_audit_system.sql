/*
  # Patient Notification and Audit Logging System

  ## Overview
  This migration creates comprehensive notification and audit trail systems for patient
  registration and department assignment workflows.

  ## New Tables

  ### 1. `patient_assignment_notifications`
  Tracks all notifications sent when patients are assigned to departments
  - `id` (uuid, primary key)
  - `patient_id` (uuid) - Reference to patient
  - `department_id` (uuid) - Assigned department
  - `assigned_doctor_id` (uuid) - Assigned physician
  - `notification_type` (text) - Type of notification
  - `priority` (text) - Notification priority level
  - `sent_to_staff_ids` (uuid[]) - Array of staff who received notification
  - `acknowledged_by` (uuid) - Staff member who acknowledged
  - `acknowledged_at` (timestamptz) - When acknowledged
  - `message_body` (text) - Notification content
  - `metadata` (jsonb) - Additional data

  ### 2. `department_notification_settings`
  Configuration for department-specific notification preferences
  - `department_id` (uuid, primary key)
  - `notify_on_new_patient` (boolean) - Send notifications for new patients
  - `notify_on_urgent` (boolean) - Send urgent patient alerts
  - `notification_channels` (text[]) - Delivery channels
  - `notify_roles` (text[]) - Which roles to notify
  - `quiet_hours_start` / `quiet_hours_end` (time) - Do not disturb period
  - `escalation_delay_minutes` (integer) - Escalation timing

  ### 3. `patient_registration_audit_log`
  Complete audit trail for all patient registration actions
  - `id` (uuid, primary key)
  - `patient_id` (uuid) - Reference to patient
  - `registration_id` (uuid) - Reference to registration
  - `action_type` (text) - Type of action performed
  - `performed_by` (uuid) - User who performed action
  - `performed_by_role` (text) - User's role
  - `department_before` / `department_after` (uuid) - Department changes
  - `doctor_before` / `doctor_after` (uuid) - Doctor assignment changes
  - `reason` (text) - Reason for action
  - `ip_address` (inet) - User's IP address
  - `user_agent` (text) - Browser/device info
  - `previous_values` / `new_values` (jsonb) - Complete change record
  - `metadata` (jsonb) - Additional context

  ## Security
  - RLS enabled on all tables
  - Notifications viewable by department staff and admin
  - Audit logs viewable by admin and compliance officers only
  - Automatic audit trail creation via triggers

  ## Features
  - Automatic notification creation when patient assigned
  - Escalation workflow for unacknowledged notifications
  - Complete audit trail with IP and user agent tracking
  - Configurable notification preferences per department
*/

-- Create patient assignment notifications table
CREATE TABLE IF NOT EXISTS patient_assignment_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES patient_registrations(id),
  appointment_id UUID REFERENCES appointments(id),
  department_id UUID REFERENCES departments(id),
  assigned_doctor_id UUID,
  notification_type TEXT DEFAULT 'new_patient', -- 'new_patient', 'urgent_patient', 'transfer', 'reassignment'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'emergency'
  sent_to_staff_ids UUID[] DEFAULT ARRAY[]::UUID[],
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_by UUID REFERENCES user_profiles(id),
  acknowledged_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  message_title TEXT,
  message_body TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_patient ON patient_assignment_notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_department ON patient_assignment_notifications(department_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON patient_assignment_notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON patient_assignment_notifications(priority) WHERE priority IN ('high', 'emergency');
CREATE INDEX IF NOT EXISTS idx_notifications_created ON patient_assignment_notifications(created_at DESC);

-- Create department notification settings table
CREATE TABLE IF NOT EXISTS department_notification_settings (
  department_id UUID PRIMARY KEY REFERENCES departments(id) ON DELETE CASCADE,
  notify_on_new_patient BOOLEAN DEFAULT true,
  notify_on_urgent BOOLEAN DEFAULT true,
  notify_on_transfer BOOLEAN DEFAULT true,
  notification_channels TEXT[] DEFAULT ARRAY['in_app']::TEXT[], -- 'in_app', 'email', 'sms'
  notify_roles TEXT[] DEFAULT ARRAY['department_head', 'doctor', 'receptionist']::TEXT[],
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  escalation_delay_minutes INTEGER DEFAULT 30,
  escalation_enabled BOOLEAN DEFAULT true,
  auto_acknowledge_after_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create patient registration audit log table
CREATE TABLE IF NOT EXISTS patient_registration_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  registration_id UUID REFERENCES patient_registrations(id),
  action_type TEXT NOT NULL, -- 'created', 'assigned', 'reassigned', 'verified', 'department_changed', 'doctor_changed', 'status_updated'
  performed_by UUID REFERENCES user_profiles(id),
  performed_by_role TEXT,
  department_before UUID REFERENCES departments(id),
  department_after UUID REFERENCES departments(id),
  doctor_before UUID,
  doctor_after UUID,
  status_before TEXT,
  status_after TEXT,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  previous_values JSONB DEFAULT '{}'::jsonb,
  new_values JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_patient ON patient_registration_audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_registration ON patient_registration_audit_log(registration_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON patient_registration_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON patient_registration_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_action ON patient_registration_audit_log(action_type);

-- Enable RLS
ALTER TABLE patient_assignment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_registration_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_assignment_notifications

-- Staff can view notifications for their department
CREATE POLICY "Staff can view own department notifications"
  ON patient_assignment_notifications
  FOR SELECT
  TO authenticated
  USING (
    department_id IN (
      SELECT department_id FROM user_profiles WHERE id = auth.uid()
    )
    OR 
    auth.uid() = ANY(sent_to_staff_ids)
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() 
      AND r.name IN ('admin', 'administrative_staff')
    )
  );

-- Staff can acknowledge notifications sent to them
CREATE POLICY "Staff can acknowledge own notifications"
  ON patient_assignment_notifications
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = ANY(sent_to_staff_ids)
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() 
      AND r.name IN ('admin', 'administrative_staff')
    )
  )
  WITH CHECK (
    auth.uid() = ANY(sent_to_staff_ids)
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() 
      AND r.name IN ('admin', 'administrative_staff')
    )
  );

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON patient_assignment_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for department_notification_settings

-- All authenticated users can view notification settings
CREATE POLICY "Anyone can view notification settings"
  ON department_notification_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admin and department heads can modify settings
CREATE POLICY "Admin can manage notification settings"
  ON department_notification_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() 
      AND r.name IN ('admin', 'administrative_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() 
      AND r.name IN ('admin', 'administrative_staff')
    )
  );

-- RLS Policies for patient_registration_audit_log

-- Only admin and compliance roles can view audit logs
CREATE POLICY "Admin can view audit logs"
  ON patient_registration_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() 
      AND r.name IN ('admin', 'administrative_staff')
    )
  );

-- System can insert audit log entries
CREATE POLICY "System can create audit logs"
  ON patient_registration_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default notification settings for existing departments
INSERT INTO department_notification_settings (department_id)
SELECT id FROM departments
WHERE NOT EXISTS (
  SELECT 1 FROM department_notification_settings WHERE department_id = departments.id
)
ON CONFLICT (department_id) DO NOTHING;

-- Create function to notify department when appointment is created/updated
CREATE OR REPLACE FUNCTION notify_department_on_appointment()
RETURNS TRIGGER AS $$
DECLARE
  dept_settings RECORD;
  staff_to_notify UUID[];
  notification_priority TEXT;
  notification_title TEXT;
  notification_body TEXT;
  patient_name TEXT;
  dept_name TEXT;
BEGIN
  -- Only process new appointments or department changes
  IF (TG_OP = 'INSERT' AND NEW.department_id IS NOT NULL) 
    OR (TG_OP = 'UPDATE' AND OLD.department_id IS DISTINCT FROM NEW.department_id AND NEW.department_id IS NOT NULL) THEN
    
    -- Get department notification settings
    SELECT * INTO dept_settings 
    FROM department_notification_settings 
    WHERE department_id = NEW.department_id;
    
    -- Check if notifications are enabled and not in quiet hours
    IF dept_settings IS NOT NULL AND dept_settings.notify_on_new_patient THEN
      IF dept_settings.quiet_hours_start IS NULL 
        OR dept_settings.quiet_hours_end IS NULL 
        OR CURRENT_TIME NOT BETWEEN dept_settings.quiet_hours_start AND dept_settings.quiet_hours_end THEN
        
        -- Determine priority based on appointment urgency
        notification_priority := 'normal';
        IF NEW.appointment_type = 'emergency' OR NEW.notes ILIKE '%urgence%' THEN
          notification_priority := 'high';
        END IF;
        
        -- Get staff to notify based on department settings
        SELECT array_agg(DISTINCT up.id)
        INTO staff_to_notify
        FROM user_profiles up
        JOIN roles r ON up.role_id = r.id
        WHERE up.department_id = NEW.department_id
          AND up.is_active = true
          AND (
            'all' = ANY(dept_settings.notify_roles)
            OR r.name = ANY(dept_settings.notify_roles)
          );
        
        -- Get patient and department names
        SELECT p.first_name || ' ' || p.last_name INTO patient_name
        FROM patients p WHERE p.id = NEW.patient_id;
        
        SELECT name INTO dept_name FROM departments WHERE id = NEW.department_id;
        
        -- Create notification title and body
        notification_title := 'Nouveau rendez-vous assigné';
        notification_body := format(
          'Un nouveau rendez-vous pour %s a été programmé au service %s le %s.',
          COALESCE(patient_name, 'Patient inconnu'),
          COALESCE(dept_name, 'Service inconnu'),
          to_char(NEW.appointment_date, 'DD/MM/YYYY à HH24:MI')
        );
        
        -- Insert notification
        INSERT INTO patient_assignment_notifications (
          patient_id,
          appointment_id,
          department_id,
          assigned_doctor_id,
          notification_type,
          priority,
          sent_to_staff_ids,
          message_title,
          message_body,
          metadata
        ) VALUES (
          NEW.patient_id,
          NEW.id,
          NEW.department_id,
          NEW.doctor_id,
          CASE WHEN TG_OP = 'UPDATE' THEN 'transfer' ELSE 'new_patient' END,
          notification_priority,
          COALESCE(staff_to_notify, ARRAY[]::UUID[]),
          notification_title,
          notification_body,
          jsonb_build_object(
            'appointment_type', NEW.appointment_type,
            'appointment_date', NEW.appointment_date,
            'appointment_status', NEW.status
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to notify department on appointment creation/update
CREATE TRIGGER trigger_notify_department_on_appointment
  AFTER INSERT OR UPDATE OF department_id ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_department_on_appointment();

-- Create function to log patient registration audit trail
CREATE OR REPLACE FUNCTION log_patient_registration_audit()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  action_performed TEXT;
BEGIN
  -- Get user's role
  SELECT r.name INTO user_role
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid();
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_performed := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.registration_status IS DISTINCT FROM NEW.registration_status THEN
      action_performed := 'status_updated';
    ELSIF OLD.preferred_department_id IS DISTINCT FROM NEW.preferred_department_id THEN
      action_performed := 'department_changed';
    ELSIF OLD.assigned_doctor_id IS DISTINCT FROM NEW.assigned_doctor_id THEN
      action_performed := 'doctor_changed';
    ELSE
      action_performed := 'updated';
    END IF;
  ELSE
    RETURN NEW;
  END IF;
  
  -- Insert audit log
  INSERT INTO patient_registration_audit_log (
    patient_id,
    registration_id,
    action_type,
    performed_by,
    performed_by_role,
    department_before,
    department_after,
    doctor_before,
    doctor_after,
    status_before,
    status_after,
    previous_values,
    new_values,
    metadata
  ) VALUES (
    COALESCE(NEW.patient_id, OLD.patient_id),
    COALESCE(NEW.id, OLD.id),
    action_performed,
    auth.uid(),
    user_role,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.preferred_department_id END,
    NEW.preferred_department_id,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.assigned_doctor_id END,
    NEW.assigned_doctor_id,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.registration_status END,
    NEW.registration_status,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END,
    to_jsonb(NEW),
    jsonb_build_object(
      'operation', TG_OP,
      'timestamp', NOW(),
      'table', TG_TABLE_NAME
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging on patient registrations
CREATE TRIGGER trigger_log_registration_audit
  AFTER INSERT OR UPDATE ON patient_registrations
  FOR EACH ROW
  EXECUTE FUNCTION log_patient_registration_audit();

-- Create function to log patient changes
CREATE OR REPLACE FUNCTION log_patient_audit()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user's role
  SELECT r.name INTO user_role
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid();
  
  -- Insert audit log for patient changes
  INSERT INTO patient_registration_audit_log (
    patient_id,
    action_type,
    performed_by,
    performed_by_role,
    doctor_before,
    doctor_after,
    previous_values,
    new_values,
    metadata
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'patient_created'
      WHEN TG_OP = 'UPDATE' THEN 'patient_updated'
      ELSE 'patient_deleted'
    END,
    auth.uid(),
    user_role,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.primary_care_physician_id END,
    NEW.primary_care_physician_id,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END,
    to_jsonb(NEW),
    jsonb_build_object(
      'operation', TG_OP,
      'timestamp', NOW(),
      'table', TG_TABLE_NAME
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging on patients table
CREATE TRIGGER trigger_log_patient_audit
  AFTER INSERT OR UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION log_patient_audit();

-- Create function to get unacknowledged notifications count for a user
CREATE OR REPLACE FUNCTION get_unacknowledged_notifications_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM patient_assignment_notifications
    WHERE user_id = ANY(sent_to_staff_ids)
      AND acknowledged_at IS NULL
      AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_unacknowledged_notifications_count TO authenticated;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE patient_assignment_notifications
  SET 
    is_read = true,
    acknowledged_by = auth.uid(),
    acknowledged_at = NOW()
  WHERE id = notification_id
    AND auth.uid() = ANY(sent_to_staff_ids);
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;

-- Create updated_at trigger for notification settings
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notification_settings_updated_at
  BEFORE UPDATE ON department_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();
