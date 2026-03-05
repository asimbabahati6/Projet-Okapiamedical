/*
  # Insert 10 Congolese Demo Doctors for OKAPIA Medical

  1. Purpose
    - Insert 10 realistic Congolese doctors with complete profiles
    - Assign doctors to specific departments
    - Set up availability schedules for each doctor
    - Enable telemedicine for all doctors

  2. Doctors List
    - Dr. Jean Mukendi - Cardiologie
    - Dr. Sarah Kapinga - Pédiatrie
    - Dr. Marie-Louise Nzuji - Gynécologie (Médecine Générale)
    - Dr. Patrick Bolamba - Médecine Générale
    - Dr. Alice Watuna - Médecine Générale
    - Dr. Robert Kasongo - Chirurgie
    - Dr. Hélène Yowa - Neurologie (Médecine Générale)
    - Dr. David Mutombo - Ophtalmologie (Médecine Générale)
    - Dr. Sophie Kalala - Radiologie (Médecine Générale)
    - Dr. Marc Zola - Urgences (Médecine Générale)

  3. Security
    - Standard RLS policies apply
    - All doctors have appropriate role assignments
*/

-- Insert doctors into auth.users and user_profiles (using existing user IDs from migration)
-- Note: We'll reuse the 5 existing doctor IDs and create 5 new ones

-- ============================================================================
-- 1. Dr. Jean Mukendi - Cardiologie
-- ============================================================================
-- Update existing doctor (ID: 1ea2b700-6123-45e5-8850-38942f17566c)
UPDATE user_profiles
SET
  full_name = 'Dr. Jean Mukendi',
  phone = '+243 81 234 5678',
  email = 'j.mukendi@okapiamedical.com',
  department_id = (SELECT id FROM departments WHERE name = 'Cardiologie'),
  updated_at = now()
WHERE id = '1ea2b700-6123-45e5-8850-38942f17566c';

UPDATE medical_staff
SET
  rpps_number = 'RDC-CARD-001',
  specialization = 'Cardiologie',
  qualifications = ARRAY['Doctorat en Médecine', 'Spécialisation en Cardiologie', 'Cardiologie interventionnelle'],
  years_of_experience = 15,
  consultation_fee = 100.00,
  bio = 'Cardiologue expérimenté spécialisé dans les pathologies coronariennes et l''hypertension artérielle. Diplômé de l''Université de Kinshasa avec une formation complémentaire en cardiologie interventionnelle.',
  is_accepting_patients = true,
  staff_type = 'medical',
  staff_category = 'doctor',
  telemedicine_enabled = true,
  can_prescribe_controlled_substances = true,
  current_status = 'available',
  average_rating = 4.8,
  total_consultations = 450,
  updated_at = now()
WHERE id = '1ea2b700-6123-45e5-8850-38942f17566c';

-- Assign to Cardiologie department
INSERT INTO doctor_departments (doctor_id, department_id, is_primary, is_active, assignment_date)
VALUES
  ('1ea2b700-6123-45e5-8850-38942f17566c',
   (SELECT id FROM departments WHERE name = 'Cardiologie'),
   true, true, now())
ON CONFLICT (doctor_id, department_id) DO UPDATE
SET is_primary = true, is_active = true, assignment_date = now();

-- Set availability: Lun-Ven 08:00-16:00
INSERT INTO doctor_schedule_templates (doctor_id, day_of_week, start_time, end_time, is_active, slot_duration)
VALUES
  ('1ea2b700-6123-45e5-8850-38942f17566c', 1, '08:00', '16:00', true, 30),
  ('1ea2b700-6123-45e5-8850-38942f17566c', 2, '08:00', '16:00', true, 30),
  ('1ea2b700-6123-45e5-8850-38942f17566c', 3, '08:00', '16:00', true, 30),
  ('1ea2b700-6123-45e5-8850-38942f17566c', 4, '08:00', '16:00', true, 30),
  ('1ea2b700-6123-45e5-8850-38942f17566c', 5, '08:00', '16:00', true, 30)
ON CONFLICT (doctor_id, day_of_week) DO UPDATE
SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_active = true;

-- ============================================================================
-- 2. Dr. Sarah Kapinga - Pédiatrie
-- ============================================================================
UPDATE user_profiles
SET
  full_name = 'Dr. Sarah Kapinga',
  phone = '+243 82 345 6789',
  email = 's.kapinga@okapiamedical.com',
  department_id = (SELECT id FROM departments WHERE name = 'Pédiatrie'),
  updated_at = now()
WHERE id = 'c556b341-be26-4ef7-9f54-d3fadb5a0de5';

UPDATE medical_staff
SET
  rpps_number = 'RDC-PED-002',
  specialization = 'Pédiatrie',
  qualifications = ARRAY['Doctorat en Médecine', 'Spécialisation en Pédiatrie', 'Néonatologie'],
  years_of_experience = 12,
  consultation_fee = 80.00,
  bio = 'Pédiatre dévouée aux soins des nourrissons, enfants et adolescents. Spécialisée en vaccination et suivi de croissance.',
  is_accepting_patients = true,
  staff_type = 'medical',
  staff_category = 'doctor',
  telemedicine_enabled = true,
  can_prescribe_controlled_substances = true,
  current_status = 'available',
  average_rating = 4.9,
  total_consultations = 580,
  updated_at = now()
WHERE id = 'c556b341-be26-4ef7-9f54-d3fadb5a0de5';

INSERT INTO doctor_departments (doctor_id, department_id, is_primary, is_active, assignment_date)
VALUES
  ('c556b341-be26-4ef7-9f54-d3fadb5a0de5',
   (SELECT id FROM departments WHERE name = 'Pédiatrie'),
   true, true, now())
ON CONFLICT (doctor_id, department_id) DO UPDATE
SET is_primary = true, is_active = true;

-- Set availability: Lun-Sam 09:00-17:00
INSERT INTO doctor_schedule_templates (doctor_id, day_of_week, start_time, end_time, is_active, slot_duration)
VALUES
  ('c556b341-be26-4ef7-9f54-d3fadb5a0de5', 1, '09:00', '17:00', true, 30),
  ('c556b341-be26-4ef7-9f54-d3fadb5a0de5', 2, '09:00', '17:00', true, 30),
  ('c556b341-be26-4ef7-9f54-d3fadb5a0de5', 3, '09:00', '17:00', true, 30),
  ('c556b341-be26-4ef7-9f54-d3fadb5a0de5', 4, '09:00', '17:00', true, 30),
  ('c556b341-be26-4ef7-9f54-d3fadb5a0de5', 5, '09:00', '17:00', true, 30),
  ('c556b341-be26-4ef7-9f54-d3fadb5a0de5', 6, '09:00', '17:00', true, 30)
ON CONFLICT (doctor_id, day_of_week) DO UPDATE
SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_active = true;

-- ============================================================================
-- 3. Dr. Marie-Louise Nzuji - Gynécologie (Médecine Générale)
-- ============================================================================
UPDATE user_profiles
SET
  full_name = 'Dr. Marie-Louise Nzuji',
  phone = '+243 83 456 7890',
  email = 'ml.nzuji@okapiamedical.com',
  department_id = (SELECT id FROM departments WHERE name = 'Médecine Générale'),
  updated_at = now()
WHERE id = '5fe6a6c9-3306-484f-9525-c98793e5aff1';

UPDATE medical_staff
SET
  rpps_number = 'RDC-GYN-003',
  specialization = 'Gynécologie-Obstétrique',
  qualifications = ARRAY['Doctorat en Médecine', 'Spécialisation en Gynécologie', 'Obstétrique'],
  years_of_experience = 18,
  consultation_fee = 90.00,
  bio = 'Gynécologue-obstétricienne expérimentée, spécialisée en santé reproductive et suivi de grossesse. Approche bienveillante et écoute attentive.',
  is_accepting_patients = true,
  staff_type = 'medical',
  staff_category = 'doctor',
  telemedicine_enabled = true,
  can_prescribe_controlled_substances = true,
  current_status = 'available',
  average_rating = 4.9,
  total_consultations = 620,
  updated_at = now()
WHERE id = '5fe6a6c9-3306-484f-9525-c98793e5aff1';

INSERT INTO doctor_departments (doctor_id, department_id, is_primary, is_active, assignment_date)
VALUES
  ('5fe6a6c9-3306-484f-9525-c98793e5aff1',
   (SELECT id FROM departments WHERE name = 'Médecine Générale'),
   true, true, now())
ON CONFLICT (doctor_id, department_id) DO UPDATE
SET is_primary = true, is_active = true;

-- Set availability: Mar-Sam 10:00-18:00
INSERT INTO doctor_schedule_templates (doctor_id, day_of_week, start_time, end_time, is_active, slot_duration)
VALUES
  ('5fe6a6c9-3306-484f-9525-c98793e5aff1', 2, '10:00', '18:00', true, 30),
  ('5fe6a6c9-3306-484f-9525-c98793e5aff1', 3, '10:00', '18:00', true, 30),
  ('5fe6a6c9-3306-484f-9525-c98793e5aff1', 4, '10:00', '18:00', true, 30),
  ('5fe6a6c9-3306-484f-9525-c98793e5aff1', 5, '10:00', '18:00', true, 30),
  ('5fe6a6c9-3306-484f-9525-c98793e5aff1', 6, '10:00', '18:00', true, 30)
ON CONFLICT (doctor_id, day_of_week) DO UPDATE
SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_active = true;

-- ============================================================================
-- 4. Dr. Patrick Bolamba - Médecine Générale
-- ============================================================================
UPDATE user_profiles
SET
  full_name = 'Dr. Patrick Bolamba',
  phone = '+243 84 567 8901',
  email = 'p.bolamba@okapiamedical.com',
  department_id = (SELECT id FROM departments WHERE name = 'Médecine Générale'),
  updated_at = now()
WHERE id = '00967326-333a-4619-9142-ac3ba2a5bcb6';

UPDATE medical_staff
SET
  rpps_number = 'RDC-MED-004',
  specialization = 'Médecine Générale',
  qualifications = ARRAY['Doctorat en Médecine', 'Médecine Familiale', 'Médecine Préventive'],
  years_of_experience = 10,
  consultation_fee = 60.00,
  bio = 'Médecin généraliste avec approche holistique centrée sur le patient et la prévention. Consultation pour toute la famille.',
  is_accepting_patients = true,
  staff_type = 'medical',
  staff_category = 'doctor',
  telemedicine_enabled = true,
  can_prescribe_controlled_substances = true,
  current_status = 'available',
  average_rating = 4.7,
  total_consultations = 720,
  updated_at = now()
WHERE id = '00967326-333a-4619-9142-ac3ba2a5bcb6';

INSERT INTO doctor_departments (doctor_id, department_id, is_primary, is_active, assignment_date)
VALUES
  ('00967326-333a-4619-9142-ac3ba2a5bcb6',
   (SELECT id FROM departments WHERE name = 'Médecine Générale'),
   true, true, now())
ON CONFLICT (doctor_id, department_id) DO UPDATE
SET is_primary = true, is_active = true;

-- Set availability: Lun-Ven 07:00-15:00
INSERT INTO doctor_schedule_templates (doctor_id, day_of_week, start_time, end_time, is_active, slot_duration)
VALUES
  ('00967326-333a-4619-9142-ac3ba2a5bcb6', 1, '07:00', '15:00', true, 20),
  ('00967326-333a-4619-9142-ac3ba2a5bcb6', 2, '07:00', '15:00', true, 20),
  ('00967326-333a-4619-9142-ac3ba2a5bcb6', 3, '07:00', '15:00', true, 20),
  ('00967326-333a-4619-9142-ac3ba2a5bcb6', 4, '07:00', '15:00', true, 20),
  ('00967326-333a-4619-9142-ac3ba2a5bcb6', 5, '07:00', '15:00', true, 20)
ON CONFLICT (doctor_id, day_of_week) DO UPDATE
SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_active = true;

-- ============================================================================
-- 5. Dr. Alice Watuna - Médecine Générale (Horaires tardifs)
-- ============================================================================
UPDATE user_profiles
SET
  full_name = 'Dr. Alice Watuna',
  phone = '+243 85 678 9012',
  email = 'a.watuna@okapiamedical.com',
  department_id = (SELECT id FROM departments WHERE name = 'Médecine Générale'),
  updated_at = now()
WHERE id = '9a745185-9059-47ae-84ac-a88f9d34295b';

UPDATE medical_staff
SET
  rpps_number = 'RDC-MED-005',
  specialization = 'Médecine Générale',
  qualifications = ARRAY['Doctorat en Médecine', 'Médecine d''Urgence', 'Médecine du Travail'],
  years_of_experience = 8,
  consultation_fee = 60.00,
  bio = 'Médecin généraliste disponible en horaires tardifs pour les consultations en soirée. Expertise en médecine d''urgence.',
  is_accepting_patients = true,
  staff_type = 'medical',
  staff_category = 'doctor',
  telemedicine_enabled = true,
  can_prescribe_controlled_substances = true,
  current_status = 'available',
  average_rating = 4.6,
  total_consultations = 410,
  updated_at = now()
WHERE id = '9a745185-9059-47ae-84ac-a88f9d34295b';

INSERT INTO doctor_departments (doctor_id, department_id, is_primary, is_active, assignment_date)
VALUES
  ('9a745185-9059-47ae-84ac-a88f9d34295b',
   (SELECT id FROM departments WHERE name = 'Médecine Générale'),
   true, true, now())
ON CONFLICT (doctor_id, department_id) DO UPDATE
SET is_primary = true, is_active = true;

-- Set availability: Lun-Ven 14:00-22:00
INSERT INTO doctor_schedule_templates (doctor_id, day_of_week, start_time, end_time, is_active, slot_duration)
VALUES
  ('9a745185-9059-47ae-84ac-a88f9d34295b', 1, '14:00', '22:00', true, 20),
  ('9a745185-9059-47ae-84ac-a88f9d34295b', 2, '14:00', '22:00', true, 20),
  ('9a745185-9059-47ae-84ac-a88f9d34295b', 3, '14:00', '22:00', true, 20),
  ('9a745185-9059-47ae-84ac-a88f9d34295b', 4, '14:00', '22:00', true, 20),
  ('9a745185-9059-47ae-84ac-a88f9d34295b', 5, '14:00', '22:00', true, 20)
ON CONFLICT (doctor_id, day_of_week) DO UPDATE
SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_active = true;

-- ============================================================================
-- 6. Dr. Robert Kasongo - Chirurgie
-- ============================================================================
-- Create new user profile and medical staff entry
DO $$
DECLARE
  new_doctor_id uuid := gen_random_uuid();
BEGIN
  -- Insert into user_profiles
  INSERT INTO user_profiles (id, full_name, phone, email, department_id, role)
  VALUES (
    new_doctor_id,
    'Dr. Robert Kasongo',
    '+243 86 789 0123',
    'r.kasongo@okapiamedical.com',
    (SELECT id FROM departments WHERE name = 'Chirurgie'),
    'doctor'
  );

  -- Insert into medical_staff
  INSERT INTO medical_staff (
    id, rpps_number, specialization, qualifications, years_of_experience,
    consultation_fee, bio, is_accepting_patients, staff_type, staff_category,
    telemedicine_enabled, can_prescribe_controlled_substances, current_status,
    average_rating, total_consultations
  ) VALUES (
    new_doctor_id,
    'RDC-CHIR-006',
    'Chirurgie Générale',
    ARRAY['Doctorat en Médecine', 'Spécialisation en Chirurgie', 'Chirurgie viscérale'],
    16,
    120.00,
    'Chirurgien spécialisé en chirurgie viscérale et digestive. Expert en laparoscopie et chirurgie mini-invasive.',
    true,
    'medical',
    'doctor',
    true,
    true,
    'available',
    4.8,
    350
  );

  -- Assign to department
  INSERT INTO doctor_departments (doctor_id, department_id, is_primary, is_active, assignment_date)
  VALUES (new_doctor_id, (SELECT id FROM departments WHERE name = 'Chirurgie'), true, true, now());

  -- Set availability: Lun-Jeu 08:00-16:00
  INSERT INTO doctor_schedule_templates (doctor_id, day_of_week, start_time, end_time, is_active, slot_duration)
  VALUES
    (new_doctor_id, 1, '08:00', '16:00', true, 45),
    (new_doctor_id, 2, '08:00', '16:00', true, 45),
    (new_doctor_id, 3, '08:00', '16:00', true, 45),
    (new_doctor_id, 4, '08:00', '16:00', true, 45);
END $$;

-- ============================================================================
-- 7. Dr. Hélène Yowa - Neurologie
-- ============================================================================
DO $$
DECLARE
  new_doctor_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO user_profiles (id, full_name, phone, email, department_id, role)
  VALUES (
    new_doctor_id,
    'Dr. Hélène Yowa',
    '+243 87 890 1234',
    'h.yowa@okapiamedical.com',
    (SELECT id FROM departments WHERE name = 'Médecine Générale'),
    'doctor'
  );

  INSERT INTO medical_staff (
    id, rpps_number, specialization, qualifications, years_of_experience,
    consultation_fee, bio, is_accepting_patients, staff_type, staff_category,
    telemedicine_enabled, can_prescribe_controlled_substances, current_status,
    average_rating, total_consultations
  ) VALUES (
    new_doctor_id,
    'RDC-NEU-007',
    'Neurologie',
    ARRAY['Doctorat en Médecine', 'Spécialisation en Neurologie', 'Épileptologie'],
    14,
    110.00,
    'Neurologue spécialisée dans les troubles neurologiques, migraines, épilepsie et maladies neurodégénératives.',
    true,
    'medical',
    'doctor',
    true,
    true,
    'available',
    4.8,
    380
  );

  INSERT INTO doctor_departments (doctor_id, department_id, is_primary, is_active, assignment_date)
  VALUES (new_doctor_id, (SELECT id FROM departments WHERE name = 'Médecine Générale'), true, true, now());

  -- Set availability: Mar-Ven 09:00-17:00
  INSERT INTO doctor_schedule_templates (doctor_id, day_of_week, start_time, end_time, is_active, slot_duration)
  VALUES
    (new_doctor_id, 2, '09:00', '17:00', true, 40),
    (new_doctor_id, 3, '09:00', '17:00', true, 40),
    (new_doctor_id, 4, '09:00', '17:00', true, 40),
    (new_doctor_id, 5, '09:00', '17:00', true, 40);
END $$;

-- ============================================================================
-- 8. Dr. David Mutombo - Ophtalmologie
-- ============================================================================
DO $$
DECLARE
  new_doctor_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO user_profiles (id, full_name, phone, email, department_id, role)
  VALUES (
    new_doctor_id,
    'Dr. David Mutombo',
    '+243 88 901 2345',
    'd.mutombo@okapiamedical.com',
    (SELECT id FROM departments WHERE name = 'Médecine Générale'),
    'doctor'
  );

  INSERT INTO medical_staff (
    id, rpps_number, specialization, qualifications, years_of_experience,
    consultation_fee, bio, is_accepting_patients, staff_type, staff_category,
    telemedicine_enabled, can_prescribe_controlled_substances, current_status,
    average_rating, total_consultations
  ) VALUES (
    new_doctor_id,
    'RDC-OPH-008',
    'Ophtalmologie',
    ARRAY['Doctorat en Médecine', 'Spécialisation en Ophtalmologie', 'Chirurgie réfractive'],
    13,
    95.00,
    'Ophtalmologue expert en santé oculaire, dépistage de la vue, et chirurgie de la cataracte. Équipement moderne disponible.',
    true,
    'medical',
    'doctor',
    true,
    true,
    'available',
    4.7,
    460
  );

  INSERT INTO doctor_departments (doctor_id, department_id, is_primary, is_active, assignment_date)
  VALUES (new_doctor_id, (SELECT id FROM departments WHERE name = 'Médecine Générale'), true, true, now());

  -- Set availability: Lun-Mer-Ven 08:00-14:00
  INSERT INTO doctor_schedule_templates (doctor_id, day_of_week, start_time, end_time, is_active, slot_duration)
  VALUES
    (new_doctor_id, 1, '08:00', '14:00', true, 30),
    (new_doctor_id, 3, '08:00', '14:00', true, 30),
    (new_doctor_id, 5, '08:00', '14:00', true, 30);
END $$;

-- ============================================================================
-- 9. Dr. Sophie Kalala - Radiologie
-- ============================================================================
DO $$
DECLARE
  new_doctor_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO user_profiles (id, full_name, phone, email, department_id, role)
  VALUES (
    new_doctor_id,
    'Dr. Sophie Kalala',
    '+243 89 012 3456',
    's.kalala@okapiamedical.com',
    (SELECT id FROM departments WHERE name = 'Médecine Générale'),
    'doctor'
  );

  INSERT INTO medical_staff (
    id, rpps_number, specialization, qualifications, years_of_experience,
    consultation_fee, bio, is_accepting_patients, staff_type, staff_category,
    telemedicine_enabled, can_prescribe_controlled_substances, current_status,
    average_rating, total_consultations
  ) VALUES (
    new_doctor_id,
    'RDC-RAD-009',
    'Radiologie',
    ARRAY['Doctorat en Médecine', 'Spécialisation en Radiologie', 'Imagerie médicale'],
    11,
    85.00,
    'Radiologue spécialisée en imagerie médicale : radiographie, échographie, scanner et IRM. Interprétation rapide et précise.',
    true,
    'medical',
    'doctor',
    true,
    false,
    'available',
    4.9,
    890
  );

  INSERT INTO doctor_departments (doctor_id, department_id, is_primary, is_active, assignment_date)
  VALUES (new_doctor_id, (SELECT id FROM departments WHERE name = 'Médecine Générale'), true, true, now());

  -- Set availability: Lun-Ven 07:00-19:00
  INSERT INTO doctor_schedule_templates (doctor_id, day_of_week, start_time, end_time, is_active, slot_duration)
  VALUES
    (new_doctor_id, 1, '07:00', '19:00', true, 25),
    (new_doctor_id, 2, '07:00', '19:00', true, 25),
    (new_doctor_id, 3, '07:00', '19:00', true, 25),
    (new_doctor_id, 4, '07:00', '19:00', true, 25),
    (new_doctor_id, 5, '07:00', '19:00', true, 25);
END $$;

-- ============================================================================
-- 10. Dr. Marc Zola - Urgences (Disponible 24/7)
-- ============================================================================
DO $$
DECLARE
  new_doctor_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO user_profiles (id, full_name, phone, email, department_id, role)
  VALUES (
    new_doctor_id,
    'Dr. Marc Zola',
    '+243 90 123 4567',
    'm.zola@okapiamedical.com',
    (SELECT id FROM departments WHERE name = 'Médecine Générale'),
    'doctor'
  );

  INSERT INTO medical_staff (
    id, rpps_number, specialization, qualifications, years_of_experience,
    consultation_fee, bio, is_accepting_patients, staff_type, staff_category,
    telemedicine_enabled, can_prescribe_controlled_substances, current_status,
    average_rating, total_consultations
  ) VALUES (
    new_doctor_id,
    'RDC-URG-010',
    'Médecine d''Urgence',
    ARRAY['Doctorat en Médecine', 'Spécialisation Médecine d''Urgence', 'Réanimation', 'ATLS'],
    9,
    150.00,
    'Urgentiste disponible 24h/24 et 7j/7. Expertise en prise en charge des urgences vitales, traumatologie et réanimation.',
    true,
    'medical',
    'doctor',
    true,
    true,
    'available',
    4.8,
    1200
  );

  INSERT INTO doctor_departments (doctor_id, department_id, is_primary, is_active, assignment_date)
  VALUES (new_doctor_id, (SELECT id FROM departments WHERE name = 'Médecine Générale'), true, true, now());

  -- Set availability: Tous les jours 24h/24
  INSERT INTO doctor_schedule_templates (doctor_id, day_of_week, start_time, end_time, is_active, slot_duration)
  VALUES
    (new_doctor_id, 1, '00:00', '23:59', true, 15),
    (new_doctor_id, 2, '00:00', '23:59', true, 15),
    (new_doctor_id, 3, '00:00', '23:59', true, 15),
    (new_doctor_id, 4, '00:00', '23:59', true, 15),
    (new_doctor_id, 5, '00:00', '23:59', true, 15),
    (new_doctor_id, 6, '00:00', '23:59', true, 15),
    (new_doctor_id, 0, '00:00', '23:59', true, 15);
END $$;
