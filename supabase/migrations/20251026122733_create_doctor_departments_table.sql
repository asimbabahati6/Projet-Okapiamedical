/*
  # Création de la Table d'Attribution des Médecins aux Départements

  ## Description
  Cette migration crée une table de jonction pour gérer l'affectation des médecins
  à plusieurs départements simultanément (relation many-to-many). Chaque médecin peut
  être assigné à plusieurs départements avec le même niveau de priorité.

  ## Tables Créées

  1. **doctor_departments** - Table de jonction médecins/départements
     - id (uuid, clé primaire)
     - doctor_id (uuid, référence vers medical_staff)
     - department_id (uuid, référence vers departments)
     - assigned_at (timestamptz) - Date d'affectation
     - assigned_by (uuid, référence vers user_profiles) - Qui a effectué l'assignation
     - is_active (boolean) - Permet de désactiver sans supprimer
     - created_at (timestamptz)
     - updated_at (timestamptz)

  ## Indexes
  - Index sur doctor_id pour retrouver les départements d'un médecin
  - Index sur department_id pour lister les médecins d'un département
  - Index composite sur (doctor_id, is_active) pour requêtes filtrées
  - Contrainte d'unicité sur (doctor_id, department_id)

  ## Sécurité
  - Politiques RLS pour contrôler l'accès selon les rôles
  - SELECT accessible à tous les utilisateurs authentifiés
  - INSERT/UPDATE/DELETE réservé aux administrateurs
*/

-- Créer la table doctor_departments
CREATE TABLE IF NOT EXISTS doctor_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Contrainte d'unicité pour éviter les doublons
  CONSTRAINT unique_doctor_department UNIQUE(doctor_id, department_id)
);

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_doctor_departments_doctor_id
ON doctor_departments(doctor_id);

CREATE INDEX IF NOT EXISTS idx_doctor_departments_department_id
ON doctor_departments(department_id);

CREATE INDEX IF NOT EXISTS idx_doctor_departments_doctor_active
ON doctor_departments(doctor_id, is_active);

CREATE INDEX IF NOT EXISTS idx_doctor_departments_department_active
ON doctor_departments(department_id, is_active);

-- Trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_doctor_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_doctor_departments_updated_at
  BEFORE UPDATE ON doctor_departments
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_departments_updated_at();

-- Activer RLS sur la table
ALTER TABLE doctor_departments ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: tous les utilisateurs authentifiés peuvent consulter
CREATE POLICY "Users can view doctor department assignments"
  ON doctor_departments
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique INSERT: réservé aux administrateurs
CREATE POLICY "Admins can create doctor department assignments"
  ON doctor_departments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Politique UPDATE: réservé aux administrateurs
CREATE POLICY "Admins can update doctor department assignments"
  ON doctor_departments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Politique DELETE: réservé aux administrateurs
CREATE POLICY "Admins can delete doctor department assignments"
  ON doctor_departments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Commentaires sur les colonnes pour documentation
COMMENT ON TABLE doctor_departments IS 'Table de jonction gérant l''affectation des médecins aux départements (relation many-to-many)';
COMMENT ON COLUMN doctor_departments.doctor_id IS 'Référence vers le médecin assigné';
COMMENT ON COLUMN doctor_departments.department_id IS 'Référence vers le département assigné';
COMMENT ON COLUMN doctor_departments.assigned_at IS 'Date et heure de l''affectation';
COMMENT ON COLUMN doctor_departments.assigned_by IS 'Utilisateur ayant effectué l''affectation';
COMMENT ON COLUMN doctor_departments.is_active IS 'Indique si l''affectation est active (permet de désactiver sans supprimer)';
