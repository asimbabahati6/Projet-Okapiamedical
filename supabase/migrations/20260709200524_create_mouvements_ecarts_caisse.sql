/*
# Create Financial Transaction Tables: mouvements_caisse, ecarts_caisse

1. New Tables

  a) `mouvements_caisse` — Enregistrement de chaque mouvement financier dans une caisse
    - `id` (uuid, PK)
    - `caisse_id` (uuid, FK vers caisses)
    - `type` (text) — entree, sortie, transfert_entrant, transfert_sortant
    - `montant` (numeric, NOT NULL, > 0)
    - `devise` (text) — USD ou CDF
    - `reference` (text) — N° facture, bon de sortie, recu
    - `motif` (text) — Description du mouvement
    - `effectue_par` (uuid, FK vers auth.users)
    - `created_at` (timestamptz)

  b) `ecarts_caisse` — Declaration des ecarts lors de la cloture de caisse
    - `id` (uuid, PK)
    - `caisse_id` (uuid, FK vers caisses)
    - `date_cloture` (date, NOT NULL)
    - `montant_theorique` (numeric, NOT NULL)
    - `montant_physique` (numeric, NOT NULL)
    - `ecart` (numeric, GENERATED) — difference physique - theorique
    - `motif_justification` (text, NOT NULL)
    - `declare_par` (uuid, FK vers auth.users)
    - `created_at` (timestamptz)

2. Security
  - RLS active sur les 2 tables
  - `mouvements_caisse` : SELECT pour admin + finance + caissiere ; INSERT pour caissiere (transferts) et admin (tous types)
  - `ecarts_caisse` : SELECT pour admin + finance uniquement ; INSERT pour admin + caissiere
*/

-- ============================================================
-- TABLE: mouvements_caisse
-- ============================================================
CREATE TABLE IF NOT EXISTS mouvements_caisse (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caisse_id uuid NOT NULL REFERENCES caisses(id) ON DELETE RESTRICT,
  type text NOT NULL CHECK (type IN ('entree','sortie','transfert_entrant','transfert_sortant')),
  montant numeric NOT NULL CHECK (montant > 0),
  devise text NOT NULL DEFAULT 'CDF' CHECK (devise IN ('USD','CDF')),
  reference text,
  motif text,
  effectue_par uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mouvements_caisse ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_caisse_id ON mouvements_caisse(caisse_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_created_at ON mouvements_caisse(created_at);
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_type ON mouvements_caisse(type);

DROP POLICY IF EXISTS "select_mouvements_caisse" ON mouvements_caisse;
CREATE POLICY "select_mouvements_caisse" ON mouvements_caisse
  FOR SELECT TO authenticated
  USING (
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

DROP POLICY IF EXISTS "insert_mouvements_caisse" ON mouvements_caisse;
CREATE POLICY "insert_mouvements_caisse" ON mouvements_caisse
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

DROP POLICY IF EXISTS "update_mouvements_caisse" ON mouvements_caisse;
CREATE POLICY "update_mouvements_caisse" ON mouvements_caisse
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','medecin_chef_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','medecin_chef_staff')
    )
  );

DROP POLICY IF EXISTS "delete_mouvements_caisse" ON mouvements_caisse;
CREATE POLICY "delete_mouvements_caisse" ON mouvements_caisse
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
-- TABLE: ecarts_caisse
-- ============================================================
CREATE TABLE IF NOT EXISTS ecarts_caisse (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caisse_id uuid NOT NULL REFERENCES caisses(id) ON DELETE RESTRICT,
  date_cloture date NOT NULL,
  montant_theorique numeric NOT NULL,
  montant_physique numeric NOT NULL,
  ecart numeric GENERATED ALWAYS AS (montant_physique - montant_theorique) STORED,
  motif_justification text NOT NULL,
  declare_par uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ecarts_caisse ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ecarts_caisse_caisse_id ON ecarts_caisse(caisse_id);
CREATE INDEX IF NOT EXISTS idx_ecarts_caisse_date_cloture ON ecarts_caisse(date_cloture);

DROP POLICY IF EXISTS "select_ecarts_caisse" ON ecarts_caisse;
CREATE POLICY "select_ecarts_caisse" ON ecarts_caisse
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

DROP POLICY IF EXISTS "insert_ecarts_caisse" ON ecarts_caisse;
CREATE POLICY "insert_ecarts_caisse" ON ecarts_caisse
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN (
        'super_admin','hospital_admin','directeur_general','medecin_chef_staff',
        'caissiere'
      )
    )
  );

DROP POLICY IF EXISTS "update_ecarts_caisse" ON ecarts_caisse;
CREATE POLICY "update_ecarts_caisse" ON ecarts_caisse
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','medecin_chef_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','medecin_chef_staff')
    )
  );

DROP POLICY IF EXISTS "delete_ecarts_caisse" ON ecarts_caisse;
CREATE POLICY "delete_ecarts_caisse" ON ecarts_caisse
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
