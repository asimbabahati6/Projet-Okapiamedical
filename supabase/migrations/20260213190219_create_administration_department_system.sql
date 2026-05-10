/*
  # Create Administration Department System

  1. New Tables
    - `administrative_staff` - Tracks administrative department personnel and their roles
    - `administrative_tasks` - Task management for administrative operations
    - `administrative_policies` - Policy and procedure management
    - `facility_maintenance_requests` - Facility and maintenance tracking
    - `vendor_contracts` - Vendor and contract management
    - `administrative_reports` - Report generation and tracking
    - `administrative_kpis` - KPI tracking for administrative performance

  2. Updates to Existing Tables
    - Add `administrative_division` to employees table
    - Add `reports_to_admin` to employees table
    - Create Administration department record

  3. New Roles
    - administrative_director (level 2)
    - hr_manager (level 3)
    - finance_manager (level 3)
    - operations_manager (level 3)
    - information_systems_coordinator (level 3)
    - administrative_officer (level 4)
    - administrative_assistant (level 5)

  4. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users based on administrative roles
*/

-- Create Administration department if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Administration') THEN
    INSERT INTO departments (id, name, description, is_public, is_active)
    VALUES (
      gen_random_uuid(),
      'Administration',
      'Centralized administrative support including HR, Finance, Operations, and IT',
      false,
      true
    );
  END IF;
END $$;

-- Add new roles for administrative staff
DO $$
BEGIN
  -- Administrative Director
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'administrative_director') THEN
    INSERT INTO roles (id, name, description, level, created_at)
    VALUES (
      gen_random_uuid(),
      'administrative_director',
      'Administrative Director - Head of Administration Department',
      2,
      now()
    );
  END IF;

  -- HR Manager
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'hr_manager') THEN
    INSERT INTO roles (id, name, description, level, created_at)
    VALUES (
      gen_random_uuid(),
      'hr_manager',
      'Human Resources Manager',
      3,
      now()
    );
  END IF;

  -- Finance Manager
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'finance_manager') THEN
    INSERT INTO roles (id, name, description, level, created_at)
    VALUES (
      gen_random_uuid(),
      'finance_manager',
      'Finance & Accounting Manager',
      3,
      now()
    );
  END IF;

  -- Operations Manager
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'operations_manager') THEN
    INSERT INTO roles (id, name, description, level, created_at)
    VALUES (
      gen_random_uuid(),
      'operations_manager',
      'Operations & Facilities Manager',
      3,
      now()
    );
  END IF;

  -- Information Systems Coordinator
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'information_systems_coordinator') THEN
    INSERT INTO roles (id, name, description, level, created_at)
    VALUES (
      gen_random_uuid(),
      'information_systems_coordinator',
      'Information Systems Coordinator',
      3,
      now()
    );
  END IF;

  -- Administrative Officer
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'administrative_officer') THEN
    INSERT INTO roles (id, name, description, level, created_at)
    VALUES (
      gen_random_uuid(),
      'administrative_officer',
      'Administrative Officer - Various administrative functions',
      4,
      now()
    );
  END IF;

  -- Administrative Assistant
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'administrative_assistant') THEN
    INSERT INTO roles (id, name, description, level, created_at)
    VALUES (
      gen_random_uuid(),
      'administrative_assistant',
      'Administrative Assistant - Support staff',
      5,
      now()
    );
  END IF;
END $$;

-- Add administrative columns to employees table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'administrative_division'
  ) THEN
    ALTER TABLE employees ADD COLUMN administrative_division text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'reports_to_admin'
  ) THEN
    ALTER TABLE employees ADD COLUMN reports_to_admin uuid REFERENCES employees(id);
  END IF;
END $$;

-- Create administrative_staff table
CREATE TABLE IF NOT EXISTS administrative_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  division text NOT NULL CHECK (division IN ('hr', 'finance', 'operations', 'information_systems')),
  position_level text NOT NULL CHECK (position_level IN ('director', 'manager', 'officer', 'specialist', 'assistant', 'support')),
  specific_role text NOT NULL,
  department_head boolean DEFAULT false,
  access_level text DEFAULT 'limited' CHECK (access_level IN ('full', 'division_only', 'limited')),
  assigned_functions text[] DEFAULT '{}',
  can_manage_staff boolean DEFAULT false,
  can_approve_budgets boolean DEFAULT false,
  can_generate_reports boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id)
);

-- Create administrative_tasks table
CREATE TABLE IF NOT EXISTS administrative_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type text NOT NULL CHECK (task_type IN ('hr', 'finance', 'operations', 'compliance', 'reporting', 'general')),
  task_title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES administrative_staff(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES employees(id),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date date,
  completed_date timestamptz,
  notes text,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create administrative_policies table
CREATE TABLE IF NOT EXISTS administrative_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_category text NOT NULL CHECK (policy_category IN ('hr', 'finance', 'operations', 'safety', 'it', 'general')),
  policy_title text NOT NULL,
  policy_number text UNIQUE NOT NULL,
  description text,
  document_url text,
  effective_date date NOT NULL,
  review_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'under_review', 'archived')),
  approved_by uuid REFERENCES employees(id),
  created_by uuid REFERENCES employees(id),
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create facility_maintenance_requests table
CREATE TABLE IF NOT EXISTS facility_maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL CHECK (request_type IN ('repair', 'maintenance', 'inspection', 'upgrade', 'emergency')),
  location text NOT NULL,
  description text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
  requested_by uuid REFERENCES employees(id),
  assigned_to uuid REFERENCES administrative_staff(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  estimated_cost_cdf numeric(12,2),
  estimated_cost_usd numeric(12,2),
  actual_cost_cdf numeric(12,2),
  actual_cost_usd numeric(12,2),
  scheduled_date date,
  completed_date timestamptz,
  notes text,
  photos jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendor_contracts table
CREATE TABLE IF NOT EXISTS vendor_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name text NOT NULL,
  vendor_contact_name text,
  vendor_phone text,
  vendor_email text,
  vendor_address text,
  contract_type text NOT NULL CHECK (contract_type IN ('service', 'supply', 'maintenance', 'consulting', 'equipment')),
  contract_number text UNIQUE NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  contract_value_cdf numeric(15,2),
  contract_value_usd numeric(15,2),
  payment_terms text,
  managed_by uuid REFERENCES administrative_staff(id) ON DELETE SET NULL,
  renewal_reminder_days integer DEFAULT 30,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
  document_url text,
  performance_rating integer CHECK (performance_rating >= 1 AND performance_rating <= 5),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create administrative_reports table
CREATE TABLE IF NOT EXISTS administrative_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL CHECK (report_type IN ('hr', 'finance', 'operations', 'compliance', 'executive', 'kpi')),
  report_title text NOT NULL,
  report_period text,
  period_start date,
  period_end date,
  generated_by uuid REFERENCES administrative_staff(id),
  file_url text,
  report_data jsonb DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  shared_with uuid[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create administrative_kpis table
CREATE TABLE IF NOT EXISTS administrative_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division text NOT NULL CHECK (division IN ('hr', 'finance', 'operations', 'information_systems', 'overall')),
  kpi_name text NOT NULL,
  kpi_category text NOT NULL,
  target_value numeric(12,2),
  actual_value numeric(12,2),
  unit text,
  measurement_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_staff_employee ON administrative_staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_admin_staff_division ON administrative_staff(division);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_assigned ON administrative_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_status ON administrative_tasks(status);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_due_date ON administrative_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_policies_category ON administrative_policies(policy_category);
CREATE INDEX IF NOT EXISTS idx_policies_status ON administrative_policies(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON facility_maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_assigned ON facility_maintenance_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_vendor_status ON vendor_contracts(status);
CREATE INDEX IF NOT EXISTS idx_vendor_end_date ON vendor_contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_reports_type ON administrative_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_kpis_division ON administrative_kpis(division);
CREATE INDEX IF NOT EXISTS idx_kpis_date ON administrative_kpis(measurement_date);

-- Enable Row Level Security
ALTER TABLE administrative_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrative_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrative_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrative_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrative_kpis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for administrative_staff
CREATE POLICY "Administrative staff can view all admin staff"
  ON administrative_staff FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('hospital_admin', 'super_admin', 'administrative_director', 'hr_manager', 'finance_manager', 'operations_manager', 'information_systems_coordinator')
    )
  );

CREATE POLICY "Administrative directors and managers can manage admin staff"
  ON administrative_staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('hospital_admin', 'super_admin', 'administrative_director', 'hr_manager')
    )
  );

-- RLS Policies for administrative_tasks
CREATE POLICY "Users can view their assigned tasks"
  ON administrative_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM administrative_staff ast
      JOIN employees e ON e.id = ast.employee_id
      WHERE ast.id = assigned_to
      AND e.user_profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('hospital_admin', 'super_admin', 'administrative_director', 'hr_manager', 'finance_manager', 'operations_manager')
    )
  );

CREATE POLICY "Administrative staff can create tasks"
  ON administrative_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('hospital_admin', 'super_admin', 'administrative_director', 'hr_manager', 'finance_manager', 'operations_manager', 'administrative_officer')
    )
  );

CREATE POLICY "Users can update their assigned tasks"
  ON administrative_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM administrative_staff ast
      JOIN employees e ON e.id = ast.employee_id
      WHERE ast.id = assigned_to
      AND e.user_profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('hospital_admin', 'super_admin', 'administrative_director', 'hr_manager', 'finance_manager', 'operations_manager')
    )
  );

-- RLS Policies for administrative_policies
CREATE POLICY "Authenticated users can view active policies"
  ON administrative_policies FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('hospital_admin', 'super_admin', 'administrative_director', 'hr_manager', 'finance_manager', 'operations_manager')
    )
  );

CREATE POLICY "Administrative directors and managers can manage policies"
  ON administrative_policies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('hospital_admin', 'super_admin', 'administrative_director')
    )
  );

-- RLS Policies for facility_maintenance_requests
CREATE POLICY "Authenticated users can view maintenance requests"
  ON facility_maintenance_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create maintenance requests"
  ON facility_maintenance_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Operations staff can manage maintenance requests"
  ON facility_maintenance_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('hospital_admin', 'super_admin', 'administrative_director', 'operations_manager', 'administrative_officer')
    )
  );

-- RLS Policies for vendor_contracts
CREATE POLICY "Administrative staff can view vendor contracts"
  ON vendor_contracts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('hospital_admin', 'super_admin', 'administrative_director', 'hr_manager', 'finance_manager', 'operations_manager', 'administrative_officer')
    )
  );

CREATE POLICY "Managers can manage vendor contracts"
  ON vendor_contracts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('hospital_admin', 'super_admin', 'administrative_director', 'finance_manager', 'operations_manager')
    )
  );

-- RLS Policies for administrative_reports
CREATE POLICY "Administrative staff can view reports"
  ON administrative_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND (
        r.name IN ('hospital_admin', 'super_admin', 'administrative_director', 'hr_manager', 'finance_manager', 'operations_manager')
        OR up.id = ANY(shared_with)
      )
    )
  );

CREATE POLICY "Administrative staff can generate reports"
  ON administrative_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('hospital_admin', 'super_admin', 'administrative_director', 'hr_manager', 'finance_manager', 'operations_manager', 'information_systems_coordinator')
    )
  );

-- RLS Policies for administrative_kpis
CREATE POLICY "Administrative staff can view KPIs"
  ON administrative_kpis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('hospital_admin', 'super_admin', 'administrative_director', 'hr_manager', 'finance_manager', 'operations_manager', 'information_systems_coordinator')
    )
  );

CREATE POLICY "Managers can manage KPIs"
  ON administrative_kpis FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('hospital_admin', 'super_admin', 'administrative_director', 'hr_manager', 'finance_manager', 'operations_manager')
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_administrative_staff_updated_at') THEN
    CREATE TRIGGER update_administrative_staff_updated_at
      BEFORE UPDATE ON administrative_staff
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_administrative_tasks_updated_at') THEN
    CREATE TRIGGER update_administrative_tasks_updated_at
      BEFORE UPDATE ON administrative_tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_administrative_policies_updated_at') THEN
    CREATE TRIGGER update_administrative_policies_updated_at
      BEFORE UPDATE ON administrative_policies
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_facility_maintenance_updated_at') THEN
    CREATE TRIGGER update_facility_maintenance_updated_at
      BEFORE UPDATE ON facility_maintenance_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vendor_contracts_updated_at') THEN
    CREATE TRIGGER update_vendor_contracts_updated_at
      BEFORE UPDATE ON vendor_contracts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_administrative_reports_updated_at') THEN
    CREATE TRIGGER update_administrative_reports_updated_at
      BEFORE UPDATE ON administrative_reports
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
