/*
  # Fix update_doctor_stats_after_consultation trigger - wrong column references

  1. Problem
    - The trigger function `update_doctor_stats_after_consultation` references `NEW.status` 
      but the actual column is `consultation_status`
    - It also references `NEW.rating` and `OLD.rating` which do not exist in the consultations table
    - This causes: "record 'new' has no field 'status'" error on every INSERT/UPDATE

  2. Changes
    - Replace `NEW.status` / `OLD.status` with `NEW.consultation_status` / `OLD.consultation_status`
    - Remove the rating recalculation block since the column does not exist
    - Add SECURITY DEFINER since it updates medical_staff table (may be RLS-protected)

  3. Impact
    - Fixes consultation creation that was completely blocked by this error
    - Doctor stats will now correctly update when consultation_status becomes 'completed'
*/

CREATE OR REPLACE FUNCTION update_doctor_stats_after_consultation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.consultation_status = 'completed' AND (OLD IS NULL OR OLD.consultation_status IS DISTINCT FROM 'completed') THEN
    UPDATE public.medical_staff
    SET 
      total_consultations = total_consultations + 1,
      total_patients = (
        SELECT COUNT(DISTINCT patient_id) 
        FROM public.consultations 
        WHERE doctor_id = NEW.doctor_id
      ),
      updated_at = now()
    WHERE id = NEW.doctor_id;
  END IF;

  RETURN NEW;
END;
$$;
