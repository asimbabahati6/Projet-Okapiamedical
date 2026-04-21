/*
  # Re-seed Reference Data — Part 1
  # Departments, Medical Specialties, Languages, Insurance Providers

  Restores static lookup data after a full data wipe.
  Uses safe idempotent patterns (ON CONFLICT or WHERE NOT EXISTS).
*/

-- ─── 1. Departments ──────────────────────────────────────────────────────────
-- No unique constraint on name, so use WHERE NOT EXISTS
INSERT INTO departments (name, description, is_public, is_active)
SELECT 'Administration', 'Centralized administrative support including HR, Finance, Operations, and IT', false, true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Administration');

INSERT INTO departments (name, description, is_public, is_active)
SELECT 'Logistique', 'Gestion logistique et approvisionnements', false, true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Logistique');

INSERT INTO departments (name, description, is_public, is_active)
SELECT 'Dentisterie', 'Soins dentaires et santé bucco-dentaire', true, true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Dentisterie');

INSERT INTO departments (name, description, is_public, is_active)
SELECT 'Kinésithérapie', 'Kinésithérapie et rééducation fonctionnelle', true, true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Kinésithérapie');

-- ─── 2. Medical Specialties ───────────────────────────────────────────────────
INSERT INTO medical_specialties (code_cnom, name_fr, name_en, name_ar, category, average_consultation_duration) VALUES
  ('MG',      'Médecine Générale',          'General Medicine',        'الطب العام',                   'Généraliste',            30),
  ('CARD',    'Cardiologie',                'Cardiology',              'أمراض القلب',                  'Spécialité Médicale',    45),
  ('DERM',    'Dermatologie',               'Dermatology',             'الأمراض الجلدية',              'Spécialité Médicale',    30),
  ('ENDO',    'Endocrinologie',             'Endocrinology',           'الغدد الصماء',                 'Spécialité Médicale',    45),
  ('GASTRO',  'Gastro-entérologie',         'Gastroenterology',        'أمراض الجهاز الهضمي',         'Spécialité Médicale',    45),
  ('GYNECO',  'Gynécologie-Obstétrique',    'Gynecology-Obstetrics',   'أمراض النساء والتوليد',        'Spécialité Médicale',    45),
  ('NEURO',   'Neurologie',                 'Neurology',               'طب الأعصاب',                   'Spécialité Médicale',    45),
  ('PNEUMO',  'Pneumologie',                'Pulmonology',             'أمراض الرئة',                  'Spécialité Médicale',    45),
  ('PEDIA',   'Pédiatrie',                  'Pediatrics',              'طب الأطفال',                   'Spécialité Médicale',    30),
  ('ORTHO',   'Orthopédie',                 'Orthopedics',             'جراحة العظام',                 'Spécialité Chirurgicale', 45),
  ('OPHTALMO','Ophtalmologie',              'Ophthalmology',           'طب العيون',                    'Spécialité Médicale',    30),
  ('ORL',     'Oto-Rhino-Laryngologie',     'ENT',                     'الأنف والأذن والحنجرة',        'Spécialité Chirurgicale', 30),
  ('RADIO',   'Radiologie',                 'Radiology',               'الأشعة',                       'Spécialité Technique',   30),
  ('ANES',    'Anesthésie-Réanimation',     'Anesthesiology',          'التخدير والإنعاش',             'Spécialité Chirurgicale', 60),
  ('PSY',     'Psychiatrie',                'Psychiatry',              'الطب النفسي',                  'Spécialité Médicale',    60),
  ('URO',     'Urologie',                   'Urology',                 'المسالك البولية',              'Spécialité Chirurgicale', 45),
  ('DENT',    'Dentisterie',                'Dentistry',               'طب الأسنان',                   'Dentaire',               30),
  ('KINE',    'Kinésithérapie',             'Physiotherapy',           'العلاج الطبيعي',               'Paramédical',            45)
ON CONFLICT (code_cnom) DO NOTHING;

-- ─── 3. Languages ─────────────────────────────────────────────────────────────
INSERT INTO languages (iso_code_639_1, name_fr, name_en, name_ar, is_medical_terminology_available) VALUES
  ('fr', 'Français',   'French',     'الفرنسية',    true),
  ('en', 'Anglais',    'English',    'الإنجليزية',  true),
  ('ar', 'Arabe',      'Arabic',     'العربية',      true),
  ('es', 'Espagnol',   'Spanish',    'الإسبانية',   true),
  ('pt', 'Portugais',  'Portuguese', 'البرتغالية',  true),
  ('sw', 'Swahili',    'Swahili',    'السواحيلية',  false),
  ('ln', 'Lingala',    'Lingala',    'اللينغالا',   false)
ON CONFLICT (iso_code_639_1) DO NOTHING;

-- ─── 4. Insurance Providers ───────────────────────────────────────────────────
INSERT INTO insurance_providers (name, code, type, tiers_payant_available, electronic_billing_enabled) VALUES
  ('Sécurité Sociale',    'SS',     'securite_sociale', true,  true),
  ('CMU Complémentaire',  'CMU',    'cmu',              true,  true),
  ('AME',                 'AME',    'ame',              false, false),
  ('Mutuelle Générale',   'MG001',  'mutuelle',         true,  true),
  ('Assurance Santé Plus','ASP001', 'assurance_privee', true,  true)
ON CONFLICT (code) DO NOTHING;
