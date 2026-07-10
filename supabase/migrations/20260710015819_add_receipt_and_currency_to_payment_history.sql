/*
# Add receipt number and currency columns to payment_history

1. Modified Tables
   - `payment_history`
     - `numero_recu` (text, nullable) — receipt number for this specific payment
     - `devise_paiement` (text, nullable, CHECK USD/CDF) — currency used for this payment

2. Important Notes
   - These columns complement the same-named columns on `invoices`.
   - For partial payments, each payment_history row gets its own receipt number.
   - The invoices.numero_recu stores the LAST receipt; payment_history stores each one.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_history' AND column_name = 'numero_recu'
  ) THEN
    ALTER TABLE payment_history ADD COLUMN numero_recu text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_history' AND column_name = 'devise_paiement'
  ) THEN
    ALTER TABLE payment_history ADD COLUMN devise_paiement text;
    ALTER TABLE payment_history ADD CONSTRAINT payment_history_devise_check CHECK (devise_paiement IN ('USD', 'CDF'));
  END IF;
END $$;
