/*
# Extend medecins_prestataires with default remuneration and create versements table

## Purpose
Add default remuneration settings to the prestataires table, and create a dedicated
versements (payments) table to track actual disbursements of honoraires and commissions,
linking them to the existing sortie de caisse system.

## Modified Tables
- `medecins_prestataires`
  - `email` (text): contact email
  - `mode_remuneration_defaut` (text): default remuneration mode (pourcentage/forfait)
  - `taux_defaut` (numeric): default rate/amount for remuneration
  - `service` (text): service/department the prestataire works in

## New Tables
- `versements_honoraires`
  - Tracks actual payments made to prestataires for honoraires or commissions
  - Links to the honoraire/commission rows being paid
  - Links to the caisse movement for traceability
  - Supports multi-currency (USD/CDF)

## Security
- RLS on versements_honoraires: finance roles pattern
*/

-- Extend medecins_prestataires
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medecins_prestataires' AND column_name='email') THEN
    ALTER TABLE medecins_prestataires ADD COLUMN email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medecins_prestataires' AND column_name='mode_remuneration_defaut') THEN
    ALTER TABLE medecins_prestataires ADD COLUMN mode_remuneration_defaut text DEFAULT 'pourcentage' CHECK (mode_remuneration_defaut IN ('pourcentage','forfait'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medecins_prestataires' AND column_name='taux_defaut') THEN
    ALTER TABLE medecins_prestataires ADD COLUMN taux_defaut numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medecins_prestataires' AND column_name='service') THEN
    ALTER TABLE medecins_prestataires ADD COLUMN service text;
  END IF;
END $$;

-- Create versements table
CREATE TABLE IF NOT EXISTS versements_honoraires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_versement text NOT NULL CHECK (type_versement IN ('honoraire','commission')),
  medecin_id uuid NOT NULL REFERENCES medecins_prestataires(id) ON DELETE RESTRICT,
  montant numeric NOT NULL CHECK (montant > 0),
  devise text NOT NULL DEFAULT 'USD' CHECK (devise IN ('USD','CDF')),
  reference text,
  notes text,
  periode_debut date,
  periode_fin date,
  effectue_par uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_versements_medecin ON versements_honoraires(medecin_id);
CREATE INDEX IF NOT EXISTS idx_versements_type ON versements_honoraires(type_versement);
CREATE INDEX IF NOT EXISTS idx_versements_created ON versements_honoraires(created_at);

ALTER TABLE versements_honoraires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_versements" ON versements_honoraires;
CREATE POLICY "select_versements" ON versements_honoraires FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','medecin_chef_staff','finance_manager','accountant','gestionnaire','caissiere')
    )
  );

DROP POLICY IF EXISTS "insert_versements" ON versements_honoraires;
CREATE POLICY "insert_versements" ON versements_honoraires FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','finance_manager','accountant','gestionnaire')
    )
  );

DROP POLICY IF EXISTS "update_versements" ON versements_honoraires;
CREATE POLICY "update_versements" ON versements_honoraires FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general')
    )
  );

DROP POLICY IF EXISTS "delete_versements" ON versements_honoraires;
CREATE POLICY "delete_versements" ON versements_honoraires FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general')
    )
  );
