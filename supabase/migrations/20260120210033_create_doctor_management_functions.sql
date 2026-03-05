/*
  # Create Doctor Management Functions
  
  1. Availability Functions
    - get_doctor_next_available_slot
    - check_doctor_availability
    - find_doctors_by_criteria
  
  2. Replacement Functions
    - create_replacement
    - find_suitable_replacement
    - transfer_appointments_to_replacement
  
  3. Billing Functions
    - calculate_act_price
    - calculate_consultation_total
    - calculate_insurance_share
  
  4. Statistics Functions
    - calculate_doctor_rating
    - get_doctor_revenue
    - calculate_workload_metrics
  
  5. Validation Functions
    - validate_rpps_number
    - check_insurance_validity
    - check_authorization_for_act
*/

-- Function: Get doctor's next available appointment slot
CREATE OR REPLACE FUNCTION get_doctor_next_available_slot(
  p_doctor_id uuid,
  p_from_date date DEFAULT CURRENT_DATE,
  p_appointment_type text DEFAULT 'consultation'
)
RETURNS TABLE (
  available_date date,
  available_time time,
  slot_duration integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dac.date,
    dac.available_from,
    ms.average_consultation_duration
  FROM doctor_availability_calendar dac
  JOIN medical_staff ms ON ms.id = dac.doctor_id
  WHERE dac.doctor_id = p_doctor_id
    AND dac.date >= p_from_date
    AND dac.is_available = true
    AND NOT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.doctor_id = p_doctor_id
        AND a.appointment_date = dac.date
        AND a.status NOT IN ('cancelled', 'no_show', 'completed')
      HAVING COUNT(*) >= ms.max_daily_appointments
    )
  ORDER BY dac.date, dac.available_from
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check if doctor is available at specific date/time
CREATE OR REPLACE FUNCTION check_doctor_availability(
  p_doctor_id uuid,
  p_date date,
  p_time time,
  p_duration integer DEFAULT 30
)
RETURNS boolean AS $$
DECLARE
  v_is_available boolean;
  v_max_appointments integer;
  v_current_appointments integer;
BEGIN
  -- Check calendar availability
  SELECT is_available INTO v_is_available
  FROM doctor_availability_calendar
  WHERE doctor_id = p_doctor_id
    AND date = p_date
    AND p_time BETWEEN available_from AND available_until;
  
  IF v_is_available IS NULL THEN
    RETURN false;
  END IF;
  
  IF NOT v_is_available THEN
    RETURN false;
  END IF;
  
  -- Check appointment capacity
  SELECT max_daily_appointments INTO v_max_appointments
  FROM medical_staff
  WHERE id = p_doctor_id;
  
  SELECT COUNT(*) INTO v_current_appointments
  FROM appointments
  WHERE doctor_id = p_doctor_id
    AND appointment_date = p_date
    AND status NOT IN ('cancelled', 'no_show');
  
  IF v_current_appointments >= v_max_appointments THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Find doctors by multiple criteria
CREATE OR REPLACE FUNCTION find_doctors_by_criteria(
  p_specialty_id uuid DEFAULT NULL,
  p_language_iso text DEFAULT NULL,
  p_telemedicine boolean DEFAULT NULL,
  p_accepts_walk_ins boolean DEFAULT NULL,
  p_min_rating numeric DEFAULT 0
)
RETURNS TABLE (
  doctor_id uuid,
  full_name text,
  specialization text,
  average_rating numeric,
  total_ratings integer,
  is_accepting_patients boolean,
  telemedicine_enabled boolean,
  next_available_date date
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ms.id,
    up.full_name,
    ms.specialization,
    ms.average_rating,
    ms.total_ratings,
    ms.is_accepting_patients,
    ms.telemedicine_enabled,
    MIN(dac.date) as next_available_date
  FROM medical_staff ms
  JOIN user_profiles up ON up.id = ms.id
  LEFT JOIN doctor_specialties ds ON ds.doctor_id = ms.id
  LEFT JOIN doctor_languages dl ON dl.doctor_id = ms.id
  LEFT JOIN languages l ON l.id = dl.language_id
  LEFT JOIN doctor_availability_calendar dac ON dac.doctor_id = ms.id 
    AND dac.is_available = true 
    AND dac.date >= CURRENT_DATE
  WHERE ms.is_accepting_patients = true
    AND (p_specialty_id IS NULL OR ds.specialty_id = p_specialty_id)
    AND (p_language_iso IS NULL OR l.iso_code_639_1 = p_language_iso)
    AND (p_telemedicine IS NULL OR ms.telemedicine_enabled = p_telemedicine)
    AND (p_accepts_walk_ins IS NULL OR ms.accepts_walk_ins = p_accepts_walk_ins)
    AND ms.average_rating >= p_min_rating
  GROUP BY ms.id, up.full_name, ms.specialization, ms.average_rating, 
    ms.total_ratings, ms.is_accepting_patients, ms.telemedicine_enabled
  ORDER BY ms.average_rating DESC, ms.total_ratings DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Find suitable replacement doctor
CREATE OR REPLACE FUNCTION find_suitable_replacement(
  p_doctor_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  replacement_doctor_id uuid,
  full_name text,
  specialization text,
  match_score integer
) AS $$
BEGIN
  RETURN QUERY
  WITH original_doctor_specialties AS (
    SELECT specialty_id 
    FROM doctor_specialties 
    WHERE doctor_id = p_doctor_id AND is_primary_specialty = true
  )
  SELECT 
    ms.id,
    up.full_name,
    ms.specialization,
    (
      -- Score based on matching specialties
      (SELECT COUNT(*)::integer * 50 
       FROM doctor_specialties ds2 
       WHERE ds2.doctor_id = ms.id 
       AND ds2.specialty_id IN (SELECT specialty_id FROM original_doctor_specialties))
      +
      -- Bonus for availability
      CASE WHEN NOT EXISTS (
        SELECT 1 FROM doctor_leave_requests dlr
        WHERE dlr.doctor_id = ms.id
        AND dlr.status = 'approved'
        AND (dlr.start_date, dlr.end_date) OVERLAPS (p_start_date, p_end_date)
      ) THEN 30 ELSE 0 END
      +
      -- Bonus for high rating
      (ms.average_rating * 10)::integer
    ) as match_score
  FROM medical_staff ms
  JOIN user_profiles up ON up.id = ms.id
  WHERE ms.id != p_doctor_id
    AND ms.is_accepting_patients = true
    AND ms.practice_mode IN ('salarie', 'mixte', 'remplacant')
  ORDER BY match_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate act price with modifiers
CREATE OR REPLACE FUNCTION calculate_act_price(
  p_nomenclature_id uuid,
  p_doctor_id uuid,
  p_datetime timestamptz DEFAULT now(),
  p_modifiers text[] DEFAULT ARRAY[]::text[]
)
RETURNS numeric AS $$
DECLARE
  v_base_price numeric;
  v_custom_price numeric;
  v_final_price numeric;
  v_modifier_code text;
  v_multiplier numeric;
BEGIN
  -- Get base price from nomenclature
  SELECT base_price_usd INTO v_base_price
  FROM medical_nomenclatures
  WHERE id = p_nomenclature_id;
  
  -- Check for custom doctor pricing
  SELECT custom_price INTO v_custom_price
  FROM doctor_act_pricing
  WHERE doctor_id = p_doctor_id
    AND nomenclature_id = p_nomenclature_id
    AND p_datetime::date BETWEEN effective_from AND COALESCE(effective_until, '9999-12-31'::date)
    AND is_active = true
  LIMIT 1;
  
  v_final_price := COALESCE(v_custom_price, v_base_price);
  
  -- Apply modifiers
  FOREACH v_modifier_code IN ARRAY p_modifiers
  LOOP
    SELECT multiplier INTO v_multiplier
    FROM act_modifiers
    WHERE code = v_modifier_code
      AND is_active = true;
    
    IF v_multiplier IS NOT NULL THEN
      v_final_price := v_final_price * v_multiplier;
    END IF;
  END LOOP;
  
  RETURN ROUND(v_final_price, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate consultation total with all acts
CREATE OR REPLACE FUNCTION calculate_consultation_total(
  p_consultation_id uuid
)
RETURNS numeric AS $$
DECLARE
  v_total numeric;
BEGIN
  SELECT SUM(total_price) INTO v_total
  FROM consultation_acts
  WHERE consultation_id = p_consultation_id;
  
  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate insurance share for an act
CREATE OR REPLACE FUNCTION calculate_insurance_share(
  p_nomenclature_id uuid,
  p_insurance_provider_id uuid,
  p_total_amount numeric
)
RETURNS TABLE (
  insurance_share numeric,
  patient_share numeric,
  reimbursement_rate numeric
) AS $$
DECLARE
  v_rate numeric;
  v_max_amount numeric;
  v_insurance_share numeric;
BEGIN
  -- Get reimbursement rules
  SELECT 
    reimbursement_percentage,
    max_reimbursement_amount
  INTO v_rate, v_max_amount
  FROM insurance_reimbursement_rules
  WHERE nomenclature_id = p_nomenclature_id
    AND insurance_provider_id = p_insurance_provider_id
    AND CURRENT_DATE BETWEEN valid_from AND COALESCE(valid_until, '9999-12-31'::date)
    AND is_active = true
  LIMIT 1;
  
  -- Default to 70% if no specific rule
  v_rate := COALESCE(v_rate, 70.0);
  
  -- Calculate shares
  v_insurance_share := (p_total_amount * v_rate / 100);
  
  -- Apply maximum cap if exists
  IF v_max_amount IS NOT NULL AND v_insurance_share > v_max_amount THEN
    v_insurance_share := v_max_amount;
  END IF;
  
  RETURN QUERY SELECT 
    ROUND(v_insurance_share, 2),
    ROUND(p_total_amount - v_insurance_share, 2),
    v_rate;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate doctor rating
CREATE OR REPLACE FUNCTION calculate_doctor_rating(
  p_doctor_id uuid
)
RETURNS numeric AS $$
DECLARE
  v_avg_rating numeric;
  v_total_ratings integer;
BEGIN
  SELECT 
    AVG(rating)::numeric(3,2),
    COUNT(*)::integer
  INTO v_avg_rating, v_total_ratings
  FROM consultations
  WHERE doctor_id = p_doctor_id
    AND rating IS NOT NULL;
  
  UPDATE medical_staff
  SET 
    average_rating = COALESCE(v_avg_rating, 0),
    total_ratings = COALESCE(v_total_ratings, 0),
    updated_at = now()
  WHERE id = p_doctor_id;
  
  RETURN COALESCE(v_avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Get doctor revenue for period
CREATE OR REPLACE FUNCTION get_doctor_revenue(
  p_doctor_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  total_revenue numeric,
  total_acts integer,
  average_act_price numeric,
  patient_revenue numeric,
  insurance_revenue numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(ca.total_price)::numeric,
    COUNT(*)::integer,
    AVG(ca.total_price)::numeric,
    SUM(ca.patient_share)::numeric,
    SUM(ca.insurance_share)::numeric
  FROM consultation_acts ca
  WHERE ca.doctor_id = p_doctor_id
    AND ca.performed_at::date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Validate RPPS number format (French standard)
CREATE OR REPLACE FUNCTION validate_rpps_number(
  p_rpps text
)
RETURNS boolean AS $$
BEGIN
  -- RPPS numbers are 11 digits
  RETURN p_rpps ~ '^[0-9]{11}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Check if doctor's insurance is valid
CREATE OR REPLACE FUNCTION check_insurance_validity(
  p_doctor_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_expiry_date date;
BEGIN
  SELECT professional_insurance_expiry INTO v_expiry_date
  FROM medical_staff
  WHERE id = p_doctor_id;
  
  RETURN v_expiry_date IS NOT NULL AND v_expiry_date >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check if doctor is authorized for an act
CREATE OR REPLACE FUNCTION check_authorization_for_act(
  p_doctor_id uuid,
  p_nomenclature_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_is_authorized boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM doctor_medical_acts
    WHERE doctor_id = p_doctor_id
      AND nomenclature_id = p_nomenclature_id
      AND authorization_level IN ('full', 'supervised')
      AND is_active = true
  ) INTO v_is_authorized;
  
  RETURN COALESCE(v_is_authorized, false);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get doctor workload metrics
CREATE OR REPLACE FUNCTION calculate_workload_metrics(
  p_doctor_id uuid,
  p_period_days integer DEFAULT 30
)
RETURNS TABLE (
  total_appointments integer,
  completed_appointments integer,
  cancelled_appointments integer,
  average_daily_appointments numeric,
  capacity_utilization_percent numeric,
  total_consultations integer,
  average_consultation_duration numeric
) AS $$
DECLARE
  v_start_date date := CURRENT_DATE - p_period_days;
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_appointments,
    COUNT(*) FILTER (WHERE status = 'completed')::integer as completed_appointments,
    COUNT(*) FILTER (WHERE status = 'cancelled')::integer as cancelled_appointments,
    (COUNT(*)::numeric / p_period_days) as average_daily_appointments,
    ((COUNT(*)::numeric / p_period_days) / ms.max_daily_appointments * 100) as capacity_utilization_percent,
    COUNT(*) FILTER (WHERE EXISTS (
      SELECT 1 FROM consultations c 
      WHERE c.appointment_id = appointments.id
    ))::integer as total_consultations,
    ms.average_consultation_duration::numeric
  FROM appointments
  CROSS JOIN medical_staff ms
  WHERE appointments.doctor_id = p_doctor_id
    AND appointments.appointment_date >= v_start_date
    AND ms.id = p_doctor_id
  GROUP BY ms.max_daily_appointments, ms.average_consultation_duration;
END;
$$ LANGUAGE plpgsql STABLE;
