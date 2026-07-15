/*
# Add free-text apporteur name to commissions_medecins

Allows commissions for non-registered apporteurs (free-text names on invoices).
- `medecin_nom_libre` (text, nullable): the free-text name when medecin_id is null
- Makes medecin_id nullable if not already
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commissions_medecins' AND column_name = 'medecin_nom_libre') THEN
    ALTER TABLE commissions_medecins ADD COLUMN medecin_nom_libre text;
  END IF;
END $$;

ALTER TABLE commissions_medecins ALTER COLUMN medecin_id DROP NOT NULL;
