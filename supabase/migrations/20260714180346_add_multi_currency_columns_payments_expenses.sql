/*
# Add Multi-Currency Columns to Invoices and Mouvements Caisse

## Context
Enable full multi-currency (USD/CDF) tracking with historical exchange rates
frozen at transaction time. All existing data is assumed USD.

## 1. Modified Tables

### a) `invoices`
- ADD `taux_change_applique` (numeric) — exchange rate USD/CDF frozen at payment time

### b) `mouvements_caisse`
- ADD `taux_applique` (numeric) — exchange rate at time of movement
- ADD `montant_equivalent` (numeric) — equivalent amount in the other currency

## 2. Backfill
- Existing `payment_history` rows without `devise_paiement` set to 'USD' (default)
- Existing `expenses` rows without `devise` updated remain 'USD' (already default)
- Existing `invoices` without `devise_paiement` remain null (treated as USD by app)

## 3. Important Notes
- No data is deleted or modified destructively
- All new columns are nullable to preserve existing records
- The app handles conversion client-side using the active exchange_rates table
- CDF amounts are always rounded to integer (no decimals in francs congolais)
*/

-- ============================================================
-- 1. INVOICES: add taux_change_applique
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'taux_change_applique'
  ) THEN
    ALTER TABLE invoices ADD COLUMN taux_change_applique numeric;
  END IF;
END $$;

-- ============================================================
-- 2. MOUVEMENTS_CAISSE: add taux_applique + montant_equivalent
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mouvements_caisse' AND column_name = 'taux_applique'
  ) THEN
    ALTER TABLE mouvements_caisse ADD COLUMN taux_applique numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mouvements_caisse' AND column_name = 'montant_equivalent'
  ) THEN
    ALTER TABLE mouvements_caisse ADD COLUMN montant_equivalent numeric;
  END IF;
END $$;

-- ============================================================
-- 3. BACKFILL: set devise_paiement='USD' on existing payment_history rows
-- ============================================================
UPDATE payment_history SET devise_paiement = 'USD' WHERE devise_paiement IS NULL;

NOTIFY pgrst, 'reload schema';
