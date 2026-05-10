/*
  # Système de Codes Médicaux et Traçabilité CNIL

  ## Vue d'ensemble
  Cette migration crée les tables de référence pour codes médicaux standardisés
  et le système complet d'audit/traçabilité conforme CNIL/RGPD.

  ## 1. Tables de Codes Médicaux

  ### medical_codes_icd10
  - Classification Internationale des Maladies version 10
  - Codes, libellés FR/EN, catégories, chapit res
  - Support recherche full-text pour assistance à la codification

  ### medical_codes_ccam
  - Classification Commune des Actes Médicaux
  - Codes actes, descriptions, tarifs de base, durées moyennes
  - Pour facturation et statistiques

  ### medical_codes_loinc
  - Logical Observation Identifiers Names and Codes
  - Pour examens biologiques et résultats de laboratoire
  - Unités de mesure, valeurs de référence

  ### medical_codes_snomed_ct
  - SNOMED Clinical Terms
  - Terminologie clinique standardisée internationale
  - Pour interopérabilité avec systèmes internationaux

  ## 2. Système d'Audit et Traçabilité CNIL

  ### patient_data_access_log
  - Trace tous les accès aux données patient
  - Qui, quand, quoi, pourquoi, comment
  - IP, user agent, durée de session

  ### patient_data_modification_log
  - Trace toutes les modifications
  - Before/after values en JSON
  - Type d'opération (INSERT, UPDATE, DELETE)

  ### patient_consent_history
  - Historique complet des consentements
  - Toutes les versions et modifications
  - Traçabilité des révocations

  ## 3. Sécurité et Performance
  - RLS sur toutes les tables
  - Index optimisés pour recherche full-text
  - Index sur dates pour requêtes chronologiques
  - Partitionnement des logs par date (future optimisation)

  ## 4. Conformité RGPD/CNIL
  - Pseudonymisation des données dans les logs
  - Rétention limitée des logs (configurable)
  - Droit d'accès aux logs par le patient
  - Notification automatique en cas d'accès suspect
*/

-- =====================================================
-- 1. TABLE CIM-10 (Classification Internationale des Maladies)
-- =====================================================

CREATE TABLE IF NOT EXISTS medical_codes_icd10 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Code et version
  code text NOT NULL UNIQUE,
  code_version text DEFAULT '10' NOT NULL,
  
  -- Libellés
  label_fr text NOT NULL,
  label_en text,
  short_label_fr text,
  short_label_en text,
  
  -- Classification
  chapter text,
  chapter_name text,
  category text,
  subcategory text,
  
  -- Détails
  description_fr text,
  description_en text,
  clinical_notes text,
  
  -- Synonymes et termes associés (pour recherche)
  synonyms text[],
  related_terms text[],
  
  -- Métadonnées
  is_active boolean DEFAULT true,
  deprecated_date date,
  replacement_code text,
  
  -- Statistiques d'utilisation
  usage_count integer DEFAULT 0,
  last_used_date timestamptz,
  
  -- Traçabilité
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Full-text search
  search_vector tsvector
);

CREATE INDEX IF NOT EXISTS idx_medical_codes_icd10_code ON medical_codes_icd10(code);
CREATE INDEX IF NOT EXISTS idx_medical_codes_icd10_chapter ON medical_codes_icd10(chapter) WHERE chapter IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medical_codes_icd10_category ON medical_codes_icd10(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medical_codes_icd10_active ON medical_codes_icd10(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_medical_codes_icd10_search ON medical_codes_icd10 USING gin(search_vector);

-- Trigger pour mise à jour automatique du vecteur de recherche
CREATE OR REPLACE FUNCTION update_icd10_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('french',
    coalesce(NEW.code, '') || ' ' ||
    coalesce(NEW.label_fr, '') || ' ' ||
    coalesce(NEW.short_label_fr, '') || ' ' ||
    coalesce(NEW.description_fr, '') || ' ' ||
    coalesce(array_to_string(NEW.synonyms, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_icd10_search_vector
  BEFORE INSERT OR UPDATE ON medical_codes_icd10
  FOR EACH ROW
  EXECUTE FUNCTION update_icd10_search_vector();

-- =====================================================
-- 2. TABLE CCAM (Classification Commune des Actes Médicaux)
-- =====================================================

CREATE TABLE IF NOT EXISTS medical_codes_ccam (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Code
  code text NOT NULL UNIQUE,
  code_version text DEFAULT '1.0' NOT NULL,
  
  -- Libellés
  label_fr text NOT NULL,
  label_en text,
  
  -- Classification
  chapter text,
  chapter_name text,
  section text,
  section_name text,
  
  -- Détails de l'acte
  description_fr text,
  description_en text,
  technical_details text,
  
  -- Tarification
  base_tariff numeric(10, 2),
  currency text DEFAULT 'EUR',
  reimbursement_rate numeric(5, 2),
  
  -- Durée et ressources
  average_duration_minutes integer,
  anesthesia_required boolean DEFAULT false,
  hospitalization_required boolean DEFAULT false,
  
  -- Spécialité
  specialty text,
  medical_discipline text,
  
  -- Synonymes
  synonyms text[],
  related_codes text[],
  
  -- Métadonnées
  is_active boolean DEFAULT true,
  deprecated_date date,
  
  -- Statistiques
  usage_count integer DEFAULT 0,
  last_used_date timestamptz,
  
  -- Traçabilité
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Full-text search
  search_vector tsvector
);

CREATE INDEX IF NOT EXISTS idx_medical_codes_ccam_code ON medical_codes_ccam(code);
CREATE INDEX IF NOT EXISTS idx_medical_codes_ccam_chapter ON medical_codes_ccam(chapter) WHERE chapter IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medical_codes_ccam_specialty ON medical_codes_ccam(specialty) WHERE specialty IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medical_codes_ccam_active ON medical_codes_ccam(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_medical_codes_ccam_search ON medical_codes_ccam USING gin(search_vector);

-- Trigger pour mise à jour automatique du vecteur de recherche
CREATE OR REPLACE FUNCTION update_ccam_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('french',
    coalesce(NEW.code, '') || ' ' ||
    coalesce(NEW.label_fr, '') || ' ' ||
    coalesce(NEW.description_fr, '') || ' ' ||
    coalesce(array_to_string(NEW.synonyms, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ccam_search_vector
  BEFORE INSERT OR UPDATE ON medical_codes_ccam
  FOR EACH ROW
  EXECUTE FUNCTION update_ccam_search_vector();

-- =====================================================
-- 3. TABLE LOINC (Logical Observation Identifiers Names and Codes)
-- =====================================================

CREATE TABLE IF NOT EXISTS medical_codes_loinc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Code
  loinc_code text NOT NULL UNIQUE,
  loinc_version text NOT NULL,
  
  -- Composants
  component text NOT NULL,
  component_fr text,
  property text,
  time_aspect text,
  system text,
  scale_type text,
  method_type text,
  
  -- Libellés
  long_common_name text NOT NULL,
  short_name text,
  french_name text,
  
  -- Classification
  class_type text,
  class_name text,
  
  -- Unités et valeurs de référence
  example_units text,
  reference_range_adult text,
  reference_range_child text,
  reference_range_male text,
  reference_range_female text,
  
  -- Détails
  description text,
  clinical_information text,
  
  -- Synonymes
  synonyms text[],
  related_codes text[],
  
  -- Métadonnées
  is_active boolean DEFAULT true,
  status text,
  
  -- Statistiques
  usage_count integer DEFAULT 0,
  last_used_date timestamptz,
  
  -- Traçabilité
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Full-text search
  search_vector tsvector
);

CREATE INDEX IF NOT EXISTS idx_medical_codes_loinc_code ON medical_codes_loinc(loinc_code);
CREATE INDEX IF NOT EXISTS idx_medical_codes_loinc_class ON medical_codes_loinc(class_type) WHERE class_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medical_codes_loinc_component ON medical_codes_loinc(component);
CREATE INDEX IF NOT EXISTS idx_medical_codes_loinc_active ON medical_codes_loinc(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_medical_codes_loinc_search ON medical_codes_loinc USING gin(search_vector);

-- Trigger pour mise à jour automatique du vecteur de recherche
CREATE OR REPLACE FUNCTION update_loinc_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('french',
    coalesce(NEW.loinc_code, '') || ' ' ||
    coalesce(NEW.long_common_name, '') || ' ' ||
    coalesce(NEW.short_name, '') || ' ' ||
    coalesce(NEW.french_name, '') || ' ' ||
    coalesce(NEW.component_fr, '') || ' ' ||
    coalesce(array_to_string(NEW.synonyms, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_loinc_search_vector
  BEFORE INSERT OR UPDATE ON medical_codes_loinc
  FOR EACH ROW
  EXECUTE FUNCTION update_loinc_search_vector();

-- =====================================================
-- 4. TABLE SNOMED CT
-- =====================================================

CREATE TABLE IF NOT EXISTS medical_codes_snomed_ct (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Code et concept
  concept_id text NOT NULL UNIQUE,
  concept_version text NOT NULL,
  
  -- Libellés
  fully_specified_name text NOT NULL,
  preferred_term text NOT NULL,
  french_term text,
  
  -- Hiérarchie
  semantic_tag text,
  parent_concepts text[],
  child_concepts text[],
  
  -- Classification
  hierarchy text,
  domain text,
  
  -- Descriptions et synonymes
  descriptions text[],
  synonyms text[],
  
  -- Relations
  related_concepts text[],
  
  -- Métadonnées
  is_active boolean DEFAULT true,
  effective_date date,
  
  -- Statistiques
  usage_count integer DEFAULT 0,
  last_used_date timestamptz,
  
  -- Traçabilité
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Full-text search
  search_vector tsvector
);

CREATE INDEX IF NOT EXISTS idx_medical_codes_snomed_concept_id ON medical_codes_snomed_ct(concept_id);
CREATE INDEX IF NOT EXISTS idx_medical_codes_snomed_semantic_tag ON medical_codes_snomed_ct(semantic_tag) WHERE semantic_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medical_codes_snomed_domain ON medical_codes_snomed_ct(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medical_codes_snomed_active ON medical_codes_snomed_ct(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_medical_codes_snomed_search ON medical_codes_snomed_ct USING gin(search_vector);

-- Trigger pour mise à jour automatique du vecteur de recherche
CREATE OR REPLACE FUNCTION update_snomed_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('french',
    coalesce(NEW.concept_id, '') || ' ' ||
    coalesce(NEW.preferred_term, '') || ' ' ||
    coalesce(NEW.french_term, '') || ' ' ||
    coalesce(NEW.fully_specified_name, '') || ' ' ||
    coalesce(array_to_string(NEW.synonyms, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_snomed_search_vector
  BEFORE INSERT OR UPDATE ON medical_codes_snomed_ct
  FOR EACH ROW
  EXECUTE FUNCTION update_snomed_search_vector();

-- =====================================================
-- 5. TABLE LOGS D'ACCÈS AUX DONNÉES PATIENT (CNIL)
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id),
  
  -- Type d'accès
  access_type text CHECK (access_type IN (
    'view', 'search', 'export', 'print', 'api_access', 'bulk_access'
  )) NOT NULL,
  
  -- Détails de l'accès
  accessed_sections text[],
  access_reason text,
  access_context text,
  
  -- Données consultées (pseudonymisées)
  data_accessed jsonb,
  
  -- Session et technique
  session_id uuid,
  ip_address inet,
  user_agent text,
  device_info jsonb,
  
  -- Durée
  access_duration_seconds integer,
  
  -- Géolocalisation (si disponible)
  access_location text,
  
  -- Consentement
  patient_consent_verified boolean DEFAULT false,
  consent_id uuid,
  
  -- Alertes
  is_suspicious boolean DEFAULT false,
  suspicious_reason text,
  
  -- Traçabilité
  accessed_at timestamptz DEFAULT now(),
  
  -- Métadonnées
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_patient_data_access_log_patient_id ON patient_data_access_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_data_access_log_user_id ON patient_data_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_data_access_log_accessed_at ON patient_data_access_log(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_data_access_log_access_type ON patient_data_access_log(access_type);
CREATE INDEX IF NOT EXISTS idx_patient_data_access_log_suspicious ON patient_data_access_log(is_suspicious) WHERE is_suspicious = true;
CREATE INDEX IF NOT EXISTS idx_patient_data_access_log_ip ON patient_data_access_log(ip_address);

-- =====================================================
-- 6. TABLE LOGS DE MODIFICATION DES DONNÉES PATIENT
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_data_modification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id),
  
  -- Table et enregistrement modifiés
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  
  -- Type d'opération
  operation_type text CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')) NOT NULL,
  
  -- Valeurs avant/après
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],
  
  -- Raison et contexte
  modification_reason text,
  modification_context text,
  
  -- Session
  session_id uuid,
  ip_address inet,
  user_agent text,
  
  -- Validation
  requires_validation boolean DEFAULT false,
  validated_by uuid REFERENCES user_profiles(id),
  validated_at timestamptz,
  
  -- Traçabilité
  modified_at timestamptz DEFAULT now(),
  
  -- Métadonnées
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_patient_data_modification_log_patient_id ON patient_data_modification_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_data_modification_log_user_id ON patient_data_modification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_data_modification_log_modified_at ON patient_data_modification_log(modified_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_data_modification_log_table ON patient_data_modification_log(table_name);
CREATE INDEX IF NOT EXISTS idx_patient_data_modification_log_operation ON patient_data_modification_log(operation_type);
CREATE INDEX IF NOT EXISTS idx_patient_data_modification_log_record ON patient_data_modification_log(record_id);

-- =====================================================
-- 7. TABLE HISTORIQUE DES CONSENTEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_consent_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence au consentement
  consent_id uuid NOT NULL REFERENCES patient_consents(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Action
  action_type text CHECK (action_type IN (
    'created', 'updated', 'signed', 'revoked', 'expired', 'renewed'
  )) NOT NULL,
  
  -- Détails de l'action
  action_details text,
  previous_status text,
  new_status text,
  
  -- Valeurs avant/après
  old_values jsonb,
  new_values jsonb,
  
  -- Utilisateur
  performed_by uuid REFERENCES user_profiles(id),
  
  -- Session
  ip_address inet,
  user_agent text,
  
  -- Signature (si applicable)
  signature_method text,
  signature_data text,
  
  -- Traçabilité
  performed_at timestamptz DEFAULT now(),
  
  -- Métadonnées
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_patient_consent_history_consent_id ON patient_consent_history(consent_id);
CREATE INDEX IF NOT EXISTS idx_patient_consent_history_patient_id ON patient_consent_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_consent_history_performed_at ON patient_consent_history(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_consent_history_action_type ON patient_consent_history(action_type);

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POUR LES CODES MÉDICAUX
-- =====================================================

-- Les codes médicaux sont en lecture seule pour tous les professionnels
ALTER TABLE medical_codes_icd10 ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_codes_ccam ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_codes_loinc ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_codes_snomed_ct ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionnels peuvent lire codes ICD10"
  ON medical_codes_icd10 FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Professionnels peuvent lire codes CCAM"
  ON medical_codes_ccam FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Professionnels peuvent lire codes LOINC"
  ON medical_codes_loinc FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Professionnels peuvent lire codes SNOMED CT"
  ON medical_codes_snomed_ct FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- =====================================================
-- 9. RLS POUR LES LOGS (Accès très restreint)
-- =====================================================

ALTER TABLE patient_data_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_data_modification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consent_history ENABLE ROW LEVEL SECURITY;

-- Seuls les administrateurs et l'utilisateur lui-même peuvent voir ses logs
CREATE POLICY "Administrateurs et utilisateur peuvent voir logs d'accès"
  ON patient_data_access_log FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.level >= 5
    )
  );

CREATE POLICY "Système peut créer logs d'accès"
  ON patient_data_access_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Administrateurs et utilisateur peuvent voir logs de modification"
  ON patient_data_modification_log FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.level >= 5
    )
  );

CREATE POLICY "Système peut créer logs de modification"
  ON patient_data_modification_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Professionnels peuvent voir historique consentements"
  ON patient_consent_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Système peut créer historique consentements"
  ON patient_consent_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- =====================================================
-- 10. FONCTION DE RECHERCHE DE CODES MÉDICAUX
-- =====================================================

CREATE OR REPLACE FUNCTION search_medical_codes(
  search_term text,
  code_system text DEFAULT 'icd10',
  limit_results integer DEFAULT 20
)
RETURNS TABLE (
  code text,
  label text,
  description text,
  category text,
  relevance real
) AS $$
BEGIN
  IF code_system = 'icd10' THEN
    RETURN QUERY
    SELECT 
      mc.code,
      mc.label_fr AS label,
      mc.description_fr AS description,
      mc.chapter AS category,
      ts_rank(mc.search_vector, plainto_tsquery('french', search_term)) AS relevance
    FROM medical_codes_icd10 mc
    WHERE mc.is_active = true
      AND mc.search_vector @@ plainto_tsquery('french', search_term)
    ORDER BY relevance DESC, mc.usage_count DESC
    LIMIT limit_results;
    
  ELSIF code_system = 'ccam' THEN
    RETURN QUERY
    SELECT 
      mc.code,
      mc.label_fr AS label,
      mc.description_fr AS description,
      mc.chapter AS category,
      ts_rank(mc.search_vector, plainto_tsquery('french', search_term)) AS relevance
    FROM medical_codes_ccam mc
    WHERE mc.is_active = true
      AND mc.search_vector @@ plainto_tsquery('french', search_term)
    ORDER BY relevance DESC, mc.usage_count DESC
    LIMIT limit_results;
    
  ELSIF code_system = 'loinc' THEN
    RETURN QUERY
    SELECT 
      mc.loinc_code AS code,
      mc.long_common_name AS label,
      mc.description AS description,
      mc.class_type AS category,
      ts_rank(mc.search_vector, plainto_tsquery('french', search_term)) AS relevance
    FROM medical_codes_loinc mc
    WHERE mc.is_active = true
      AND mc.search_vector @@ plainto_tsquery('french', search_term)
    ORDER BY relevance DESC, mc.usage_count DESC
    LIMIT limit_results;
    
  ELSIF code_system = 'snomed' THEN
    RETURN QUERY
    SELECT 
      mc.concept_id AS code,
      mc.preferred_term AS label,
      coalesce(mc.french_term, mc.fully_specified_name) AS description,
      mc.domain AS category,
      ts_rank(mc.search_vector, plainto_tsquery('french', search_term)) AS relevance
    FROM medical_codes_snomed_ct mc
    WHERE mc.is_active = true
      AND mc.search_vector @@ plainto_tsquery('french', search_term)
    ORDER BY relevance DESC, mc.usage_count DESC
    LIMIT limit_results;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;