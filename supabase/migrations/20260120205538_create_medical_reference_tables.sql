/*
  # Create Medical Reference Tables
  
  1. New Tables
    - `medical_specialties`
      - Complete catalog of medical specialties with multilingual support
      - Hierarchical structure for specialties and sub-specialties
    
    - `medical_certifications`
      - Catalog of recognized medical certifications and diplomas
      - DES, DIU, capacities, masters, etc.
    
    - `languages`
      - Standardized language reference using ISO codes
      - Medical terminology availability tracking
    
    - `insurance_providers`
      - Complete list of health insurance companies
      - Support for electronic billing and tiers payant
    
    - `medical_acts_categories`
      - Classification of medical acts
      - Hierarchical structure for organization
  
  2. Security
    - Enable RLS on all tables
    - Public read access for reference data
    - Only admins can modify reference data
*/

-- Medical Specialties Table
CREATE TABLE IF NOT EXISTS medical_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_cnom text UNIQUE NOT NULL,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  name_ar text,
  category text NOT NULL,
  parent_specialty_id uuid REFERENCES medical_specialties(id),
  requires_specific_license boolean DEFAULT false,
  average_consultation_duration integer DEFAULT 30,
  description text,
  icon_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Medical Certifications Table
CREATE TABLE IF NOT EXISTS medical_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_type text NOT NULL CHECK (certification_type IN ('DES', 'DIU', 'capacite', 'master', 'doctorat', 'autre')),
  name text NOT NULL,
  issuing_authority text NOT NULL,
  duration_years integer,
  renewal_required boolean DEFAULT false,
  renewal_frequency_years integer,
  specialties_concerned text[],
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Languages Reference Table
CREATE TABLE IF NOT EXISTS languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_code_639_1 text UNIQUE NOT NULL,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  name_ar text,
  is_medical_terminology_available boolean DEFAULT false,
  interpreter_available boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Insurance Providers Table
CREATE TABLE IF NOT EXISTS insurance_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('mutuelle', 'assurance_privee', 'cmu', 'ame', 'securite_sociale')),
  logo_url text,
  contact_email text,
  contact_phone text,
  tiers_payant_available boolean DEFAULT false,
  electronic_billing_enabled boolean DEFAULT false,
  api_endpoint text,
  contract_types text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Medical Acts Categories Table
CREATE TABLE IF NOT EXISTS medical_acts_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  parent_category_id uuid REFERENCES medical_acts_categories(id),
  requires_specialist boolean DEFAULT false,
  ambulatory_possible boolean DEFAULT true,
  requires_hospitalization boolean DEFAULT false,
  average_duration_minutes integer DEFAULT 30,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE medical_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_acts_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public can read reference data
CREATE POLICY "Anyone can read active medical specialties"
  ON medical_specialties FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can read active certifications"
  ON medical_certifications FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can read active languages"
  ON languages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can read active insurance providers"
  ON insurance_providers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can read active acts categories"
  ON medical_acts_categories FOR SELECT
  USING (is_active = true);

-- Only admins can insert/update reference data
CREATE POLICY "Only admins can insert medical specialties"
  ON medical_specialties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

CREATE POLICY "Only admins can update medical specialties"
  ON medical_specialties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      JOIN roles ON user_profiles.role_id = roles.id
      WHERE user_profiles.id = auth.uid()
      AND roles.name IN ('super_admin', 'hospital_admin')
    )
  );

-- Insert sample medical specialties
INSERT INTO medical_specialties (code_cnom, name_fr, name_en, name_ar, category, average_consultation_duration) VALUES
  ('MG', 'Médecine Générale', 'General Medicine', 'الطب العام', 'Généraliste', 30),
  ('CARD', 'Cardiologie', 'Cardiology', 'أمراض القلب', 'Spécialité Médicale', 45),
  ('DERM', 'Dermatologie', 'Dermatology', 'الأمراض الجلدية', 'Spécialité Médicale', 30),
  ('ENDO', 'Endocrinologie', 'Endocrinology', 'الغدد الصماء', 'Spécialité Médicale', 45),
  ('GASTRO', 'Gastro-entérologie', 'Gastroenterology', 'أمراض الجهاز الهضمي', 'Spécialité Médicale', 45),
  ('GYNECO', 'Gynécologie-Obstétrique', 'Gynecology-Obstetrics', 'أمراض النساء والتوليد', 'Spécialité Médicale', 45),
  ('NEURO', 'Neurologie', 'Neurology', 'طب الأعصاب', 'Spécialité Médicale', 45),
  ('PNEUMO', 'Pneumologie', 'Pulmonology', 'أمراض الرئة', 'Spécialité Médicale', 45),
  ('PEDIA', 'Pédiatrie', 'Pediatrics', 'طب الأطفال', 'Spécialité Médicale', 30),
  ('ORTHO', 'Orthopédie', 'Orthopedics', 'جراحة العظام', 'Spécialité Chirurgicale', 45),
  ('OPHTALMO', 'Ophtalmologie', 'Ophthalmology', 'طب العيون', 'Spécialité Médicale', 30),
  ('ORL', 'Oto-Rhino-Laryngologie', 'ENT', 'الأنف والأذن والحنجرة', 'Spécialité Chirurgicale', 30),
  ('RADIO', 'Radiologie', 'Radiology', 'الأشعة', 'Spécialité Technique', 30),
  ('ANES', 'Anesthésie-Réanimation', 'Anesthesiology', 'التخدير والإنعاش', 'Spécialité Chirurgicale', 60),
  ('PSY', 'Psychiatrie', 'Psychiatry', 'الطب النفسي', 'Spécialité Médicale', 60),
  ('URO', 'Urologie', 'Urology', 'المسالك البولية', 'Spécialité Chirurgicale', 45),
  ('DENT', 'Dentisterie', 'Dentistry', 'طب الأسنان', 'Dentaire', 30),
  ('KINE', 'Kinésithérapie', 'Physiotherapy', 'العلاج الطبيعي', 'Paramédical', 45)
ON CONFLICT (code_cnom) DO NOTHING;

-- Insert sample languages
INSERT INTO languages (iso_code_639_1, name_fr, name_en, name_ar, is_medical_terminology_available) VALUES
  ('fr', 'Français', 'French', 'الفرنسية', true),
  ('en', 'Anglais', 'English', 'الإنجليزية', true),
  ('ar', 'Arabe', 'Arabic', 'العربية', true),
  ('es', 'Espagnol', 'Spanish', 'الإسبانية', true),
  ('pt', 'Portugais', 'Portuguese', 'البرتغالية', true),
  ('sw', 'Swahili', 'Swahili', 'السواحيلية', false),
  ('ln', 'Lingala', 'Lingala', 'اللينغالا', false)
ON CONFLICT (iso_code_639_1) DO NOTHING;

-- Insert sample insurance providers
INSERT INTO insurance_providers (name, code, type, tiers_payant_available, electronic_billing_enabled) VALUES
  ('Sécurité Sociale', 'SS', 'securite_sociale', true, true),
  ('CMU Complémentaire', 'CMU', 'cmu', true, true),
  ('AME', 'AME', 'ame', false, false),
  ('Mutuelle Générale', 'MG001', 'mutuelle', true, true),
  ('Assurance Santé Plus', 'ASP001', 'assurance_privee', true, true)
ON CONFLICT (code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_specialties_code ON medical_specialties(code_cnom);
CREATE INDEX IF NOT EXISTS idx_specialties_category ON medical_specialties(category);
CREATE INDEX IF NOT EXISTS idx_specialties_parent ON medical_specialties(parent_specialty_id);
CREATE INDEX IF NOT EXISTS idx_certifications_type ON medical_certifications(certification_type);
CREATE INDEX IF NOT EXISTS idx_languages_iso ON languages(iso_code_639_1);
CREATE INDEX IF NOT EXISTS idx_insurance_code ON insurance_providers(code);
CREATE INDEX IF NOT EXISTS idx_insurance_type ON insurance_providers(type);
CREATE INDEX IF NOT EXISTS idx_acts_categories_code ON medical_acts_categories(code);
