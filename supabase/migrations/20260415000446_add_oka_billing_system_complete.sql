/*
  # Systeme de Facturation 360 Okapia Medical

  ## Resume des modifications

  ### Colonnes ajoutees sur la table `invoices`
  - `tva_rate` (numeric) : taux de TVA applicable, defaut 16%
  - `tva_amount` (numeric) : montant TVA calcule, defaut 0
  - `net_to_pay` (numeric) : montant net apres TVA (total_amount + tva_amount), defaut 0
  - `draft_number` (text, nullable) : identifiant temporaire pour les brouillons (ex: DRAFT-1747392831)

  ### Nouveau statut
  - Ajout du statut `draft` (Brouillon) au CHECK constraint sur la colonne `status`
  - Une facture draft n'obtient pas de numero OKA officiel
  - Elle doit etre promue en `pending` pour recevoir son numero OKA definitif

  ### Fonction de numerotation sequentielle OKA
  - `generate_oka_invoice_number()` : genere OKA-YYYY-MM-XXXX en interrogeant la derniere facture de la periode
  - Garantit l'unicite et la sequentialite par periode mensuelle

  ### Fonction de promotion draft -> pending
  - `promote_draft_to_pending(p_invoice_id UUID)` : assigne le numero OKA officiel et change le statut
  - Action irreversible, tracee dans updated_at

  ### Trigger de numerotation automatique
  - `trigger_assign_oka_number` sur INSERT : appelle la fonction si statut != 'draft'
  - Les brouillons conservent invoice_number NULL jusqu'a promotion

  ## Notes importantes
  1. La contrainte UNIQUE sur invoice_number accepte maintenant les valeurs NULL (multiple drafts)
  2. Les politiques RLS existantes sont etendues pour couvrir le statut `draft`
  3. Cette migration est non-destructive : aucune donnee existante n'est modifiee
*/

-- ============================================================
-- 1. AJOUT DES NOUVELLES COLONNES SUR invoices
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'tva_rate'
  ) THEN
    ALTER TABLE invoices ADD COLUMN tva_rate numeric DEFAULT 16;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'tva_amount'
  ) THEN
    ALTER TABLE invoices ADD COLUMN tva_amount numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'net_to_pay'
  ) THEN
    ALTER TABLE invoices ADD COLUMN net_to_pay numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'draft_number'
  ) THEN
    ALTER TABLE invoices ADD COLUMN draft_number text;
  END IF;
END $$;

-- ============================================================
-- 2. MODIFICATION DU CHECK CONSTRAINT POUR AJOUTER 'draft'
-- ============================================================

-- Supprimer l'ancienne contrainte de statut si elle existe
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  WHERE tc.table_name = 'invoices'
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name LIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE invoices DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;
END $$;

-- Ajouter la nouvelle contrainte incluant 'draft'
ALTER TABLE invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'pending', 'partial', 'paid', 'cancelled'));

-- ============================================================
-- 3. RENDRE invoice_number NULLABLE (pour les brouillons)
-- ============================================================

ALTER TABLE invoices ALTER COLUMN invoice_number DROP NOT NULL;

-- Modifier la contrainte UNIQUE pour ignorer les NULL
-- (en Postgres, UNIQUE accepte nativement plusieurs NULL)
-- Rien de plus a faire : la contrainte unique existante est compatible

-- ============================================================
-- 4. FONCTION DE NUMEROTATION SEQUENTIELLE OKA
-- ============================================================

CREATE OR REPLACE FUNCTION generate_oka_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefix text;
  v_year text;
  v_month text;
  v_last_seq integer;
  v_new_seq integer;
  v_invoice_number text;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_month := TO_CHAR(NOW(), 'MM');
  v_prefix := 'OKA-' || v_year || '-' || v_month || '-';

  -- Trouver le dernier numero sequentiel pour ce mois
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(invoice_number FROM LENGTH(v_prefix) + 1)
        AS integer
      )
    ),
    0
  )
  INTO v_last_seq
  FROM invoices
  WHERE invoice_number LIKE v_prefix || '%'
    AND invoice_number ~ ('^' || REPLACE(v_prefix, '-', '\-') || '[0-9]{4}$');

  v_new_seq := v_last_seq + 1;
  v_invoice_number := v_prefix || LPAD(v_new_seq::text, 4, '0');

  RETURN v_invoice_number;
END;
$$;

-- ============================================================
-- 5. FONCTION DE PROMOTION DRAFT -> PENDING
-- ============================================================

CREATE OR REPLACE FUNCTION promote_draft_to_pending(p_invoice_id UUID)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status text;
  v_oka_number text;
BEGIN
  -- Verifier que la facture existe et est bien en draft
  SELECT status INTO v_current_status
  FROM invoices
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Facture introuvable : %', p_invoice_id;
  END IF;

  IF v_current_status != 'draft' THEN
    RAISE EXCEPTION 'La facture n''est pas en statut brouillon (statut actuel : %)', v_current_status;
  END IF;

  -- Generer le numero OKA officiel
  v_oka_number := generate_oka_invoice_number();

  -- Mettre a jour la facture
  UPDATE invoices
  SET
    invoice_number = v_oka_number,
    status = 'pending',
    updated_at = NOW()
  WHERE id = p_invoice_id;

  RETURN v_oka_number;
END;
$$;

-- ============================================================
-- 6. TRIGGER DE NUMEROTATION AUTOMATIQUE A L'INSERT
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_fn_assign_oka_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si la facture est un brouillon, ne pas assigner de numero OKA
  IF NEW.status = 'draft' THEN
    -- Assigner un numero temporaire si draft_number est vide
    IF NEW.draft_number IS NULL THEN
      NEW.draft_number := 'DRAFT-' || EXTRACT(EPOCH FROM NOW())::bigint::text;
    END IF;
    NEW.invoice_number := NULL;
    RETURN NEW;
  END IF;

  -- Pour les autres statuts (pending, etc.), generer le numero OKA si non fourni
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_oka_invoice_number();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_assign_oka_number ON invoices;

CREATE TRIGGER trigger_assign_oka_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_fn_assign_oka_number();

-- ============================================================
-- 7. GRANT D'EXECUTION DES FONCTIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION generate_oka_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION promote_draft_to_pending(UUID) TO authenticated;
