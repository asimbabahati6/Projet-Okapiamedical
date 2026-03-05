/*
  # Système de Gestion des Brouillons d'Employés

  1. Nouvelle Table
    - `employee_drafts`
      - `id` (uuid, primary key)
      - `created_by` (uuid, foreign key vers auth.users)
      - `draft_name` (text) - nom du brouillon
      - `draft_data` (jsonb) - données du formulaire
      - `current_step` (integer) - étape actuelle (1-6)
      - `completed_steps` (jsonb) - array des étapes complétées
      - `is_published` (boolean) - si le brouillon a été transformé en employé
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur employee_drafts
    - Policies pour super_admin, hospital_admin, administrative_staff
    - Les utilisateurs ne peuvent voir que leurs propres brouillons

  3. Index
    - Index sur created_by pour performance
    - Index sur updated_at pour tri
*/

-- Create employee_drafts table
CREATE TABLE IF NOT EXISTS employee_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_name text,
  draft_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step integer NOT NULL DEFAULT 1,
  completed_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_current_step CHECK (current_step >= 1 AND current_step <= 6)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_drafts_created_by ON employee_drafts(created_by);
CREATE INDEX IF NOT EXISTS idx_employee_drafts_updated_at ON employee_drafts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_drafts_is_published ON employee_drafts(is_published) WHERE is_published = false;

-- Enable RLS
ALTER TABLE employee_drafts ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_employee_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_employee_drafts_updated_at ON employee_drafts;
CREATE TRIGGER trigger_update_employee_drafts_updated_at
BEFORE UPDATE ON employee_drafts
FOR EACH ROW
EXECUTE FUNCTION update_employee_drafts_updated_at();

-- RLS Policy: Users can view their own drafts or admins can view all
CREATE POLICY "Users can view own drafts"
  ON employee_drafts
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

-- RLS Policy: Authorized users can create drafts
CREATE POLICY "Authorized users can create drafts"
  ON employee_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

-- RLS Policy: Users can update their own drafts
CREATE POLICY "Users can update own drafts"
  ON employee_drafts
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
  );

-- RLS Policy: Users can delete their own drafts
CREATE POLICY "Users can delete own drafts"
  ON employee_drafts
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

-- Helper function to auto-generate draft name
CREATE OR REPLACE FUNCTION generate_draft_name()
RETURNS text AS $$
BEGIN
  RETURN 'Brouillon - ' || to_char(now(), 'DD/MM/YYYY HH24:MI');
END;
$$ LANGUAGE plpgsql;

-- Helper function to get user's draft count
CREATE OR REPLACE FUNCTION get_user_draft_count(user_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM employee_drafts
    WHERE created_by = user_id
    AND is_published = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_draft_name() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_draft_count(uuid) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE employee_drafts IS 'Stockage des brouillons de formulaires d ajout d employés pour éviter la perte de données';
COMMENT ON COLUMN employee_drafts.draft_data IS 'Données du formulaire au format JSON incluant toutes les étapes';
COMMENT ON COLUMN employee_drafts.current_step IS 'Numéro de l étape actuelle (1-6)';
COMMENT ON COLUMN employee_drafts.completed_steps IS 'Array JSON des numéros d étapes complétées';