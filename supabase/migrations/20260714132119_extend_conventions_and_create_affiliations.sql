/*
# Extend conventions table and create patient affiliations

## Purpose
Enhance the conventions system to support full CRUD management of partner organizations
and link patients to conventions via an affiliation table.

## Modified Tables
- `conventions`
  - `type_organisation` (text): entreprise / assurance / ong / autre
  - `contact_nom` (text): contact person name
  - `contact_telephone` (text): contact phone
  - `contact_email` (text): contact email
  - `plafond_montant` (numeric): optional ceiling amount per patient/period
  - `date_debut` (date): convention start date
  - `date_fin` (date): convention end date
  - `adresse` (text): organization address

## New Tables
- `patient_affiliations`
  - Links a patient to a convention with a unique affiliate number
  - `patient_id` FK → patients(id)
  - `convention_id` FK → conventions(id)
  - `numero_affilie` unique affiliate number within the convention
  - `actif` boolean
  - `date_debut` / `date_fin` optional validity dates
  - Unique constraint on (convention_id, patient_id) — one affiliation per patient per convention
  - Unique constraint on (convention_id, numero_affilie) — unique affiliate number per convention

## Security
- RLS on patient_affiliations: same finance role pattern as conventions
*/

-- Extend conventions table with new columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conventions' AND column_name='type_organisation') THEN
    ALTER TABLE conventions ADD COLUMN type_organisation text NOT NULL DEFAULT 'entreprise' CHECK (type_organisation IN ('entreprise','assurance','ong','autre'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conventions' AND column_name='contact_nom') THEN
    ALTER TABLE conventions ADD COLUMN contact_nom text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conventions' AND column_name='contact_telephone') THEN
    ALTER TABLE conventions ADD COLUMN contact_telephone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conventions' AND column_name='contact_email') THEN
    ALTER TABLE conventions ADD COLUMN contact_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conventions' AND column_name='plafond_montant') THEN
    ALTER TABLE conventions ADD COLUMN plafond_montant numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conventions' AND column_name='date_debut') THEN
    ALTER TABLE conventions ADD COLUMN date_debut date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conventions' AND column_name='date_fin') THEN
    ALTER TABLE conventions ADD COLUMN date_fin date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conventions' AND column_name='adresse') THEN
    ALTER TABLE conventions ADD COLUMN adresse text;
  END IF;
END $$;

-- Create patient affiliations table
CREATE TABLE IF NOT EXISTS patient_affiliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  convention_id uuid NOT NULL REFERENCES conventions(id) ON DELETE CASCADE,
  numero_affilie text NOT NULL,
  actif boolean NOT NULL DEFAULT true,
  date_debut date,
  date_fin date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(convention_id, patient_id),
  UNIQUE(convention_id, numero_affilie)
);

CREATE INDEX IF NOT EXISTS idx_patient_affiliations_patient ON patient_affiliations(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_affiliations_convention ON patient_affiliations(convention_id);

-- RLS for patient_affiliations
ALTER TABLE patient_affiliations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_patient_affiliations" ON patient_affiliations;
CREATE POLICY "select_patient_affiliations" ON patient_affiliations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_patient_affiliations" ON patient_affiliations;
CREATE POLICY "insert_patient_affiliations" ON patient_affiliations FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','medecin_chef_staff','finance_manager','accountant','gestionnaire','caissiere','receptionist')
    )
  );

DROP POLICY IF EXISTS "update_patient_affiliations" ON patient_affiliations;
CREATE POLICY "update_patient_affiliations" ON patient_affiliations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','medecin_chef_staff','finance_manager','accountant','gestionnaire')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','medecin_chef_staff','finance_manager','accountant','gestionnaire')
    )
  );

DROP POLICY IF EXISTS "delete_patient_affiliations" ON patient_affiliations;
CREATE POLICY "delete_patient_affiliations" ON patient_affiliations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general')
    )
  );

-- Add indexes on conventions for frequent queries
CREATE INDEX IF NOT EXISTS idx_conventions_actif ON conventions(actif);
CREATE INDEX IF NOT EXISTS idx_conventions_type_org ON conventions(type_organisation);
