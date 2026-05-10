/*
  # Extension du Système de Gestion du Personnel Médical
  
  ## Vue d'ensemble
  Extension du module de gestion du personnel médical pour inclure tous les types de personnel soignant
  et paramédical (infirmiers, techniciens, thérapeutes, personnel administratif médical, etc.)
  
  ## Nouvelles Tables
  
  1. `staff_nurse_details` - Détails spécifiques aux infirmiers
  2. `staff_technician_details` - Détails spécifiques aux techniciens médicaux
  3. `staff_therapist_details` - Détails spécifiques aux thérapeutes
  4. `staff_administrative_details` - Détails du personnel administratif médical
  5. `staff_type_permissions` - Système de permissions par type de personnel
  
  ## Modifications
  
  - Ajout de nouvelles colonnes à `medical_staff`
  - Création de vues et fonctions utilitaires
  - Mise en place de RLS sur toutes les tables
  
  ## Sécurité
  
  - RLS activé sur toutes les nouvelles tables
  - Politiques d'accès basées sur les rôles
*/

-- =====================================================
-- ÉTAPE 1: Ajout de colonnes à medical_staff
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_staff' AND column_name = 'staff_category'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN staff_category TEXT DEFAULT 'medical';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_staff' AND column_name = 'certifications_list'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN certifications_list JSONB DEFAULT '[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_staff' AND column_name = 'equipment_access'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN equipment_access JSONB DEFAULT '[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_staff' AND column_name = 'department_restrictions'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN department_restrictions JSONB DEFAULT '[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_staff' AND column_name = 'shift_preferences'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN shift_preferences TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_staff' AND column_name = 'can_work_nights'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN can_work_nights BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_staff' AND column_name = 'can_work_weekends'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN can_work_weekends BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_staff' AND column_name = 'requires_supervision'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN requires_supervision BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_staff' AND column_name = 'supervisor_id'
  ) THEN
    ALTER TABLE medical_staff ADD COLUMN supervisor_id UUID REFERENCES medical_staff(id);
  END IF;
END $$;

COMMENT ON COLUMN medical_staff.staff_type IS 'Types acceptés: medecin, infirmier, infirmier_specialise, aide_soignant, technicien_laboratoire, technicien_radiologie, technicien_anesthesie, kinesitherapeute, ergotherapeute, orthophoniste, psychologue, dieteticien, assistant_medical, secretaire_medical, pharmacien, preparateur_pharmacie, travailleur_social, ambulancier, autre';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_staff_type'
  ) THEN
    ALTER TABLE medical_staff ADD CONSTRAINT valid_staff_type CHECK (
      staff_type IN (
        'medecin', 'infirmier', 'infirmier_specialise', 'aide_soignant',
        'technicien_laboratoire', 'technicien_radiologie', 'technicien_anesthesie',
        'kinesitherapeute', 'ergotherapeute', 'orthophoniste', 'psychologue',
        'dieteticien', 'assistant_medical', 'secretaire_medical',
        'pharmacien', 'preparateur_pharmacie', 'travailleur_social',
        'ambulancier', 'autre'
      )
    );
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 2: Tables de détails spécifiques
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_nurse_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  nurse_type TEXT NOT NULL,
  specialized_certifications TEXT[] DEFAULT '{}',
  ward_assignments TEXT[] DEFAULT '{}',
  can_administer_iv BOOLEAN DEFAULT false,
  can_handle_controlled_substances BOOLEAN DEFAULT false,
  can_perform_wound_care BOOLEAN DEFAULT true,
  can_perform_injections BOOLEAN DEFAULT true,
  emergency_care_certified BOOLEAN DEFAULT false,
  pediatric_care_certified BOOLEAN DEFAULT false,
  geriatric_care_certified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id)
);

CREATE INDEX IF NOT EXISTS idx_nurse_details_staff_id ON staff_nurse_details(staff_id);
CREATE INDEX IF NOT EXISTS idx_nurse_details_type ON staff_nurse_details(nurse_type);

ALTER TABLE staff_nurse_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view nurse details"
  ON staff_nurse_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hospital admin can manage nurse details"
  ON staff_nurse_details FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
      )
    )
  );

CREATE TABLE IF NOT EXISTS staff_technician_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  technician_type TEXT NOT NULL,
  equipment_certifications TEXT[] DEFAULT '{}',
  laboratory_sections TEXT[] DEFAULT '{}',
  imaging_modalities TEXT[] DEFAULT '{}',
  radiation_safety_certified BOOLEAN DEFAULT false,
  contrast_injection_certified BOOLEAN DEFAULT false,
  can_validate_results BOOLEAN DEFAULT false,
  equipment_maintenance_trained BOOLEAN DEFAULT false,
  quality_control_certified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id)
);

CREATE INDEX IF NOT EXISTS idx_technician_details_staff_id ON staff_technician_details(staff_id);
CREATE INDEX IF NOT EXISTS idx_technician_details_type ON staff_technician_details(technician_type);

ALTER TABLE staff_technician_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view technician details"
  ON staff_technician_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hospital admin can manage technician details"
  ON staff_technician_details FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
      )
    )
  );

CREATE TABLE IF NOT EXISTS staff_therapist_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  therapist_type TEXT NOT NULL,
  therapy_specializations TEXT[] DEFAULT '{}',
  treatment_methods TEXT[] DEFAULT '{}',
  home_visit_enabled BOOLEAN DEFAULT false,
  pediatric_therapy_certified BOOLEAN DEFAULT false,
  sports_therapy_certified BOOLEAN DEFAULT false,
  neurological_therapy_certified BOOLEAN DEFAULT false,
  manual_therapy_certified BOOLEAN DEFAULT false,
  equipment_list TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id)
);

CREATE INDEX IF NOT EXISTS idx_therapist_details_staff_id ON staff_therapist_details(staff_id);
CREATE INDEX IF NOT EXISTS idx_therapist_details_type ON staff_therapist_details(therapist_type);

ALTER TABLE staff_therapist_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view therapist details"
  ON staff_therapist_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hospital admin can manage therapist details"
  ON staff_therapist_details FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
      )
    )
  );

CREATE TABLE IF NOT EXISTS staff_administrative_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES medical_staff(id) ON DELETE CASCADE,
  admin_type TEXT NOT NULL,
  departments_assigned TEXT[] DEFAULT '{}',
  scheduling_permissions BOOLEAN DEFAULT false,
  billing_access BOOLEAN DEFAULT false,
  medical_records_access_level TEXT DEFAULT 'none',
  can_register_patients BOOLEAN DEFAULT true,
  can_manage_appointments BOOLEAN DEFAULT true,
  can_handle_insurance BOOLEAN DEFAULT false,
  reception_desk_assigned TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_details_staff_id ON staff_administrative_details(staff_id);
CREATE INDEX IF NOT EXISTS idx_admin_details_type ON staff_administrative_details(admin_type);

ALTER TABLE staff_administrative_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view admin details"
  ON staff_administrative_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hospital admin can manage admin details"
  ON staff_administrative_details FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('hospital_admin', 'super_admin')
      )
    )
  );

-- =====================================================
-- ÉTAPE 3: Table des permissions
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_type_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  can_read BOOLEAN DEFAULT false,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  restrictions JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_type, resource_type)
);

CREATE INDEX IF NOT EXISTS idx_permissions_staff_type ON staff_type_permissions(staff_type);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON staff_type_permissions(resource_type);

ALTER TABLE staff_type_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view permissions"
  ON staff_type_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage permissions"
  ON staff_type_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN ('super_admin')
      )
    )
  );

-- =====================================================
-- ÉTAPE 4: Données de permissions par défaut
-- =====================================================

INSERT INTO staff_type_permissions (staff_type, resource_type, can_read, can_write, can_delete, description) VALUES
  ('medecin', 'patient_records', true, true, false, 'Accès complet aux dossiers patients'),
  ('medecin', 'prescriptions', true, true, true, 'Création et gestion des prescriptions'),
  ('medecin', 'lab_results', true, true, false, 'Consultation et validation des résultats'),
  ('medecin', 'consultations', true, true, false, 'Gestion des consultations'),
  ('medecin', 'billing', true, false, false, 'Consultation de la facturation'),
  
  ('infirmier', 'patient_records', true, true, false, 'Lecture complète, écriture des observations'),
  ('infirmier', 'prescriptions', true, false, false, 'Consultation uniquement'),
  ('infirmier', 'medication_administration', true, true, false, 'Administration et documentation'),
  ('infirmier', 'vital_signs', true, true, false, 'Saisie des signes vitaux'),
  ('infirmier', 'nursing_care_plan', true, true, false, 'Gestion du plan de soins'),
  
  ('technicien_laboratoire', 'lab_orders', true, false, false, 'Consultation des demandes'),
  ('technicien_laboratoire', 'lab_results', true, true, false, 'Saisie des résultats'),
  ('technicien_laboratoire', 'lab_equipment', true, true, false, 'Gestion des équipements'),
  ('technicien_laboratoire', 'patient_records', false, false, false, 'Pas d''accès aux dossiers complets'),
  
  ('technicien_radiologie', 'imaging_orders', true, false, false, 'Consultation des demandes'),
  ('technicien_radiologie', 'imaging_results', true, true, false, 'Saisie et téléchargement des images'),
  ('technicien_radiologie', 'imaging_equipment', true, true, false, 'Gestion des équipements'),
  ('technicien_radiologie', 'patient_records', false, false, false, 'Accès limité'),
  
  ('kinesitherapeute', 'therapy_prescriptions', true, false, false, 'Consultation des prescriptions'),
  ('kinesitherapeute', 'therapy_sessions', true, true, false, 'Gestion des séances'),
  ('kinesitherapeute', 'therapy_evaluations', true, true, false, 'Bilans et évaluations'),
  ('kinesitherapeute', 'patient_records', true, false, false, 'Consultation partielle'),
  
  ('assistant_medical', 'appointments', true, true, true, 'Gestion complète des RDV'),
  ('assistant_medical', 'patient_admin_info', true, true, false, 'Informations administratives'),
  ('assistant_medical', 'patient_records', false, false, false, 'Pas d''accès médical'),
  ('assistant_medical', 'billing', true, true, false, 'Facturation et paiements'),
  
  ('secretaire_medical', 'appointments', true, true, true, 'Gestion des rendez-vous'),
  ('secretaire_medical', 'patient_admin_info', true, true, false, 'Gestion administrative'),
  ('secretaire_medical', 'medical_documents', true, false, false, 'Préparation de documents'),
  ('secretaire_medical', 'patient_records', false, false, false, 'Pas d''accès médical')
ON CONFLICT (staff_type, resource_type) DO NOTHING;

-- =====================================================
-- ÉTAPE 5: Vues et fonctions
-- =====================================================

CREATE OR REPLACE VIEW vw_medical_staff_complete AS
SELECT 
  ms.*,
  up.full_name,
  up.phone,
  up.avatar_url,
  nd.nurse_type,
  nd.specialized_certifications as nurse_certifications,
  td.technician_type,
  td.equipment_certifications as tech_certifications,
  thd.therapist_type,
  thd.therapy_specializations,
  ad.admin_type,
  ad.departments_assigned as admin_departments
FROM medical_staff ms
JOIN user_profiles up ON ms.id = up.id
LEFT JOIN staff_nurse_details nd ON ms.id = nd.staff_id
LEFT JOIN staff_technician_details td ON ms.id = td.staff_id
LEFT JOIN staff_therapist_details thd ON ms.id = thd.staff_id
LEFT JOIN staff_administrative_details ad ON ms.id = ad.staff_id;

CREATE OR REPLACE VIEW vw_staff_statistics_by_type AS
SELECT 
  staff_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_accepting_patients = true) as active_count,
  COUNT(*) FILTER (WHERE current_status = 'available') as available_now,
  COUNT(*) FILTER (WHERE current_status = 'on_call') as on_call,
  AVG(years_of_experience) as avg_experience,
  AVG(average_rating) as avg_rating
FROM medical_staff
GROUP BY staff_type;

CREATE OR REPLACE FUNCTION check_staff_permission(
  p_staff_id UUID,
  p_resource_type TEXT,
  p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_staff_type TEXT;
  v_has_permission BOOLEAN;
BEGIN
  SELECT staff_type INTO v_staff_type
  FROM medical_staff
  WHERE id = p_staff_id;
  
  SELECT 
    CASE 
      WHEN p_action = 'read' THEN can_read
      WHEN p_action = 'write' THEN can_write
      WHEN p_action = 'delete' THEN can_delete
      ELSE false
    END INTO v_has_permission
  FROM staff_type_permissions
  WHERE staff_type = v_staff_type
    AND resource_type = p_resource_type;
  
  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_available_staff_types()
RETURNS TABLE (
  staff_type TEXT,
  category TEXT,
  display_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (VALUES
    ('medecin', 'medical', 'Médecin'),
    ('infirmier', 'nursing', 'Infirmier'),
    ('infirmier_specialise', 'nursing', 'Infirmier Spécialisé'),
    ('aide_soignant', 'nursing', 'Aide-Soignant'),
    ('technicien_laboratoire', 'technical', 'Technicien de Laboratoire'),
    ('technicien_radiologie', 'technical', 'Technicien de Radiologie'),
    ('technicien_anesthesie', 'technical', 'Technicien d''Anesthésie'),
    ('kinesitherapeute', 'therapy', 'Kinésithérapeute'),
    ('ergotherapeute', 'therapy', 'Ergothérapeute'),
    ('orthophoniste', 'therapy', 'Orthophoniste'),
    ('psychologue', 'therapy', 'Psychologue'),
    ('dieteticien', 'therapy', 'Diététicien'),
    ('assistant_medical', 'administrative', 'Assistant Médical'),
    ('secretaire_medical', 'administrative', 'Secrétaire Médical'),
    ('pharmacien', 'pharmacy', 'Pharmacien'),
    ('preparateur_pharmacie', 'pharmacy', 'Préparateur en Pharmacie'),
    ('travailleur_social', 'support', 'Travailleur Social'),
    ('ambulancier', 'support', 'Ambulancier'),
    ('autre', 'other', 'Autre')
  ) AS types(staff_type, category, display_name);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_staff_details_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nurse_details_timestamp
  BEFORE UPDATE ON staff_nurse_details
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_details_timestamp();

CREATE TRIGGER update_technician_details_timestamp
  BEFORE UPDATE ON staff_technician_details
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_details_timestamp();

CREATE TRIGGER update_therapist_details_timestamp
  BEFORE UPDATE ON staff_therapist_details
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_details_timestamp();

CREATE TRIGGER update_admin_details_timestamp
  BEFORE UPDATE ON staff_administrative_details
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_details_timestamp();
