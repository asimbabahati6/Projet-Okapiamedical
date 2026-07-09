/*
# Add reference_etat to honoraires_medecins and commissions_medecins

1. Modified Tables

  a) `honoraires_medecins` — Ajout colonne `reference_etat` (text, nullable)
    - Format : HON-YYYY-NNNN (ex: HON-2026-0001)
    - Toutes les lignes du meme medecin le meme jour partagent la meme reference
    - Cette reference sert de lien avec le module Depenses pour le paiement

  b) `commissions_medecins` — Ajout colonne `reference_etat` (text, nullable)
    - Format : COM-YYYY-NNNN (ex: COM-2026-0001)
    - Meme logique : une reference par medecin par jour

2. New Functions
  - `generate_reference_honoraire(p_medecin_id uuid, p_date date)` — Retourne la reference
    existante pour ce medecin/date ou en genere une nouvelle sequentielle pour l'annee
  - `generate_reference_commission(p_medecin_id uuid, p_date date)` — Idem pour commissions

3. New Triggers
  - `trg_assign_reference_honoraire` — BEFORE INSERT sur honoraires_medecins,
    assigne automatiquement reference_etat si NULL
  - `trg_assign_reference_commission` — BEFORE INSERT sur commissions_medecins,
    assigne automatiquement reference_etat si NULL

4. New Indexes
  - idx_honoraires_reference_etat, idx_commissions_reference_etat

5. Important Notes
  - Les references sont partagees par (medecin_id, date) : si un medecin a 5 actes
    le meme jour, les 5 lignes portent la meme reference HON-2026-XXXX
  - La sequence est annuelle (repart a 1 chaque annee)
  - Les fonctions sont SECURITY DEFINER pour bypasser RLS lors de la lecture de la sequence
*/

-- ============================================================
-- HONORAIRES: add reference_etat column
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'honoraires_medecins' AND column_name = 'reference_etat'
  ) THEN
    ALTER TABLE honoraires_medecins ADD COLUMN reference_etat text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_honoraires_reference_etat
  ON honoraires_medecins(reference_etat);

-- ============================================================
-- COMMISSIONS: add reference_etat column
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commissions_medecins' AND column_name = 'reference_etat'
  ) THEN
    ALTER TABLE commissions_medecins ADD COLUMN reference_etat text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_commissions_reference_etat
  ON commissions_medecins(reference_etat);

-- ============================================================
-- FUNCTION: generate_reference_honoraire
-- Returns existing reference for (medecin, date) or generates a new one
-- Format: HON-YYYY-NNNN
-- ============================================================
CREATE OR REPLACE FUNCTION generate_reference_honoraire(p_medecin_id uuid, p_date date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing text;
  v_year text;
  v_seq int;
  v_ref text;
BEGIN
  -- Check if a reference already exists for this medecin on this date
  SELECT reference_etat INTO v_existing
  FROM honoraires_medecins
  WHERE medecin_id = p_medecin_id
    AND date_prestation = p_date
    AND reference_etat IS NOT NULL
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Generate a new sequential reference for this year
  v_year := extract(year FROM p_date)::text;

  SELECT COALESCE(MAX(
    NULLIF(
      substring(reference_etat FROM 'HON-' || v_year || '-(\d+)')::int,
      0
    )
  ), 0) + 1
  INTO v_seq
  FROM honoraires_medecins
  WHERE reference_etat LIKE 'HON-' || v_year || '-%';

  v_ref := 'HON-' || v_year || '-' || lpad(v_seq::text, 4, '0');
  RETURN v_ref;
END;
$$;

-- ============================================================
-- FUNCTION: generate_reference_commission
-- Format: COM-YYYY-NNNN
-- ============================================================
CREATE OR REPLACE FUNCTION generate_reference_commission(p_medecin_id uuid, p_date date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing text;
  v_year text;
  v_seq int;
  v_ref text;
BEGIN
  SELECT reference_etat INTO v_existing
  FROM commissions_medecins
  WHERE medecin_id = p_medecin_id
    AND date_commission = p_date
    AND reference_etat IS NOT NULL
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  v_year := extract(year FROM p_date)::text;

  SELECT COALESCE(MAX(
    NULLIF(
      substring(reference_etat FROM 'COM-' || v_year || '-(\d+)')::int,
      0
    )
  ), 0) + 1
  INTO v_seq
  FROM commissions_medecins
  WHERE reference_etat LIKE 'COM-' || v_year || '-%';

  v_ref := 'COM-' || v_year || '-' || lpad(v_seq::text, 4, '0');
  RETURN v_ref;
END;
$$;

-- ============================================================
-- TRIGGER: auto-assign reference_etat on honoraires INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION fn_assign_reference_honoraire()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.reference_etat IS NULL THEN
    NEW.reference_etat := generate_reference_honoraire(NEW.medecin_id, NEW.date_prestation);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_reference_honoraire ON honoraires_medecins;
CREATE TRIGGER trg_assign_reference_honoraire
  BEFORE INSERT ON honoraires_medecins
  FOR EACH ROW
  EXECUTE FUNCTION fn_assign_reference_honoraire();

-- ============================================================
-- TRIGGER: auto-assign reference_etat on commissions INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION fn_assign_reference_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.reference_etat IS NULL THEN
    NEW.reference_etat := generate_reference_commission(NEW.medecin_id, NEW.date_commission);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_reference_commission ON commissions_medecins;
CREATE TRIGGER trg_assign_reference_commission
  BEFORE INSERT ON commissions_medecins
  FOR EACH ROW
  EXECUTE FUNCTION fn_assign_reference_commission();

NOTIFY pgrst, 'reload schema';
