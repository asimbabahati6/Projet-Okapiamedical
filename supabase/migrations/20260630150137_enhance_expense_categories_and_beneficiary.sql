-- Migration: Update expense categories to French business categories + add beneficiary fields

-- 1. Drop old CHECK constraint on category
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check;

-- 2. Add new CHECK constraint with 23 French business categories
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
  -- Keep old English values for backward compatibility with existing data
  'utilities', 'rent', 'maintenance', 'supplies', 'salaries',
  'equipment', 'marketing', 'insurance', 'transportation', 'other'
));

-- 3. Add beneficiary fields
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS beneficiaire_type text DEFAULT 'externe' CHECK (beneficiaire_type IN ('interne', 'externe'));
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS beneficiaire_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS beneficiaire_nom text;

-- 4. Create index on beneficiaire_id for join performance
CREATE INDEX IF NOT EXISTS idx_expenses_beneficiaire_id ON expenses(beneficiaire_id);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
