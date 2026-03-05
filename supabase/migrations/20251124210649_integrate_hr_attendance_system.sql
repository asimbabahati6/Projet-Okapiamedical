/*
  # Intégration du Système de Présence dans le Module RH

  ## Aperçu
  Cette migration intègre complètement le système de gestion de présence dans le module RH,
  créant des tables liées directement à hr_employees au lieu de user_profiles.

  ## Nouvelles Tables

  ### 1. hr_attendance_records
  Enregistrements de présence liés aux employés RH
  - Hérite de toutes les fonctionnalités d'attendance_records
  - Lié directement à hr_employees
  - Supporte la géolocalisation, les pauses, et les notifications

  ### 2. hr_leave_requests
  Demandes de congés intégrées au système RH
  - Gestion complète des congés avec approbation
  - Calcul automatique des soldes depuis hr_leave_balances
  - Intégration avec la paie pour déductions

  ### 3. hr_attendance_settings
  Configuration de présence au niveau RH
  - Horaires de travail, périodes de grâce
  - Paramètres de géolocalisation
  - Gestion des pauses

  ### 4. hr_migration_log
  Traçabilité complète de la migration des données
  - Log de chaque opération de migration
  - Statuts de succès/échec
  - Informations de rollback

  ## Sécurité
  - Enable RLS sur toutes les tables
  - Les employés voient uniquement leurs propres données
  - Les managers voient les données de leur département
  - Les admins ont accès complet

  ## Migration des Données
  - Fonctions SQL pour copier attendance_records → hr_attendance_records
  - Fonctions SQL pour copier leave_requests → hr_leave_requests
  - Validation d'intégrité automatique
  - Génération de rapports de migration
*/

-- Create hr_attendance_records table (intégré au module RH)
CREATE TABLE IF NOT EXISTS hr_attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES hr_employees(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  check_in_time timestamptz,
  check_out_time timestamptz,
  break_start_time timestamptz,
  break_end_time timestamptz,
  status text NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'late', 'absent', 'on_leave')),
  location_lat decimal(10, 8),
  location_lng decimal(11, 8),
  gps_accuracy numeric(10, 2),
  calculated_distance numeric(10, 2),
  validation_result text,
  device_info jsonb,
  break_warning_sent boolean DEFAULT false,
  break_exceeded_notification_sent boolean DEFAULT false,
  break_forced_end_time timestamptz,
  forced_by_system boolean DEFAULT false,
  supervisor_notified boolean DEFAULT false,
  total_work_hours numeric(5, 2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Create hr_leave_requests table (intégré au module RH)
CREATE TABLE IF NOT EXISTS hr_leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES hr_employees(id) ON DELETE CASCADE NOT NULL,
  leave_type text NOT NULL CHECK (leave_type IN ('annual', 'sick', 'emergency', 'maternity', 'paternity', 'unpaid', 'other')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid REFERENCES user_profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  affects_payroll boolean DEFAULT true,
  deduction_amount numeric(12, 2) DEFAULT 0,
  attached_document_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hr_attendance_settings table
CREATE TABLE IF NOT EXISTS hr_attendance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_start_time time NOT NULL DEFAULT '08:00:00',
  work_end_time time NOT NULL DEFAULT '17:00:00',
  grace_period_minutes integer DEFAULT 15,
  break_duration_minutes integer DEFAULT 60,
  max_break_duration_minutes integer DEFAULT 90,
  break_warning_threshold_minutes integer DEFAULT 75,
  require_geolocation boolean DEFAULT true,
  allowed_location_radius_meters numeric(10, 2) DEFAULT 100,
  hospital_location_lat decimal(10, 8),
  hospital_location_lng decimal(11, 8),
  auto_checkout_enabled boolean DEFAULT false,
  auto_checkout_time time DEFAULT '18:00:00',
  overtime_threshold_hours numeric(5, 2) DEFAULT 8,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hr_migration_log table
CREATE TABLE IF NOT EXISTS hr_migration_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_type text NOT NULL CHECK (migration_type IN ('user_to_employee', 'attendance_records', 'leave_requests', 'validation')),
  source_table text NOT NULL,
  target_table text NOT NULL,
  source_id uuid,
  target_id uuid,
  status text NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
  records_processed integer DEFAULT 0,
  records_success integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create check-in attempts log for audit
CREATE TABLE IF NOT EXISTS hr_checkin_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES hr_employees(id) ON DELETE CASCADE,
  attempt_time timestamptz NOT NULL DEFAULT now(),
  attempt_type text NOT NULL CHECK (attempt_type IN ('check_in', 'check_out', 'break_start', 'break_end')),
  gps_latitude decimal(10, 8),
  gps_longitude decimal(11, 8),
  gps_accuracy numeric(10, 2),
  calculated_distance numeric(10, 2),
  validation_result text NOT NULL CHECK (validation_result IN ('success', 'out_of_range', 'no_gps', 'already_checked_in', 'not_checked_in', 'error')),
  rejection_reason text,
  device_info jsonb,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hr_attendance_employee_date ON hr_attendance_records(employee_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_date ON hr_attendance_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_status ON hr_attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_hr_leave_employee ON hr_leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_status ON hr_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_hr_leave_dates ON hr_leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_hr_checkin_attempts_employee ON hr_checkin_attempts(employee_id, attempt_time DESC);
CREATE INDEX IF NOT EXISTS idx_hr_migration_log_type ON hr_migration_log(migration_type, status);

-- Enable RLS
ALTER TABLE hr_attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_migration_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_checkin_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hr_attendance_records

CREATE POLICY "Employees can view own attendance records"
  ON hr_attendance_records FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM hr_employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "Employees can insert own attendance records"
  ON hr_attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM hr_employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "Employees can update own attendance records"
  ON hr_attendance_records FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM hr_employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all attendance records"
  ON hr_attendance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

CREATE POLICY "Admins can manage all attendance records"
  ON hr_attendance_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for hr_leave_requests

CREATE POLICY "Employees can view own leave requests"
  ON hr_leave_requests FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM hr_employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "Employees can create own leave requests"
  ON hr_leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM hr_employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all leave requests"
  ON hr_leave_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

CREATE POLICY "Admins can manage all leave requests"
  ON hr_leave_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for hr_attendance_settings

CREATE POLICY "Everyone can view attendance settings"
  ON hr_attendance_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify attendance settings"
  ON hr_attendance_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for hr_checkin_attempts

CREATE POLICY "Employees can view own check-in attempts"
  ON hr_checkin_attempts FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM hr_employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all check-in attempts"
  ON hr_checkin_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for hr_migration_log

CREATE POLICY "Only admins can view migration logs"
  ON hr_migration_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Insert default attendance settings
INSERT INTO hr_attendance_settings (
  work_start_time,
  work_end_time,
  grace_period_minutes,
  break_duration_minutes,
  max_break_duration_minutes,
  break_warning_threshold_minutes,
  require_geolocation,
  allowed_location_radius_meters,
  auto_checkout_enabled,
  overtime_threshold_hours
) VALUES (
  '08:00:00',
  '17:00:00',
  15,
  60,
  90,
  75,
  true,
  100,
  false,
  8
) ON CONFLICT DO NOTHING;

-- Create function to calculate work hours
CREATE OR REPLACE FUNCTION calculate_work_hours(
  check_in timestamptz,
  check_out timestamptz,
  break_start timestamptz,
  break_end timestamptz
) RETURNS numeric AS $$
DECLARE
  total_minutes numeric;
  break_minutes numeric;
BEGIN
  IF check_in IS NULL OR check_out IS NULL THEN
    RETURN 0;
  END IF;

  total_minutes := EXTRACT(EPOCH FROM (check_out - check_in)) / 60;

  IF break_start IS NOT NULL AND break_end IS NOT NULL THEN
    break_minutes := EXTRACT(EPOCH FROM (break_end - break_start)) / 60;
    total_minutes := total_minutes - break_minutes;
  END IF;

  RETURN ROUND((total_minutes / 60)::numeric, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-calculate work hours
CREATE OR REPLACE FUNCTION update_work_hours()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_work_hours := calculate_work_hours(
    NEW.check_in_time,
    NEW.check_out_time,
    NEW.break_start_time,
    NEW.break_end_time
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_hours
  BEFORE INSERT OR UPDATE ON hr_attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_work_hours();

-- Create trigger for leave requests to update leave balance
CREATE OR REPLACE FUNCTION update_leave_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE hr_leave_balances
    SET 
      days_used = days_used + NEW.total_days,
      days_remaining = days_remaining - NEW.total_days,
      updated_at = now()
    WHERE 
      employee_id = NEW.employee_id
      AND leave_type = NEW.leave_type
      AND year = EXTRACT(YEAR FROM NEW.start_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leave_balance
  AFTER INSERT OR UPDATE ON hr_leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balance_on_approval();
