/*
# Add Convention, Caisse and Financial Columns to Existing Tables

1. Modified Tables

  a) `invoices` — Colonnes pour factures conventionnees et commissions
    - `type_facture` (text, DEFAULT 'cash') — cash ou conventionne
    - `numero_recu` (text, nullable) — Numero de recu papier
    - `devise_paiement` (text, nullable) — USD ou CDF
    - `medecin_apporteur_id` (uuid, FK medecins_prestataires) — Medecin apporteur lie
    - `pourcentage_commission` (numeric, nullable) — Taux de commission apporteur

  b) `expenses` — Colonnes pour tracabilite des depenses
    - `service_destinataire_id` (uuid, FK departments, nullable) — Service/departement destinataire
    - `piece_justificative_ref` (text, nullable) — Reference de la piece justificative
    - `numero_bon_sortie` (text, UNIQUE, nullable) — Format BSC-YYYYMMDD-NNN
    - `type_paiement_lie` (text, nullable) — honoraire, commission, ou autre
    - `reference_facture_liee` (uuid, FK invoices, nullable) — Facture liee au paiement

  c) `consultations` — Colonnes pour type de patient et convention
    - `type_patient` (text, DEFAULT 'ordinaire') — ordinaire, prive, ou conventionne
    - `convention_id` (uuid, FK conventions, nullable) — Organisme conventionne

2. New Functions
  - `generate_bon_sortie_number()` — Genere un numero sequentiel BSC-YYYYMMDD-NNN

3. New Triggers
  - Trigger sur INSERT expenses pour auto-assigner numero_bon_sortie

4. New Indexes
  - idx_invoices_medecin_apporteur, idx_invoices_type_facture
  - idx_expenses_service_dest, idx_expenses_ref_facture
  - idx_consultations_type_patient, idx_consultations_convention
*/

-- ============================================================
-- INVOICES: add convention + commission columns
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'type_facture'
  ) THEN
    ALTER TABLE invoices ADD COLUMN type_facture text NOT NULL DEFAULT 'cash'
      CHECK (type_facture IN ('cash','conventionne'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'numero_recu'
  ) THEN
    ALTER TABLE invoices ADD COLUMN numero_recu text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'devise_paiement'
  ) THEN
    ALTER TABLE invoices ADD COLUMN devise_paiement text
      CHECK (devise_paiement IN ('USD','CDF'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'medecin_apporteur_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN medecin_apporteur_id uuid
      REFERENCES medecins_prestataires(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'pourcentage_commission'
  ) THEN
    ALTER TABLE invoices ADD COLUMN pourcentage_commission numeric;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_medecin_apporteur ON invoices(medecin_apporteur_id);
CREATE INDEX IF NOT EXISTS idx_invoices_type_facture ON invoices(type_facture);

-- ============================================================
-- EXPENSES: add tracability columns
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'service_destinataire_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN service_destinataire_id uuid
      REFERENCES departments(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'piece_justificative_ref'
  ) THEN
    ALTER TABLE expenses ADD COLUMN piece_justificative_ref text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'numero_bon_sortie'
  ) THEN
    ALTER TABLE expenses ADD COLUMN numero_bon_sortie text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'type_paiement_lie'
  ) THEN
    ALTER TABLE expenses ADD COLUMN type_paiement_lie text
      CHECK (type_paiement_lie IN ('honoraire','commission','autre'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'reference_facture_liee'
  ) THEN
    ALTER TABLE expenses ADD COLUMN reference_facture_liee uuid
      REFERENCES invoices(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expenses_service_dest ON expenses(service_destinataire_id);
CREATE INDEX IF NOT EXISTS idx_expenses_ref_facture ON expenses(reference_facture_liee);
CREATE INDEX IF NOT EXISTS idx_expenses_type_paiement ON expenses(type_paiement_lie);

-- ============================================================
-- CONSULTATIONS: add type_patient + convention columns
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'type_patient'
  ) THEN
    ALTER TABLE consultations ADD COLUMN type_patient text NOT NULL DEFAULT 'ordinaire'
      CHECK (type_patient IN ('ordinaire','prive','conventionne'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'convention_id'
  ) THEN
    ALTER TABLE consultations ADD COLUMN convention_id uuid
      REFERENCES conventions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consultations_type_patient ON consultations(type_patient);
CREATE INDEX IF NOT EXISTS idx_consultations_convention ON consultations(convention_id);

-- ============================================================
-- FUNCTION: generate_bon_sortie_number
-- Generates sequential BSC-YYYYMMDD-NNN numbers
-- ============================================================
CREATE OR REPLACE FUNCTION generate_bon_sortie_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_part text;
  v_seq int;
  v_num text;
BEGIN
  v_date_part := to_char(CURRENT_DATE, 'YYYYMMDD');

  SELECT COALESCE(MAX(
    NULLIF(
      substring(numero_bon_sortie from 'BSC-' || v_date_part || '-(\d+)')::int,
      0
    )
  ), 0) + 1
  INTO v_seq
  FROM expenses
  WHERE numero_bon_sortie LIKE 'BSC-' || v_date_part || '-%';

  v_num := 'BSC-' || v_date_part || '-' || lpad(v_seq::text, 3, '0');
  RETURN v_num;
END;
$$;

-- ============================================================
-- TRIGGER: auto-assign numero_bon_sortie on expense INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION fn_assign_bon_sortie_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.numero_bon_sortie IS NULL THEN
    NEW.numero_bon_sortie := generate_bon_sortie_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_bon_sortie ON expenses;
CREATE TRIGGER trg_assign_bon_sortie
  BEFORE INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION fn_assign_bon_sortie_number();

-- ============================================================
-- TRIGGER: enforce piece_justificative_ref on new expenses
-- Only enforced for rows inserted after this migration
-- ============================================================
CREATE OR REPLACE FUNCTION fn_enforce_piece_justificative()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.piece_justificative_ref IS NULL OR length(trim(NEW.piece_justificative_ref)) = 0 THEN
    RAISE EXCEPTION 'piece_justificative_ref est obligatoire pour les nouvelles depenses';
  END IF;
  RETURN NEW;
END;
$$;

-- Note: this trigger is created but NOT yet activated to avoid breaking existing workflows
-- It can be activated when the frontend forms are updated to include the field
-- DROP TRIGGER IF EXISTS trg_enforce_piece_justificative ON expenses;
-- CREATE TRIGGER trg_enforce_piece_justificative
--   BEFORE INSERT ON expenses
--   FOR EACH ROW
--   EXECUTE FUNCTION fn_enforce_piece_justificative();

NOTIFY pgrst, 'reload schema';
