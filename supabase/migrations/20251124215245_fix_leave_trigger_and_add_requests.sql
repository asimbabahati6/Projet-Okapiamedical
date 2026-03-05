/*
  # Fix Leave Balance Trigger and Add Leave Requests

  ## Changes

  ### 1. Fix Leave Balance Update Trigger
  Corrects column names from days_used/days_remaining to used_days/remaining_days

  ### 2. Add 18 More Leave Requests
  To reach total of 20 leave requests with various leave types and statuses

  ## Notes
  - Fixes trigger bug preventing leave request creation
  - Adds diverse leave requests across different employees
*/

-- Drop and recreate the trigger function with correct column names
DROP TRIGGER IF EXISTS trigger_update_leave_balance ON hr_leave_requests;
DROP FUNCTION IF EXISTS update_leave_balance_on_approval();

CREATE OR REPLACE FUNCTION update_leave_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE hr_leave_balances
    SET 
      used_days = used_days + NEW.total_days,
      remaining_days = remaining_days - NEW.total_days,
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

-- Add 18 more leave requests
DO $$
DECLARE
  v_employee_ids uuid[];
  v_employee_id uuid;
  i integer := 1;
BEGIN
  -- Get employees who don't have leave requests yet (excluding the 2 that already have)
  SELECT ARRAY_AGG(id) INTO v_employee_ids
  FROM (
    SELECT e.id
    FROM hr_employees e
    WHERE NOT EXISTS (SELECT 1 FROM hr_leave_requests WHERE employee_id = e.id)
    ORDER BY e.employee_number
    LIMIT 18
  ) subq;

  IF v_employee_ids IS NOT NULL THEN
    FOREACH v_employee_id IN ARRAY v_employee_ids
    LOOP
      INSERT INTO hr_leave_requests (
        employee_id,
        leave_type,
        start_date,
        end_date,
        total_days,
        reason,
        status,
        review_notes,
        reviewed_at
      ) VALUES (
        v_employee_id,
        CASE
          WHEN i % 5 = 0 THEN 'annual'
          WHEN i % 5 = 1 THEN 'sick'
          WHEN i % 5 = 2 THEN 'emergency'
          WHEN i % 5 = 3 THEN 'unpaid'
          ELSE 'annual'
        END,
        CURRENT_DATE + (i * 7 || ' days')::interval,
        CURRENT_DATE + ((i * 7 + 3 + (i % 8))::integer || ' days')::interval,
        3 + (i % 8),
        CASE
          WHEN i % 5 = 0 THEN 'Congé annuel - vacances familiales'
          WHEN i % 5 = 1 THEN 'Arrêt maladie prescrit par médecin'
          WHEN i % 5 = 2 THEN 'Urgence familiale imprévue'
          WHEN i % 5 = 3 THEN 'Raisons personnelles importantes'
          ELSE 'Repos et récupération planifiés'
        END,
        CASE
          WHEN i <= 8 THEN 'approved'
          WHEN i <= 14 THEN 'pending'
          ELSE 'rejected'
        END,
        CASE
          WHEN i <= 8 THEN 'Demande approuvée conformément au planning'
          WHEN i <= 14 THEN NULL
          ELSE 'Refusée - effectifs insuffisants pendant cette période'
        END,
        CASE
          WHEN i <= 8 OR i > 14 THEN CURRENT_DATE - ((i % 4 + 1)::integer || ' days')::interval
          ELSE NULL
        END
      );

      i := i + 1;
    END LOOP;

    RAISE NOTICE 'Created % additional leave requests', i - 1;
  ELSE
    RAISE NOTICE 'All employees already have leave requests';
  END IF;
END $$;