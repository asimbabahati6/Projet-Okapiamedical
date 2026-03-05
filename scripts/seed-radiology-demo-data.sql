-- Script de génération de données de démonstration pour le module Radiologie
-- À exécuter dans la console SQL Supabase

-- Insérer des examens radiologiques de démonstration avec différents statuts

-- Examen 1: Scanner thorax URGENT en attente
INSERT INTO radiology_exams (
  patient_id,
  prescribed_by,
  exam_type,
  modality,
  body_part,
  clinical_info,
  urgency_level,
  status,
  special_instructions,
  created_at
)
SELECT
  p.id,
  (SELECT id FROM user_profiles WHERE role = 'doctor' LIMIT 1),
  'ct_scan',
  'CT',
  'Thorax',
  'Patient présentant une douleur thoracique aiguë avec dyspnée. Suspicion de pneumonie ou embolie pulmonaire. À réaliser en urgence.',
  'urgent',
  'prescribed',
  'Avec injection de produit de contraste si possible',
  NOW() - INTERVAL '2 hours'
FROM patients p
WHERE p.patient_number LIKE 'P-2026-%'
LIMIT 1 OFFSET 0
ON CONFLICT DO NOTHING;

-- Examen 2: IRM cérébrale URGENCE en attente
INSERT INTO radiology_exams (
  patient_id,
  prescribed_by,
  exam_type,
  modality,
  body_part,
  clinical_info,
  urgency_level,
  status,
  special_instructions,
  created_at
)
SELECT
  p.id,
  (SELECT id FROM user_profiles WHERE role = 'doctor' LIMIT 1 OFFSET 1),
  'mri',
  'MR',
  'Cerveau',
  'AVC suspecté - déficit moteur hémicorps gauche depuis 1h. Glasgow 14/15. URGENCE absolue.',
  'emergency',
  'prescribed',
  'IRM avec séquence diffusion et FLAIR - PRIORITAIRE',
  NOW() - INTERVAL '45 minutes'
FROM patients p
WHERE p.patient_number LIKE 'P-2026-%'
LIMIT 1 OFFSET 1
ON CONFLICT DO NOTHING;

-- Examen 3: Radiographie membre inférieur en cours
INSERT INTO radiology_exams (
  patient_id,
  prescribed_by,
  exam_type,
  modality,
  body_part,
  clinical_info,
  urgency_level,
  status,
  special_instructions,
  created_at
)
SELECT
  p.id,
  (SELECT id FROM user_profiles WHERE role = 'doctor' LIMIT 1),
  'radiography',
  'CR',
  'Membre inférieur',
  'Traumatisme de la cheville droite suite à une chute. Douleur vive, impossibilité de mise en charge. Suspicion de fracture malléolaire.',
  'urgent',
  'in_progress',
  'Incidences de face et profil + incidence mortaise',
  NOW() - INTERVAL '3 hours'
FROM patients p
WHERE p.patient_number LIKE 'P-2026-%'
LIMIT 1 OFFSET 2
ON CONFLICT DO NOTHING;

-- Examen 4: Échographie abdominale routine en attente
INSERT INTO radiology_exams (
  patient_id,
  prescribed_by,
  exam_type,
  modality,
  body_part,
  clinical_info,
  urgency_level,
  status,
  special_instructions,
  created_at
)
SELECT
  p.id,
  (SELECT id FROM user_profiles WHERE role = 'doctor' LIMIT 1 OFFSET 2),
  'ultrasound',
  'US',
  'Abdomen',
  'Douleurs abdominales diffuses évoluant depuis 3 jours. Exploration de la vésicule biliaire et des voies biliaires. Bilan hépatique à interpréter.',
  'routine',
  'prescribed',
  'Patient à jeun depuis 8h',
  NOW() - INTERVAL '5 hours'
FROM patients p
WHERE p.patient_number LIKE 'P-2026-%'
LIMIT 1 OFFSET 3
ON CONFLICT DO NOTHING;

-- Examen 5: Radiographie colonne vertébrale routine
INSERT INTO radiology_exams (
  patient_id,
  prescribed_by,
  exam_type,
  modality,
  body_part,
  clinical_info,
  urgency_level,
  status,
  special_instructions,
  created_at
)
SELECT
  p.id,
  (SELECT id FROM user_profiles WHERE role = 'doctor' LIMIT 1 OFFSET 1),
  'radiography',
  'CR',
  'Colonne vertébrale',
  'Lombalgies chroniques avec irradiation sciatique L5. Recherche de hernie discale ou arthrose lombaire.',
  'routine',
  'prescribed',
  'Rachis lombaire de face et profil + incidence oblique',
  NOW() - INTERVAL '1 hour'
FROM patients p
WHERE p.patient_number LIKE 'P-2026-%'
LIMIT 1 OFFSET 4
ON CONFLICT DO NOTHING;

-- Examen 6: Scanner crâne URGENCE
INSERT INTO radiology_exams (
  patient_id,
  prescribed_by,
  exam_type,
  modality,
  body_part,
  clinical_info,
  urgency_level,
  status,
  special_instructions,
  created_at
)
SELECT
  p.id,
  (SELECT id FROM user_profiles WHERE role = 'doctor' LIMIT 1),
  'ct_scan',
  'CT',
  'Crâne',
  'Traumatisme crânien grave - chute de 3m de hauteur. Patient confus, vomissements. Glasgow 12/15. Recherche hématome intracrânien.',
  'emergency',
  'prescribed',
  'Sans injection - URGENCE VITALE',
  NOW() - INTERVAL '30 minutes'
FROM patients p
WHERE p.patient_number LIKE 'P-2026-%'
LIMIT 1 OFFSET 5
ON CONFLICT DO NOTHING;

-- Examen 7: Échographie obstétricale routine
INSERT INTO radiology_exams (
  patient_id,
  prescribed_by,
  exam_type,
  modality,
  body_part,
  clinical_info,
  urgency_level,
  status,
  special_instructions,
  created_at
)
SELECT
  p.id,
  (SELECT id FROM user_profiles WHERE role = 'doctor' LIMIT 1 OFFSET 2),
  'ultrasound',
  'US',
  'Bassin',
  'Grossesse 22 SA - échographie morphologique du 2ème trimestre. Évaluation anatomique fœtale, croissance et placenta.',
  'routine',
  'prescribed',
  'Vessie semi-pleine',
  NOW() - INTERVAL '4 hours'
FROM patients p
WHERE p.first_name LIKE '%Grace%' OR p.first_name LIKE '%Marie%' OR p.first_name LIKE '%Sophie%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Examen 8: Radiographie thorax terminé
INSERT INTO radiology_exams (
  patient_id,
  prescribed_by,
  exam_type,
  modality,
  body_part,
  clinical_info,
  urgency_level,
  status,
  special_instructions,
  created_at
)
SELECT
  p.id,
  (SELECT id FROM user_profiles WHERE role = 'doctor' LIMIT 1),
  'radiography',
  'CR',
  'Thorax',
  'Contrôle post-pneumonie. Toux persistante après 10 jours d''antibiotiques. Vérification de la résolution des foyers infectieux.',
  'routine',
  'completed',
  'Incidences de face et profil',
  NOW() - INTERVAL '1 day'
FROM patients p
WHERE p.patient_number LIKE 'P-2026-%'
LIMIT 1 OFFSET 6
ON CONFLICT DO NOTHING;

-- Ajouter des rapports pour les examens terminés
INSERT INTO radiology_reports (
  exam_id,
  performed_by,
  technique,
  findings,
  impression,
  recommendations,
  status,
  created_at
)
SELECT
  re.id,
  (SELECT id FROM user_profiles WHERE role IN ('radiology_head', 'radiologist') LIMIT 1),
  'Radiographie thoracique numérique, incidence de face en inspiration profonde et incidence de profil gauche. kV: 120, mAs: 8.',
  'Champs pulmonaires bien aérés bilatéralement. Pas d''opacité alvéolaire ou interstitielle visible. Structures médiastinales de taille et de position normales. Pas d''épanchement pleural. Index cardio-thoracique normal (0,45). Coupoles diaphragmatiques bien dégagées.',
  'Radiographie thoracique normale. Résolution complète de la pneumonie documentée il y a 10 jours. Aucune anomalie résiduelle.',
  'Arrêt des antibiotiques possible selon avis clinique. Pas de contrôle radiologique nécessaire sauf nouvelle symptomatologie.',
  'validated',
  NOW() - INTERVAL '18 hours'
FROM radiology_exams re
WHERE re.status = 'completed'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Mettre à jour le statut de l'examen avec rapport
UPDATE radiology_exams
SET status = 'validated'
WHERE id IN (
  SELECT exam_id FROM radiology_reports WHERE status = 'validated'
);

-- Afficher un résumé
SELECT
  'Examens créés' as type,
  COUNT(*) as nombre
FROM radiology_exams
WHERE created_at > NOW() - INTERVAL '1 day'

UNION ALL

SELECT
  'Rapports créés' as type,
  COUNT(*) as nombre
FROM radiology_reports
WHERE created_at > NOW() - INTERVAL '1 day';
