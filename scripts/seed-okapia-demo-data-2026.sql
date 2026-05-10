/*
  # Seeding de Données de Démonstration - Okapia Medical
  # Date de Référence: 27 février 2026

  Ce script génère des données fictives réalistes pour tous les modules du système:
  1. Personnel et Employés (10 employés)
  2. Contrats Personnel (5 contrats actifs)
  3. Dépenses (15 dépenses récentes)
  4. Factures (10 factures avec statuts variés)
  5. Demandes d'Analyses Laboratoire (20 demandes)
  6. Résultats d'Analyses (5 résultats récents)
  7. File d'Attente (5 patients)
  8. Inventaire Logistique (20 articles)

  IMPORTANT: Ce script est conçu pour une base de données vide ou de test.
*/

-- ============================================================================
-- 1. PÔLE ADMINISTRATIF - PERSONNEL ET EMPLOYÉS
-- ============================================================================

-- Insertion des profils utilisateurs pour les employés
INSERT INTO user_profiles (id, full_name, phone, employee_category, is_medical_staff, is_hr_employee, is_active, role, department_id)
SELECT
  gen_random_uuid(),
  employee_data.name,
  employee_data.phone,
  employee_data.category,
  employee_data.is_medical,
  employee_data.is_hr,
  true,
  employee_data.role_name,
  (SELECT id FROM departments WHERE name = employee_data.dept_name LIMIT 1)
FROM (VALUES
  -- Médecins
  ('Dr. Jean-Baptiste Kabongo', '+243 85 123 4567', 'medical', true, false, 'doctor', 'Médecine Générale'),
  ('Dr. Marie-Claire Tshimanga', '+243 85 234 5678', 'medical', true, false, 'doctor', 'Pédiatrie'),
  ('Dr. Emmanuel Nkulu', '+243 85 345 6789', 'medical', true, false, 'doctor', 'Cardiologie'),

  -- Personnel Infirmier
  ('Infirmière Grace Mbuyi', '+243 85 456 7890', 'medical', true, false, 'nurse', 'Urgences'),
  ('Infirmier Joseph Kasongo', '+243 85 567 8901', 'medical', true, false, 'nurse', 'Médecine Générale'),

  -- Laboratoire
  ('Technicien Lab Pierre Mulamba', '+243 85 678 9012', 'medical', true, false, 'lab_technician', 'Laboratoire'),

  -- Administration
  ('Admin Sophie Kalala', '+243 85 789 0123', 'administrative', false, true, 'administrative_staff', 'Administration'),
  ('Réceptionniste Alice Mukendi', '+243 85 890 1234', 'support', false, true, 'receptionist', 'Réception'),

  -- Logistique
  ('Logisticien David Mwamba', '+243 85 901 2345', 'support', false, true, 'logistician', 'Logistique'),

  -- Pharmacie
  ('Pharmacien Sarah Luboya', '+243 85 012 3456', 'medical', true, false, 'pharmacist', 'Pharmacie')
) AS employee_data(name, phone, category, is_medical, is_hr, role_name, dept_name)
ON CONFLICT (id) DO NOTHING;

-- Insertion des données HR pour les employés
INSERT INTO hr_employees (user_id, employee_number, hire_date, employment_status, contract_type, salary_amount, salary_currency, bank_name, bank_account, emergency_contact_name, emergency_contact_phone)
SELECT
  up.id,
  'EMP' || LPAD((ROW_NUMBER() OVER ())::text, 4, '0'),
  DATE '2026-02-27' - (RANDOM() * 365 * 3)::int,
  'active',
  CASE WHEN RANDOM() > 0.3 THEN 'CDI' ELSE 'CDD' END,
  (500 + RANDOM() * 1500)::decimal(10,2),
  'USD',
  CASE (RANDOM() * 3)::int
    WHEN 0 THEN 'Banque Centrale du Congo'
    WHEN 1 THEN 'Equity Bank'
    ELSE 'Rawbank'
  END,
  'ACC' || LPAD((RANDOM() * 999999)::int::text, 10, '0'),
  'Contact Urgence ' || up.full_name,
  '+243 81 ' || LPAD((RANDOM() * 9999999)::int::text, 7, '0')
FROM user_profiles up
WHERE up.is_hr_employee = true OR up.is_medical_staff = true
ON CONFLICT (user_id) DO NOTHING;

-- Insertion des données médicales pour le personnel soignant
INSERT INTO medical_staff (user_id, license_number, specialization, staff_type, staff_category, years_of_experience, consultation_fee, is_accepting_patients, telemedicine_enabled, current_status)
SELECT
  up.id,
  'MED' || LPAD((ROW_NUMBER() OVER ())::text, 6, '0'),
  CASE up.role
    WHEN 'doctor' THEN (SELECT name FROM departments WHERE id = up.department_id LIMIT 1)
    WHEN 'nurse' THEN 'Soins Infirmiers'
    WHEN 'lab_technician' THEN 'Analyses Médicales'
    WHEN 'pharmacist' THEN 'Pharmacie Clinique'
    ELSE 'Général'
  END,
  up.role,
  CASE up.role
    WHEN 'doctor' THEN 'physician'
    WHEN 'nurse' THEN 'nursing'
    WHEN 'lab_technician' THEN 'technician'
    WHEN 'pharmacist' THEN 'pharmacy'
    ELSE 'other'
  END,
  (2 + RANDOM() * 15)::int,
  CASE up.role
    WHEN 'doctor' THEN (30 + RANDOM() * 70)::decimal(10,2)
    ELSE 0
  END,
  up.role = 'doctor',
  up.role = 'doctor',
  'available'
FROM user_profiles up
WHERE up.is_medical_staff = true
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 2. PÔLE ADMINISTRATIF - CONTRATS PERSONNEL
-- ============================================================================

INSERT INTO employee_contracts (employee_id, contract_type, start_date, end_date, position, salary_amount, salary_currency, status, terms)
SELECT
  hre.id,
  hre.contract_type,
  hre.hire_date,
  CASE
    WHEN hre.contract_type = 'CDD' THEN hre.hire_date + INTERVAL '1 year'
    ELSE NULL
  END,
  up.role,
  hre.salary_amount,
  hre.salary_currency,
  'active',
  'Contrat standard avec période d''essai de 3 mois. Avantages: Assurance santé, congés payés (30 jours/an).'
FROM hr_employees hre
JOIN user_profiles up ON up.id = hre.user_id
WHERE hre.employment_status = 'active'
LIMIT 5
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. PÔLE COMMERCIAL & FINANCE - DÉPENSES
-- ============================================================================

INSERT INTO expenses (category, amount, currency, description, expense_date, paid_by, payment_method, status, receipt_url)
SELECT
  expense_data.category,
  expense_data.amount,
  'USD',
  expense_data.description,
  DATE '2026-02-27' - expense_data.days_ago,
  (SELECT id FROM user_profiles WHERE employee_category = 'administrative' LIMIT 1),
  expense_data.payment_method,
  expense_data.status,
  NULL
FROM (VALUES
  -- Février 2026
  ('rent', 2500.00, 'Loyer mensuel - Février 2026', 0, 'bank_transfer', 'paid'),
  ('utilities', 850.00, 'Électricité - Février 2026', 2, 'bank_transfer', 'paid'),
  ('supplies', 450.50, 'Fournitures médicales - Gants et masques', 3, 'credit_card', 'paid'),
  ('maintenance', 1200.00, 'Maintenance équipement laboratoire', 5, 'check', 'paid'),
  ('supplies', 320.00, 'Médicaments urgence - Stock pharmacie', 7, 'cash', 'paid'),

  -- Janvier 2026
  ('rent', 2500.00, 'Loyer mensuel - Janvier 2026', 31, 'bank_transfer', 'paid'),
  ('utilities', 780.00, 'Eau et assainissement - Janvier 2026', 28, 'bank_transfer', 'paid'),
  ('equipment', 3500.00, 'Nouveau microscope laboratoire', 25, 'bank_transfer', 'paid'),
  ('supplies', 650.00, 'Seringues et consommables', 22, 'credit_card', 'paid'),
  ('salaries', 8500.00, 'Salaires personnel - Janvier 2026', 20, 'bank_transfer', 'paid'),

  -- Décembre 2025
  ('utilities', 920.00, 'Électricité - Décembre 2025', 60, 'bank_transfer', 'paid'),
  ('maintenance', 450.00, 'Réparation climatisation', 55, 'cash', 'paid'),
  ('supplies', 380.00, 'Désinfectants et produits nettoyage', 50, 'credit_card', 'paid'),
  ('equipment', 1800.00, 'Tensiomètres automatiques (x3)', 48, 'bank_transfer', 'paid'),
  ('other', 250.00, 'Formation continue personnel', 45, 'check', 'paid')
) AS expense_data(category, amount, description, days_ago, payment_method, status)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. PÔLE COMMERCIAL & FINANCE - FACTURATION
-- ============================================================================

INSERT INTO billing (patient_id, amount, currency, status, payment_method, due_date, paid_date, description, invoice_number)
SELECT
  (SELECT id FROM patients ORDER BY RANDOM() LIMIT 1),
  bill_data.amount,
  'USD',
  bill_data.status,
  bill_data.payment_method,
  DATE '2026-02-27' - bill_data.days_ago + INTERVAL '15 days',
  CASE
    WHEN bill_data.status = 'paid' THEN DATE '2026-02-27' - bill_data.days_ago + (RANDOM() * 10)::int
    ELSE NULL
  END,
  bill_data.description,
  'INV-2026-' || LPAD((1000 + ROW_NUMBER() OVER ())::text, 4, '0')
FROM (VALUES
  -- Factures payées
  (120.00, 'paid', 'cash', 'Consultation générale + analyses', 1),
  (85.00, 'paid', 'insurance', 'Consultation pédiatrique', 3),
  (200.00, 'paid', 'credit_card', 'Échographie cardiaque', 5),
  (95.50, 'paid', 'mobile_money', 'Analyses sanguines complètes', 7),
  (150.00, 'paid', 'insurance', 'Consultation + radiographie', 10),

  -- Factures en attente
  (110.00, 'pending', 'insurance', 'Consultation de suivi', 2),
  (175.00, 'pending', NULL, 'Électrocardiogramme + consultation', 4),
  (90.00, 'pending', NULL, 'Test glycémie + consultation', 6),

  -- Factures en retard
  (250.00, 'overdue', NULL, 'Consultation spécialisée + examens', 20),
  (180.00, 'overdue', NULL, 'Analyses multiples non payées', 25)
) AS bill_data(amount, status, payment_method, description, days_ago)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. PÔLE MÉDICAL - DEMANDES D'ANALYSES LABORATOIRE
-- ============================================================================

INSERT INTO lab_orders (patient_id, doctor_id, order_number, test_type, priority, status, sample_type, notes, ordered_at)
SELECT
  (SELECT id FROM patients ORDER BY RANDOM() LIMIT 1),
  (SELECT user_id FROM medical_staff WHERE staff_type = 'doctor' ORDER BY RANDOM() LIMIT 1),
  'LAB-2026-' || LPAD((ROW_NUMBER() OVER ())::text, 5, '0'),
  lab_data.test_type,
  lab_data.priority,
  lab_data.status,
  lab_data.sample_type,
  lab_data.notes,
  TIMESTAMP '2026-02-27 08:00:00' - (lab_data.hours_ago || ' hours')::interval
FROM (VALUES
  -- Analyses urgentes en cours
  ('NFS', 'urgent', 'in_progress', 'blood', 'Patient avec anémie sévère', 2),
  ('Glycémie', 'urgent', 'pending', 'blood', 'Suspicion diabète aigu', 1),

  -- Analyses normales en attente
  ('Cholestérol Total', 'normal', 'pending', 'blood', 'Bilan de routine', 4),
  ('Créatinine', 'normal', 'pending', 'blood', 'Fonction rénale', 6),
  ('Transaminases', 'normal', 'pending', 'blood', 'Bilan hépatique', 8),
  ('TSH', 'normal', 'pending', 'blood', 'Thyroïde', 10),

  -- Analyses en cours de traitement
  ('Ionogramme', 'normal', 'in_progress', 'blood', 'Bilan électrolytique', 12),
  ('CRP', 'normal', 'in_progress', 'blood', 'Inflammation', 14),

  -- Analyses complétées aujourd''hui
  ('NFS', 'normal', 'completed', 'blood', 'Contrôle post-traitement', 20),
  ('Glycémie à jeun', 'normal', 'completed', 'blood', 'Suivi diabète', 22),
  ('ECBU', 'normal', 'completed', 'urine', 'Infection urinaire suspectée', 24),
  ('Hémoglobine', 'normal', 'completed', 'blood', 'Anémie', 26),
  ('Plaquettes', 'normal', 'completed', 'blood', 'Thrombopénie', 28),

  -- Analyses d''hier
  ('Sérologie VIH', 'normal', 'completed', 'blood', 'Dépistage', 36),
  ('Groupage sanguin', 'normal', 'completed', 'blood', 'Pré-opératoire', 38),
  ('Calcémie', 'normal', 'completed', 'blood', 'Bilan phospho-calcique', 40),

  -- Analyses de la semaine
  ('Magnésium', 'normal', 'completed', 'blood', 'Crampes musculaires', 72),
  ('Ferritine', 'normal', 'completed', 'blood', 'Bilan martial', 96),
  ('Vitamine D', 'normal', 'completed', 'blood', 'Carence suspectée', 120),
  ('Acide urique', 'normal', 'completed', 'blood', 'Goutte', 144)
) AS lab_data(test_type, priority, status, sample_type, notes, hours_ago)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. PÔLE MÉDICAL - RÉSULTATS D'ANALYSES (5 récents prêts à valider)
-- ============================================================================

UPDATE lab_orders
SET
  status = 'completed',
  results = CASE test_type
    WHEN 'NFS' THEN jsonb_build_object(
      'Hémoglobine', '13.5 g/dL',
      'Leucocytes', '7200/mm³',
      'Plaquettes', '245000/mm³',
      'Interprétation', 'Valeurs normales'
    )
    WHEN 'Glycémie à jeun' THEN jsonb_build_object(
      'Glucose', '5.2 mmol/L',
      'Interprétation', 'Normal (< 6.1 mmol/L)'
    )
    WHEN 'ECBU' THEN jsonb_build_object(
      'Leucocytes', 'Présents',
      'Bactéries', 'E. coli > 100000 UFC/mL',
      'Interprétation', 'Infection urinaire confirmée'
    )
    WHEN 'Hémoglobine' THEN jsonb_build_object(
      'Hb', '14.2 g/dL',
      'Interprétation', 'Normal (Homme: 13-17 g/dL)'
    )
    WHEN 'Plaquettes' THEN jsonb_build_object(
      'Plaquettes', '180000/mm³',
      'Interprétation', 'Légèrement bas (Normal: 150-400k/mm³)'
    )
  END,
  completed_at = TIMESTAMP '2026-02-27 08:00:00' - (RANDOM() * 24)::int * INTERVAL '1 hour',
  validated_at = NULL,
  validated_by = NULL
WHERE test_type IN ('NFS', 'Glycémie à jeun', 'ECBU', 'Hémoglobine', 'Plaquettes')
  AND status = 'completed'
  AND ordered_at >= DATE '2026-02-26';

-- ============================================================================
-- 7. PÔLE MÉDICAL - FILE D'ATTENTE
-- ============================================================================

INSERT INTO waiting_list (patient_id, department_id, priority, reason, check_in_time, patient_type)
SELECT
  (SELECT id FROM patients ORDER BY RANDOM() LIMIT 1),
  (SELECT id FROM departments WHERE name = queue_data.dept_name LIMIT 1),
  queue_data.priority,
  queue_data.reason,
  TIMESTAMP '2026-02-27 08:00:00' + (queue_data.minutes_ago || ' minutes')::interval,
  queue_data.patient_type
FROM (VALUES
  ('Urgences', 'urgent', 'Douleur thoracique', 15, 'walk_in'),
  ('Médecine Générale', 'normal', 'Consultation de suivi', 45, 'appointment'),
  ('Pédiatrie', 'normal', 'Vaccination enfant', 60, 'appointment'),
  ('Laboratoire', 'normal', 'Prélèvement sanguin', 30, 'walk_in'),
  ('Cardiologie', 'urgent', 'Palpitations cardiaques', 20, 'walk_in')
) AS queue_data(dept_name, priority, reason, minutes_ago, patient_type)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. LOGISTIQUE - INVENTAIRE ET STOCKS
-- ============================================================================

INSERT INTO inventory (item_name, category, quantity, unit, reorder_level, unit_price, currency, supplier_id, expiry_date, location, status)
SELECT
  inv_data.item_name,
  inv_data.category,
  inv_data.quantity,
  inv_data.unit,
  inv_data.reorder_level,
  inv_data.unit_price,
  'USD',
  (SELECT id FROM suppliers ORDER BY RANDOM() LIMIT 1),
  DATE '2026-02-27' + (inv_data.expiry_months || ' months')::interval,
  inv_data.location,
  CASE
    WHEN inv_data.quantity <= inv_data.reorder_level THEN 'low_stock'
    WHEN inv_data.quantity > inv_data.reorder_level * 3 THEN 'overstocked'
    ELSE 'in_stock'
  END
FROM (VALUES
  -- Consommables médicaux - STOCK BAS (ALERTES)
  ('Gants latex taille M', 'supplies', 50, 'boîte', 200, 8.50, 'Pharmacie', 3),
  ('Seringues 5ml', 'supplies', 80, 'unité', 300, 0.25, 'Salle de soins', 6),
  ('Masques chirurgicaux', 'supplies', 150, 'boîte', 500, 12.00, 'Stock central', 2),

  -- Consommables médicaux - STOCK NORMAL
  ('Gants nitrile taille L', 'supplies', 800, 'boîte', 200, 9.00, 'Pharmacie', 4),
  ('Compresses stériles', 'supplies', 450, 'paquet', 150, 3.50, 'Salle de soins', 12),
  ('Cathéters IV 18G', 'supplies', 320, 'unité', 100, 1.80, 'Urgences', 8),
  ('Pansements adhésifs', 'supplies', 600, 'boîte', 200, 5.50, 'Pharmacie', 10),

  -- Médicaments essentiels
  ('Paracétamol 500mg', 'medication', 2500, 'comprimé', 1000, 0.05, 'Pharmacie', 18),
  ('Amoxicilline 500mg', 'medication', 1800, 'gélule', 500, 0.15, 'Pharmacie', 24),
  ('Ibuprofène 400mg', 'medication', 1200, 'comprimé', 500, 0.08, 'Pharmacie', 18),
  ('Métronidazole 250mg', 'medication', 900, 'comprimé', 400, 0.12, 'Pharmacie', 24),

  -- Produits de désinfection
  ('Alcool éthylique 70%', 'cleaning', 25, 'litre', 10, 4.50, 'Stock central', 36),
  ('Solution de Dakin', 'cleaning', 18, 'litre', 8, 6.00, 'Salle de soins', 12),
  ('Gel hydroalcoolique', 'cleaning', 40, 'litre', 15, 8.50, 'Stock central', 24),

  -- Équipements
  ('Thermomètres digitaux', 'equipment', 12, 'unité', 5, 15.00, 'Stock équipement', 60),
  ('Tensiomètres automatiques', 'equipment', 6, 'unité', 3, 85.00, 'Consultations', 60),

  -- Réactifs laboratoire
  ('Tubes EDTA', 'lab_supplies', 850, 'unité', 300, 0.35, 'Laboratoire', 18),
  ('Réactif glycémie', 'lab_supplies', 450, 'test', 200, 0.80, 'Laboratoire', 12),
  ('Bandelettes urinaires', 'lab_supplies', 380, 'boîte', 150, 12.00, 'Laboratoire', 24),
  ('Lames microscope', 'lab_supplies', 600, 'unité', 200, 0.15, 'Laboratoire', 36)
) AS inv_data(item_name, category, quantity, unit, reorder_level, unit_price, location, expiry_months)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DONNÉES COMPLÉMENTAIRES POUR LES GRAPHIQUES
-- ============================================================================

-- Générer des données historiques de revenus pour les 6 derniers mois
INSERT INTO financial_reports (report_type, period_start, period_end, total_revenue, total_expenses, net_profit, currency, generated_by)
SELECT
  'monthly',
  DATE_TRUNC('month', DATE '2026-02-27' - (month_offset || ' months')::interval),
  DATE_TRUNC('month', DATE '2026-02-27' - (month_offset || ' months')::interval) + INTERVAL '1 month' - INTERVAL '1 day',
  (15000 + RANDOM() * 10000)::decimal(10,2),
  (8000 + RANDOM() * 5000)::decimal(10,2),
  0, -- Sera calculé par trigger
  'USD',
  (SELECT id FROM user_profiles WHERE employee_category = 'administrative' LIMIT 1)
FROM generate_series(0, 5) AS month_offset
ON CONFLICT DO NOTHING;

-- Mettre à jour le net_profit
UPDATE financial_reports
SET net_profit = total_revenue - total_expenses
WHERE net_profit = 0;

-- ============================================================================
-- COMMIT ET CONFIRMATION
-- ============================================================================

-- Afficher un résumé des données insérées
DO $$
DECLARE
  employee_count int;
  contract_count int;
  expense_count int;
  billing_count int;
  lab_order_count int;
  waiting_count int;
  inventory_count int;
BEGIN
  SELECT COUNT(*) INTO employee_count FROM user_profiles WHERE employee_category IS NOT NULL;
  SELECT COUNT(*) INTO contract_count FROM employee_contracts WHERE status = 'active';
  SELECT COUNT(*) INTO expense_count FROM expenses WHERE expense_date >= DATE '2025-12-01';
  SELECT COUNT(*) INTO billing_count FROM billing WHERE due_date >= DATE '2026-01-01';
  SELECT COUNT(*) INTO lab_order_count FROM lab_orders WHERE ordered_at >= DATE '2026-02-01';
  SELECT COUNT(*) INTO waiting_count FROM waiting_list WHERE check_in_time >= DATE '2026-02-27';
  SELECT COUNT(*) INTO inventory_count FROM inventory;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEEDING OKAPIA MEDICAL - RÉSUMÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Employés créés: %', employee_count;
  RAISE NOTICE 'Contrats actifs: %', contract_count;
  RAISE NOTICE 'Dépenses récentes: %', expense_count;
  RAISE NOTICE 'Factures: %', billing_count;
  RAISE NOTICE 'Demandes d''analyses: %', lab_order_count;
  RAISE NOTICE 'Patients en attente: %', waiting_count;
  RAISE NOTICE 'Articles en stock: %', inventory_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Date de référence: 27 février 2026';
  RAISE NOTICE '========================================';
END $$;
