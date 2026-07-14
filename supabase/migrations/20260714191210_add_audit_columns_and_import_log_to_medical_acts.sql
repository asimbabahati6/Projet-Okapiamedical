/*
# Add audit columns to medical_acts_pricing + create tarif_import_logs table

1. Modified Tables
   - `medical_acts_pricing`
     - `updated_by` (uuid, nullable) — user who last modified the price
     - `updated_by_name` (text, nullable) — display name of the user who last modified

2. New Tables
   - `tarif_import_logs`
     - `id` (uuid, primary key)
     - `imported_by` (uuid, not null) — user who performed the import
     - `imported_by_name` (text) — display name
     - `total_rows` (integer) — total rows in the file
     - `acts_updated` (integer) — number of existing acts with price changes
     - `acts_created` (integer) — number of new acts created
     - `errors_count` (integer) — number of invalid/skipped rows
     - `taux_change_applique` (numeric) — exchange rate used for CDF calculation
     - `details` (jsonb) — detailed breakdown of changes
     - `created_at` (timestamptz)

3. Security
   - RLS enabled on `tarif_import_logs`
   - SELECT for admin roles + accountant
   - INSERT for admin + medical_director only

4. Notes
   - No data is dropped or deleted
   - Existing medical_acts_pricing rows are unchanged
*/

-- Add audit columns to medical_acts_pricing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_acts_pricing' AND column_name = 'updated_by') THEN
    ALTER TABLE medical_acts_pricing ADD COLUMN updated_by uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_acts_pricing' AND column_name = 'updated_by_name') THEN
    ALTER TABLE medical_acts_pricing ADD COLUMN updated_by_name text;
  END IF;
END $$;

-- Create tarif_import_logs table
CREATE TABLE IF NOT EXISTS tarif_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by uuid NOT NULL,
  imported_by_name text,
  total_rows integer NOT NULL DEFAULT 0,
  acts_updated integer NOT NULL DEFAULT 0,
  acts_created integer NOT NULL DEFAULT 0,
  errors_count integer NOT NULL DEFAULT 0,
  taux_change_applique numeric(12,2),
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tarif_import_logs ENABLE ROW LEVEL SECURITY;

-- SELECT for admin roles
DROP POLICY IF EXISTS "admin_select_tarif_import_logs" ON tarif_import_logs;
CREATE POLICY "admin_select_tarif_import_logs" ON tarif_import_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'directeur_general', 'super_admin', 'hospital_admin', 'accountant')
    )
  );

-- INSERT for admin + medical_director
DROP POLICY IF EXISTS "admin_insert_tarif_import_logs" ON tarif_import_logs;
CREATE POLICY "admin_insert_tarif_import_logs" ON tarif_import_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'directeur_general', 'super_admin', 'hospital_admin')
    )
  );

-- UPDATE policy (for corrections)
DROP POLICY IF EXISTS "admin_update_tarif_import_logs" ON tarif_import_logs;
CREATE POLICY "admin_update_tarif_import_logs" ON tarif_import_logs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'directeur_general')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'directeur_general')
    )
  );

-- DELETE policy
DROP POLICY IF EXISTS "admin_delete_tarif_import_logs" ON tarif_import_logs;
CREATE POLICY "admin_delete_tarif_import_logs" ON tarif_import_logs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'directeur_general')
    )
  );
