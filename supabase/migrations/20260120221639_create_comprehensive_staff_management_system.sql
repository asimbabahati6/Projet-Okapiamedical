/*
  # Comprehensive Staff Management System

  1. New Tables
    - `staff_audit_trail` - Complete audit logging for all staff operations
    - `staff_pending_approvals` - Workflow management for staff changes
    - `staff_credentials_verification` - Track credential validation
    - `staff_employment_history` - Employment event tracking
    - `staff_versions` - Version control for staff data
    - `staff_deletion_approvals` - Multi-level deletion approval workflow
    - `staff_permanent_archive` - Long-term archival storage
    - `staff_audit_trail_permanent` - Immutable audit log
    - `sensitive_data_access_log` - Track access to sensitive fields

  2. Functions
    - `log_staff_changes()` - Automatic audit logging trigger
    - `create_staff_version()` - Automatic versioning on updates
    - `request_staff_update_approval()` - Request approval for changes
    - `soft_delete_staff()` - Soft delete with validation
    - `recover_deleted_staff()` - Restore archived staff
    - `log_sensitive_access()` - Log sensitive field access

  3. Security
    - RLS policies for all new tables
    - Field-level access control
    - Audit trail protection
*/

-- =====================================================
-- AUDIT TRAIL SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES medical_staff(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'created', 'updated', 'deleted', 'activated', 'deactivated',
    'license_updated', 'insurance_updated', 'credentials_verified',
    'profile_approved', 'profile_rejected', 'update_requested',
    'rolled_back', 'recovered'
  )),
  performed_by UUID NOT NULL REFERENCES user_profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  old_values JSONB,
  new_values JSONB,
  changes_summary TEXT,
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approval_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_audit_staff_id ON staff_audit_trail(staff_id, created_at DESC);
CREATE INDEX idx_staff_audit_performed_by ON staff_audit_trail(performed_by, created_at DESC);
CREATE INDEX idx_staff_audit_action ON staff_audit_trail(action, created_at DESC);

-- =====================================================
-- PENDING APPROVALS WORKFLOW
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_pending_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES medical_staff(id),
  approval_type TEXT NOT NULL CHECK (approval_type IN (
    'new_registration', 'profile_update', 'credential_change',
    'license_renewal', 'department_assignment'
  )),
  requested_by UUID NOT NULL REFERENCES user_profiles(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  data_payload JSONB NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_approvals_staff_id ON staff_pending_approvals(staff_id, status);
CREATE INDEX idx_staff_approvals_status ON staff_pending_approvals(status, priority, created_at);
CREATE INDEX idx_staff_approvals_requested_by ON staff_pending_approvals(requested_by);

-- =====================================================
-- CREDENTIALS VERIFICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_credentials_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL CHECK (credential_type IN (
    'rpps', 'adeli', 'license', 'insurance', 'certificate', 'degree'
  )),
  credential_number TEXT NOT NULL,
  issuing_authority TEXT,
  issue_date DATE,
  expiry_date DATE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN (
    'pending', 'verified', 'expired', 'invalid', 'suspended'
  )),
  verified_by UUID REFERENCES user_profiles(id),
  verified_at TIMESTAMPTZ,
  verification_method TEXT,
  document_url TEXT,
  notes TEXT,
  next_verification_date DATE,
  auto_reminder_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credentials_staff_id ON staff_credentials_verification(staff_id);
CREATE INDEX idx_credentials_expiry ON staff_credentials_verification(expiry_date) WHERE verification_status = 'verified';
CREATE INDEX idx_credentials_status ON staff_credentials_verification(verification_status);

-- =====================================================
-- EMPLOYMENT HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_employment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'hired', 'promoted', 'transferred', 'suspended', 'terminated', 'resigned', 'retired'
  )),
  event_date DATE NOT NULL,
  effective_date DATE NOT NULL,
  previous_position TEXT,
  new_position TEXT,
  previous_department_id UUID REFERENCES departments(id),
  new_department_id UUID REFERENCES departments(id),
  reason TEXT,
  processed_by UUID REFERENCES user_profiles(id),
  documentation_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employment_history_staff_id ON staff_employment_history(staff_id, event_date DESC);
CREATE INDEX idx_employment_history_event_type ON staff_employment_history(event_type, event_date DESC);

-- =====================================================
-- VERSION CONTROL
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  data_snapshot JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT FALSE,
  change_description TEXT,
  rollback_reason TEXT,
  UNIQUE(staff_id, version_number)
);

CREATE INDEX idx_staff_versions_staff_id ON staff_versions(staff_id, version_number DESC);
CREATE INDEX idx_staff_versions_current ON staff_versions(staff_id) WHERE is_current = TRUE;

-- =====================================================
-- SOFT DELETE COLUMNS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'deleted_at') THEN
    ALTER TABLE medical_staff ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'deleted_by') THEN
    ALTER TABLE medical_staff ADD COLUMN deleted_by UUID REFERENCES user_profiles(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'deletion_reason') THEN
    ALTER TABLE medical_staff ADD COLUMN deletion_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'deletion_type') THEN
    ALTER TABLE medical_staff ADD COLUMN deletion_type TEXT CHECK (
      deletion_type IN ('resigned', 'terminated', 'retired', 'transferred', 'deceased')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'final_work_date') THEN
    ALTER TABLE medical_staff ADD COLUMN final_work_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_staff' AND column_name = 'archive_retention_years') THEN
    ALTER TABLE medical_staff ADD COLUMN archive_retention_years INTEGER DEFAULT 10;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_medical_staff_deleted ON medical_staff(deleted_at) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- DELETION APPROVAL WORKFLOW
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_deletion_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES medical_staff(id),
  deletion_type TEXT NOT NULL,
  deletion_reason TEXT NOT NULL,
  final_work_date DATE NOT NULL,
  requested_by UUID NOT NULL REFERENCES user_profiles(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  hr_approved_by UUID REFERENCES user_profiles(id),
  hr_approved_at TIMESTAMPTZ,
  hr_comments TEXT,
  admin_approved_by UUID REFERENCES user_profiles(id),
  admin_approved_at TIMESTAMPTZ,
  admin_comments TEXT,
  final_approved_by UUID REFERENCES user_profiles(id),
  final_approved_at TIMESTAMPTZ,
  final_comments TEXT,
  approval_status TEXT DEFAULT 'pending_hr' CHECK (approval_status IN (
    'pending_hr', 'pending_admin', 'pending_final', 'approved', 'rejected'
  )),
  active_patients_count INTEGER,
  future_appointments_count INTEGER,
  on_call_schedules_count INTEGER,
  patient_reassignment_plan JSONB,
  appointment_handling_plan JSONB,
  notifications_sent JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deletion_approvals_staff_id ON staff_deletion_approvals(staff_id);
CREATE INDEX idx_deletion_approvals_status ON staff_deletion_approvals(approval_status, created_at);

-- =====================================================
-- PERMANENT ARCHIVE
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_permanent_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL,
  complete_data JSONB NOT NULL,
  medical_staff_data JSONB,
  user_profile_data JSONB,
  detail_tables_data JSONB,
  employment_history JSONB,
  audit_trail_summary JSONB,
  archived_by UUID REFERENCES user_profiles(id),
  archive_reason TEXT NOT NULL,
  archive_date TIMESTAMPTZ DEFAULT NOW(),
  retention_category TEXT CHECK (retention_category IN (
    'medical_personnel', 'terminated_cause', 'legal_hold', 'standard'
  )),
  legal_hold BOOLEAN DEFAULT FALSE,
  destruction_date DATE,
  destruction_approved_by UUID REFERENCES user_profiles(id),
  destroyed_at TIMESTAMPTZ,
  encryption_key_id TEXT,
  checksum TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_archive_staff_id ON staff_permanent_archive(staff_id);
CREATE INDEX idx_archive_destruction_date ON staff_permanent_archive(destruction_date) WHERE destroyed_at IS NULL;

-- =====================================================
-- IMMUTABLE AUDIT TRAIL
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_audit_trail_permanent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL,
  action TEXT NOT NULL,
  performed_by UUID NOT NULL,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  old_values JSONB,
  new_values JSONB,
  changes_summary TEXT,
  ip_address INET,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_permanent_staff_id ON staff_audit_trail_permanent(staff_id, created_at DESC);

-- =====================================================
-- SENSITIVE DATA ACCESS LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS sensitive_data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  accessed_by UUID NOT NULL REFERENCES user_profiles(id),
  access_type TEXT NOT NULL CHECK (access_type IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sensitive_access_record ON sensitive_data_access_log(table_name, record_id, created_at DESC);
CREATE INDEX idx_sensitive_access_user ON sensitive_data_access_log(accessed_by, created_at DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to log staff changes automatically
CREATE OR REPLACE FUNCTION log_staff_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB := '{}'::jsonb;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT jsonb_object_agg(key, jsonb_build_object('old', OLD_val, 'new', NEW_val))
    INTO v_changes
    FROM (
      SELECT key,
             to_jsonb(OLD)->key as OLD_val,
             to_jsonb(NEW)->key as NEW_val
      FROM jsonb_object_keys(to_jsonb(NEW)) as key
      WHERE to_jsonb(OLD)->key IS DISTINCT FROM to_jsonb(NEW)->key
    ) changes;
  END IF;

  INSERT INTO staff_audit_trail (
    staff_id,
    action,
    performed_by,
    ip_address,
    old_values,
    new_values,
    changes_summary
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    auth.uid(),
    inet_client_addr(),
    to_jsonb(OLD),
    to_jsonb(NEW),
    v_changes::text
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_medical_staff_changes ON medical_staff;
CREATE TRIGGER audit_medical_staff_changes
  AFTER INSERT OR UPDATE OR DELETE ON medical_staff
  FOR EACH ROW
  EXECUTE FUNCTION log_staff_changes();

-- Function to create staff version automatically
CREATE OR REPLACE FUNCTION create_staff_version()
RETURNS TRIGGER AS $$
DECLARE
  v_version_number INTEGER;
BEGIN
  IF TG_OP != 'UPDATE' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM staff_versions
  WHERE staff_id = NEW.id;

  UPDATE staff_versions
  SET is_current = FALSE
  WHERE staff_id = NEW.id
  AND is_current = TRUE;

  INSERT INTO staff_versions (
    staff_id,
    version_number,
    data_snapshot,
    created_by,
    is_current,
    change_description
  ) VALUES (
    NEW.id,
    v_version_number,
    to_jsonb(NEW),
    auth.uid(),
    TRUE,
    'Automatic version created on update'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS version_medical_staff ON medical_staff;
CREATE TRIGGER version_medical_staff
  AFTER UPDATE ON medical_staff
  FOR EACH ROW
  EXECUTE FUNCTION create_staff_version();

-- Function to log sensitive field access
CREATE OR REPLACE FUNCTION log_sensitive_access()
RETURNS TRIGGER AS $$
DECLARE
  v_sensitive_fields TEXT[] := ARRAY[
    'license_number', 'rpps_number', 'adeli_number', 'professional_insurance_number',
    'digital_signature_certificate'
  ];
  v_field TEXT;
BEGIN
  FOREACH v_field IN ARRAY v_sensitive_fields
  LOOP
    IF (NEW IS NOT NULL AND (to_jsonb(NEW)->>v_field) IS NOT NULL) OR
       (OLD IS NOT NULL AND (to_jsonb(OLD)->>v_field) IS NOT NULL) THEN
      INSERT INTO sensitive_data_access_log (
        table_name,
        record_id,
        field_name,
        accessed_by,
        access_type,
        ip_address
      ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        v_field,
        auth.uid(),
        TG_OP,
        inet_client_addr()
      );
    END IF;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_sensitive_medical_staff_access ON medical_staff;
CREATE TRIGGER log_sensitive_medical_staff_access
  AFTER INSERT OR UPDATE OR DELETE ON medical_staff
  FOR EACH ROW
  EXECUTE FUNCTION log_sensitive_access();

-- Function to request staff update approval
CREATE OR REPLACE FUNCTION request_staff_update_approval(
  p_staff_id UUID,
  p_field_name TEXT,
  p_old_value JSONB,
  p_new_value JSONB,
  p_reason TEXT
) RETURNS UUID AS $$
DECLARE
  v_approval_id UUID;
  v_approval_type TEXT;
  v_required_role TEXT;
BEGIN
  v_approval_type := CASE
    WHEN p_field_name IN ('rpps_number', 'adeli_number', 'license_number')
      THEN 'credential_change'
    WHEN p_field_name IN ('staff_type', 'practice_mode', 'can_prescribe_controlled_substances')
      THEN 'profile_update'
    ELSE 'profile_update'
  END;

  v_required_role := CASE
    WHEN p_field_name IN ('rpps_number', 'adeli_number', 'license_number')
      THEN 'super_admin'
    WHEN p_field_name IN ('professional_insurance_expiry', 'billing_sector')
      THEN 'hospital_admin'
    ELSE 'hr_manager'
  END;

  INSERT INTO staff_pending_approvals (
    staff_id,
    approval_type,
    requested_by,
    data_payload,
    priority,
    expires_at
  ) VALUES (
    p_staff_id,
    v_approval_type,
    auth.uid(),
    jsonb_build_object(
      'field_name', p_field_name,
      'old_value', p_old_value,
      'new_value', p_new_value,
      'reason', p_reason,
      'required_role', v_required_role
    ),
    CASE
      WHEN p_field_name = 'professional_insurance_expiry' AND
           (p_new_value->>'date')::date < CURRENT_DATE + INTERVAL '30 days'
        THEN 'urgent'
      ELSE 'normal'
    END,
    NOW() + INTERVAL '7 days'
  )
  RETURNING id INTO v_approval_id;

  INSERT INTO staff_audit_trail (
    staff_id,
    action,
    performed_by,
    old_values,
    new_values,
    approval_status
  ) VALUES (
    p_staff_id,
    'update_requested',
    auth.uid(),
    p_old_value,
    p_new_value,
    'pending'
  );

  RETURN v_approval_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for soft delete
CREATE OR REPLACE FUNCTION soft_delete_staff(
  p_staff_id UUID,
  p_deletion_type TEXT,
  p_reason TEXT,
  p_final_work_date DATE DEFAULT CURRENT_DATE
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_active_patients INTEGER;
  v_has_future_appointments INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to delete staff';
  END IF;

  SELECT COUNT(*) INTO v_has_active_patients
  FROM patients
  WHERE primary_care_physician_id = p_staff_id
  AND created_at >= CURRENT_DATE - INTERVAL '1 year';

  SELECT COUNT(*) INTO v_has_future_appointments
  FROM appointments
  WHERE doctor_id = p_staff_id
  AND appointment_date > CURRENT_DATE
  AND status NOT IN ('cancelled', 'no_show');

  IF v_has_active_patients > 0 THEN
    RAISE EXCEPTION 'Staff has % active patients. Reassign patients before deletion.', v_has_active_patients;
  END IF;

  IF v_has_future_appointments > 0 THEN
    RAISE EXCEPTION 'Staff has % future appointments. Cancel/reassign before deletion.', v_has_future_appointments;
  END IF;

  UPDATE medical_staff
  SET
    deleted_at = NOW(),
    deleted_by = auth.uid(),
    deletion_reason = p_reason,
    deletion_type = p_deletion_type,
    final_work_date = p_final_work_date,
    is_accepting_patients = FALSE,
    current_status = 'off_duty',
    updated_at = NOW()
  WHERE id = p_staff_id
  AND deleted_at IS NULL;

  UPDATE user_profiles
  SET is_active = FALSE
  WHERE id = p_staff_id;

  UPDATE appointment_slots
  SET is_active = FALSE
  WHERE doctor_id = p_staff_id;

  INSERT INTO staff_employment_history (
    staff_id,
    event_type,
    event_date,
    effective_date,
    reason,
    processed_by
  ) VALUES (
    p_staff_id,
    p_deletion_type,
    CURRENT_DATE,
    p_final_work_date,
    p_reason,
    auth.uid()
  );

  INSERT INTO staff_audit_trail (
    staff_id,
    action,
    performed_by,
    changes_summary
  ) VALUES (
    p_staff_id,
    'deleted',
    auth.uid(),
    format('Soft deleted. Type: %s, Reason: %s', p_deletion_type, p_reason)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to recover deleted staff
CREATE OR REPLACE FUNCTION recover_deleted_staff(
  p_staff_id UUID,
  p_recovery_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_staff_exists BOOLEAN;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions for data recovery';
  END IF;

  SELECT deleted_at IS NOT NULL INTO v_staff_exists
  FROM medical_staff
  WHERE id = p_staff_id;

  IF NOT v_staff_exists THEN
    RAISE EXCEPTION 'Staff not found or not deleted';
  END IF;

  UPDATE medical_staff
  SET
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL,
    deletion_type = NULL,
    is_accepting_patients = FALSE,
    current_status = 'off_duty',
    updated_at = NOW()
  WHERE id = p_staff_id;

  UPDATE user_profiles
  SET is_active = TRUE
  WHERE id = p_staff_id;

  INSERT INTO staff_audit_trail (
    staff_id,
    action,
    performed_by,
    changes_summary
  ) VALUES (
    p_staff_id,
    'recovered',
    auth.uid(),
    format('Staff recovered. Reason: %s', p_recovery_reason)
  );

  INSERT INTO staff_employment_history (
    staff_id,
    event_type,
    event_date,
    effective_date,
    reason,
    processed_by
  ) VALUES (
    p_staff_id,
    'hired',
    CURRENT_DATE,
    CURRENT_DATE,
    'Recovered: ' || p_recovery_reason,
    auth.uid()
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE staff_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_pending_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_credentials_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_employment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_deletion_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_permanent_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_audit_trail_permanent ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs" ON staff_audit_trail FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager'))
);

CREATE POLICY "Staff can view own audit logs" ON staff_audit_trail FOR SELECT TO authenticated USING (staff_id = auth.uid());

CREATE POLICY "Authorized users can view pending approvals" ON staff_pending_approvals FOR SELECT TO authenticated USING (
  requested_by = auth.uid() OR EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager'))
);

CREATE POLICY "Authorized users can create approval requests" ON staff_pending_approvals FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager', 'department_head'))
);

CREATE POLICY "Approvers can update approvals" ON staff_pending_approvals FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager'))
);

CREATE POLICY "Admins can view all credentials" ON staff_credentials_verification FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager'))
);

CREATE POLICY "Staff can view own credentials" ON staff_credentials_verification FOR SELECT TO authenticated USING (staff_id = auth.uid());

CREATE POLICY "Admins can manage credentials" ON staff_credentials_verification FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager'))
);

CREATE POLICY "Admins can view all employment history" ON staff_employment_history FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager'))
);

CREATE POLICY "Staff can view own employment history" ON staff_employment_history FOR SELECT TO authenticated USING (staff_id = auth.uid());

CREATE POLICY "Admins can create employment history" ON staff_employment_history FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager'))
);

CREATE POLICY "Admins can view all versions" ON staff_versions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager'))
);

CREATE POLICY "Staff can view own versions" ON staff_versions FOR SELECT TO authenticated USING (staff_id = auth.uid());

CREATE POLICY "Authorized users can view deletion approvals" ON staff_deletion_approvals FOR SELECT TO authenticated USING (
  requested_by = auth.uid() OR EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager'))
);

CREATE POLICY "Admins can create deletion approvals" ON staff_deletion_approvals FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager'))
);

CREATE POLICY "Approvers can update deletion approvals" ON staff_deletion_approvals FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager'))
);

CREATE POLICY "Super admins can view archives" ON staff_permanent_archive FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name = 'super_admin')
);

CREATE POLICY "Super admins can create archives" ON staff_permanent_archive FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name = 'super_admin')
);

CREATE POLICY "audit_append_only" ON staff_audit_trail_permanent FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "audit_no_delete" ON staff_audit_trail_permanent FOR DELETE TO authenticated USING (false);
CREATE POLICY "audit_no_update" ON staff_audit_trail_permanent FOR UPDATE TO authenticated USING (false);

CREATE POLICY "admins_can_view_permanent_audit" ON staff_audit_trail_permanent FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'hospital_admin'))
);

CREATE POLICY "admins_can_view_sensitive_access_log" ON sensitive_data_access_log FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'hospital_admin'))
);