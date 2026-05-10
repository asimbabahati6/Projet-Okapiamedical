/*
  # Medical Clinic Management System for Kinshasa, DRC
  
  Comprehensive clinic management system for healthcare facilities in Kinshasa.
  
  ## New Tables
  - exchange_rates: CDF/USD exchange rate management
  - insurance_providers: Local insurers and mutuals
  - patient_insurance: Insurance voucher tracking
  - employees: Employee profiles
  - employee_documents: Document archive
  - employee_contracts: Contract management
  - shift_types & shift_schedules: Staff scheduling
  - tax_brackets: DRC IPR configuration
  - payroll_periods & payroll_items: Payroll system
  - medication_batches: Batch tracking
  - medication_stock_alerts: Expiration alerts
  
  ## Security
  - RLS policies for all tables
*/

-- Exchange Rate Management
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_date date NOT NULL,
  cdf_to_usd numeric(10, 4) NOT NULL,
  usd_to_cdf numeric(10, 4) NOT NULL,
  set_by uuid REFERENCES auth.users(id),
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(rate_date)
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exchange_rates' AND policyname = 'Anyone can view active exchange rates'
  ) THEN
    CREATE POLICY "Anyone can view active exchange rates"
      ON exchange_rates FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exchange_rates' AND policyname = 'Admins can manage exchange rates'
  ) THEN
    CREATE POLICY "Admins can manage exchange rates"
      ON exchange_rates FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
          )
        )
      );
  END IF;
END $$;

-- Insurance Providers
CREATE TABLE IF NOT EXISTS insurance_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider_type text NOT NULL CHECK (provider_type IN ('mutual', 'corporate', 'government', 'private')),
  contact_person text,
  phone text,
  email text,
  address text,
  coverage_percentage numeric(5, 2) DEFAULT 80.00,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'insurance_providers' AND policyname = 'Staff can view insurance providers'
  ) THEN
    CREATE POLICY "Staff can view insurance providers"
      ON insurance_providers FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'insurance_providers' AND policyname = 'Admins can manage insurance providers'
  ) THEN
    CREATE POLICY "Admins can manage insurance providers"
      ON insurance_providers FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin', 'administrative_staff')
          )
        )
      );
  END IF;
END $$;

-- Patient Insurance
CREATE TABLE IF NOT EXISTS patient_insurance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES insurance_providers(id),
  policy_number text NOT NULL,
  voucher_number text,
  coverage_start date NOT NULL,
  coverage_end date NOT NULL,
  coverage_percentage numeric(5, 2) DEFAULT 80.00,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE patient_insurance ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'patient_insurance' AND policyname = 'Staff can view patient insurance'
  ) THEN
    CREATE POLICY "Staff can view patient insurance"
      ON patient_insurance FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'patient_insurance' AND policyname = 'Staff can manage patient insurance'
  ) THEN
    CREATE POLICY "Staff can manage patient insurance"
      ON patient_insurance FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin', 'receptionist', 'administrative_staff')
          )
        )
      );
  END IF;
END $$;

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid REFERENCES user_profiles(id),
  employee_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  phone text NOT NULL,
  email text,
  address text,
  city text DEFAULT 'Kinshasa',
  country text DEFAULT 'DRC',
  national_id text,
  photo_url text,
  department text,
  position text NOT NULL,
  employment_type text CHECK (employment_type IN ('permanent', 'fixed_term', 'contractor', 'intern')),
  hire_date date NOT NULL,
  probation_end_date date,
  termination_date date,
  professional_registration_number text,
  medical_specialty text,
  is_medical_staff boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'suspended', 'terminated')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'Staff can view employees'
  ) THEN
    CREATE POLICY "Staff can view employees"
      ON employees FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'HR can manage employees'
  ) THEN
    CREATE POLICY "HR can manage employees"
      ON employees FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
          )
        )
      );
  END IF;
END $$;

-- Employee Documents
CREATE TABLE IF NOT EXISTS employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('contract', 'diploma', 'certificate', 'id_card', 'cv', 'medical_cert', 'other')),
  document_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  uploaded_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_documents' AND policyname = 'Staff can view their own documents'
  ) THEN
    CREATE POLICY "Staff can view their own documents"
      ON employee_documents FOR SELECT
      TO authenticated
      USING (
        employee_id IN (
          SELECT id FROM employees WHERE user_profile_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_documents' AND policyname = 'HR can manage employee documents'
  ) THEN
    CREATE POLICY "HR can manage employee documents"
      ON employee_documents FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
          )
        )
      );
  END IF;
END $$;

-- Employee Contracts
CREATE TABLE IF NOT EXISTS employee_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  contract_type text NOT NULL CHECK (contract_type IN ('permanent', 'fixed_term', 'contractor', 'intern')),
  contract_number text UNIQUE NOT NULL,
  start_date date NOT NULL,
  end_date date,
  probation_period_months integer DEFAULT 0,
  probation_end_date date,
  position text NOT NULL,
  department text,
  base_salary_cdf numeric(12, 2) NOT NULL,
  base_salary_usd numeric(12, 2),
  transport_allowance_cdf numeric(12, 2) DEFAULT 0,
  housing_allowance_cdf numeric(12, 2) DEFAULT 0,
  other_allowances_cdf numeric(12, 2) DEFAULT 0,
  work_hours_per_week integer DEFAULT 40,
  contract_status text DEFAULT 'active' CHECK (contract_status IN ('draft', 'active', 'expired', 'terminated', 'renewed')),
  signed_date date,
  termination_date date,
  termination_reason text,
  renewal_count integer DEFAULT 0,
  notes text,
  alert_30_days boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employee_contracts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_contracts' AND policyname = 'Staff can view contracts'
  ) THEN
    CREATE POLICY "Staff can view contracts"
      ON employee_contracts FOR SELECT
      TO authenticated
      USING (
        employee_id IN (
          SELECT id FROM employees WHERE user_profile_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_contracts' AND policyname = 'HR can manage contracts'
  ) THEN
    CREATE POLICY "HR can manage contracts"
      ON employee_contracts FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
          )
        )
      );
  END IF;
END $$;

-- Shift Types
CREATE TABLE IF NOT EXISTS shift_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_hours integer NOT NULL,
  shift_category text CHECK (shift_category IN ('day', 'night', 'weekend', 'holiday')),
  min_rest_hours integer DEFAULT 12,
  color_code text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shift_types' AND policyname = 'Staff can view shift types'
  ) THEN
    CREATE POLICY "Staff can view shift types"
      ON shift_types FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shift_types' AND policyname = 'Admins can manage shift types'
  ) THEN
    CREATE POLICY "Admins can manage shift types"
      ON shift_types FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
          )
        )
      );
  END IF;
END $$;

-- Shift Schedules
CREATE TABLE IF NOT EXISTS shift_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  shift_type_id uuid REFERENCES shift_types(id),
  shift_date date NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  assigned_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shift_schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shift_schedules' AND policyname = 'Medical staff can view their shifts'
  ) THEN
    CREATE POLICY "Medical staff can view their shifts"
      ON shift_schedules FOR SELECT
      TO authenticated
      USING (
        employee_id IN (
          SELECT id FROM employees WHERE user_profile_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin', 'doctor', 'nurse')
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shift_schedules' AND policyname = 'Admins can manage shifts'
  ) THEN
    CREATE POLICY "Admins can manage shifts"
      ON shift_schedules FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
          )
        )
      );
  END IF;
END $$;

-- Tax Brackets
CREATE TABLE IF NOT EXISTS tax_brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_name text NOT NULL,
  min_amount_cdf numeric(12, 2) NOT NULL,
  max_amount_cdf numeric(12, 2),
  tax_rate numeric(5, 2) NOT NULL,
  fixed_amount_cdf numeric(12, 2) DEFAULT 0,
  effective_from date NOT NULL,
  effective_to date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tax_brackets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tax_brackets' AND policyname = 'Staff can view tax brackets'
  ) THEN
    CREATE POLICY "Staff can view tax brackets"
      ON tax_brackets FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tax_brackets' AND policyname = 'Admins can manage tax brackets'
  ) THEN
    CREATE POLICY "Admins can manage tax brackets"
      ON tax_brackets FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
          )
        )
      );
  END IF;
END $$;

-- Payroll Periods
CREATE TABLE IF NOT EXISTS payroll_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_name text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  payment_date date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid', 'cancelled')),
  exchange_rate_id uuid REFERENCES exchange_rates(id),
  total_gross_cdf numeric(15, 2) DEFAULT 0,
  total_net_cdf numeric(15, 2) DEFAULT 0,
  total_cnss_employee_cdf numeric(15, 2) DEFAULT 0,
  total_cnss_employer_cdf numeric(15, 2) DEFAULT 0,
  total_ipr_cdf numeric(15, 2) DEFAULT 0,
  processed_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payroll_periods' AND policyname = 'HR can view payroll periods'
  ) THEN
    CREATE POLICY "HR can view payroll periods"
      ON payroll_periods FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payroll_periods' AND policyname = 'HR can manage payroll periods'
  ) THEN
    CREATE POLICY "HR can manage payroll periods"
      ON payroll_periods FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
          )
        )
      );
  END IF;
END $$;

-- Payroll Items
CREATE TABLE IF NOT EXISTS payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id uuid REFERENCES payroll_periods(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id),
  payslip_number text UNIQUE NOT NULL,
  base_salary_cdf numeric(12, 2) NOT NULL,
  transport_allowance_cdf numeric(12, 2) DEFAULT 0,
  housing_allowance_cdf numeric(12, 2) DEFAULT 0,
  other_allowances_cdf numeric(12, 2) DEFAULT 0,
  total_bonuses_cdf numeric(12, 2) DEFAULT 0,
  gross_salary_cdf numeric(12, 2) NOT NULL,
  cnss_employee_cdf numeric(12, 2) NOT NULL,
  cnss_employer_cdf numeric(12, 2) NOT NULL,
  ipr_tax_cdf numeric(12, 2) NOT NULL,
  other_deductions_cdf numeric(12, 2) DEFAULT 0,
  total_deductions_cdf numeric(12, 2) NOT NULL,
  net_salary_cdf numeric(12, 2) NOT NULL,
  payment_method text DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'cash', 'mobile_money', 'check')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  payment_reference text,
  payment_date date,
  notes text,
  calculated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payroll_items' AND policyname = 'Employees can view their own payslips'
  ) THEN
    CREATE POLICY "Employees can view their own payslips"
      ON payroll_items FOR SELECT
      TO authenticated
      USING (
        employee_id IN (
          SELECT id FROM employees WHERE user_profile_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payroll_items' AND policyname = 'HR can manage payroll items'
  ) THEN
    CREATE POLICY "HR can manage payroll items"
      ON payroll_items FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
          )
        )
      );
  END IF;
END $$;

-- Medication Batches
CREATE TABLE IF NOT EXISTS medication_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid REFERENCES medications(id) ON DELETE CASCADE,
  batch_number text NOT NULL,
  quantity integer NOT NULL,
  unit_cost_cdf numeric(10, 2),
  unit_cost_usd numeric(10, 2),
  manufacture_date date,
  expiry_date date NOT NULL,
  supplier text,
  received_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'recalled', 'depleted')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE medication_batches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'medication_batches' AND policyname = 'Staff can view medication batches'
  ) THEN
    CREATE POLICY "Staff can view medication batches"
      ON medication_batches FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'medication_batches' AND policyname = 'Pharmacists can manage medication batches'
  ) THEN
    CREATE POLICY "Pharmacists can manage medication batches"
      ON medication_batches FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin', 'pharmacist')
          )
        )
      );
  END IF;
END $$;

-- Medication Stock Alerts
CREATE TABLE IF NOT EXISTS medication_stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL CHECK (alert_type IN ('low_stock', 'expiring_soon', 'expired', 'out_of_stock')),
  medication_id uuid REFERENCES medications(id),
  batch_id uuid REFERENCES medication_batches(id),
  alert_message text NOT NULL,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medication_stock_alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'medication_stock_alerts' AND policyname = 'Staff can view medication stock alerts'
  ) THEN
    CREATE POLICY "Staff can view medication stock alerts"
      ON medication_stock_alerts FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'medication_stock_alerts' AND policyname = 'Pharmacists can manage medication stock alerts'
  ) THEN
    CREATE POLICY "Pharmacists can manage medication stock alerts"
      ON medication_stock_alerts FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role_id IN (
            SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin', 'pharmacist')
          )
        )
      );
  END IF;
END $$;

-- Insert default data
INSERT INTO shift_types (name, start_time, end_time, duration_hours, shift_category, min_rest_hours, color_code)
VALUES 
  ('Jour', '08:00:00', '16:00:00', 8, 'day', 12, '#3b82f6'),
  ('Nuit', '20:00:00', '08:00:00', 12, 'night', 16, '#1e40af'),
  ('Weekend Jour', '08:00:00', '20:00:00', 12, 'weekend', 12, '#10b981'),
  ('Garde', '16:00:00', '08:00:00', 16, 'night', 24, '#ef4444')
ON CONFLICT DO NOTHING;

INSERT INTO tax_brackets (bracket_name, min_amount_cdf, max_amount_cdf, tax_rate, fixed_amount_cdf, effective_from, is_active)
VALUES
  ('Tranche 1', 0, 524000, 3.00, 0, '2024-01-01', true),
  ('Tranche 2', 524001, 1428000, 10.00, 15720, '2024-01-01', true),
  ('Tranche 3', 1428001, 2856000, 20.00, 106120, '2024-01-01', true),
  ('Tranche 4', 2856001, 5712000, 30.00, 391720, '2024-01-01', true),
  ('Tranche 5', 5712001, NULL, 40.00, 1248520, '2024-01-01', true)
ON CONFLICT DO NOTHING;

INSERT INTO exchange_rates (rate_date, cdf_to_usd, usd_to_cdf, is_active, notes)
VALUES (CURRENT_DATE, 0.00040, 2500.00, true, 'Taux de change initial')
ON CONFLICT (rate_date) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_user_profile ON employees(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_status ON employee_contracts(contract_status);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_end_date ON employee_contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_date ON shift_schedules(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_employee ON shift_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_period ON payroll_items(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON payroll_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_medication_batches_expiry ON medication_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_medication_stock_alerts_resolved ON medication_stock_alerts(is_resolved);
