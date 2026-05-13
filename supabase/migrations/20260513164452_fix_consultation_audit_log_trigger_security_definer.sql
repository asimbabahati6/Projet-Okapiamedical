/*
  # Fix consultation_audit_log insert blocked by RLS

  1. Problem
    - The trigger function `log_consultation_change` inserts into `consultation_audit_log`
    - It runs as SECURITY INVOKER (default), so it's subject to RLS
    - No INSERT policy exists on `consultation_audit_log`, causing all inserts to fail
    - This blocks creating/updating consultations with error: "new row violates row-level security policy"

  2. Solution
    - Alter the trigger function to use SECURITY DEFINER so it bypasses RLS for audit logging
    - Set search_path to empty to prevent privilege escalation
    - This is the standard pattern for audit trigger functions

  3. Security notes
    - SECURITY DEFINER is appropriate here because:
      - The function is only invoked via a trigger on the consultations table
      - Users already need INSERT/UPDATE/DELETE permission on consultations to fire the trigger
      - Audit logs should always be written regardless of who performs the action
*/

CREATE OR REPLACE FUNCTION log_consultation_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.consultation_audit_log (consultation_id, action, new_values, performed_by)
    VALUES (NEW.id, 'created', to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.consultation_audit_log (consultation_id, action, old_values, new_values, performed_by)
    VALUES (NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.consultation_audit_log (consultation_id, action, old_values, performed_by)
    VALUES (OLD.id, 'deleted', to_jsonb(OLD), auth.uid());
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;
