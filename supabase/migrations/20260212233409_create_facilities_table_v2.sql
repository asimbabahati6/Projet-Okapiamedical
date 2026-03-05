/*
  # Ajouter support multi-établissements

  1. Nouvelles Tables
    - `facilities` - Gestion des établissements médicaux

  2. Sécurité
    - Enable RLS
    - Policies pour accès approprié
*/

-- Créer table facilities
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('hospital', 'clinic', 'laboratory', 'pharmacy')),
  address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer index pour performance
CREATE INDEX IF NOT EXISTS idx_facilities_is_active ON facilities(is_active);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities(type);

-- Enable RLS
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- Policies pour facilities
DROP POLICY IF EXISTS "Facilities visible to all authenticated users" ON facilities;
CREATE POLICY "Facilities visible to all authenticated users"
  ON facilities FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage facilities" ON facilities;
CREATE POLICY "Admins can manage facilities"
  ON facilities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      JOIN user_profiles up ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_facilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS facilities_updated_at ON facilities;
CREATE TRIGGER facilities_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_facilities_updated_at();

-- Insérer facility par défaut
INSERT INTO facilities (name, type, address, phone, email, is_active)
VALUES (
  'MediCare Pro - Clinique Principale',
  'clinic',
  'Avenue des Cliniques, Kinshasa, RDC',
  '+243 123 456 789',
  'contact@medicare-pro.cd',
  true
)
ON CONFLICT DO NOTHING;