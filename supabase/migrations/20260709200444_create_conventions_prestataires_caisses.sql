/*
# Create Core Reference Tables: conventions, medecins_prestataires, caisses

1. New Tables

  a) `conventions` — Organismes conventionnes (mutuelles, entreprises, SNCC, etc.)
    - `id` (uuid, PK)
    - `nom` (text, NOT NULL) — Nom de l'organisme (ex: "SNCC", "SCPT")
    - `code` (text, UNIQUE) — Code court unique
    - `actif` (boolean, DEFAULT true)
    - `created_at` (timestamptz)

  b) `medecins_prestataires` — Medecins honoraires/visiteurs, distincts des utilisateurs systeme
    - `id` (uuid, PK)
    - `nom_complet` (text, NOT NULL) — Nom complet du medecin
    - `specialite` (text) — Specialite medicale
    - `telephone` (text) — Numero de telephone
    - `type` (text) — prestataire, apporteur, ou les_deux
    - `actif` (boolean, DEFAULT true)
    - `created_at` (timestamptz)
    - `created_by` (uuid) — Utilisateur ayant cree la fiche

  c) `caisses` — Registres de caisse (auxiliaire + permanente)
    - `id` (uuid, PK)
    - `nom` (text, NOT NULL) — Nom de la caisse
    - `type` (text) — auxiliaire ou permanente
    - `solde_courant` (numeric, DEFAULT 0)
    - `devise` (text, DEFAULT 'CDF')
    - `created_at` (timestamptz)

2. Seed Data
  - Insere 2 caisses par defaut : "Caisse auxiliaire" et "Caisse permanente"

3. Security
  - RLS active sur les 3 tables
  - `conventions` : SELECT pour tous les authentifies, ecriture admin uniquement
  - `medecins_prestataires` : SELECT pour tous les authentifies, ecriture admin uniquement
  - `caisses` : SELECT pour admin + finance + caissiere, UPDATE admin uniquement
*/

-- ============================================================
-- TABLE: conventions
-- ============================================================
CREATE TABLE IF NOT EXISTS conventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  code text UNIQUE,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conventions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_conventions" ON conventions;
CREATE POLICY "select_conventions" ON conventions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_conventions" ON conventions;
CREATE POLICY "insert_conventions" ON conventions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','medecin_chef_staff')
    )
  );

DROP POLICY IF EXISTS "update_conventions" ON conventions;
CREATE POLICY "update_conventions" ON conventions
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

DROP POLICY IF EXISTS "delete_conventions" ON conventions;
CREATE POLICY "delete_conventions" ON conventions
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
-- TABLE: medecins_prestataires
-- ============================================================
CREATE TABLE IF NOT EXISTS medecins_prestataires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_complet text NOT NULL,
  specialite text,
  telephone text,
  type text NOT NULL DEFAULT 'prestataire' CHECK (type IN ('prestataire','apporteur','les_deux')),
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE medecins_prestataires ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_medecins_prestataires_type ON medecins_prestataires(type);
CREATE INDEX IF NOT EXISTS idx_medecins_prestataires_actif ON medecins_prestataires(actif);

DROP POLICY IF EXISTS "select_medecins_prestataires" ON medecins_prestataires;
CREATE POLICY "select_medecins_prestataires" ON medecins_prestataires
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_medecins_prestataires" ON medecins_prestataires;
CREATE POLICY "insert_medecins_prestataires" ON medecins_prestataires
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','medecin_chef_staff')
    )
  );

DROP POLICY IF EXISTS "update_medecins_prestataires" ON medecins_prestataires;
CREATE POLICY "update_medecins_prestataires" ON medecins_prestataires
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

DROP POLICY IF EXISTS "delete_medecins_prestataires" ON medecins_prestataires;
CREATE POLICY "delete_medecins_prestataires" ON medecins_prestataires
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
-- TABLE: caisses
-- ============================================================
CREATE TABLE IF NOT EXISTS caisses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  type text NOT NULL CHECK (type IN ('auxiliaire','permanente')),
  solde_courant numeric NOT NULL DEFAULT 0,
  devise text NOT NULL DEFAULT 'CDF',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE caisses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_caisses" ON caisses;
CREATE POLICY "select_caisses" ON caisses
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

DROP POLICY IF EXISTS "insert_caisses" ON caisses;
CREATE POLICY "insert_caisses" ON caisses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','medecin_chef_staff')
    )
  );

DROP POLICY IF EXISTS "update_caisses" ON caisses;
CREATE POLICY "update_caisses" ON caisses
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

DROP POLICY IF EXISTS "delete_caisses" ON caisses;
CREATE POLICY "delete_caisses" ON caisses
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
-- SEED: default caisses
-- ============================================================
INSERT INTO caisses (nom, type, devise)
SELECT 'Caisse auxiliaire', 'auxiliaire', 'CDF'
WHERE NOT EXISTS (SELECT 1 FROM caisses WHERE type = 'auxiliaire');

INSERT INTO caisses (nom, type, devise)
SELECT 'Caisse permanente', 'permanente', 'CDF'
WHERE NOT EXISTS (SELECT 1 FROM caisses WHERE type = 'permanente');

NOTIFY pgrst, 'reload schema';
