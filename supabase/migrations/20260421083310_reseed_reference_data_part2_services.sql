/*
  # Re-seed Reference Data — Part 2
  # Service Categories and Services

  Restores the 8 service categories and 21 services used by the public-facing
  website and appointment booking system.
*/

-- ─── 1. Service Categories ────────────────────────────────────────────────────
INSERT INTO service_categories (name, name_en, name_ar, icon, display_order)
SELECT 'Consultation générale', 'General Consultation', 'استشارة عامة', 'Stethoscope', 1
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Consultation générale');

INSERT INTO service_categories (name, name_en, name_ar, icon, display_order)
SELECT 'Radiologie diagnostique', 'Diagnostic Radiology', 'الأشعة التشخيصية', 'Scan', 2
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Radiologie diagnostique');

INSERT INTO service_categories (name, name_en, name_ar, icon, display_order)
SELECT 'Consultation spécialisée', 'Specialized Consultation', 'استشارة متخصصة', 'UserCheck', 3
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Consultation spécialisée');

INSERT INTO service_categories (name, name_en, name_ar, icon, display_order)
SELECT 'Radiologie interventionnelle', 'Interventional Radiology', 'الأشعة التداخلية', 'Activity', 4
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Radiologie interventionnelle');

INSERT INTO service_categories (name, name_en, name_ar, icon, display_order)
SELECT 'Dentisterie', 'Dentistry', 'طب الأسنان', 'Smile', 5
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Dentisterie');

INSERT INTO service_categories (name, name_en, name_ar, icon, display_order)
SELECT 'Laboratoire médical', 'Medical Laboratory', 'المختبر الطبي', 'TestTube', 6
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Laboratoire médical');

INSERT INTO service_categories (name, name_en, name_ar, icon, display_order)
SELECT 'Explorations médicales', 'Medical Explorations', 'الفحوصات الطبية', 'Search', 7
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Explorations médicales');

INSERT INTO service_categories (name, name_en, name_ar, icon, display_order)
SELECT 'Kinésithérapie', 'Physiotherapy', 'العلاج الطبيعي', 'Dumbbell', 8
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Kinésithérapie');

-- ─── 2. Services ──────────────────────────────────────────────────────────────
-- Consultation générale
INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Consultation générale', 'General Consultation', 'استشارة عامة',
       (SELECT id FROM service_categories WHERE name = 'Consultation générale' LIMIT 1),
       true, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Consultation générale');

-- Radiologie diagnostique services
INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Radiographie', 'Radiography', 'الأشعة السينية',
       (SELECT id FROM service_categories WHERE name = 'Radiologie diagnostique' LIMIT 1),
       true, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Radiographie');

INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Échographie', 'Ultrasound', 'الموجات فوق الصوتية',
       (SELECT id FROM service_categories WHERE name = 'Radiologie diagnostique' LIMIT 1),
       true, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Échographie');

INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Scanner', 'CT Scanner', 'الأشعة المقطعية',
       (SELECT id FROM service_categories WHERE name = 'Radiologie diagnostique' LIMIT 1),
       true, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Scanner');

-- Consultation spécialisée
INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Consultation spécialisée', 'Specialized Consultation', 'استشارة متخصصة',
       (SELECT id FROM service_categories WHERE name = 'Consultation spécialisée' LIMIT 1),
       true, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Consultation spécialisée');

-- Radiologie interventionnelle
INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Biopsie guidée', 'Guided Biopsy', 'خزعة موجهة',
       (SELECT id FROM service_categories WHERE name = 'Radiologie interventionnelle' LIMIT 1),
       false, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Biopsie guidée');

INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Embolisation', 'Embolization', 'الانصمام',
       (SELECT id FROM service_categories WHERE name = 'Radiologie interventionnelle' LIMIT 1),
       false, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Embolisation');

INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Drainage', 'Drainage', 'الصرف',
       (SELECT id FROM service_categories WHERE name = 'Radiologie interventionnelle' LIMIT 1),
       false, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Drainage');

INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Traitement des varices', 'Varicose Vein Treatment', 'علاج الدوالي',
       (SELECT id FROM service_categories WHERE name = 'Radiologie interventionnelle' LIMIT 1),
       false, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Traitement des varices');

-- Dentisterie
INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Soins dentaires', 'Dental Care', 'رعاية الأسنان',
       (SELECT id FROM service_categories WHERE name = 'Dentisterie' LIMIT 1),
       true, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Soins dentaires');

-- Laboratoire médical
INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Hématologie', 'Hematology', 'أمراض الدم',
       (SELECT id FROM service_categories WHERE name = 'Laboratoire médical' LIMIT 1),
       false, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Hématologie');

INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Biochimie', 'Biochemistry', 'الكيمياء الحيوية',
       (SELECT id FROM service_categories WHERE name = 'Laboratoire médical' LIMIT 1),
       false, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Biochimie');

INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Immunologie', 'Immunology', 'المناعة',
       (SELECT id FROM service_categories WHERE name = 'Laboratoire médical' LIMIT 1),
       false, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Immunologie');

INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Bactériologie', 'Bacteriology', 'علم الجراثيم',
       (SELECT id FROM service_categories WHERE name = 'Laboratoire médical' LIMIT 1),
       false, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Bactériologie');

INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Parasitologie', 'Parasitology', 'علم الطفيليات',
       (SELECT id FROM service_categories WHERE name = 'Laboratoire médical' LIMIT 1),
       false, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Parasitologie');

-- Explorations médicales
INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Endoscopie digestive', 'Digestive Endoscopy', 'التنظير الهضمي',
       (SELECT id FROM service_categories WHERE name = 'Explorations médicales' LIMIT 1),
       false, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Endoscopie digestive');

INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Endoscopie bronchique', 'Bronchial Endoscopy', 'التنظير القصبي',
       (SELECT id FROM service_categories WHERE name = 'Explorations médicales' LIMIT 1),
       false, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Endoscopie bronchique');

INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Explorations cardiaques', 'Cardiac Explorations', 'الفحوصات القلبية',
       (SELECT id FROM service_categories WHERE name = 'Explorations médicales' LIMIT 1),
       false, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Explorations cardiaques');

INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'EEG', 'EEG', 'تخطيط الدماغ',
       (SELECT id FROM service_categories WHERE name = 'Explorations médicales' LIMIT 1),
       false, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'EEG');

-- Kinésithérapie
INSERT INTO services (name, name_en, name_ar, category_id, is_featured, is_active)
SELECT 'Kinésithérapie', 'Physiotherapy', 'العلاج الطبيعي',
       (SELECT id FROM service_categories WHERE name = 'Kinésithérapie' LIMIT 1),
       true, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Kinésithérapie');
