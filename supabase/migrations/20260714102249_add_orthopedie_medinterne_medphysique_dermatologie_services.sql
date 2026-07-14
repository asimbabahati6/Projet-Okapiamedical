/*
# Ajout de 4 nouveaux services specialises

1. Nouveaux departements (si absents)
   - Orthopédie
   - Médecine Physique
   - Dermatologie
   - (Médecine interne existe deja)

2. Nouveaux services dans la table services
   - Orthopédie (categorie: Consultation spécialisée)
   - Médecine Interne (categorie: Consultation spécialisée)
   - Médecine Physique (categorie: Consultation spécialisée)
   - Dermatologie (categorie: Consultation spécialisée)

3. Notes
   - Idempotent : verifie l'existence avant insertion
   - category_id = '1344d504-d446-418b-a449-18d3d5e94801' (Consultation spécialisée)
*/

-- Departements manquants
INSERT INTO departments (id, name, description, is_active, is_public)
SELECT gen_random_uuid(), 'Orthopédie',
       'Service d''orthopédie – prise en charge des pathologies de l''appareil locomoteur',
       true, true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Orthopédie');

INSERT INTO departments (id, name, description, is_active, is_public)
SELECT gen_random_uuid(), 'Médecine Physique',
       'Service de médecine physique et de réadaptation fonctionnelle',
       true, true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Médecine Physique');

INSERT INTO departments (id, name, description, is_active, is_public)
SELECT gen_random_uuid(), 'Dermatologie',
       'Service de dermatologie – diagnostic et traitement des maladies de la peau',
       true, true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Dermatologie');

-- Services
INSERT INTO services (name, name_en, name_ar, description, description_en, category_id, department_id, is_active, is_featured, estimated_duration_minutes, telemedicine_available)
SELECT
  'Orthopédie',
  'Orthopedics',
  '',
  'Consultation et prise en charge des troubles musculo-squelettiques, fractures, prothèses articulaires et traumatismes sportifs.',
  'Consultation and management of musculoskeletal disorders, fractures, joint prostheses and sports injuries.',
  '1344d504-d446-418b-a449-18d3d5e94801',
  d.id,
  true, true, 30, false
FROM departments d WHERE d.name = 'Orthopédie'
AND NOT EXISTS (SELECT 1 FROM services WHERE name = 'Orthopédie');

INSERT INTO services (name, name_en, name_ar, description, description_en, category_id, department_id, is_active, is_featured, estimated_duration_minutes, telemedicine_available)
SELECT
  'Médecine Interne',
  'Internal Medicine',
  '',
  'Diagnostic et traitement des pathologies complexes de l''adulte, maladies systémiques et polypathologies.',
  'Diagnosis and treatment of complex adult pathologies, systemic diseases and multi-organ conditions.',
  '1344d504-d446-418b-a449-18d3d5e94801',
  d.id,
  true, true, 45, true
FROM departments d WHERE d.name = 'Médecine interne'
AND NOT EXISTS (SELECT 1 FROM services WHERE name = 'Médecine Interne');

INSERT INTO services (name, name_en, name_ar, description, description_en, category_id, department_id, is_active, is_featured, estimated_duration_minutes, telemedicine_available)
SELECT
  'Médecine Physique',
  'Physical Medicine',
  '',
  'Rééducation et réadaptation fonctionnelle, traitement de la douleur chronique et récupération post-opératoire.',
  'Rehabilitation and functional recovery, chronic pain management and post-operative recovery.',
  '1344d504-d446-418b-a449-18d3d5e94801',
  d.id,
  true, true, 45, false
FROM departments d WHERE d.name = 'Médecine Physique'
AND NOT EXISTS (SELECT 1 FROM services WHERE name = 'Médecine Physique');

INSERT INTO services (name, name_en, name_ar, description, description_en, category_id, department_id, is_active, is_featured, estimated_duration_minutes, telemedicine_available)
SELECT
  'Dermatologie',
  'Dermatology',
  '',
  'Diagnostic et traitement des maladies de la peau, des ongles et des muqueuses. Dermatologie esthétique et chirurgicale.',
  'Diagnosis and treatment of skin, nail and mucous membrane diseases. Aesthetic and surgical dermatology.',
  '1344d504-d446-418b-a449-18d3d5e94801',
  d.id,
  true, true, 30, true
FROM departments d WHERE d.name = 'Dermatologie'
AND NOT EXISTS (SELECT 1 FROM services WHERE name = 'Dermatologie');
