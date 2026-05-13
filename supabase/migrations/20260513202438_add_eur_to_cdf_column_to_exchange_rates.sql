/*
  # Add EUR/CDF column to exchange_rates table

  1. Modified Tables
    - `exchange_rates`
      - Added `eur_to_cdf` (numeric) - Euro to Congolese Franc exchange rate

  2. Notes
    - Column is nullable since EUR rate may not always be available
    - Existing rows will have NULL for this column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exchange_rates' AND column_name = 'eur_to_cdf'
  ) THEN
    ALTER TABLE exchange_rates ADD COLUMN eur_to_cdf numeric;
  END IF;
END $$;
