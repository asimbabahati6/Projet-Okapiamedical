/*
  # Create Medical Acts Pricing Table

  1. New Tables
    - `medical_acts_pricing`
      - `id` (uuid, primary key)
      - `act_name` (text) - Name of the medical act
      - `category` (text) - Category (Consultation, Chirurgie, Radiologie, Laboratoire, Pharmacie, Soins infirmiers, Autres)
      - `price_usd` (numeric) - Price in USD
      - `price_cdf` (numeric) - Price in Congolese Franc
      - `is_active` (boolean) - Whether the act is active or archived
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - RLS enabled
    - Authenticated staff can view active acts
    - Admin/medical_director can insert/update/delete

  3. Seed Data
    - Common medical acts with prices
*/

CREATE TABLE IF NOT EXISTS medical_acts_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  act_name text NOT NULL,
  category text NOT NULL DEFAULT 'Autres',
  price_usd numeric(10,2) NOT NULL DEFAULT 0,
  price_cdf numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medical_acts_pricing_category ON medical_acts_pricing(category);
CREATE INDEX IF NOT EXISTS idx_medical_acts_pricing_is_active ON medical_acts_pricing(is_active);

ALTER TABLE medical_acts_pricing ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active acts
CREATE POLICY "Authenticated users can view active medical acts"
  ON medical_acts_pricing FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'super_admin', 'hospital_admin', 'directeur_general')
    )
  );

-- Admin/director can insert
CREATE POLICY "Admins can insert medical acts pricing"
  ON medical_acts_pricing FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'super_admin', 'hospital_admin', 'directeur_general')
    )
  );

-- Admin/director can update
CREATE POLICY "Admins can update medical acts pricing"
  ON medical_acts_pricing FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'super_admin', 'hospital_admin', 'directeur_general')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'super_admin', 'hospital_admin', 'directeur_general')
    )
  );

-- Admin can delete
CREATE POLICY "Admins can delete medical acts pricing"
  ON medical_acts_pricing FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('admin', 'medical_director', 'super_admin', 'hospital_admin', 'directeur_general')
    )
  );

-- Seed common medical acts
INSERT INTO medical_acts_pricing (act_name, category, price_usd, price_cdf) VALUES
  ('Consultation generale', 'Consultation', 25.00, 62500.00),
  ('Consultation specialisee', 'Consultation', 40.00, 100000.00),
  ('Consultation de suivi', 'Consultation', 15.00, 37500.00),
  ('Consultation pediatrique', 'Consultation', 25.00, 62500.00),
  ('Consultation gynecologique', 'Consultation', 35.00, 87500.00),
  ('Chirurgie mineure', 'Chirurgie', 150.00, 375000.00),
  ('Chirurgie majeure', 'Chirurgie', 500.00, 1250000.00),
  ('Suture simple', 'Chirurgie', 30.00, 75000.00),
  ('Incision et drainage', 'Chirurgie', 50.00, 125000.00),
  ('Radiographie standard', 'Radiologie', 25.00, 62500.00),
  ('Echographie abdominale', 'Radiologie', 40.00, 100000.00),
  ('Echographie obstetricale', 'Radiologie', 35.00, 87500.00),
  ('Scanner (CT)', 'Radiologie', 150.00, 375000.00),
  ('IRM', 'Radiologie', 250.00, 625000.00),
  ('Hemogramme complet (NFS)', 'Laboratoire', 15.00, 37500.00),
  ('Glycemie', 'Laboratoire', 8.00, 20000.00),
  ('Bilan hepatique', 'Laboratoire', 25.00, 62500.00),
  ('Bilan renal', 'Laboratoire', 20.00, 50000.00),
  ('Test VIH', 'Laboratoire', 10.00, 25000.00),
  ('Goutte epaisse (paludisme)', 'Laboratoire', 5.00, 12500.00),
  ('ECBU (urine)', 'Laboratoire', 12.00, 30000.00),
  ('Medicaments generiques', 'Pharmacie', 10.00, 25000.00),
  ('Perfusion IV', 'Pharmacie', 15.00, 37500.00),
  ('Injection IM/IV', 'Soins infirmiers', 5.00, 12500.00),
  ('Pansement simple', 'Soins infirmiers', 8.00, 20000.00),
  ('Pansement complexe', 'Soins infirmiers', 15.00, 37500.00),
  ('Pose de catheter', 'Soins infirmiers', 20.00, 50000.00),
  ('Nebulisation', 'Soins infirmiers', 10.00, 25000.00),
  ('Certificat medical', 'Autres', 10.00, 25000.00),
  ('Hospitalisation (par jour)', 'Autres', 50.00, 125000.00);
