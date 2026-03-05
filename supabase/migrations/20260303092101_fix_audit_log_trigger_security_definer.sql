/*
  # Fix patient_registration_audit_log trigger for public submissions

  ## Problem
  The trigger function `log_patient_registration_audit` runs as the calling user.
  When an unauthenticated (public) user submits a patient registration, the trigger
  fires and tries to INSERT into `patient_registration_audit_log`, but the INSERT
  policy on that table only allows `authenticated` users — causing the entire
  registration insert to fail with a permissions error.

  ## Fix
  Recreate the trigger function with SECURITY DEFINER so it always runs with
  the privileges of the function owner (superuser/postgres), bypassing RLS on
  the audit log table regardless of who triggered it.
*/

CREATE OR REPLACE FUNCTION log_patient_registration_audit()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT;
  action_performed TEXT;
BEGIN
  SELECT r.name INTO user_role
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid();

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
$$;
