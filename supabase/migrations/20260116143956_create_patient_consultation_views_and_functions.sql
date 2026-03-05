/*
  # Vues et Fonctions pour la Navigation Patient-Consultation-Médecin

  1. Vues Créées
    - `patient_consultations_view` : Vue complète des consultations avec détails patient et médecin
    - `patient_medical_history_view` : Historique médical complet par patient
    - `doctor_consultations_view` : Consultations par médecin avec détails patients
    - `patient_appointments_view` : Rendez-vous avec détails

  2. Fonctions Créées
    - `get_patient_consultation_history(patient_id)` : Récupère l'historique de consultations d'un patient
    - `get_doctor_patients(doctor_id)` : Récupère la liste des patients d'un médecin
    - `get_patient_doctors(patient_id)` : Récupère la liste des médecins ayant consulté un patient
    - `get_consultation_details(consultation_id)` : Détails complets d'une consultation

  3. Indexes
    - Indexes sur consultations et appointments pour améliorer les performances
*/

-- Vue complète des consultations avec détails
CREATE OR REPLACE VIEW patient_consultations_view AS
SELECT 
  c.id as consultation_id,
  c.consultation_date,
  c.chief_complaint,
  c.diagnosis,
  c.treatment_plan,
  c.follow_up_date,
  -- Patient info
  p.id as patient_id,
  p.patient_number,
  p.first_name as patient_first_name,
  p.last_name as patient_last_name,
  p.date_of_birth,
  p.gender,
  p.blood_group,
  p.phone as patient_phone,
  p.email as patient_email,
  -- Doctor info (medical_staff.id = user_profiles.id)
  ms.id as doctor_id,
  up.full_name as doctor_name,
  up.phone as doctor_phone,
  ms.specialization,
  d.name as department_name,
  -- Appointment info
  a.appointment_number,
  a.appointment_date,
  a.appointment_time,
  a.appointment_type,
  -- Additional details
  c.vital_signs,
  c.physical_examination,
  c.diagnosis_codes,
  c.notes,
  c.created_at,
  c.updated_at
FROM consultations c
LEFT JOIN patients p ON c.patient_id = p.id
LEFT JOIN medical_staff ms ON c.doctor_id = ms.id
LEFT JOIN user_profiles up ON ms.id = up.id
LEFT JOIN appointments a ON c.appointment_id = a.id
LEFT JOIN departments d ON up.department_id = d.id;

-- Vue de l'historique médical par patient
CREATE OR REPLACE VIEW patient_medical_history_view AS
SELECT 
  p.id as patient_id,
  p.patient_number,
  p.first_name || ' ' || p.last_name as patient_name,
  p.date_of_birth,
  p.gender,
  p.blood_group,
  p.allergies,
  p.chronic_conditions,
  -- Primary care physician
  pcp_up.full_name as primary_care_physician_name,
  pcp_ms.specialization as primary_care_physician_specialty,
  -- Consultation count
  (SELECT COUNT(*) FROM consultations WHERE patient_id = p.id) as total_consultations,
  -- Last consultation
  (SELECT MAX(consultation_date) FROM consultations WHERE patient_id = p.id) as last_consultation_date,
  -- Next appointment
  (SELECT MIN(appointment_date) FROM appointments 
   WHERE patient_id = p.id 
   AND appointment_date >= CURRENT_DATE 
   AND status NOT IN ('cancelled', 'completed')) as next_appointment_date,
  p.created_at as registration_date
FROM patients p
LEFT JOIN medical_staff pcp_ms ON p.primary_care_physician_id = pcp_ms.id
LEFT JOIN user_profiles pcp_up ON pcp_ms.id = pcp_up.id;

-- Vue des consultations par médecin
CREATE OR REPLACE VIEW doctor_consultations_view AS
SELECT 
  ms.id as doctor_id,
  up.full_name as doctor_name,
  up.phone as doctor_phone,
  ms.specialization,
  d.name as department_name,
  -- Consultation details
  c.id as consultation_id,
  c.consultation_date,
  c.chief_complaint,
  c.diagnosis,
  -- Patient details
  p.id as patient_id,
  p.patient_number,
  p.first_name || ' ' || p.last_name as patient_name,
  p.date_of_birth,
  p.gender,
  p.blood_group,
  p.phone as patient_phone,
  -- Stats
  c.created_at,
  c.updated_at
FROM medical_staff ms
LEFT JOIN user_profiles up ON ms.id = up.id
LEFT JOIN departments d ON up.department_id = d.id
LEFT JOIN consultations c ON ms.id = c.doctor_id
LEFT JOIN patients p ON c.patient_id = p.id;

-- Vue des rendez-vous avec détails
CREATE OR REPLACE VIEW patient_appointments_view AS
SELECT 
  a.id as appointment_id,
  a.appointment_number,
  a.appointment_date,
  a.appointment_time,
  a.status,
  a.appointment_type,
  a.reason,
  a.notes,
  -- Patient info
  p.id as patient_id,
  p.patient_number,
  p.first_name || ' ' || p.last_name as patient_name,
  p.phone as patient_phone,
  p.email as patient_email,
  -- Doctor info
  ms.id as doctor_id,
  up.full_name as doctor_name,
  ms.specialization,
  d.name as department_name,
  -- Consultation link
  c.id as consultation_id,
  c.consultation_date,
  c.diagnosis,
  -- Dates
  a.created_at,
  a.checked_in_at,
  a.completed_at,
  a.cancelled_at
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN medical_staff ms ON a.doctor_id = ms.id
LEFT JOIN user_profiles up ON ms.id = up.id
LEFT JOIN departments d ON a.department_id = d.id
LEFT JOIN consultations c ON a.id = c.appointment_id;

-- Fonction : Récupérer l'historique de consultations d'un patient
CREATE OR REPLACE FUNCTION get_patient_consultation_history(p_patient_id UUID)
RETURNS TABLE (
  consultation_id UUID,
  consultation_date TIMESTAMPTZ,
  doctor_name TEXT,
  doctor_specialization TEXT,
  department_name TEXT,
  chief_complaint TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  follow_up_date DATE,
  vital_signs JSONB,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.consultation_date,
    up.full_name,
    ms.specialization,
    d.name,
    c.chief_complaint,
    c.diagnosis,
    c.treatment_plan,
    c.follow_up_date,
    c.vital_signs,
    c.notes
  FROM consultations c
  LEFT JOIN medical_staff ms ON c.doctor_id = ms.id
  LEFT JOIN user_profiles up ON ms.id = up.id
  LEFT JOIN departments d ON up.department_id = d.id
  WHERE c.patient_id = p_patient_id
  ORDER BY c.consultation_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : Récupérer la liste des patients d'un médecin
CREATE OR REPLACE FUNCTION get_doctor_patients(p_doctor_id UUID)
RETURNS TABLE (
  patient_id UUID,
  patient_number TEXT,
  patient_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  phone TEXT,
  email TEXT,
  blood_group TEXT,
  last_consultation_date TIMESTAMPTZ,
  total_consultations BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.patient_number,
    p.first_name || ' ' || p.last_name,
    p.date_of_birth,
    p.gender,
    p.phone,
    p.email,
    p.blood_group,
    (SELECT MAX(consultation_date) FROM consultations WHERE patient_id = p.id AND doctor_id = p_doctor_id),
    (SELECT COUNT(*) FROM consultations WHERE patient_id = p.id AND doctor_id = p_doctor_id)
  FROM patients p
  WHERE EXISTS (
    SELECT 1 FROM consultations c 
    WHERE c.patient_id = p.id 
    AND c.doctor_id = p_doctor_id
  )
  ORDER BY (SELECT MAX(consultation_date) FROM consultations WHERE patient_id = p.id AND doctor_id = p_doctor_id) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : Récupérer la liste des médecins ayant consulté un patient
CREATE OR REPLACE FUNCTION get_patient_doctors(p_patient_id UUID)
RETURNS TABLE (
  doctor_id UUID,
  doctor_name TEXT,
  department_name TEXT,
  specialization TEXT,
  last_consultation_date TIMESTAMPTZ,
  total_consultations BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    ms.id,
    up.full_name,
    d.name,
    ms.specialization,
    (SELECT MAX(consultation_date) FROM consultations WHERE patient_id = p_patient_id AND doctor_id = ms.id),
    (SELECT COUNT(*) FROM consultations WHERE patient_id = p_patient_id AND doctor_id = ms.id)
  FROM medical_staff ms
  LEFT JOIN user_profiles up ON ms.id = up.id
  LEFT JOIN departments d ON up.department_id = d.id
  WHERE EXISTS (
    SELECT 1 FROM consultations c 
    WHERE c.patient_id = p_patient_id 
    AND c.doctor_id = ms.id
  )
  ORDER BY (SELECT MAX(consultation_date) FROM consultations WHERE patient_id = p_patient_id AND doctor_id = ms.id) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction : Détails complets d'une consultation
CREATE OR REPLACE FUNCTION get_consultation_details(p_consultation_id UUID)
RETURNS TABLE (
  consultation_id UUID,
  consultation_date TIMESTAMPTZ,
  -- Patient
  patient_id UUID,
  patient_number TEXT,
  patient_name TEXT,
  patient_dob DATE,
  patient_gender TEXT,
  patient_blood_group TEXT,
  patient_allergies TEXT[],
  patient_chronic_conditions TEXT[],
  -- Doctor
  doctor_id UUID,
  doctor_name TEXT,
  department_name TEXT,
  doctor_specialization TEXT,
  -- Consultation details
  chief_complaint TEXT,
  history_of_present_illness TEXT,
  vital_signs JSONB,
  physical_examination TEXT,
  diagnosis TEXT,
  diagnosis_codes TEXT[],
  treatment_plan TEXT,
  notes TEXT,
  follow_up_date DATE,
  -- Appointment
  appointment_id UUID,
  appointment_number TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.consultation_date,
    -- Patient
    p.id,
    p.patient_number,
    p.first_name || ' ' || p.last_name,
    p.date_of_birth,
    p.gender,
    p.blood_group,
    p.allergies,
    p.chronic_conditions,
    -- Doctor
    ms.id,
    up.full_name,
    d.name,
    ms.specialization,
    -- Consultation
    c.chief_complaint,
    c.history_of_present_illness,
    c.vital_signs,
    c.physical_examination,
    c.diagnosis,
    c.diagnosis_codes,
    c.treatment_plan,
    c.notes,
    c.follow_up_date,
    -- Appointment
    a.id,
    a.appointment_number
  FROM consultations c
  LEFT JOIN patients p ON c.patient_id = p.id
  LEFT JOIN medical_staff ms ON c.doctor_id = ms.id
  LEFT JOIN user_profiles up ON ms.id = up.id
  LEFT JOIN departments d ON up.department_id = d.id
  LEFT JOIN appointments a ON c.appointment_id = a.id
  WHERE c.id = p_consultation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_consultations_patient_date 
ON consultations(patient_id, consultation_date DESC);

CREATE INDEX IF NOT EXISTS idx_consultations_doctor_date 
ON consultations(doctor_id, consultation_date DESC);

CREATE INDEX IF NOT EXISTS idx_consultations_appointment 
ON consultations(appointment_id);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_date 
ON appointments(patient_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date 
ON appointments(doctor_id, appointment_date DESC);