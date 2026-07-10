/*
# Add user_profile_id to medecins_prestataires + mirror internal doctors

1. Modified Tables
   - `medecins_prestataires`: added `user_profile_id` (uuid, nullable, unique)
     Links an external prestataire row to an internal Okapia user when applicable.
   - `medecins_prestataires`: added `source` (text, default 'externe')
     Distinguishes internal Okapia doctors ('interne') from external prestataires ('externe').

2. Data Changes
   - Inserts mirror rows for active internal doctors (role = doctor, medical_director,
     medecin_chef_staff) into medecins_prestataires with source = 'interne'.

3. Security
   - No RLS changes (existing policies cover new columns).

4. Notes
   - user_profile_id is UNIQUE to prevent duplicate mirror rows.
   - Existing rows get source = 'externe' by default.
   - The trigger trg_invoice_paid_generate_honoraires is NOT modified.
*/

-- Add columns idempotently
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medecins_prestataires' AND column_name = 'user_profile_id'
  ) THEN
    ALTER TABLE medecins_prestataires
      ADD COLUMN user_profile_id uuid UNIQUE REFERENCES user_profiles(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medecins_prestataires' AND column_name = 'source'
  ) THEN
    ALTER TABLE medecins_prestataires
      ADD COLUMN source text NOT NULL DEFAULT 'externe';
  END IF;
END $$;

-- Insert mirror rows for active internal doctors
INSERT INTO medecins_prestataires (id, nom_complet, specialite, type, actif, source, user_profile_id)
SELECT
  gen_random_uuid(),
  up.full_name,
  COALESCE(ms.specialization, r.name),
  'prestataire',
  true,
  'interne',
  up.id
FROM user_profiles up
JOIN roles r ON up.role_id = r.id
LEFT JOIN medical_staff ms ON ms.id = up.id
WHERE r.name IN ('doctor', 'medical_director', 'medecin_chef_staff', 'dentist')
  AND up.account_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM medecins_prestataires mp WHERE mp.user_profile_id = up.id
  );
