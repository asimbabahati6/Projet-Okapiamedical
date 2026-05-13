/*
  # Expand Pharmacy Medications Check Constraints

  1. Problem
    - The existing category and form constraints are too restrictive
    - Missing common pharmaceutical categories (Gastro-intestinal, Vitamine, etc.)
    - Missing dosage forms (Crème, Collyre, Inhalateur, Poudre)

  2. Changes
    - Drop and recreate category constraint with expanded list
    - Drop and recreate form constraint with expanded list
    - Covers all medication types used in a hospital pharmacy

  3. Categories Added
    - Gastro-intestinal, Vitamine, Dermatologie, Neurologique
    - Obstétrique, Ophtalmologie, Cardiovasculaire, Respiratoire
    - Antiparasitaire, Antalgique

  4. Forms Added
    - Crème, Collyre, Inhalateur, Poudre, Pommade (already exists)
*/

ALTER TABLE pharmacy_medications DROP CONSTRAINT IF EXISTS pharmacy_medications_category_check;
ALTER TABLE pharmacy_medications ADD CONSTRAINT pharmacy_medications_category_check 
  CHECK (category = ANY (ARRAY[
    'Antibiotique', 'Analgésique', 'Antalgique', 'Anti-inflammatoire', 
    'Antihypertenseur', 'Antidiabétique', 'Antipaludéen', 'Antiviral',
    'Bronchodilatateur', 'Corticoïde', 'Cardiovasculaire', 'Antiparasitaire',
    'Gastro-intestinal', 'Respiratoire', 'Vitamine', 'Dermatologie',
    'Neurologique', 'Obstétrique', 'Ophtalmologie', 'Autre'
  ]));

ALTER TABLE pharmacy_medications DROP CONSTRAINT IF EXISTS pharmacy_medications_form_check;
ALTER TABLE pharmacy_medications ADD CONSTRAINT pharmacy_medications_form_check 
  CHECK (form = ANY (ARRAY[
    'Comprimé', 'Gélule', 'Sirop', 'Injectable', 'Suppositoire', 
    'Pommade', 'Solution', 'Spray', 'Crème', 'Collyre', 
    'Inhalateur', 'Poudre'
  ]));
