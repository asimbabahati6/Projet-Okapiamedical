/*
# Create Honoraires and Commissions Tables

1. New Tables

  a) `honoraires_medecins` — Suivi des honoraires dus aux medecins prestataires par acte preste
    - `id` (uuid, PK)
    - `date_prestation` (date, DEFAULT CURRENT_DATE)
    - `medecin_id` (uuid, FK vers medecins_prestataires)
    - `facture_id` (uuid, FK vers invoices)
    - `acte_id` (uuid, nullable) — Reference vers medical_acts_pricing
    - `libelle_acte` (text) — Description de l'acte
    - `montant_acte` (numeric, NOT NULL) — Montant total de l'acte facture
    - `mode_remuneration` (text) — pourcentage ou forfait
    - `pourcentage` (numeric, nullable) — Pourcentage applique si mode pourcentage
    - `montant_forfait` (numeric, nullable) — Montant fixe si mode forfait
    - `montant_du` (numeric, NOT NULL) — Montant effectivement du au medecin
    - `statut_paiement` (text, DEFAULT 'non_paye')
    - `depense_id` (uuid, nullable) — Lien vers la depense de paiement
    - `paye_le` (timestamptz, nullable)
    - `created_at` (timestamptz)
    - UNIQUE(facture_id, acte_id) pour idempotence du trigger

  b) `commissions_medecins` — Suivi des commissions dues aux medecins apporteurs
    - `id` (uuid, PK)
    - `date_commission` (date, DEFAULT CURRENT_DATE)
    - `medecin_id` (uuid, FK vers medecins_prestataires)
    - `facture_id` (uuid, FK vers invoices)
    - `acte_id` (uuid, nullable)
    - `libelle_acte` (text)
    - `montant_acte` (numeric, NOT NULL)
    - `pourcentage` (numeric, nullable)
    - `montant_du` (numeric, NOT NULL)
    - `statut_paiement` (text, DEFAULT 'non_paye')
    - `depense_id` (uuid, nullable)
    - `paye_le` (timestamptz, nullable)
    - `created_at` (timestamptz)
    - UNIQUE(facture_id, acte_id) pour idempotence

2. Security
  - RLS active sur les 2 tables
  - SELECT pour admin + finance + gestionnaire
  - INSERT pour admin + caissiere (via trigger ou saisie directe)
  - UPDATE pour admin + finance (marquer comme paye)
  - DELETE pour admin uniquement
*/

-- ============================================================
-- TABLE: honoraires_medecins
-- ============================================================
CREATE TABLE IF NOT EXISTS honoraires_medecins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_prestation date NOT NULL DEFAULT CURRENT_DATE,
  medecin_id uuid NOT NULL REFERENCES medecins_prestataires(id) ON DELETE RESTRICT,
  facture_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  acte_id uuid,
  libelle_acte text,
  montant_acte numeric NOT NULL CHECK (montant_acte >= 0),
  mode_remuneration text NOT NULL DEFAULT 'pourcentage' CHECK (mode_remuneration IN ('pourcentage','forfait')),
  pourcentage numeric,
  montant_forfait numeric,
  montant_du numeric NOT NULL CHECK (montant_du >= 0),
  statut_paiement text NOT NULL DEFAULT 'non_paye' CHECK (statut_paiement IN ('non_paye','paye')),
  depense_id uuid REFERENCES expenses(id) ON DELETE SET NULL,
  paye_le timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for idempotent trigger inserts
-- Using a partial unique index to handle NULL acte_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_honoraires_facture_acte
  ON honoraires_medecins(facture_id, acte_id)
  WHERE facture_id IS NOT NULL AND acte_id IS NOT NULL;

-- For rows where acte_id IS NULL, use facture_id + libelle_acte
CREATE UNIQUE INDEX IF NOT EXISTS idx_honoraires_facture_libelle
  ON honoraires_medecins(facture_id, libelle_acte)
  WHERE facture_id IS NOT NULL AND acte_id IS NULL;

ALTER TABLE honoraires_medecins ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_honoraires_medecin_id ON honoraires_medecins(medecin_id);
CREATE INDEX IF NOT EXISTS idx_honoraires_facture_id ON honoraires_medecins(facture_id);
CREATE INDEX IF NOT EXISTS idx_honoraires_statut ON honoraires_medecins(statut_paiement);
CREATE INDEX IF NOT EXISTS idx_honoraires_date ON honoraires_medecins(date_prestation);

DROP POLICY IF EXISTS "select_honoraires" ON honoraires_medecins;
CREATE POLICY "select_honoraires" ON honoraires_medecins
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN (
        'super_admin','hospital_admin','directeur_general','medecin_chef_staff',
        'finance_manager','accountant','gestionnaire'
      )
    )
  );

DROP POLICY IF EXISTS "insert_honoraires" ON honoraires_medecins;
CREATE POLICY "insert_honoraires" ON honoraires_medecins
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN (
        'super_admin','hospital_admin','directeur_general','medecin_chef_staff',
        'finance_manager','accountant','gestionnaire','caissiere'
      )
    )
  );

DROP POLICY IF EXISTS "update_honoraires" ON honoraires_medecins;
CREATE POLICY "update_honoraires" ON honoraires_medecins
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN (
        'super_admin','hospital_admin','directeur_general','medecin_chef_staff',
        'finance_manager','accountant','gestionnaire'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN (
        'super_admin','hospital_admin','directeur_general','medecin_chef_staff',
        'finance_manager','accountant','gestionnaire'
      )
    )
  );

DROP POLICY IF EXISTS "delete_honoraires" ON honoraires_medecins;
CREATE POLICY "delete_honoraires" ON honoraires_medecins
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','medecin_chef_staff')
    )
  );

-- ============================================================
-- TABLE: commissions_medecins
-- ============================================================
CREATE TABLE IF NOT EXISTS commissions_medecins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_commission date NOT NULL DEFAULT CURRENT_DATE,
  medecin_id uuid NOT NULL REFERENCES medecins_prestataires(id) ON DELETE RESTRICT,
  facture_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  acte_id uuid,
  libelle_acte text,
  montant_acte numeric NOT NULL CHECK (montant_acte >= 0),
  pourcentage numeric,
  montant_du numeric NOT NULL CHECK (montant_du >= 0),
  statut_paiement text NOT NULL DEFAULT 'non_paye' CHECK (statut_paiement IN ('non_paye','paye')),
  depense_id uuid REFERENCES expenses(id) ON DELETE SET NULL,
  paye_le timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for idempotent trigger inserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_commissions_facture_acte
  ON commissions_medecins(facture_id, acte_id)
  WHERE facture_id IS NOT NULL AND acte_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_commissions_facture_libelle
  ON commissions_medecins(facture_id, libelle_acte)
  WHERE facture_id IS NOT NULL AND acte_id IS NULL;

ALTER TABLE commissions_medecins ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_commissions_medecin_id ON commissions_medecins(medecin_id);
CREATE INDEX IF NOT EXISTS idx_commissions_facture_id ON commissions_medecins(facture_id);
CREATE INDEX IF NOT EXISTS idx_commissions_statut ON commissions_medecins(statut_paiement);
CREATE INDEX IF NOT EXISTS idx_commissions_date ON commissions_medecins(date_commission);

DROP POLICY IF EXISTS "select_commissions" ON commissions_medecins;
CREATE POLICY "select_commissions" ON commissions_medecins
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN (
        'super_admin','hospital_admin','directeur_general','medecin_chef_staff',
        'finance_manager','accountant','gestionnaire'
      )
    )
  );

DROP POLICY IF EXISTS "insert_commissions" ON commissions_medecins;
CREATE POLICY "insert_commissions" ON commissions_medecins
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN (
        'super_admin','hospital_admin','directeur_general','medecin_chef_staff',
        'finance_manager','accountant','gestionnaire','caissiere'
      )
    )
  );

DROP POLICY IF EXISTS "update_commissions" ON commissions_medecins;
CREATE POLICY "update_commissions" ON commissions_medecins
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN (
        'super_admin','hospital_admin','directeur_general','medecin_chef_staff',
        'finance_manager','accountant','gestionnaire'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN (
        'super_admin','hospital_admin','directeur_general','medecin_chef_staff',
        'finance_manager','accountant','gestionnaire'
      )
    )
  );

DROP POLICY IF EXISTS "delete_commissions" ON commissions_medecins;
CREATE POLICY "delete_commissions" ON commissions_medecins
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','medecin_chef_staff')
    )
  );

NOTIFY pgrst, 'reload schema';
