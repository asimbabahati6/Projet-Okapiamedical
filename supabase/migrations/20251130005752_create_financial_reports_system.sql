/*
  # Système de Rapports Financiers

  1. Nouvelle Table
    - `financial_reports`
      - `id` (uuid, primary key)
      - `report_number` (text, unique) - Numéro unique du rapport
      - `period_type` (text) - Type de période (monthly, quarterly, annual, custom)
      - `start_date` (timestamptz) - Date de début de la période
      - `end_date` (timestamptz) - Date de fin de la période
      - `file_url` (text, nullable) - URL du fichier dans Supabase Storage
      - `file_size` (bigint, nullable) - Taille du fichier en octets
      - `generated_by` (uuid) - ID de l utilisateur qui a généré le rapport
      - `generated_at` (timestamptz) - Date de génération
      - `metadata` (jsonb) - Métadonnées du rapport (template, langue, nombre de pages, etc.)

  2. Storage Bucket
    - Créer le bucket `financial-reports` pour stocker les PDF

  3. Sécurité
    - Enable RLS sur la table `financial_reports`
    - Politiques pour les admins et le personnel administratif
    - Politiques de storage pour le téléchargement des rapports

  4. Index
    - Index sur `report_number` pour recherche rapide
    - Index sur `generated_at` pour tri chronologique
    - Index sur `period_type` pour filtrage
*/

-- Création de la table financial_reports
CREATE TABLE IF NOT EXISTS financial_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number text UNIQUE NOT NULL,
  period_type text NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual', 'custom')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  file_url text,
  file_size bigint,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Création des index
CREATE INDEX IF NOT EXISTS idx_financial_reports_report_number
  ON financial_reports(report_number);

CREATE INDEX IF NOT EXISTS idx_financial_reports_generated_at
  ON financial_reports(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_reports_period_type
  ON financial_reports(period_type);

CREATE INDEX IF NOT EXISTS idx_financial_reports_generated_by
  ON financial_reports(generated_by);

CREATE INDEX IF NOT EXISTS idx_financial_reports_dates
  ON financial_reports(start_date, end_date);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_financial_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financial_reports_updated_at
  BEFORE UPDATE ON financial_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_reports_updated_at();

-- Enable Row Level Security
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- Politique: Les admins et le personnel administratif peuvent voir tous les rapports
CREATE POLICY "Admins and admin staff can view all reports"
  ON financial_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

-- Politique: Les admins et le personnel administratif peuvent créer des rapports
CREATE POLICY "Admins and admin staff can create reports"
  ON financial_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

-- Politique: Les admins peuvent supprimer des rapports
CREATE POLICY "Admins can delete reports"
  ON financial_reports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Politique: Les admins peuvent mettre à jour des rapports
CREATE POLICY "Admins can update reports"
  ON financial_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Création du bucket de stockage pour les rapports financiers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'financial-reports',
  'financial-reports',
  false,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Politique de storage: Les admins et le personnel administratif peuvent uploader
CREATE POLICY "Admins and admin staff can upload reports"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'financial-reports'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

-- Politique de storage: Les admins et le personnel administratif peuvent télécharger
CREATE POLICY "Admins and admin staff can download reports"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'financial-reports'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'administrative_staff')
    )
  );

-- Politique de storage: Les admins peuvent supprimer
CREATE POLICY "Admins can delete report files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'financial-reports'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );