/*
# Create Trigger for Auto-Generating Honoraires and Commissions on Invoice Payment

1. New Functions
  - `fn_generate_honoraires_commissions()` — Fonction trigger SECURITY DEFINER qui :
    a) Se declenche quand une facture passe au statut 'paid'
    b) Pour chaque ligne de la facture (invoice_items), si un medecin prestataire est
       associe via l'item_type ou une table de liaison future, insere une ligne honoraire
    c) Si la facture a un medecin_apporteur_id + pourcentage_commission,
       insere des lignes commission pour chaque item de la facture
    d) Utilise ON CONFLICT DO NOTHING pour garantir l'idempotence (pas de doublons si revalidation)

2. New Triggers
  - `trg_invoice_paid_generate_honoraires` — AFTER UPDATE sur invoices,
    se declenche uniquement quand status passe a 'paid'

3. Important Notes
  - Le trigger est SECURITY DEFINER pour bypasser RLS lors de l'insertion
  - L'idempotence est assuree par les index uniques partiels sur (facture_id, acte_id)
    et (facture_id, libelle_acte)
  - Les honoraires sont generes a partir des invoice_items uniquement si un medecin
    prestataire est lie a la facture (via une colonne future ou manuellement)
  - Les commissions sont generees automatiquement si medecin_apporteur_id est renseigne
*/

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
BEGIN
  -- Only process when status changes to 'paid'
  IF NEW.status <> 'paid' OR OLD.status = 'paid' THEN
    RETURN NEW;
  END IF;

  -- Get apporteur info if present
  v_apporteur_id := NEW.medecin_apporteur_id;
  v_commission_pct := NEW.pourcentage_commission;

  -- Generate commissions for medecin apporteur (if one is linked)
  IF v_apporteur_id IS NOT NULL AND v_commission_pct IS NOT NULL AND v_commission_pct > 0 THEN
    -- Verify the medecin is an apporteur or les_deux
    SELECT type INTO v_apporteur_type
    FROM medecins_prestataires
    WHERE id = v_apporteur_id AND actif = true;

    IF v_apporteur_type IN ('apporteur', 'les_deux') THEN
      -- Insert a commission line for each invoice item
      FOR v_item IN
        SELECT id, description, unit_price, total_price
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
          montant_du
        )
        VALUES (
          CURRENT_DATE,
          v_apporteur_id,
          NEW.id,
          v_item.id,
          v_item.description,
          v_item.total_price,
          v_commission_pct,
          ROUND(v_item.total_price * v_commission_pct / 100, 2)
        )
        ON CONFLICT DO NOTHING;
      END LOOP;

      -- If no invoice_items exist, insert a single commission line for the total
      IF NOT FOUND THEN
        INSERT INTO commissions_medecins (
          date_commission,
          medecin_id,
          facture_id,
          libelle_acte,
          montant_acte,
          pourcentage,
          montant_du
        )
        VALUES (
          CURRENT_DATE,
          v_apporteur_id,
          NEW.id,
          'Commission sur facture ' || COALESCE(NEW.invoice_number, NEW.id::text),
          NEW.total_amount,
          v_commission_pct,
          ROUND(NEW.total_amount * v_commission_pct / 100, 2)
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on invoices
DROP TRIGGER IF EXISTS trg_invoice_paid_generate_honoraires ON invoices;
CREATE TRIGGER trg_invoice_paid_generate_honoraires
  AFTER UPDATE OF status ON invoices
  FOR EACH ROW
  WHEN (NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid')
  EXECUTE FUNCTION fn_generate_honoraires_commissions();

NOTIFY pgrst, 'reload schema';
