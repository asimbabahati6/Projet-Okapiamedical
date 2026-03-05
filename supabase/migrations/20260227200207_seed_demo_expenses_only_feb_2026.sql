/*
  # Seeding Dépenses - Okapia Medical
  # Date: 27 février 2026
  
  15 dépenses réalistes pour remplir la page "Gestion des Dépenses"
*/

INSERT INTO expenses (category, subcategory, amount, description, expense_date, payment_method, vendor, created_by, created_at)
SELECT
  expense_data.category,
  expense_data.subcategory,
  expense_data.amount,
  expense_data.description,
  DATE '2026-02-27' - expense_data.days_ago * INTERVAL '1 day',
  expense_data.payment_method,
  expense_data.vendor,
  (SELECT id FROM user_profiles LIMIT 1),
  NOW()
FROM (VALUES
  -- Février 2026 (5 dépenses)
  ('rent', NULL, 2500.00, 'Loyer mensuel - Février 2026', 0, 'bank_transfer', 'Immobilier Kin'),
  ('utilities', 'Électricité', 850.00, 'Électricité - Février 2026', 2, 'bank_transfer', 'SNEL'),
  ('supplies', 'Médical', 450.50, 'Gants et masques chirurgicaux', 3, 'card', 'Medica Supplies'),
  ('maintenance', 'Équipement', 1200.00, 'Maintenance équipement laboratoire', 5, 'check', 'TechMed Services'),
  ('supplies', 'Pharmacie', 320.00, 'Médicaments urgence', 7, 'cash', 'Pharma Plus'),
  
  -- Janvier 2026 (5 dépenses)
  ('rent', NULL, 2500.00, 'Loyer mensuel - Janvier 2026', 31, 'bank_transfer', 'Immobilier Kin'),
  ('utilities', 'Eau', 780.00, 'Eau et assainissement', 28, 'bank_transfer', 'REGIDESO'),
  ('equipment', 'Laboratoire', 3500.00, 'Microscope binoculaire', 25, 'bank_transfer', 'MedTech Import'),
  ('supplies', 'Médical', 650.00, 'Seringues et consommables', 22, 'card', 'Medica Supplies'),
  ('salaries', 'Personnel', 8500.00, 'Salaires personnel - Janvier', 20, 'bank_transfer', NULL),
  
  -- Décembre 2025 (5 dépenses)
  ('utilities', 'Électricité', 920.00, 'Électricité - Décembre 2025', 60, 'bank_transfer', 'SNEL'),
  ('maintenance', 'Climatisation', 450.00, 'Réparation climatisation', 55, 'cash', 'Cool Air RDC'),
  ('supplies', 'Nettoyage', 380.00, 'Désinfectants et produits', 50, 'card', 'Hygiène Pro'),
  ('equipment', 'Consultation', 1800.00, 'Tensiomètres automatiques (x3)', 48, 'bank_transfer', 'MedTech Import'),
  ('other', 'Formation', 250.00, 'Formation continue personnel', 45, 'check', 'Institut Formation')
) AS expense_data(category, subcategory, amount, description, days_ago, payment_method, vendor);

-- Afficher résumé
DO $$
DECLARE
  expense_count int;
  total_amount decimal;
BEGIN
  SELECT COUNT(*), SUM(amount) 
  INTO expense_count, total_amount
  FROM expenses 
  WHERE created_at >= NOW() - INTERVAL '2 minutes';

  RAISE NOTICE '========================================';
  RAISE NOTICE '   SEEDING OKAPIA - SUCCÈS!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Dépenses insérées: %', expense_count;
  RAISE NOTICE 'Montant total: % USD', total_amount;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Module rempli: Gestion des Dépenses';
  RAISE NOTICE 'Période: Déc 2025 - Fév 2026';
  RAISE NOTICE '========================================';
END $$;
