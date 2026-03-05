/*
  # Add Payroll Records and Leave Balances

  ## Data to Add

  ### 1. 60 Payroll Records
  Current and previous month payroll for all 30 employees

  ### 2. 60 Leave Balances
  Annual and sick leave balances for all 30 employees

  ### 3. 6 Salary Adjustments
  Bonuses and salary increases for selected employees

  ## Notes
  - Builds on existing 30 employees
  - All payroll calculations include tax (15%) and social security (5%)
  - Leave balances initialized for current year
*/

-- Add payroll records for all employees (2 per employee = 60 total)
DO $$
DECLARE
  v_employee record;
  i integer := 1;
BEGIN
  FOR v_employee IN SELECT id, salary_amount FROM hr_employees ORDER BY employee_number
  LOOP
    -- Previous month payroll (paid)
    INSERT INTO hr_payroll (
      employee_id,
      payroll_number,
      period_start,
      period_end,
      base_salary,
      bonuses,
      allowances,
      deductions,
      tax_amount,
      social_security,
      gross_salary,
      net_salary,
      payment_method,
      payment_status,
      payment_date,
      payment_reference,
      notes
    ) VALUES (
      v_employee.id,
      'PAY' || TO_CHAR(CURRENT_DATE - interval '1 month', 'YYYYMM') || '-' || LPAD(i::text, 3, '0'),
      DATE_TRUNC('month', CURRENT_DATE - interval '1 month'),
      DATE_TRUNC('month', CURRENT_DATE - interval '1 month') + interval '1 month' - interval '1 day',
      v_employee.salary_amount,
      CASE WHEN i % 3 = 0 THEN 500 ELSE 0 END,
      250,
      CASE WHEN i % 5 = 0 THEN 100 ELSE 0 END,
      v_employee.salary_amount * 0.15,
      v_employee.salary_amount * 0.05,
      v_employee.salary_amount + CASE WHEN i % 3 = 0 THEN 500 ELSE 0 END + 250,
      (v_employee.salary_amount + CASE WHEN i % 3 = 0 THEN 500 ELSE 0 END + 250) - (v_employee.salary_amount * 0.15) - (v_employee.salary_amount * 0.05) - CASE WHEN i % 5 = 0 THEN 100 ELSE 0 END,
      CASE WHEN i % 3 = 0 THEN 'bank_transfer' WHEN i % 3 = 1 THEN 'mobile_money' ELSE 'bank_transfer' END,
      'paid',
      DATE_TRUNC('month', CURRENT_DATE - interval '1 month') + interval '1 month' - interval '1 day',
      'PAY-' || TO_CHAR(CURRENT_DATE - interval '1 month', 'YYYYMM') || '-' || LPAD((i * 100)::text, 5, '0'),
      'Salaire mois ' || TO_CHAR(CURRENT_DATE - interval '1 month', 'Month YYYY')
    );

    -- Current month payroll (approved or pending)
    INSERT INTO hr_payroll (
      employee_id,
      payroll_number,
      period_start,
      period_end,
      base_salary,
      bonuses,
      allowances,
      deductions,
      tax_amount,
      social_security,
      gross_salary,
      net_salary,
      payment_method,
      payment_status,
      payment_date,
      payment_reference,
      notes
    ) VALUES (
      v_employee.id,
      'PAY' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(i::text, 3, '0'),
      DATE_TRUNC('month', CURRENT_DATE),
      DATE_TRUNC('month', CURRENT_DATE) + interval '1 month' - interval '1 day',
      v_employee.salary_amount,
      CASE WHEN i % 4 = 0 THEN 800 ELSE 0 END,
      250,
      CASE WHEN i % 6 = 0 THEN 150 ELSE 0 END,
      v_employee.salary_amount * 0.15,
      v_employee.salary_amount * 0.05,
      v_employee.salary_amount + CASE WHEN i % 4 = 0 THEN 800 ELSE 0 END + 250,
      (v_employee.salary_amount + CASE WHEN i % 4 = 0 THEN 800 ELSE 0 END + 250) - (v_employee.salary_amount * 0.15) - (v_employee.salary_amount * 0.05) - CASE WHEN i % 6 = 0 THEN 150 ELSE 0 END,
      CASE WHEN i % 3 = 0 THEN 'bank_transfer' WHEN i % 3 = 1 THEN 'mobile_money' ELSE 'bank_transfer' END,
      CASE WHEN i <= 20 THEN 'approved' ELSE 'pending' END,
      CASE WHEN i <= 20 THEN CURRENT_DATE + ((i % 10 + 1)::integer || ' days')::interval ELSE NULL END,
      CASE WHEN i <= 20 THEN 'PAY-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD((i * 100 + 1)::text, 5, '0') ELSE NULL END,
      'Salaire mois ' || TO_CHAR(CURRENT_DATE, 'Month YYYY')
    );

    i := i + 1;
  END LOOP;

  RAISE NOTICE 'Created % payroll records', (i - 1) * 2;
END $$;

-- Add leave balances for all employees
DO $$
DECLARE
  v_employee record;
  i integer := 1;
BEGIN
  FOR v_employee IN SELECT id FROM hr_employees ORDER BY employee_number
  LOOP
    -- Annual leave balance
    INSERT INTO hr_leave_balances (
      employee_id,
      leave_type,
      total_days,
      used_days,
      remaining_days,
      year
    ) VALUES (
      v_employee.id,
      'annual',
      22,
      (i % 12),
      22 - (i % 12),
      EXTRACT(YEAR FROM CURRENT_DATE)::integer
    ) ON CONFLICT (employee_id, leave_type, year) DO NOTHING;

    -- Sick leave balance
    INSERT INTO hr_leave_balances (
      employee_id,
      leave_type,
      total_days,
      used_days,
      remaining_days,
      year
    ) VALUES (
      v_employee.id,
      'sick',
      10,
      (i % 6),
      10 - (i % 6),
      EXTRACT(YEAR FROM CURRENT_DATE)::integer
    ) ON CONFLICT (employee_id, leave_type, year) DO NOTHING;

    i := i + 1;
  END LOOP;

  RAISE NOTICE 'Created leave balance records for % employees', i - 1;
END $$;

-- Add salary adjustments for some employees
DO $$
DECLARE
  v_employee_ids uuid[];
  v_employee_id uuid;
  i integer := 1;
BEGIN
  -- Get 6 random employees for salary adjustments
  SELECT ARRAY_AGG(id) INTO v_employee_ids
  FROM (
    SELECT id FROM hr_employees ORDER BY RANDOM() LIMIT 6
  ) subq;

  FOREACH v_employee_id IN ARRAY v_employee_ids
  LOOP
    IF i <= 3 THEN
      -- Bonuses
      INSERT INTO hr_salary_adjustments (
        employee_id,
        adjustment_type,
        amount,
        currency,
        reason,
        description,
        effective_date,
        is_recurring,
        frequency,
        status
      ) VALUES (
        v_employee_id,
        'bonus',
        CASE
          WHEN i = 1 THEN 1500
          WHEN i = 2 THEN 1000
          ELSE 800
        END,
        'USD',
        'Prime de performance',
        'Reconnaissance pour performance exceptionnelle et dépassement des objectifs',
        CURRENT_DATE - ((30 + i * 10)::integer || ' days')::interval,
        false,
        'one_time',
        'applied'
      );
    ELSE
      -- Salary increases
      INSERT INTO hr_salary_adjustments (
        employee_id,
        adjustment_type,
        amount,
        currency,
        reason,
        description,
        effective_date,
        is_recurring,
        frequency,
        status
      ) VALUES (
        v_employee_id,
        'increase',
        500,
        'USD',
        'Augmentation annuelle',
        'Augmentation de salaire suite à évaluation annuelle positive',
        CURRENT_DATE - ((60 + i * 15)::integer || ' days')::interval,
        true,
        'monthly',
        'applied'
      );
    END IF;

    i := i + 1;
  END LOOP;

  RAISE NOTICE 'Created % salary adjustments', i - 1;
END $$;