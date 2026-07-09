/*
# Add Prestataire Columns to invoice_items and Extend Honoraires Trigger

1. Modified Tables

  a) `invoice_items` — Ajout de 3 colonnes pour lier un acte a un medecin prestataire
    - `medecin_prestataire_id` (uuid, FK vers medecins_prestataires, nullable)
    - `mode_remuneration` (text, CHECK 'pourcentage'/'forfait', nullable)
    - `valeur_remuneration` (numeric, nullable) — le % ou le montant forfait

  b) `honoraires_medecins` — Modification du CHECK sur statut_paiement
    - Ancien : ('non_paye','paye')
    - Nouveau : ('a_payer','non_paye','paye') — ajoute 'a_payer' comme statut initial du trigger

2. Modified Functions
  - `fn_generate_honoraires_commissions()` — Etendue pour :
    a) Parcourir chaque invoice_item ayant un medecin_prestataire_id
    b) Calculer le montant_du selon le mode (prix * %/100 ou forfait)
    c) Inserer dans honoraires_medecins avec statut 'a_payer'
    d) Rester idempotent via ON CONFLICT DO NOTHING

3. New Indexes
  - idx_invoice_items_medecin_prestataire on invoice_items(medecin_prestataire_id)

4. Important Notes
  - Le trigger existant trg_invoice_paid_generate_honoraires n'est PAS recree,
    seule la fonction sous-jacente est remplacee (CREATE OR REPLACE)
  - Les lignes existantes dans honoraires_medecins avec statut 'non_paye'
    restent valides car 'non_paye' est toujours dans la CHECK
*/

-- ============================================================
-- INVOICE_ITEMS: add prestataire columns
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_items' AND column_name = 'medecin_prestataire_id'
  ) THEN
    ALTER TABLE invoice_items ADD COLUMN medecin_prestataire_id uuid
      REFERENCES medecins_prestataires(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_items' AND column_name = 'mode_remuneration'
  ) THEN
    ALTER TABLE invoice_items ADD COLUMN mode_remuneration text
      CHECK (mode_remuneration IN ('pourcentage','forfait'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_items' AND column_name = 'valeur_remuneration'
  ) THEN
    ALTER TABLE invoice_items ADD COLUMN valeur_remuneration numeric;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoice_items_medecin_prestataire
  ON invoice_items(medecin_prestataire_id);

-- ============================================================
-- HONORAIRES: extend statut_paiement CHECK to include 'a_payer'
-- ============================================================
ALTER TABLE honoraires_medecins
  DROP CONSTRAINT IF EXISTS honoraires_medecins_statut_paiement_check;

ALTER TABLE honoraires_medecins
  ADD CONSTRAINT honoraires_medecins_statut_paiement_check
  CHECK (statut_paiement IN ('a_payer','non_paye','paye'));

-- Update existing 'non_paye' rows to 'a_payer' for consistency
UPDATE honoraires_medecins SET statut_paiement = 'a_payer' WHERE statut_paiement = 'non_paye';

-- Also extend commissions_medecins for consistency
ALTER TABLE commissions_medecins
  DROP CONSTRAINT IF EXISTS commissions_medecins_statut_paiement_check;

ALTER TABLE commissions_medecins
  ADD CONSTRAINT commissions_medecins_statut_paiement_check
  CHECK (statut_paiement IN ('a_payer','non_paye','paye'));

UPDATE commissions_medecins SET statut_paiement = 'a_payer' WHERE statut_paiement = 'non_paye';

-- ============================================================
-- FUNCTION: extend fn_generate_honoraires_commissions
-- Now generates BOTH honoraires (per invoice_item with prestataire)
-- AND commissions (per invoice with apporteur)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_generate_honoraires_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_commission_pct numeric;
  v_apporteur_id uuid;
  v_apporteur_type text;
  v_montant_honoraire numeric;
BEGIN
  -- Only process when status changes to 'paid'
  IF NEW.status <> 'paid' OR OLD.status = 'paid' THEN
    RETURN NEW;
  END IF;

  -- ========================================
  -- PART 1: Generate HONORAIRES per invoice_item with a medecin_prestataire_id
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
    -- Calculate the amount due
    IF v_item.mode_remuneration = 'pourcentage' THEN
      v_montant_honoraire := ROUND(v_item.total_price * v_item.valeur_remuneration / 100, 2);
    ELSE -- forfait
      v_montant_honoraire := v_item.valeur_remuneration;
    END IF;

    -- Insert honoraire (idempotent via unique index on facture_id + acte_id)
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
      montant_du,
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
      'a_payer'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- ========================================
  -- PART 2: Generate COMMISSIONS for medecin apporteur (unchanged logic)
  -- ========================================
  v_apporteur_id := NEW.medecin_apporteur_id;
  v_commission_pct := NEW.pourcentage_commission;

  IF v_apporteur_id IS NOT NULL AND v_commission_pct IS NOT NULL AND v_commission_pct > 0 THEN
    SELECT type INTO v_apporteur_type
    FROM medecins_prestataires
    WHERE id = v_apporteur_id AND actif = true;

    IF v_apporteur_type IN ('apporteur', 'les_deux') THEN
      FOR v_item IN
        SELECT id, description, total_price
        FROM invoice_items
        WHERE invoice_id = NEW.id
      LOOP
        INSERT INTO commissions_medecins (
          date_commission,
          medecin_id,
          facture_id,
          acte_id,
          libelle_acte,
          montant_acte,
          pourcentage,
          montant_du,
          statut_paiement
        )
        VALUES (
          CURRENT_DATE,
          v_apporteur_id,
          NEW.id,
          v_item.id,
          v_item.description,
          v_item.total_price,
          v_commission_pct,
          ROUND(v_item.total_price * v_commission_pct / 100, 2),
          'a_payer'
        )
        ON CONFLICT DO NOTHING;
      END LOOP;

      -- Fallback: if no invoice_items, insert one line for the total
      IF NOT FOUND THEN
        INSERT INTO commissions_medecins (
          date_commission,
          medecin_id,
          facture_id,
          libelle_acte,
          montant_acte,
          pourcentage,
          montant_du,
          statut_paiement
        )
        VALUES (
          CURRENT_DATE,
          v_apporteur_id,
          NEW.id,
          'Commission sur facture ' || COALESCE(NEW.invoice_number, NEW.id::text),
          NEW.total_amount,
          v_commission_pct,
          ROUND(NEW.total_amount * v_commission_pct / 100, 2),
          'a_payer'
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
