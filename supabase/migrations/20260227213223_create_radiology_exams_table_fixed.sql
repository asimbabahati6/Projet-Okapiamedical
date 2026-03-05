/*
  # Création de la table radiology_exams pour le module Radiologie
  
  1. Nouvelle table
    - `radiology_exams` : Table principale pour les examens radiologiques
      - Liens avec patients et user_profiles
      - Types d'examens et modalités DICOM
      - Gestion des urgences et statuts
  
  2. Sécurité
    - Enable RLS
    - Policies pour prescription et réalisation
*/

-- Créer la table radiology_exams
CREATE TABLE IF NOT EXISTS radiology_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  prescribed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  exam_type text NOT NULL CHECK (exam_type IN ('radiography', 'ct_scan', 'mri', 'ultrasound', 'mammography')),
  modality text NOT NULL CHECK (modality IN ('CR', 'CT', 'MR', 'US', 'MG', 'DX', 'RF')),
  body_part text NOT NULL,
  clinical_info text NOT NULL,
  urgency_level text NOT NULL DEFAULT 'routine' CHECK (urgency_level IN ('routine', 'urgent', 'emergency')),
  status text NOT NULL DEFAULT 'prescribed' CHECK (status IN ('prescribed', 'in_progress', 'completed', 'validated', 'cancelled')),
  special_instructions text,
  scheduled_for timestamptz,
  performed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_radiology_exams_patient_id ON radiology_exams(patient_id);
CREATE INDEX IF NOT EXISTS idx_radiology_exams_prescribed_by ON radiology_exams(prescribed_by);
CREATE INDEX IF NOT EXISTS idx_radiology_exams_status ON radiology_exams(status);
CREATE INDEX IF NOT EXISTS idx_radiology_exams_urgency ON radiology_exams(urgency_level);
CREATE INDEX IF NOT EXISTS idx_radiology_exams_created_at ON radiology_exams(created_at DESC);

-- Trigger pour updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_radiology_exams_updated_at'
  ) THEN
    CREATE FUNCTION update_radiology_exams_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS radiology_exams_updated_at ON radiology_exams;
CREATE TRIGGER radiology_exams_updated_at
  BEFORE UPDATE ON radiology_exams
  FOR EACH ROW
  EXECUTE FUNCTION update_radiology_exams_updated_at();

-- Enable RLS
ALTER TABLE radiology_exams ENABLE ROW LEVEL SECURITY;

-- Policy: Tous les utilisateurs authentifiés peuvent voir
CREATE POLICY "Authenticated users can view radiology exams"
  ON radiology_exams
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Utilisateurs authentifiés peuvent prescrire
CREATE POLICY "Authenticated users can prescribe exams"
  ON radiology_exams
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Utilisateurs authentifiés peuvent mettre à jour
CREATE POLICY "Authenticated users can update exams"
  ON radiology_exams
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Utilisateurs authentifiés peuvent supprimer
CREATE POLICY "Authenticated users can delete exams"
  ON radiology_exams
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
