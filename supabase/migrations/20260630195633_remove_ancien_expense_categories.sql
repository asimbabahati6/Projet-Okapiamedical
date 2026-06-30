-- Remove legacy "(ancien)" expense category values from CHECK constraint
-- Values removed: 'rent', 'salaries', 'insurance', 'transportation', 'other'
-- Values kept: 'utilities', 'maintenance', 'supplies', 'equipment', 'marketing'

ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check;

ALTER TABLE expenses ADD CONSTRAINT expenses_category_check CHECK (category IN (
  'logiciel',
  'frais_generaux',
  'salaires_charges',
  'avance_salaire',
  'soins_medicaux',
  'autres_charges_personnel',
  'frais_mission',
  'primes',
  'frais_transport',
  'achat_marchandises',
  'import_taxes',
  'materiels_bureau',
  'assurances',
  'depenses_informatiques',
  'frais_juridiques',
  'dons_rse',
  'marchandises',
  'materiels_fournitures',
  'energie_courant_carburant',
  'loyer',
  'autres_services',
  'communication',
  'autres_depenses',
  'utilities', 'maintenance', 'supplies', 'equipment', 'marketing'
));

NOTIFY pgrst, 'reload schema';