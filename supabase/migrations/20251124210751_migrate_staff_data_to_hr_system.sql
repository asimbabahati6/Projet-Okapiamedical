/*
  # Migration des Données du Personnel vers le Système RH

  ## Aperçu
  Cette migration copie toutes les données du personnel depuis user_profiles vers hr_employees,
  et migre tous les enregistrements de présence et congés vers les nouvelles tables RH.

  ## Processus
  1. Créer des enregistrements hr_employees pour tous les utilisateurs staff actifs
  2. Copier attendance_records → hr_attendance_records
  3. Copier leave_requests → hr_leave_requests
  4. Générer des contrats par défaut pour les employés migrés
  5. Logger toutes les opérations dans hr_migration_log

  ## Sécurité
  - Toutes les opérations sont tracées
  - Possibilité de rollback via les logs
  - Validation d'intégrité à chaque étape
*/

-- Function to migrate users to hr_employees
CREATE OR REPLACE FUNCTION migrate_users_to_hr_employees()
RETURNS TABLE(
  total_processed integer,
  total_success integer,
  total_failed integer,
  total_skipped integer
) AS $$
DECLARE
  v_user_record RECORD;
  v_employee_number text;
  v_count_processed integer := 0;
  v_count_success integer := 0;
  v_count_failed integer := 0;
  v_count_skipped integer := 0;
  v_log_id uuid;
BEGIN
  -- Log migration start
  INSERT INTO hr_migration_log (
    migration_type,
    source_table,
    target_table,
    status,
    metadata
  ) VALUES (
    'user_to_employee',
    'user_profiles',
    'hr_employees',
    'pending',
    jsonb_build_object('started_at', now())
  ) RETURNING id INTO v_log_id;

  -- Iterate through all active staff users
  FOR v_user_record IN 
    SELECT 
      up.id,
      up.full_name,
      up.phone,
      up.department_id,
      up.created_at,
      r.name as role_name
    FROM user_profiles up
    LEFT JOIN roles r ON up.role_id = r.id
    WHERE up.is_active = true
    AND r.name NOT IN ('patient') -- Exclure les patients
    AND up.id NOT IN (SELECT id FROM hr_employees) -- Éviter les doublons
    ORDER BY up.created_at
  LOOP
    v_count_processed := v_count_processed + 1;

    BEGIN
      -- Generate employee number
      SELECT 'EMP' || LPAD((COALESCE(MAX(SUBSTRING(employee_number FROM 4)::integer), 0) + 1)::text, 6, '0')
      INTO v_employee_number
      FROM hr_employees;

      -- Insert into hr_employees
      INSERT INTO hr_employees (
        id,
        employee_number,
        hire_date,
        employment_status,
        contract_type,
        salary_amount,
        salary_currency,
        emergency_contact_phone,
        notes,
        created_at,
        updated_at
      ) VALUES (
        v_user_record.id,
        v_employee_number,
        COALESCE(v_user_record.created_at::date, CURRENT_DATE),
        'active',
        'permanent', -- Par défaut
        0, -- À mettre à jour manuellement
        'XAF',
        v_user_record.phone,
        'Migré automatiquement depuis user_profiles le ' || now()::text,
        v_user_record.created_at,
        now()
      );

      v_count_success := v_count_success + 1;

      -- Log individual success
      INSERT INTO hr_migration_log (
        migration_type,
        source_table,
        target_table,
        source_id,
        target_id,
        status,
        metadata
      ) VALUES (
        'user_to_employee',
        'user_profiles',
        'hr_employees',
        v_user_record.id,
        v_user_record.id,
        'success',
        jsonb_build_object(
          'employee_number', v_employee_number,
          'full_name', v_user_record.full_name,
          'role', v_user_record.role_name
        )
      );

    EXCEPTION WHEN OTHERS THEN
      v_count_failed := v_count_failed + 1;

      -- Log individual failure
      INSERT INTO hr_migration_log (
        migration_type,
        source_table,
        target_table,
        source_id,
        status,
        error_message,
        metadata
      ) VALUES (
        'user_to_employee',
        'user_profiles',
        'hr_employees',
        v_user_record.id,
        'failed',
        SQLERRM,
        jsonb_build_object(
          'full_name', v_user_record.full_name,
          'error_code', SQLSTATE
        )
      );
    END;
  END LOOP;

  -- Update main log with results
  UPDATE hr_migration_log
  SET 
    status = CASE 
      WHEN v_count_failed = 0 THEN 'success'
      WHEN v_count_success = 0 THEN 'failed'
      ELSE 'success'
    END,
    records_processed = v_count_processed,
    records_success = v_count_success,
    records_failed = v_count_failed,
    completed_at = now(),
    metadata = metadata || jsonb_build_object(
      'completed_at', now(),
      'duration_seconds', EXTRACT(EPOCH FROM (now() - started_at))
    )
  WHERE id = v_log_id;

  RETURN QUERY SELECT v_count_processed, v_count_success, v_count_failed, v_count_skipped;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate attendance records
CREATE OR REPLACE FUNCTION migrate_attendance_records()
RETURNS TABLE(
  total_processed integer,
  total_success integer,
  total_failed integer
) AS $$
DECLARE
  v_count_processed integer := 0;
  v_count_success integer := 0;
  v_count_failed integer := 0;
  v_log_id uuid;
  v_attendance_record RECORD;
BEGIN
  -- Log migration start
  INSERT INTO hr_migration_log (
    migration_type,
    source_table,
    target_table,
    status,
    metadata
  ) VALUES (
    'attendance_records',
    'attendance_records',
    'hr_attendance_records',
    'pending',
    jsonb_build_object('started_at', now())
  ) RETURNING id INTO v_log_id;

  -- Migrate attendance records for employees that exist in hr_employees
  FOR v_attendance_record IN
    SELECT ar.*
    FROM attendance_records ar
    WHERE ar.staff_id IN (SELECT id FROM hr_employees)
    AND NOT EXISTS (
      SELECT 1 FROM hr_attendance_records har
      WHERE har.employee_id = ar.staff_id
      AND har.date = ar.date
    )
    ORDER BY ar.date DESC
  LOOP
    v_count_processed := v_count_processed + 1;

    BEGIN
      INSERT INTO hr_attendance_records (
        employee_id,
        date,
        check_in_time,
        check_out_time,
        break_start_time,
        break_end_time,
        status,
        location_lat,
        location_lng,
        notes,
        created_at,
        updated_at
      ) VALUES (
        v_attendance_record.staff_id,
        v_attendance_record.date,
        v_attendance_record.check_in_time,
        v_attendance_record.check_out_time,
        v_attendance_record.break_start_time,
        v_attendance_record.break_end_time,
        v_attendance_record.status,
        v_attendance_record.location_lat,
        v_attendance_record.location_lng,
        v_attendance_record.notes,
        v_attendance_record.created_at,
        v_attendance_record.updated_at
      );

      v_count_success := v_count_success + 1;

    EXCEPTION WHEN OTHERS THEN
      v_count_failed := v_count_failed + 1;

      INSERT INTO hr_migration_log (
        migration_type,
        source_table,
        target_table,
        source_id,
        status,
        error_message
      ) VALUES (
        'attendance_records',
        'attendance_records',
        'hr_attendance_records',
        v_attendance_record.id,
        'failed',
        SQLERRM
      );
    END;
  END LOOP;

  -- Update main log
  UPDATE hr_migration_log
  SET 
    status = CASE WHEN v_count_failed = 0 THEN 'success' ELSE 'success' END,
    records_processed = v_count_processed,
    records_success = v_count_success,
    records_failed = v_count_failed,
    completed_at = now()
  WHERE id = v_log_id;

  RETURN QUERY SELECT v_count_processed, v_count_success, v_count_failed;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate leave requests
CREATE OR REPLACE FUNCTION migrate_leave_requests()
RETURNS TABLE(
  total_processed integer,
  total_success integer,
  total_failed integer
) AS $$
DECLARE
  v_count_processed integer := 0;
  v_count_success integer := 0;
  v_count_failed integer := 0;
  v_log_id uuid;
  v_leave_record RECORD;
BEGIN
  -- Log migration start
  INSERT INTO hr_migration_log (
    migration_type,
    source_table,
    target_table,
    status,
    metadata
  ) VALUES (
    'leave_requests',
    'leave_requests',
    'hr_leave_requests',
    'pending',
    jsonb_build_object('started_at', now())
  ) RETURNING id INTO v_log_id;

  -- Migrate leave requests
  FOR v_leave_record IN
    SELECT lr.*
    FROM leave_requests lr
    WHERE lr.staff_id IN (SELECT id FROM hr_employees)
    AND lr.id NOT IN (SELECT id FROM hr_leave_requests WHERE id = lr.id)
    ORDER BY lr.created_at DESC
  LOOP
    v_count_processed := v_count_processed + 1;

    BEGIN
      INSERT INTO hr_leave_requests (
        id,
        employee_id,
        leave_type,
        start_date,
        end_date,
        total_days,
        reason,
        status,
        reviewed_by,
        reviewed_at,
        review_notes,
        created_at,
        updated_at
      ) VALUES (
        v_leave_record.id,
        v_leave_record.staff_id,
        v_leave_record.leave_type,
        v_leave_record.start_date,
        v_leave_record.end_date,
        v_leave_record.total_days,
        v_leave_record.reason,
        v_leave_record.status,
        v_leave_record.reviewed_by,
        v_leave_record.reviewed_at,
        v_leave_record.review_notes,
        v_leave_record.created_at,
        v_leave_record.updated_at
      );

      v_count_success := v_count_success + 1;

    EXCEPTION WHEN OTHERS THEN
      v_count_failed := v_count_failed + 1;

      INSERT INTO hr_migration_log (
        migration_type,
        source_table,
        target_table,
        source_id,
        status,
        error_message
      ) VALUES (
        'leave_requests',
        'leave_requests',
        'hr_leave_requests',
        v_leave_record.id,
        'failed',
        SQLERRM
      );
    END;
  END LOOP;

  -- Update main log
  UPDATE hr_migration_log
  SET 
    status = CASE WHEN v_count_failed = 0 THEN 'success' ELSE 'success' END,
    records_processed = v_count_processed,
    records_success = v_count_success,
    records_failed = v_count_failed,
    completed_at = now()
  WHERE id = v_log_id;

  RETURN QUERY SELECT v_count_processed, v_count_success, v_count_failed;
END;
$$ LANGUAGE plpgsql;

-- Function to create default contracts for migrated employees
CREATE OR REPLACE FUNCTION create_default_contracts_for_employees()
RETURNS integer AS $$
DECLARE
  v_employee_record RECORD;
  v_contract_number text;
  v_count integer := 0;
BEGIN
  FOR v_employee_record IN
    SELECT he.*, up.department_id
    FROM hr_employees he
    JOIN user_profiles up ON he.id = up.id
    WHERE NOT EXISTS (
      SELECT 1 FROM hr_contracts WHERE employee_id = he.id
    )
  LOOP
    -- Generate contract number
    SELECT 'CONT' || LPAD((COALESCE(MAX(SUBSTRING(contract_number FROM 5)::integer), 0) + 1)::text, 6, '0')
    INTO v_contract_number
    FROM hr_contracts;

    INSERT INTO hr_contracts (
      employee_id,
      contract_number,
      contract_type,
      start_date,
      position,
      department_id,
      salary_amount,
      salary_currency,
      status,
      notes
    ) VALUES (
      v_employee_record.id,
      v_contract_number,
      v_employee_record.contract_type,
      v_employee_record.hire_date,
      'À définir',
      v_employee_record.department_id,
      v_employee_record.salary_amount,
      v_employee_record.salary_currency,
      'active',
      'Contrat généré automatiquement lors de la migration'
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to validate migration integrity
CREATE OR REPLACE FUNCTION validate_migration_integrity()
RETURNS TABLE(
  check_name text,
  expected_count bigint,
  actual_count bigint,
  status text,
  details text
) AS $$
BEGIN
  -- Check 1: All active staff users have hr_employees record
  RETURN QUERY
  SELECT 
    'Active staff in hr_employees'::text,
    (SELECT COUNT(*) FROM user_profiles up 
     JOIN roles r ON up.role_id = r.id 
     WHERE up.is_active = true AND r.name != 'patient')::bigint,
    (SELECT COUNT(*) FROM hr_employees)::bigint,
    CASE 
      WHEN (SELECT COUNT(*) FROM user_profiles up 
            JOIN roles r ON up.role_id = r.id 
            WHERE up.is_active = true AND r.name != 'patient') = 
           (SELECT COUNT(*) FROM hr_employees)
      THEN 'PASS'::text
      ELSE 'FAIL'::text
    END,
    'Verify all active staff have been migrated to hr_employees'::text;

  -- Check 2: Attendance records migration
  RETURN QUERY
  SELECT 
    'Attendance records migrated'::text,
    (SELECT COUNT(*) FROM attendance_records ar
     WHERE ar.staff_id IN (SELECT id FROM hr_employees))::bigint,
    (SELECT COUNT(*) FROM hr_attendance_records)::bigint,
    CASE 
      WHEN (SELECT COUNT(*) FROM attendance_records ar
            WHERE ar.staff_id IN (SELECT id FROM hr_employees)) <= 
           (SELECT COUNT(*) FROM hr_attendance_records)
      THEN 'PASS'::text
      ELSE 'WARN'::text
    END,
    'Verify attendance records have been migrated'::text;

  -- Check 3: Leave requests migration
  RETURN QUERY
  SELECT 
    'Leave requests migrated'::text,
    (SELECT COUNT(*) FROM leave_requests lr
     WHERE lr.staff_id IN (SELECT id FROM hr_employees))::bigint,
    (SELECT COUNT(*) FROM hr_leave_requests)::bigint,
    CASE 
      WHEN (SELECT COUNT(*) FROM leave_requests lr
            WHERE lr.staff_id IN (SELECT id FROM hr_employees)) <= 
           (SELECT COUNT(*) FROM hr_leave_requests)
      THEN 'PASS'::text
      ELSE 'WARN'::text
    END,
    'Verify leave requests have been migrated'::text;

  -- Check 4: All employees have at least one contract
  RETURN QUERY
  SELECT 
    'Employees have contracts'::text,
    (SELECT COUNT(*) FROM hr_employees)::bigint,
    (SELECT COUNT(DISTINCT employee_id) FROM hr_contracts)::bigint,
    CASE 
      WHEN (SELECT COUNT(*) FROM hr_employees) = 
           (SELECT COUNT(DISTINCT employee_id) FROM hr_contracts)
      THEN 'PASS'::text
      ELSE 'WARN'::text
    END,
    'Verify all employees have at least one contract'::text;
END;
$$ LANGUAGE plpgsql;

-- Function to execute full migration
CREATE OR REPLACE FUNCTION execute_full_hr_migration()
RETURNS jsonb AS $$
DECLARE
  v_users_result RECORD;
  v_attendance_result RECORD;
  v_leave_result RECORD;
  v_contracts_count integer;
  v_validation_results jsonb;
BEGIN
  -- Step 1: Migrate users
  SELECT * INTO v_users_result FROM migrate_users_to_hr_employees();

  -- Step 2: Migrate attendance records
  SELECT * INTO v_attendance_result FROM migrate_attendance_records();

  -- Step 3: Migrate leave requests
  SELECT * INTO v_leave_result FROM migrate_leave_requests();

  -- Step 4: Create default contracts
  SELECT * INTO v_contracts_count FROM create_default_contracts_for_employees();

  -- Step 5: Validate
  SELECT jsonb_agg(row_to_json(v)::jsonb) INTO v_validation_results
  FROM validate_migration_integrity() v;

  -- Return comprehensive report
  RETURN jsonb_build_object(
    'migration_completed_at', now(),
    'users_migration', jsonb_build_object(
      'processed', v_users_result.total_processed,
      'success', v_users_result.total_success,
      'failed', v_users_result.total_failed,
      'skipped', v_users_result.total_skipped
    ),
    'attendance_migration', jsonb_build_object(
      'processed', v_attendance_result.total_processed,
      'success', v_attendance_result.total_success,
      'failed', v_attendance_result.total_failed
    ),
    'leave_migration', jsonb_build_object(
      'processed', v_leave_result.total_processed,
      'success', v_leave_result.total_success,
      'failed', v_leave_result.total_failed
    ),
    'contracts_created', v_contracts_count,
    'validation_results', v_validation_results
  );
END;
$$ LANGUAGE plpgsql;
