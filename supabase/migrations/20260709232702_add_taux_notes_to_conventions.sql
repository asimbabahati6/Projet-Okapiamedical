/*
# Add coverage rate and notes to conventions table

1. Modified Tables
   - `conventions`
     - `taux_prise_en_charge` (numeric, nullable) - Default coverage rate percentage (0-100)
     - `notes` (text, nullable) - Additional remarks or notes about the convention

2. Important Notes
   - Non-destructive: adds columns only, no data loss
   - Both columns are nullable with no default, safe for existing rows
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conventions' AND column_name = 'taux_prise_en_charge'
  ) THEN
    ALTER TABLE conventions ADD COLUMN taux_prise_en_charge numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conventions' AND column_name = 'notes'
  ) THEN
    ALTER TABLE conventions ADD COLUMN notes text;
  END IF;
END $$;
