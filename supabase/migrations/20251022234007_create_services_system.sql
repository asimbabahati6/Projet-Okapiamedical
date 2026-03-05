/*
  # Create Hospital Services System

  This migration creates a comprehensive services management system for the hospital,
  replacing the basic hardcoded services with a flexible, database-driven solution.

  ## New Tables

  ### `service_categories`
  Organizes services into logical groups (e.g., Radiology, Laboratory, etc.)
  - `id` (uuid, primary key)
  - `name` (text) - Category name
  - `name_en` (text) - English name
  - `name_ar` (text) - Arabic name
  - `description` (text, nullable) - Category description
  - `icon` (text, nullable) - Lucide icon name
  - `display_order` (integer) - Sort order for display
  - `is_active` (boolean) - Whether category is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `services`
  Individual medical services offered by the hospital
  - `id` (uuid, primary key)
  - `category_id` (uuid, foreign key) - Reference to service_categories
  - `name` (text) - Service name in French (primary)
  - `name_en` (text) - English name
  - `name_ar` (text) - Arabic name
  - `description` (text, nullable) - Service description
  - `icon` (text, nullable) - Lucide icon name
  - `is_featured` (boolean) - Show on home page
  - `display_order` (integer) - Sort order within category
  - `is_active` (boolean) - Whether service is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on both tables
  - Public read access for active services (for public website)
  - Authenticated staff can manage services (insert, update, delete)

  ## Initial Data
  Populates the tables with the comprehensive service list including:
  1. Consultation générale
  2. Radiologie diagnostique (Radiographie, Échographie, Scanner)
  3. Consultation spécialisée
  4. Radiologie interventionnelle (Biopsie, Embolisation, Drainage, Traitement des varices)
  5. Dentisterie
  6. Laboratoire médical (Hématologie, Biochimie, Immunologie, Bactériologie, Parasitologie)
  7. Explorations médicales (Endoscopie digestive, Endoscopie bronchique, Explorations cardiaques, EEG)
  8. Kinésithérapie
*/

-- Create service_categories table
CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description text,
  icon text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES service_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description text,
  icon text,
  is_featured boolean DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_categories
CREATE POLICY "Anyone can view active service categories"
  ON service_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated staff can insert service categories"
  ON service_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Authenticated staff can update service categories"
  ON service_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Authenticated staff can delete service categories"
  ON service_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- RLS Policies for services
CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated staff can insert services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Authenticated staff can update services"
  ON services FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

CREATE POLICY "Authenticated staff can delete services"
  ON services FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Insert service categories
INSERT INTO service_categories (name, name_en, name_ar, icon, display_order) VALUES
  ('Consultation générale', 'General Consultation', 'استشارة عامة', 'Stethoscope', 1),
  ('Radiologie diagnostique', 'Diagnostic Radiology', 'الأشعة التشخيصية', 'Scan', 2),
  ('Consultation spécialisée', 'Specialized Consultation', 'استشارة متخصصة', 'UserCheck', 3),
  ('Radiologie interventionnelle', 'Interventional Radiology', 'الأشعة التداخلية', 'Activity', 4),
  ('Dentisterie', 'Dentistry', 'طب الأسنان', 'Smile', 5),
  ('Laboratoire médical', 'Medical Laboratory', 'المختبر الطبي', 'TestTube', 6),
  ('Explorations médicales', 'Medical Explorations', 'الفحوصات الطبية', 'Search', 7),
  ('Kinésithérapie', 'Physiotherapy', 'العلاج الطبيعي', 'Dumbbell', 8);

-- Insert services for each category
-- Consultation générale
INSERT INTO services (category_id, name, name_en, name_ar, is_featured, display_order)
SELECT id, 'Consultation générale', 'General Consultation', 'استشارة عامة', true, 1
FROM service_categories WHERE name = 'Consultation générale';

-- Radiologie diagnostique
INSERT INTO services (category_id, name, name_en, name_ar, is_featured, display_order)
SELECT id, 'Radiographie', 'Radiography', 'التصوير بالأشعة السينية', true, 1
FROM service_categories WHERE name = 'Radiologie diagnostique';

INSERT INTO services (category_id, name, name_en, name_ar, is_featured, display_order)
SELECT id, 'Échographie', 'Ultrasound', 'الموجات فوق الصوتية', true, 2
FROM service_categories WHERE name = 'Radiologie diagnostique';

INSERT INTO services (category_id, name, name_en, name_ar, is_featured, display_order)
SELECT id, 'Scanner', 'CT Scanner', 'التصوير المقطعي', true, 3
FROM service_categories WHERE name = 'Radiologie diagnostique';

-- Consultation spécialisée
INSERT INTO services (category_id, name, name_en, name_ar, is_featured, display_order)
SELECT id, 'Consultation spécialisée', 'Specialized Consultation', 'استشارة متخصصة', true, 1
FROM service_categories WHERE name = 'Consultation spécialisée';

-- Radiologie interventionnelle
INSERT INTO services (category_id, name, name_en, name_ar, display_order)
SELECT id, 'Biopsie', 'Biopsy', 'خزعة', 1
FROM service_categories WHERE name = 'Radiologie interventionnelle';

INSERT INTO services (category_id, name, name_en, name_ar, display_order)
SELECT id, 'Embolisation', 'Embolization', 'الانصمام', 2
FROM service_categories WHERE name = 'Radiologie interventionnelle';

INSERT INTO services (category_id, name, name_en, name_ar, display_order)
SELECT id, 'Drainage', 'Drainage', 'تصريف', 3
FROM service_categories WHERE name = 'Radiologie interventionnelle';

INSERT INTO services (category_id, name, name_en, name_ar, display_order)
SELECT id, 'Traitement des varices', 'Varicose Vein Treatment', 'علاج الدوالي', 4
FROM service_categories WHERE name = 'Radiologie interventionnelle';

-- Dentisterie
INSERT INTO services (category_id, name, name_en, name_ar, is_featured, display_order)
SELECT id, 'Dentisterie', 'Dentistry', 'طب الأسنان', true, 1
FROM service_categories WHERE name = 'Dentisterie';

-- Laboratoire médical
INSERT INTO services (category_id, name, name_en, name_ar, display_order)
SELECT id, 'Hématologie', 'Hematology', 'أمراض الدم', 1
FROM service_categories WHERE name = 'Laboratoire médical';

INSERT INTO services (category_id, name, name_en, name_ar, display_order)
SELECT id, 'Biochimie', 'Biochemistry', 'الكيمياء الحيوية', 2
FROM service_categories WHERE name = 'Laboratoire médical';

INSERT INTO services (category_id, name, name_en, name_ar, display_order)
SELECT id, 'Immunologie', 'Immunology', 'علم المناعة', 3
FROM service_categories WHERE name = 'Laboratoire médical';

INSERT INTO services (category_id, name, name_en, name_ar, display_order)
SELECT id, 'Bactériologie', 'Bacteriology', 'علم البكتيريا', 4
FROM service_categories WHERE name = 'Laboratoire médical';

INSERT INTO services (category_id, name, name_en, name_ar, display_order)
SELECT id, 'Parasitologie', 'Parasitology', 'علم الطفيليات', 5
FROM service_categories WHERE name = 'Laboratoire médical';

-- Explorations médicales
INSERT INTO services (category_id, name, name_en, name_ar, display_order)
SELECT id, 'Endoscopie digestive', 'Digestive Endoscopy', 'التنظير الهضمي', 1
FROM service_categories WHERE name = 'Explorations médicales';

INSERT INTO services (category_id, name, name_en, name_ar, display_order)
SELECT id, 'Endoscopie bronchique', 'Bronchial Endoscopy', 'تنظير القصبات', 2
FROM service_categories WHERE name = 'Explorations médicales';

INSERT INTO services (category_id, name, name_en, name_ar, display_order)
SELECT id, 'Explorations cardiaques', 'Cardiac Explorations', 'الفحوصات القلبية', 3
FROM service_categories WHERE name = 'Explorations médicales';

INSERT INTO services (category_id, name, name_en, name_ar, display_order)
SELECT id, 'EEG', 'EEG', 'تخطيط كهربية الدماغ', 4
FROM service_categories WHERE name = 'Explorations médicales';

-- Kinésithérapie
INSERT INTO services (category_id, name, name_en, name_ar, is_featured, display_order)
SELECT id, 'Kinésithérapie', 'Physiotherapy', 'العلاج الطبيعي', true, 1
FROM service_categories WHERE name = 'Kinésithérapie';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_is_featured ON services(is_featured);
CREATE INDEX IF NOT EXISTS idx_service_categories_is_active ON service_categories(is_active);
