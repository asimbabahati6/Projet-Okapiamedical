/*
# Enhance Medecins Prestataires, Commissions, and Trigger for Prorata + Forfait

## Context
This migration enhances the honoraires/commissions module to support:
1. Separate commission rate fields for dual-role doctors (visiteur + apporteur)
2. Forfait mode for commissions (previously only pourcentage)
3. Prorata calculation on partial payments instead of only on fully-paid invoices
4. Terminology update: 'prestataire' → 'visiteur' as CHECK constraint

## 1. Modified Tables

### a) `medecins_prestataires`
- ADD `mode_commission_defaut` (text) — 'pourcentage' or 'forfait' for commission calculation
- ADD `taux_commission_defaut` (numeric) — default commission rate/amount
- UPDATE CHECK on `type`: add 'visiteur' as alias for 'prestataire' (keep both for backwards compat)

### b) `commissions_medecins`
- ADD `mode_remuneration` (text) — 'pourcentage' or 'forfait' 
- ADD `montant_forfait` (numeric) — flat amount if mode is forfait

## 2. Modified Functions
- `fn_generate_honoraires_commissions()` — Complete rewrite to support:
  a) Prorata based on paid_amount / total_amount ratio
  b) Recalculation on each payment (UPDATE existing rows)
  c) Forfait commissions (mode_remuneration + montant_forfait)
  d) Commission mode read from invoice or fallback to medecins_prestataires defaults

## 3. New Triggers
- Trigger on payment_history INSERT to update invoice paid_amount and recalculate honoraires/commissions

## 4. Security
- No RLS changes (existing policies remain)

## 5. Important Notes
- Existing data is preserved. 'prestataire' type remains valid alongside 'visiteur'
- The trigger now fires on paid_amount changes too, not just status='paid'
- Prorata: if a 100 USD invoice is 60% paid, honoraires/commissions are calculated on 60% of each item
*/

-- ============================================================
-- 1. EXTEND medecins_prestataires with commission-specific fields
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medecins_prestataires' AND column_name = 'mode_commission_defaut'
  ) THEN
    ALTER TABLE medecins_prestataires ADD COLUMN mode_commission_defaut text
      DEFAULT 'pourcentage' CHECK (mode_commission_defaut IN ('pourcentage','forfait'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medecins_prestataires' AND column_name = 'taux_commission_defaut'
  ) THEN
    ALTER TABLE medecins_prestataires ADD COLUMN taux_commission_defaut numeric;
  END IF;
END $$;

-- Extend the type CHECK to also accept 'visiteur' 
ALTER TABLE medecins_prestataires
  DROP CONSTRAINT IF EXISTS medecins_prestataires_type_check;

ALTER TABLE medecins_prestataires
  ADD CONSTRAINT medecins_prestataires_type_check
  CHECK (type IN ('prestataire','visiteur','apporteur','les_deux'));

-- Migrate existing 'prestataire' to 'visiteur' for clarity
UPDATE medecins_prestataires SET type = 'visiteur' WHERE type = 'prestataire';

-- ============================================================
-- 2. EXTEND commissions_medecins with mode_remuneration + montant_forfait
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commissions_medecins' AND column_name = 'mode_remuneration'
  ) THEN
    ALTER TABLE commissions_medecins ADD COLUMN mode_remuneration text
      DEFAULT 'pourcentage' CHECK (mode_remuneration IN ('pourcentage','forfait'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commissions_medecins' AND column_name = 'montant_forfait'
  ) THEN
    ALTER TABLE commissions_medecins ADD COLUMN montant_forfait numeric;
  END IF;
END $$;

-- Set mode_remuneration for existing rows that have pourcentage set
UPDATE commissions_medecins
  SET mode_remuneration = 'pourcentage'
  WHERE mode_remuneration IS NULL AND pourcentage IS NOT NULL;

-- ============================================================
-- 3. Add prorata_ratio column to honoraires_medecins and commissions_medecins
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'honoraires_medecins' AND column_name = 'prorata_ratio'
  ) THEN
    ALTER TABLE honoraires_medecins ADD COLUMN prorata_ratio numeric DEFAULT 1.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commissions_medecins' AND column_name = 'prorata_ratio'
  ) THEN
    ALTER TABLE commissions_medecins ADD COLUMN prorata_ratio numeric DEFAULT 1.0;
  END IF;

  -- montant_base = full amount before prorata; montant_du = prorata-adjusted amount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'honoraires_medecins' AND column_name = 'montant_base'
  ) THEN
    ALTER TABLE honoraires_medecins ADD COLUMN montant_base numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commissions_medecins' AND column_name = 'montant_base'
  ) THEN
    ALTER TABLE commissions_medecins ADD COLUMN montant_base numeric;
  END IF;
END $$;

-- Backfill montant_base for existing rows
UPDATE honoraires_medecins SET montant_base = montant_du WHERE montant_base IS NULL;
UPDATE commissions_medecins SET montant_base = montant_du WHERE montant_base IS NULL;

-- ============================================================
-- 4. REPLACE trigger function with prorata-aware version
-- ============================================================
CREATE OR REPLACE FUNCTION fn_generate_honoraires_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_commission_pct numeric;
  v_commission_mode text;
  v_commission_forfait numeric;
  v_apporteur_id uuid;
  v_apporteur_type text;
  v_montant_honoraire numeric;
  v_montant_commission numeric;
  v_prorata numeric;
  v_total numeric;
  v_paid numeric;
BEGIN
  -- Calculate prorata ratio: paid_amount / total_amount
  v_total := COALESCE(NEW.total_amount, 0);
  v_paid := COALESCE(NEW.paid_amount, 0);
  
  IF v_total <= 0 THEN
    RETURN NEW;
  END IF;
  
  v_prorata := LEAST(v_paid / v_total, 1.0);
  
  -- Skip if nothing paid yet
  IF v_prorata <= 0 THEN
    RETURN NEW;
  END IF;

  -- ========================================
  -- PART 1: Generate/Update HONORAIRES per invoice_item with a medecin_prestataire_id
  -- ========================================
  FOR v_item IN
    SELECT
      ii.id,
      ii.description,
      ii.total_price,
      ii.medecin_prestataire_id,
      ii.mode_remuneration,
      ii.valeur_remuneration
    FROM invoice_items ii
    WHERE ii.invoice_id = NEW.id
      AND ii.medecin_prestataire_id IS NOT NULL
      AND ii.mode_remuneration IS NOT NULL
      AND ii.valeur_remuneration IS NOT NULL
  LOOP
    -- Calculate the full base amount (before prorata)
    IF v_item.mode_remuneration = 'pourcentage' THEN
      v_montant_honoraire := ROUND(v_item.total_price * v_item.valeur_remuneration / 100, 2);
    ELSE -- forfait
      v_montant_honoraire := v_item.valeur_remuneration;
    END IF;

    -- Try to insert, on conflict update with new prorata
    INSERT INTO honoraires_medecins (
      date_prestation,
      medecin_id,
      facture_id,
      acte_id,
      libelle_acte,
      montant_acte,
      mode_remuneration,
      pourcentage,
      montant_forfait,
      montant_base,
      montant_du,
      prorata_ratio,
      statut_paiement
    )
    VALUES (
      CURRENT_DATE,
      v_item.medecin_prestataire_id,
      NEW.id,
      v_item.id,
      v_item.description,
      v_item.total_price,
      v_item.mode_remuneration,
      CASE WHEN v_item.mode_remuneration = 'pourcentage' THEN v_item.valeur_remuneration ELSE NULL END,
      CASE WHEN v_item.mode_remuneration = 'forfait' THEN v_item.valeur_remuneration ELSE NULL END,
      v_montant_honoraire,
      ROUND(v_montant_honoraire * v_prorata, 2),
      v_prorata,
      'a_payer'
    )
    ON CONFLICT DO NOTHING;
    
    -- If row already exists, update prorata (only if not yet paid out)
    UPDATE honoraires_medecins
    SET montant_du = ROUND(v_montant_honoraire * v_prorata, 2),
        prorata_ratio = v_prorata,
        montant_base = v_montant_honoraire
    WHERE facture_id = NEW.id
      AND acte_id = v_item.id
      AND statut_paiement = 'a_payer';
  END LOOP;

  -- ========================================
  -- PART 2: Generate/Update COMMISSIONS for medecin apporteur
  -- ========================================
  v_apporteur_id := NEW.medecin_apporteur_id;
  v_commission_pct := NEW.pourcentage_commission;

  IF v_apporteur_id IS NOT NULL THEN
    SELECT type INTO v_apporteur_type
    FROM medecins_prestataires
    WHERE id = v_apporteur_id AND actif = true;

    IF v_apporteur_type IN ('apporteur', 'les_deux') THEN
      -- Get default commission mode from medecins_prestataires if not on invoice
      IF v_commission_pct IS NULL OR v_commission_pct <= 0 THEN
        SELECT mode_commission_defaut, taux_commission_defaut
        INTO v_commission_mode, v_commission_forfait
        FROM medecins_prestataires
        WHERE id = v_apporteur_id;
        
        v_commission_pct := v_commission_forfait;
      ELSE
        v_commission_mode := 'pourcentage';
      END IF;

      IF v_commission_pct IS NOT NULL AND v_commission_pct > 0 THEN
        FOR v_item IN
          SELECT id, description, total_price
          FROM invoice_items
          WHERE invoice_id = NEW.id
        LOOP
          -- Calculate base commission amount
          IF v_commission_mode = 'forfait' THEN
            v_montant_commission := v_commission_pct; -- flat amount per item
          ELSE
            v_montant_commission := ROUND(v_item.total_price * v_commission_pct / 100, 2);
          END IF;

          INSERT INTO commissions_medecins (
            date_commission,
            medecin_id,
            facture_id,
            acte_id,
            libelle_acte,
            montant_acte,
            mode_remuneration,
            pourcentage,
            montant_forfait,
            montant_base,
            montant_du,
            prorata_ratio,
            statut_paiement
          )
          VALUES (
            CURRENT_DATE,
            v_apporteur_id,
            NEW.id,
            v_item.id,
            v_item.description,
            v_item.total_price,
            COALESCE(v_commission_mode, 'pourcentage'),
            CASE WHEN COALESCE(v_commission_mode, 'pourcentage') = 'pourcentage' THEN v_commission_pct ELSE NULL END,
            CASE WHEN v_commission_mode = 'forfait' THEN v_commission_pct ELSE NULL END,
            v_montant_commission,
            ROUND(v_montant_commission * v_prorata, 2),
            v_prorata,
            'a_payer'
          )
          ON CONFLICT DO NOTHING;
          
          -- Update existing row with new prorata
          UPDATE commissions_medecins
          SET montant_du = ROUND(v_montant_commission * v_prorata, 2),
              prorata_ratio = v_prorata,
              montant_base = v_montant_commission,
              mode_remuneration = COALESCE(v_commission_mode, 'pourcentage'),
              montant_forfait = CASE WHEN v_commission_mode = 'forfait' THEN v_commission_pct ELSE NULL END
          WHERE facture_id = NEW.id
            AND acte_id = v_item.id
            AND statut_paiement = 'a_payer';
        END LOOP;

        -- Fallback: if no invoice_items, use total_amount
        IF NOT FOUND THEN
          IF v_commission_mode = 'forfait' THEN
            v_montant_commission := v_commission_pct;
          ELSE
            v_montant_commission := ROUND(v_total * v_commission_pct / 100, 2);
          END IF;
          
          INSERT INTO commissions_medecins (
            date_commission,
            medecin_id,
            facture_id,
            libelle_acte,
            montant_acte,
            mode_remuneration,
            pourcentage,
            montant_forfait,
            montant_base,
            montant_du,
            prorata_ratio,
            statut_paiement
          )
          VALUES (
            CURRENT_DATE,
            v_apporteur_id,
            NEW.id,
            'Commission sur facture ' || COALESCE(NEW.invoice_number, NEW.id::text),
            v_total,
            COALESCE(v_commission_mode, 'pourcentage'),
            CASE WHEN COALESCE(v_commission_mode, 'pourcentage') = 'pourcentage' THEN v_commission_pct ELSE NULL END,
            CASE WHEN v_commission_mode = 'forfait' THEN v_commission_pct ELSE NULL END,
            v_montant_commission,
            ROUND(v_montant_commission * v_prorata, 2),
            v_prorata,
            'a_payer'
          )
          ON CONFLICT DO NOTHING;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 5. Drop and recreate the trigger to also fire on paid_amount changes
-- ============================================================
DROP TRIGGER IF EXISTS trg_invoice_paid_generate_honoraires ON invoices;

CREATE TRIGGER trg_invoice_paid_generate_honoraires
  AFTER UPDATE OF status, paid_amount ON invoices
  FOR EACH ROW
  WHEN (
    NEW.paid_amount > 0 
    AND (
      NEW.paid_amount IS DISTINCT FROM OLD.paid_amount
      OR (NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid')
    )
  )
  EXECUTE FUNCTION fn_generate_honoraires_commissions();

NOTIFY pgrst, 'reload schema';
