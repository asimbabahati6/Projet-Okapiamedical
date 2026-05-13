/*
  # Seed Demo Lab Orders

  1. Purpose
    - Populate the lab_orders table with realistic demo data for dashboard display
    - Links existing patients to existing lab_tests entries
    - Various statuses and priorities for a realistic dashboard view

  2. Data Inserted
    - 15 lab orders across different patients, tests, statuses, and priorities
    - Dates spread over the past 2 weeks
    - Some with results already entered
    - doctor_id left NULL (medical_staff_extension table is empty)

  3. Notes
    - Uses existing patient IDs and lab_test IDs from the database
*/

DO $$
DECLARE
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid; p7 uuid;
  t_hem1 uuid; t_hem2 uuid; t_hem4 uuid;
  t_bio1 uuid; t_bio3 uuid; t_bio4 uuid; t_bio6 uuid;
  t_bac1 uuid; t_par1 uuid; t_ser1 uuid; t_ser2 uuid; t_imm1 uuid;
BEGIN
  -- Get patient IDs
  SELECT id INTO p1 FROM patients WHERE last_name = 'MAKESA' LIMIT 1;
  SELECT id INTO p2 FROM patients WHERE last_name = 'KIMBOLO' LIMIT 1;
  SELECT id INTO p3 FROM patients WHERE last_name = 'MANKONDJO' LIMIT 1;
  SELECT id INTO p4 FROM patients WHERE last_name = 'LESA' LIMIT 1;
  SELECT id INTO p5 FROM patients WHERE last_name = 'VANGU' LIMIT 1;
  SELECT id INTO p6 FROM patients WHERE last_name = 'KALUMBA' LIMIT 1;
  SELECT id INTO p7 FROM patients WHERE last_name = 'Makiso' LIMIT 1;

  -- Get test IDs
  SELECT id INTO t_hem1 FROM lab_tests WHERE test_code = 'HEM-001' LIMIT 1;
  SELECT id INTO t_hem2 FROM lab_tests WHERE test_code = 'HEM-002' LIMIT 1;
  SELECT id INTO t_hem4 FROM lab_tests WHERE test_code = 'HEM-004' LIMIT 1;
  SELECT id INTO t_bio1 FROM lab_tests WHERE test_code = 'BIO-001' LIMIT 1;
  SELECT id INTO t_bio3 FROM lab_tests WHERE test_code = 'BIO-003' LIMIT 1;
  SELECT id INTO t_bio4 FROM lab_tests WHERE test_code = 'BIO-004' LIMIT 1;
  SELECT id INTO t_bio6 FROM lab_tests WHERE test_code = 'BIO-006' LIMIT 1;
  SELECT id INTO t_bac1 FROM lab_tests WHERE test_code = 'BAC-001' LIMIT 1;
  SELECT id INTO t_par1 FROM lab_tests WHERE test_code = 'PAR-001' LIMIT 1;
  SELECT id INTO t_ser1 FROM lab_tests WHERE test_code = 'SER-001' LIMIT 1;
  SELECT id INTO t_ser2 FROM lab_tests WHERE test_code = 'SER-002' LIMIT 1;
  SELECT id INTO t_imm1 FROM lab_tests WHERE test_code = 'IMM-001' LIMIT 1;

  -- Insert pending orders
  INSERT INTO lab_orders (order_number, patient_id, test_id, priority, status, notes, created_at)
  VALUES
    ('LAB-20260513-4RAN', p1, t_hem1, 'routine', 'pending', 'Bilan de routine', now() - interval '1 hour'),
    ('LAB-20260513-5BXQ', p2, t_bio1, 'urgent', 'pending', 'Suspicion diabete', now() - interval '3 hours'),
    ('LAB-20260512-6CYR', p3, t_bac1, 'routine', 'pending', 'Infection urinaire suspectee', now() - interval '5 hours'),
    ('LAB-20260513-7DZS', p4, t_ser1, 'stat', 'pending', 'Depistage urgent VIH', now() - interval '30 minutes');

  -- Insert in-progress orders
  INSERT INTO lab_orders (order_number, patient_id, test_id, priority, status, specimen_collected_at, notes, created_at)
  VALUES
    ('LAB-20260512-8EAT', p5, t_hem2, 'routine', 'in_progress', now() - interval '22 hours', 'Controle hemoglobine', now() - interval '1 day'),
    ('LAB-20260513-9FBU', p6, t_bio3, 'urgent', 'in_progress', now() - interval '6 hours', 'Controle fonction renale', now() - interval '8 hours'),
    ('LAB-20260513-AGCV', p7, t_par1, 'urgent', 'in_progress', now() - interval '4 hours', 'Fievre persistante - paludisme suspecte', now() - interval '6 hours');

  -- Insert completed orders (with results)
  INSERT INTO lab_orders (order_number, patient_id, test_id, priority, status, specimen_collected_at, result_value, result_unit, is_abnormal, notes, created_at)
  VALUES
    ('LAB-20260510-BHDW', p1, t_hem1, 'routine', 'completed', now() - interval '3 days' + interval '2 hours', '4.5', 'x10^6/uL', false, 'Resultats normaux', now() - interval '3 days'),
    ('LAB-20260508-CIEX', p2, t_bio1, 'routine', 'completed', now() - interval '5 days' + interval '1 hour', '1.85', 'g/L', true, 'Glycemie elevee - suivi recommande', now() - interval '5 days'),
    ('LAB-20260509-DJFY', p3, t_par1, 'urgent', 'completed', now() - interval '4 days' + interval '3 hours', 'Positif - P. falciparum', NULL, true, 'Goutte epaisse positive', now() - interval '4 days'),
    ('LAB-20260507-EKGZ', p4, t_bio4, 'routine', 'validated', now() - interval '7 days' + interval '2 hours', '35', 'U/L', false, 'Bilan hepatique normal', now() - interval '7 days'),
    ('LAB-20260503-FLHA', p5, t_ser2, 'routine', 'validated', now() - interval '10 days' + interval '4 hours', 'Negatif', NULL, false, 'Serologie hepatite B negative', now() - interval '10 days'),
    ('LAB-20260507-GMIB', p6, t_hem4, 'routine', 'completed', now() - interval '6 days' + interval '2 hours', '250', 'x10^3/uL', false, 'Numeration plaquettaire normale', now() - interval '6 days'),
    ('LAB-20260501-HNJC', p7, t_imm1, 'urgent', 'validated', now() - interval '12 days' + interval '5 hours', '650', 'cells/uL', true, 'CD4 bas - orientation ARV', now() - interval '12 days'),
    ('LAB-20260504-IOKD', p1, t_bio6, 'routine', 'completed', now() - interval '9 days' + interval '3 hours', '2.45', 'g/L', true, 'Cholesterol eleve', now() - interval '9 days');

END $$;