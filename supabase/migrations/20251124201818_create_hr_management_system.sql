/*
  # Create HR Management System

  ## New Tables

  ### 1. hr_employees
  Extended employee information for HR management
  - Employee number, hire date, employment status
  - Salary information and banking details
  - Emergency contacts and archiving info

  ### 2. hr_contracts
  Employee and consultant contracts with renewal alerts

  ### 3. hr_payroll
  Payroll records and payment history

  ### 4. hr_salary_adjustments
  Salary adjustments (bonuses, increases, deductions)

  ### 5. hr_documents
  HR-related documents with expiry tracking

  ### 6. hr_leave_balances
  Employee leave balances by year

  ## Security
  - Enable RLS on all tables
  - Policies for super_admin, hospital_admin, administrative_staff roles
*/

-- Create hr_employees table
CREATE TABLE IF NOT EXISTS hr_employees (
  id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  employee_number text UNIQUE NOT NULL,
  hire_date date NOT NULL,
  employment_status text NOT NULL DEFAULT 'active',
  contract_type text NOT NULL DEFAULT 'permanent',
  salary_amount numeric(12, 2) DEFAULT 0,
  salary_currency text DEFAULT 'USD',
  bank_name text,
  bank_account text,
  tax_id text,
  social_security_number text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  archived_at timestamptz,
  archived_by uuid REFERENCES user_profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_employment_status CHECK (employment_status IN ('active', 'inactive', 'on_leave', 'terminated')),
  CONSTRAINT valid_contract_type CHECK (contract_type IN ('permanent', 'temporary', 'consultant'))
);

-- Create hr_contracts table
CREATE TABLE IF NOT EXISTS hr_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  contract_number text UNIQUE NOT NULL,
  contract_type text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  duration_months integer,
  position text NOT NULL,
  department_id uuid REFERENCES departments(id),
  salary_amount numeric(12, 2) NOT NULL,
  salary_currency text DEFAULT 'USD',
  benefits jsonb DEFAULT '{}',
  contract_document_url text,
  status text DEFAULT 'active',
  renewal_alert_days integer DEFAULT 30,
  last_alert_sent timestamptz,
  termination_date date,
  termination_reason text,
  notes text,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_contract_type CHECK (contract_type IN ('permanent', 'temporary', 'consultant')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'terminated', 'pending'))
);

-- Create hr_payroll table
CREATE TABLE IF NOT EXISTS hr_payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  payroll_number text UNIQUE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  base_salary numeric(12, 2) NOT NULL DEFAULT 0,
  bonuses numeric(12, 2) DEFAULT 0,
  allowances numeric(12, 2) DEFAULT 0,
  deductions numeric(12, 2) DEFAULT 0,
  tax_amount numeric(12, 2) DEFAULT 0,
  social_security numeric(12, 2) DEFAULT 0,
  gross_salary numeric(12, 2) NOT NULL,
  net_salary numeric(12, 2) NOT NULL,
  payment_method text DEFAULT 'bank_transfer',
  payment_status text DEFAULT 'pending',
  payment_date date,
  payment_reference text,
  notes text,
  calculated_by uuid REFERENCES user_profiles(id),
  approved_by uuid REFERENCES user_profiles(id),
  approval_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('bank_transfer', 'cash', 'check', 'mobile_money')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'approved', 'processing', 'paid', 'cancelled'))
);

-- Create hr_salary_adjustments table
CREATE TABLE IF NOT EXISTS hr_salary_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  adjustment_type text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  currency text DEFAULT 'USD',
  reason text NOT NULL,
  description text,
  effective_date date NOT NULL,
  end_date date,
  is_recurring boolean DEFAULT false,
  frequency text DEFAULT 'one_time',
  approved_by uuid REFERENCES user_profiles(id),
  approval_date timestamptz,
  status text DEFAULT 'pending',
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_adjustment_type CHECK (adjustment_type IN ('increase', 'bonus', 'allowance', 'deduction')),
  CONSTRAINT valid_frequency CHECK (frequency IN ('monthly', 'quarterly', 'annual', 'one_time')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'applied'))
);

-- Create hr_documents table
CREATE TABLE IF NOT EXISTS hr_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES user_profiles(id),
  uploaded_at timestamptz DEFAULT now(),
  expiry_date date,
  is_verified boolean DEFAULT false,
  verified_by uuid REFERENCES user_profiles(id),
  verified_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hr_leave_balances table
CREATE TABLE IF NOT EXISTS hr_leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  leave_type text NOT NULL,
  total_days numeric(5, 1) NOT NULL DEFAULT 0,
  used_days numeric(5, 1) DEFAULT 0,
  remaining_days numeric(5, 1) DEFAULT 0,
  year integer NOT NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_employee_leave_year UNIQUE (employee_id, leave_type, year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hr_employees_employee_number ON hr_employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_hr_employees_status ON hr_employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_hr_contracts_employee ON hr_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_contracts_status ON hr_contracts(status);
CREATE INDEX IF NOT EXISTS idx_hr_contracts_end_date ON hr_contracts(end_date) WHERE end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hr_payroll_employee ON hr_payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_period ON hr_payroll(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_status ON hr_payroll(payment_status);
CREATE INDEX IF NOT EXISTS idx_hr_adjustments_employee ON hr_salary_adjustments(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_adjustments_status ON hr_salary_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_hr_documents_employee ON hr_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_employee ON hr_leave_balances(employee_id);

-- Enable Row Level Security
ALTER TABLE hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_salary_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_balances ENABLE ROW LEVEL SECURITY;

-- Create policies for hr_employees
CREATE POLICY "HR staff can view all employees"
  ON hr_employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

CREATE POLICY "HR staff can insert employees"
  ON hr_employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

CREATE POLICY "HR staff can update employees"
  ON hr_employees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Create policies for hr_contracts
CREATE POLICY "HR staff can view all contracts"
  ON hr_contracts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

CREATE POLICY "HR staff can manage contracts"
  ON hr_contracts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Create policies for hr_payroll
CREATE POLICY "HR and payroll staff can view payroll"
  ON hr_payroll FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

CREATE POLICY "HR and payroll staff can manage payroll"
  ON hr_payroll FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

-- Create policies for hr_salary_adjustments
CREATE POLICY "HR staff can view salary adjustments"
  ON hr_salary_adjustments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

CREATE POLICY "HR staff can manage salary adjustments"
  ON hr_salary_adjustments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Create policies for hr_documents
CREATE POLICY "HR staff can view all documents"
  ON hr_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

CREATE POLICY "HR staff can manage documents"
  ON hr_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Create policies for hr_leave_balances
CREATE POLICY "HR staff can view leave balances"
  ON hr_leave_balances FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    ) OR employee_id = auth.uid()
  );

CREATE POLICY "HR staff can manage leave balances"
  ON hr_leave_balances FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Function to generate employee number
CREATE OR REPLACE FUNCTION generate_employee_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number FROM 4) AS integer)), 0) + 1
  INTO counter
  FROM hr_employees;

  new_number := 'EMP' || LPAD(counter::text, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate contract number
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 5) AS integer)), 0) + 1
  INTO counter
  FROM hr_contracts;

  new_number := 'CONT' || LPAD(counter::text, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate payroll number
CREATE OR REPLACE FUNCTION generate_payroll_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(payroll_number FROM 4) AS integer)), 0) + 1
  INTO counter
  FROM hr_payroll;

  new_number := 'PAY' || LPAD(counter::text, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hr_employees_updated_at BEFORE UPDATE ON hr_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_contracts_updated_at BEFORE UPDATE ON hr_contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_payroll_updated_at BEFORE UPDATE ON hr_payroll
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_adjustments_updated_at BEFORE UPDATE ON hr_salary_adjustments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_documents_updated_at BEFORE UPDATE ON hr_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();