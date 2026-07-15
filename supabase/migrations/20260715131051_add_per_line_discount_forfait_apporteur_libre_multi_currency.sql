/*
# Evolutions facture: remise par ligne, forfait endoscopie, apporteur libre, paiement multi-devises

## 1. invoice_items — nouvelles colonnes
  - discount_type, discount_value, discount_amount, forfait_usd

## 2. invoices — nouvelles colonnes
  - medecin_apporteur_nom_libre, taux_commission_defaut_applique

## 3. payment_history — nouvelles colonnes
  - montant_usd, montant_cdf (paiement split multi-devises)

## 4. system_settings — taux_commission_apporteur_defaut = 10%
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'discount_type') THEN
    ALTER TABLE invoice_items ADD COLUMN discount_type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'discount_value') THEN
    ALTER TABLE invoice_items ADD COLUMN discount_value numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'discount_amount') THEN
    ALTER TABLE invoice_items ADD COLUMN discount_amount numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'forfait_usd') THEN
    ALTER TABLE invoice_items ADD COLUMN forfait_usd numeric DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'medecin_apporteur_nom_libre') THEN
    ALTER TABLE invoices ADD COLUMN medecin_apporteur_nom_libre text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'taux_commission_defaut_applique') THEN
    ALTER TABLE invoices ADD COLUMN taux_commission_defaut_applique numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_history' AND column_name = 'montant_usd') THEN
    ALTER TABLE payment_history ADD COLUMN montant_usd numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_history' AND column_name = 'montant_cdf') THEN
    ALTER TABLE payment_history ADD COLUMN montant_cdf numeric;
  END IF;
END $$;

INSERT INTO system_settings (setting_key, setting_value, setting_type, is_locked, description)
VALUES (
  'taux_commission_apporteur_defaut',
  '10',
  'number',
  false,
  'Taux de commission par defaut (%) pour les medecins apporteurs non enregistres'
)
ON CONFLICT (setting_key) DO NOTHING;
