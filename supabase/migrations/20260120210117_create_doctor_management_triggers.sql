/*
  # Create Doctor Management Triggers
  
  1. Validation Triggers
    - Validate doctor data before insert/update
    - Check insurance validity
    - Validate certifications
  
  2. Calculation Triggers
    - Auto-calculate consultation totals
    - Update doctor statistics
    - Update workload metrics
  
  3. Notification Triggers
    - Alert on insurance expiry
    - Alert on certification renewal
    - Alert on replacement needs
  
  4. Audit Triggers
    - Log all doctor changes
    - Log pricing changes
    - Log replacement actions
*/

-- Trigger: Update medical_staff updated_at timestamp
CREATE OR REPLACE FUNCTION update_medical_staff_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medical_staff_timestamp_trigger
  BEFORE UPDATE ON medical_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_staff_timestamp();

-- Trigger: Auto-calculate consultation act totals
CREATE OR REPLACE FUNCTION calculate_consultation_act_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total price
  NEW.total_price = NEW.unit_price * NEW.quantity * NEW.technical_coefficient;
  
  -- Calculate shares based on reimbursement rate
  IF NEW.billed_to IN ('insurance', 'both') AND NEW.reimbursement_rate > 0 THEN
    NEW.insurance_share = NEW.total_price * NEW.reimbursement_rate / 100;
    NEW.patient_share = NEW.total_price - NEW.insurance_share;
  ELSE
    NEW.patient_share = NEW.total_price;
    NEW.insurance_share = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_consultation_act_totals_trigger
  BEFORE INSERT OR UPDATE ON consultation_acts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_consultation_act_totals();

-- Trigger: Update doctor statistics after consultation
CREATE OR REPLACE FUNCTION update_doctor_stats_after_consultation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE medical_staff
    SET 
      total_consultations = total_consultations + 1,
      total_patients = (
        SELECT COUNT(DISTINCT patient_id) 
        FROM consultations 
        WHERE doctor_id = NEW.doctor_id
      ),
      updated_at = now()
    WHERE id = NEW.doctor_id;
  END IF;
  
  -- Recalculate rating if rating was added or changed
  IF NEW.rating IS NOT NULL AND (OLD.rating IS NULL OR OLD.rating != NEW.rating) THEN
    PERFORM calculate_doctor_rating(NEW.doctor_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_doctor_stats_after_consultation_trigger
  AFTER INSERT OR UPDATE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_stats_after_consultation();

-- Trigger: Update doctor current status automatically
CREATE OR REPLACE FUNCTION update_doctor_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_status != OLD.current_status THEN
    NEW.status_updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_doctor_status_trigger
  BEFORE UPDATE ON medical_staff
  FOR EACH ROW
  WHEN (OLD.current_status IS DISTINCT FROM NEW.current_status)
  EXECUTE FUNCTION update_doctor_status();

-- Trigger: Update patient load when appointment is created/updated
CREATE OR REPLACE FUNCTION update_doctor_patient_load()
RETURNS TRIGGER AS $$
DECLARE
  v_doctor_id uuid;
  v_new_load integer;
BEGIN
  -- Determine which doctor to update
  IF TG_OP = 'DELETE' THEN
    v_doctor_id := OLD.doctor_id;
  ELSE
    v_doctor_id := NEW.doctor_id;
  END IF;
  
  -- Calculate current patient load for today
  SELECT COUNT(*) INTO v_new_load
  FROM appointments
  WHERE doctor_id = v_doctor_id
    AND appointment_date = CURRENT_DATE
    AND status NOT IN ('cancelled', 'no_show', 'completed');
  
  -- Update medical_staff
  UPDATE medical_staff
  SET 
    current_patient_load = v_new_load,
    updated_at = now()
  WHERE id = v_doctor_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_doctor_patient_load_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_patient_load();

-- Trigger: Count affected appointments when replacement is created
CREATE OR REPLACE FUNCTION count_affected_appointments_on_replacement()
RETURNS TRIGGER AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM appointments
  WHERE doctor_id = NEW.original_doctor_id
    AND appointment_date BETWEEN NEW.start_date AND NEW.end_date
    AND status NOT IN ('cancelled', 'completed');
  
  NEW.affected_appointments_count = v_count;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER count_affected_appointments_on_replacement_trigger
  BEFORE INSERT ON doctor_replacements
  FOR EACH ROW
  EXECUTE FUNCTION count_affected_appointments_on_replacement();

-- Trigger: Update replacement status based on dates
CREATE OR REPLACE FUNCTION update_replacement_status_by_date()
RETURNS void AS $$
BEGIN
  -- Activate replacements that should start today
  UPDATE doctor_replacements
  SET status = 'active'
  WHERE status = 'approved'
    AND start_date = CURRENT_DATE;
  
  -- Complete replacements that ended yesterday
  UPDATE doctor_replacements
  SET status = 'completed'
  WHERE status = 'active'
    AND end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Increment act performed count
CREATE OR REPLACE FUNCTION increment_act_performed_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE doctor_medical_acts
  SET 
    performed_count = performed_count + NEW.quantity,
    updated_at = now()
  WHERE doctor_id = NEW.doctor_id
    AND nomenclature_id = NEW.nomenclature_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_act_performed_count_trigger
  AFTER INSERT ON consultation_acts
  FOR EACH ROW
  EXECUTE FUNCTION increment_act_performed_count();

-- Trigger: Log doctor act pricing changes
CREATE OR REPLACE FUNCTION log_pricing_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      user_id
    ) VALUES (
      'doctor_act_pricing',
      NEW.id,
      'UPDATE',
      jsonb_build_object(
        'custom_price', OLD.custom_price,
        'sector', OLD.sector
      ),
      jsonb_build_object(
        'custom_price', NEW.custom_price,
        'sector', NEW.sector
      ),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_pricing_changes_trigger
  AFTER UPDATE ON doctor_act_pricing
  FOR EACH ROW
  WHEN (OLD.custom_price IS DISTINCT FROM NEW.custom_price OR OLD.sector IS DISTINCT FROM NEW.sector)
  EXECUTE FUNCTION log_pricing_changes();

-- Trigger: Validate insurance expiry on doctor update
CREATE OR REPLACE FUNCTION validate_insurance_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_accepting_patients = true 
     AND (NEW.professional_insurance_expiry IS NULL 
          OR NEW.professional_insurance_expiry < CURRENT_DATE) THEN
    RAISE WARNING 'Doctor % has expired or missing professional insurance', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_insurance_expiry_trigger
  BEFORE UPDATE ON medical_staff
  FOR EACH ROW
  WHEN (NEW.is_accepting_patients = true)
  EXECUTE FUNCTION validate_insurance_expiry();

-- Trigger: Auto-set primary specialty if it's the first one
CREATE OR REPLACE FUNCTION auto_set_primary_specialty()
RETURNS TRIGGER AS $$
DECLARE
  v_count integer;
BEGIN
  -- Count existing specialties for this doctor
  SELECT COUNT(*) INTO v_count
  FROM doctor_specialties
  WHERE doctor_id = NEW.doctor_id;
  
  -- If this is the first specialty, make it primary
  IF v_count = 0 THEN
    NEW.is_primary_specialty = true;
  END IF;
  
  -- If setting as primary, unset other primaries
  IF NEW.is_primary_specialty = true THEN
    UPDATE doctor_specialties
    SET is_primary_specialty = false
    WHERE doctor_id = NEW.doctor_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_primary_specialty_trigger
  BEFORE INSERT OR UPDATE ON doctor_specialties
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_primary_specialty();

-- Trigger: Update timestamps on junction tables
CREATE OR REPLACE FUNCTION update_junction_table_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_doctor_specialties_timestamp
  BEFORE UPDATE ON doctor_specialties
  FOR EACH ROW
  EXECUTE FUNCTION update_junction_table_timestamp();

CREATE TRIGGER update_doctor_certifications_timestamp
  BEFORE UPDATE ON doctor_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_junction_table_timestamp();

CREATE TRIGGER update_doctor_languages_timestamp
  BEFORE UPDATE ON doctor_languages
  FOR EACH ROW
  EXECUTE FUNCTION update_junction_table_timestamp();

CREATE TRIGGER update_doctor_pricing_timestamp
  BEFORE UPDATE ON doctor_act_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_junction_table_timestamp();

-- Trigger: Update certification renewal status based on expiry date
CREATE OR REPLACE FUNCTION update_certification_renewal_status()
RETURNS void AS $$
BEGIN
  -- Mark as expiring_soon (within 90 days)
  UPDATE doctor_certifications
  SET renewal_status = 'expiring_soon'
  WHERE expiry_date IS NOT NULL
    AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
    AND renewal_status = 'current';
  
  -- Mark as expired
  UPDATE doctor_certifications
  SET renewal_status = 'expired'
  WHERE expiry_date IS NOT NULL
    AND expiry_date < CURRENT_DATE
    AND renewal_status != 'expired';
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update leave request patient impact count
CREATE OR REPLACE FUNCTION calculate_leave_patient_impact()
RETURNS TRIGGER AS $$
DECLARE
  v_count integer;
BEGIN
  IF NEW.status = 'pending' OR NEW.status = 'approved' THEN
    SELECT COUNT(*) INTO v_count
    FROM appointments
    WHERE doctor_id = NEW.doctor_id
      AND appointment_date BETWEEN NEW.start_date AND NEW.end_date
      AND status NOT IN ('cancelled', 'completed');
    
    NEW.patient_impact_count = v_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_leave_patient_impact_trigger
  BEFORE INSERT OR UPDATE ON doctor_leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_leave_patient_impact();
