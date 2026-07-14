/*
# Add multi-currency support columns to payment_history and expenses

1. Modified Tables

   ## payment_history
   - `taux_applique` (numeric, nullable) — exchange rate USD/CDF used at the time of this payment.
     Stored permanently so historical conversions never change retroactively.

   ## expenses
   - `devise` (text, default 'USD') — currency of the expense amount (USD or CDF).
   - `taux_applique` (numeric, nullable) — exchange rate USD/CDF applied when the expense was recorded.
     For existing rows the default 'USD' preserves backward compatibility.

2. Notes
   - No data loss: only ADD COLUMN operations.
   - Existing payment_history rows keep devise_paiement as-is; taux_applique is nullable for legacy rows.
   - Existing expenses are implicitly USD via the default.
   - Idempotent: uses DO $$ IF NOT EXISTS $$ blocks.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_history' AND column_name = 'taux_applique'
  ) THEN
    ALTER TABLE payment_history ADD COLUMN taux_applique numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'devise'
  ) THEN
    ALTER TABLE expenses ADD COLUMN devise text NOT NULL DEFAULT 'USD';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'taux_applique'
  ) THEN
    ALTER TABLE expenses ADD COLUMN taux_applique numeric;
  END IF;
END $$;
