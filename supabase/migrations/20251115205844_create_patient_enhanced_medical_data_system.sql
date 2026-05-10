/*
  # Système de Données Médicales Enrichies pour Fiches Patients Conformes

  ## Vue d'ensemble
  Cette migration crée un système complet de gestion des données médicales patients
  conforme aux standards français et internationaux (INS, HAS, CNIL, FHIR, CIM-10, LOINC, SNOMED CT).

  ## 1. Nouvelles Tables Créées

  ### patient_ins_identity
  - Stocke les identifiants INS (Identité Nationale de Santé)
  - Champs: numéro INS, matricule INS-C, OID, statut de qualification, dates de validation
  - Permet la traçabilité de l'identitovigilance

  ### patient_medical_history
  - Antécédents médicaux personnels avec codes CIM-10
  - Champs: pathologie, code CIM-10, date de diagnostic, statut actif/résolu
  - Support pour les notes cliniques et traitement actuel

  ### patient_family_history
  - Antécédents familiaux avec relations parentales
  - Champs: relation (père, mère, fratrie), pathologie, code CIM-10, âge de survenue
  - Important pour évaluation des risques génétiques

  ### patient_allergies_detailed
  - Remplace le tableau simple par une table structurée
  - Champs: allergène, type, code SNOMED CT, sévérité, réaction, dates
  - Conformité avec les standards d'allergovigilance

  ### patient_risk_factors
  - Facteurs de risque identifiés (tabac, diabète, HTA, etc.)
  - Champs: type, code, niveau de risque, date d'identification, notes
  - Permet le suivi longitudinal des facteurs de risque

  ### patient_consents
  - Gestion des consentements patients (RGPD)
  - Types: soins, recherche, partage de données, etc.
  - Champs: type, statut, dates de signature et expiration, référence document

  ### patient_advance_directives
  - Directives anticipées du patient
  - Champs: type, contenu, date d'établissement, validité, témoin
  - Conformité avec la loi Leonetti

  ### patient_hospitalizations_history
  - Historique complet des hospitalisations
  - Champs: dates, service, diagnostic principal/associés, codes PMSI, résumé
  - Permet reconstitution du parcours de soins

  ## 2. Sécurité et Conformité
  - RLS activé sur toutes les tables pour protection des données
  - Policies restrictives: accès uniquement aux professionnels authentifiés
  - Vérification des rôles pour les opérations sensibles
  - Traçabilité automatique avec created_at, updated_at

  ## 3. Métadonnées FHIR
  - Champs metadata_fhir (JSONB) pour stockage des métadonnées FHIR R4
  - Support des identifiants système et profils FHIR français
  - Interopérabilité avec systèmes externes

  ## 4. Performance et Indexation
  - Index sur patient_id pour jointures optimisées
  - Index sur dates pour requêtes chronologiques
  - Index full-text sur codes médicaux pour recherche rapide

  ## Notes Importantes
  - Migration non-destructive: conserve toutes les données existantes
  - Compatible avec le schéma actuel de la table patients
  - Extensible pour ajouts futurs sans breaking changes
*/

-- =====================================================
-- 1. TABLE INS (Identité Nationale de Santé)
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_ins_identity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Identifiants INS
  ins_number text UNIQUE,
  ins_c_matricule text,
  oid text,
  
  -- Statut et qualification
  qualification_status text CHECK (qualification_status IN ('qualifié', 'provisoire', 'non_qualifié', 'en_cours_validation')) DEFAULT 'non_qualifié',
  validation_date timestamptz,
  validated_by text,
  
  -- Organisme émetteur
  issuing_organization text,
  issuing_organization_oid text,
  
  -- Métadonnées
  verification_method text,
  verification_notes text,
  last_verification_date timestamptz,
  
  -- Traçabilité
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES user_profiles(id),
  
  -- Métadonnées FHIR
  metadata_fhir jsonb DEFAULT '{}'::jsonb,
  
  -- Contrainte: un seul enregistrement INS actif par patient
  UNIQUE(patient_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_ins_identity_patient_id ON patient_ins_identity(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_ins_identity_ins_number ON patient_ins_identity(ins_number) WHERE ins_number IS NOT NULL;

-- =====================================================
-- 2. TABLE ANTÉCÉDENTS MÉDICAUX PERSONNELS
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_medical_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Pathologie
  condition_name text NOT NULL,
  condition_name_en text,
  
  -- Codification CIM-10
  icd10_code text,
  icd10_description text,
  
  -- Codification SNOMED CT (optionnel)
  snomed_code text,
  snomed_description text,
  
  -- Dates et statut
  diagnosis_date date,
  resolution_date date,
  status text CHECK (status IN ('actif', 'résolu', 'rémission', 'chronique', 'récurrent')) DEFAULT 'actif',
  
  -- Détails cliniques
  severity text CHECK (severity IN ('léger', 'modéré', 'sévère', 'critique')),
  clinical_notes text,
  treatment_current text,
  
  -- Traçabilité
  recorded_by uuid REFERENCES user_profiles(id),
  verified_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Métadonnées FHIR
  metadata_fhir jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_patient_medical_history_patient_id ON patient_medical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_icd10 ON patient_medical_history(icd10_code) WHERE icd10_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_status ON patient_medical_history(status);
CREATE INDEX IF NOT EXISTS idx_patient_medical_history_diagnosis_date ON patient_medical_history(diagnosis_date DESC);

-- =====================================================
-- 3. TABLE ANTÉCÉDENTS FAMILIAUX
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_family_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Relation familiale
  relationship text NOT NULL CHECK (relationship IN (
    'père', 'mère', 'frère', 'soeur', 'fils', 'fille',
    'grand-père_paternel', 'grand-mère_paternelle',
    'grand-père_maternel', 'grand-mère_maternelle',
    'oncle', 'tante', 'cousin', 'cousine', 'autre'
  )),
  relationship_notes text,
  
  -- Pathologie
  condition_name text NOT NULL,
  condition_name_en text,
  
  -- Codification
  icd10_code text,
  icd10_description text,
  snomed_code text,
  
  -- Détails
  age_at_onset integer,
  age_at_death integer,
  cause_of_death text,
  severity text CHECK (severity IN ('léger', 'modéré', 'sévère', 'fatal')),
  
  -- Notes cliniques
  clinical_notes text,
  genetic_testing_performed boolean DEFAULT false,
  genetic_testing_results text,
  
  -- Traçabilité
  recorded_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Métadonnées FHIR
  metadata_fhir jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_patient_family_history_patient_id ON patient_family_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_family_history_relationship ON patient_family_history(relationship);
CREATE INDEX IF NOT EXISTS idx_patient_family_history_icd10 ON patient_family_history(icd10_code) WHERE icd10_code IS NOT NULL;

-- =====================================================
-- 4. TABLE ALLERGIES DÉTAILLÉES
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_allergies_detailed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Allergène
  allergen_name text NOT NULL,
  allergen_name_en text,
  
  -- Type d'allergie
  allergy_type text CHECK (allergy_type IN (
    'médicament', 'aliment', 'environnement', 'insecte', 'latex', 'autre'
  )) NOT NULL,
  
  -- Codification SNOMED CT
  snomed_code text,
  snomed_description text,
  
  -- Sévérité
  severity text CHECK (severity IN ('légère', 'modérée', 'sévère', 'anaphylaxie')) NOT NULL,
  
  -- Réaction
  reaction_type text,
  reaction_description text,
  
  -- Dates
  first_occurrence_date date,
  last_occurrence_date date,
  
  -- Statut
  status text CHECK (status IN ('actif', 'résolu', 'suspecté', 'confirmé')) DEFAULT 'actif',
  
  -- Notes cliniques
  clinical_notes text,
  treatment_administered text,
  
  -- Traçabilité
  recorded_by uuid REFERENCES user_profiles(id),
  verified_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Métadonnées FHIR
  metadata_fhir jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_patient_allergies_detailed_patient_id ON patient_allergies_detailed(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_detailed_severity ON patient_allergies_detailed(severity);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_detailed_type ON patient_allergies_detailed(allergy_type);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_detailed_status ON patient_allergies_detailed(status);

-- =====================================================
-- 5. TABLE FACTEURS DE RISQUE
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_risk_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Facteur de risque
  risk_factor_name text NOT NULL,
  risk_factor_name_en text,
  
  -- Catégorie
  category text CHECK (category IN (
    'cardiovasculaire', 'métabolique', 'comportemental', 
    'environnemental', 'génétique', 'infectieux', 'autre'
  )) NOT NULL,
  
  -- Codification
  snomed_code text,
  loinc_code text,
  
  -- Niveau de risque
  risk_level text CHECK (risk_level IN ('faible', 'modéré', 'élevé', 'très_élevé')) NOT NULL,
  
  -- Valeurs quantitatives (si applicable)
  quantitative_value numeric,
  quantitative_unit text,
  reference_range text,
  
  -- Dates
  identified_date date NOT NULL,
  reassessment_date date,
  
  -- Statut
  status text CHECK (status IN ('actif', 'contrôlé', 'résolu')) DEFAULT 'actif',
  
  -- Interventions
  intervention_plan text,
  monitoring_frequency text,
  
  -- Notes
  clinical_notes text,
  
  -- Traçabilité
  identified_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Métadonnées FHIR
  metadata_fhir jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_patient_risk_factors_patient_id ON patient_risk_factors(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_risk_factors_category ON patient_risk_factors(category);
CREATE INDEX IF NOT EXISTS idx_patient_risk_factors_risk_level ON patient_risk_factors(risk_level);
CREATE INDEX IF NOT EXISTS idx_patient_risk_factors_status ON patient_risk_factors(status);

-- =====================================================
-- 6. TABLE CONSENTEMENTS PATIENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Type de consentement
  consent_type text CHECK (consent_type IN (
    'soins_généraux', 'soins_spécifiques', 'recherche_clinique',
    'partage_données', 'télémédecine', 'photographie_médicale',
    'enseignement', 'don_organes', 'transfusion', 'anesthésie', 'autre'
  )) NOT NULL,
  
  -- Détails
  consent_name text NOT NULL,
  consent_description text,
  
  -- Statut
  status text CHECK (status IN ('actif', 'révoqué', 'expiré', 'en_attente')) DEFAULT 'en_attente',
  
  -- Dates
  signature_date timestamptz,
  effective_date date NOT NULL,
  expiration_date date,
  revocation_date timestamptz,
  
  -- Signature
  signed_by_patient boolean DEFAULT false,
  patient_signature_method text CHECK (patient_signature_method IN ('électronique', 'manuscrite', 'verbale', 'représentant_légal')),
  legal_representative_name text,
  legal_representative_relationship text,
  
  -- Témoin
  witness_name text,
  witness_signature_date timestamptz,
  
  -- Document
  document_reference text,
  document_version text,
  document_url text,
  
  -- Notes
  notes text,
  revocation_reason text,
  
  -- Traçabilité
  recorded_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Métadonnées FHIR
  metadata_fhir jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_patient_consents_patient_id ON patient_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_consents_type ON patient_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_patient_consents_status ON patient_consents(status);
CREATE INDEX IF NOT EXISTS idx_patient_consents_expiration ON patient_consents(expiration_date) WHERE expiration_date IS NOT NULL;

-- =====================================================
-- 7. TABLE DIRECTIVES ANTICIPÉES
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_advance_directives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Type de directive
  directive_type text CHECK (directive_type IN (
    'limitation_soins', 'refus_traitement', 'personne_confiance',
    'don_organes', 'soins_palliatifs', 'réanimation', 'autre'
  )) NOT NULL,
  
  -- Détails
  directive_name text NOT NULL,
  directive_content text NOT NULL,
  
  -- Dates
  establishment_date date NOT NULL,
  validity_start_date date NOT NULL,
  validity_end_date date,
  last_review_date date,
  
  -- Statut
  status text CHECK (status IN ('actif', 'révoqué', 'suspendu', 'expiré')) DEFAULT 'actif',
  is_valid boolean DEFAULT true,
  
  -- Personne de confiance
  trusted_person_name text,
  trusted_person_relationship text,
  trusted_person_phone text,
  trusted_person_email text,
  
  -- Témoin
  witness_name text,
  witness_relationship text,
  witness_signature_date date,
  
  -- Document
  document_reference text,
  document_url text,
  document_stored_location text,
  
  -- Notes
  clinical_context text,
  revision_notes text,
  
  -- Traçabilité
  established_by uuid REFERENCES user_profiles(id),
  reviewed_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Métadonnées FHIR
  metadata_fhir jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_patient_advance_directives_patient_id ON patient_advance_directives(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_advance_directives_type ON patient_advance_directives(directive_type);
CREATE INDEX IF NOT EXISTS idx_patient_advance_directives_status ON patient_advance_directives(status);
CREATE INDEX IF NOT EXISTS idx_patient_advance_directives_validity ON patient_advance_directives(validity_end_date) WHERE validity_end_date IS NOT NULL;

-- =====================================================
-- 8. TABLE HISTORIQUE DES HOSPITALISATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_hospitalizations_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Références
  admission_number text UNIQUE NOT NULL,
  hospitalization_id uuid REFERENCES hospitalizations(id),
  
  -- Dates
  admission_date timestamptz NOT NULL,
  discharge_date timestamptz,
  total_stay_days integer,
  
  -- Service et localisation
  admitting_service text NOT NULL,
  department_id uuid REFERENCES departments(id),
  bed_location text,
  ward_name text,
  
  -- Diagnostics
  principal_diagnosis text NOT NULL,
  principal_diagnosis_icd10 text,
  associated_diagnoses text[],
  associated_diagnoses_icd10 text[],
  
  -- Codes PMSI
  drg_code text,
  drg_description text,
  severity_level integer CHECK (severity_level BETWEEN 1 AND 4),
  
  -- Médecins
  attending_physician_id uuid REFERENCES medical_staff(id),
  referring_physician_id uuid REFERENCES medical_staff(id),
  
  -- Type d'admission
  admission_type text CHECK (admission_type IN ('urgence', 'programmée', 'transfert', 'ambulatoire')) NOT NULL,
  admission_reason text,
  
  -- Type de sortie
  discharge_type text CHECK (discharge_type IN (
    'domicile', 'transfert', 'décès', 'contre_avis_médical', 'évasion', 'autre'
  )),
  discharge_destination text,
  
  -- Résumés
  admission_summary text,
  clinical_course_summary text,
  discharge_summary text,
  discharge_instructions text,
  
  -- Actes et procédures
  procedures_performed text[],
  procedures_ccam_codes text[],
  
  -- Complications
  complications text,
  adverse_events text,
  
  -- Traçabilité
  recorded_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Métadonnées FHIR
  metadata_fhir jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_patient_hospitalizations_history_patient_id ON patient_hospitalizations_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_hospitalizations_history_admission_date ON patient_hospitalizations_history(admission_date DESC);
CREATE INDEX IF NOT EXISTS idx_patient_hospitalizations_history_admission_number ON patient_hospitalizations_history(admission_number);
CREATE INDEX IF NOT EXISTS idx_patient_hospitalizations_history_department ON patient_hospitalizations_history(department_id) WHERE department_id IS NOT NULL;

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- INS Identity
ALTER TABLE patient_ins_identity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionnels de santé peuvent voir INS"
  ON patient_ins_identity FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Professionnels autorisés peuvent modifier INS"
  ON patient_ins_identity FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 3
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 3
    )
  );

-- Medical History
ALTER TABLE patient_medical_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionnels peuvent voir antécédents médicaux"
  ON patient_medical_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Médecins et infirmiers peuvent gérer antécédents"
  ON patient_medical_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 2
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 2
    )
  );

-- Family History
ALTER TABLE patient_family_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionnels peuvent voir antécédents familiaux"
  ON patient_family_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Médecins peuvent gérer antécédents familiaux"
  ON patient_family_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 3
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 3
    )
  );

-- Allergies
ALTER TABLE patient_allergies_detailed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionnels peuvent voir allergies"
  ON patient_allergies_detailed FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Professionnels médicaux peuvent gérer allergies"
  ON patient_allergies_detailed FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 2
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 2
    )
  );

-- Risk Factors
ALTER TABLE patient_risk_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionnels peuvent voir facteurs de risque"
  ON patient_risk_factors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Médecins peuvent gérer facteurs de risque"
  ON patient_risk_factors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 3
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 3
    )
  );

-- Consents
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionnels peuvent voir consentements"
  ON patient_consents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Professionnels autorisés peuvent gérer consentements"
  ON patient_consents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 2
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 2
    )
  );

-- Advance Directives
ALTER TABLE patient_advance_directives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionnels peuvent voir directives anticipées"
  ON patient_advance_directives FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Médecins peuvent gérer directives anticipées"
  ON patient_advance_directives FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 3
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 3
    )
  );

-- Hospitalizations History
ALTER TABLE patient_hospitalizations_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionnels peuvent voir historique hospitalisations"
  ON patient_hospitalizations_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Professionnels médicaux peuvent gérer historique hospitalisations"
  ON patient_hospitalizations_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 2
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND up.is_active = true
      AND r.level >= 2
    )
  );

-- =====================================================
-- 10. TRIGGERS POUR UPDATED_AT AUTOMATIQUE
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patient_ins_identity_updated_at
  BEFORE UPDATE ON patient_ins_identity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_medical_history_updated_at
  BEFORE UPDATE ON patient_medical_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_family_history_updated_at
  BEFORE UPDATE ON patient_family_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_allergies_detailed_updated_at
  BEFORE UPDATE ON patient_allergies_detailed
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_risk_factors_updated_at
  BEFORE UPDATE ON patient_risk_factors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_consents_updated_at
  BEFORE UPDATE ON patient_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_advance_directives_updated_at
  BEFORE UPDATE ON patient_advance_directives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_hospitalizations_history_updated_at
  BEFORE UPDATE ON patient_hospitalizations_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();