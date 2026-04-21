/*
  # Re-seed Reference Data — Part 3
  # Medical Nomenclatures, Act Modifiers, ICD-10 Codes,
  # Shift Types, Tax Brackets, Exchange Rates,
  # Inventory Categories, Supply Categories, Consultation Templates
*/

-- ─── 1. Medical Nomenclatures ─────────────────────────────────────────────────
INSERT INTO medical_nomenclatures (nomenclature_type, code, description_fr, description_en, base_price_usd, category) VALUES
  ('NGAP', 'C',       'Consultation au cabinet',       'Office consultation',           25.00, 'Consultation'),
  ('NGAP', 'V',       'Visite au domicile',             'Home visit',                   35.00, 'Consultation'),
  ('NGAP', 'CS',      'Consultation de spécialiste',    'Specialist consultation',      50.00, 'Consultation'),
  ('CCAM', 'YYYY001', 'Examen clinique complet',        'Complete clinical examination', 30.00, 'Examen'),
  ('CCAM', 'YYYY002', 'Électrocardiogramme',            'Electrocardiogram',            40.00, 'Examen Technique'),
  ('CCAM', 'YYYY003', 'Échographie abdominale',         'Abdominal ultrasound',         75.00, 'Imagerie'),
  ('CCAM', 'YYYY004', 'Radio thoracique',               'Chest X-ray',                  45.00, 'Imagerie'),
  ('CCAM', 'YYYY005', 'Prise de sang',                  'Blood draw',                   15.00, 'Prélèvement'),
  ('CCAM', 'YYYY006', 'Suture simple',                  'Simple suture',                35.00, 'Chirurgie Mineure'),
  ('CCAM', 'YYYY007', 'Pansement complexe',             'Complex dressing',             25.00, 'Soins')
ON CONFLICT (nomenclature_type, code) DO NOTHING;

-- ─── 2. Act Modifiers ─────────────────────────────────────────────────────────
INSERT INTO act_modifiers (code, description, multiplier) VALUES
  ('NIGHT',     'Majoration nuit (20h-8h)',               1.50),
  ('SUNDAY',    'Majoration dimanche et jours fériés',    2.00),
  ('EMERGENCY', 'Majoration urgence',                     1.75),
  ('HOME',      'Majoration déplacement domicile',        1.25),
  ('PEDIATRIC', 'Majoration pédiatrie',                   1.20)
ON CONFLICT (code) DO NOTHING;

-- ─── 3. ICD-10 Codes (32 codes, correct column names: description_fr / description_en) ─────
INSERT INTO icd10_codes (code, description_fr, description_en, category) VALUES
  ('A00',    'Choléra',                                                            'Cholera',                                        'Maladies infectieuses'),
  ('A09',    'Diarrhée et gastro-entérite d''origine infectieuse présumée',       'Infectious gastroenteritis',                     'Maladies infectieuses'),
  ('B34.9',  'Infection virale, sans précision',                                  'Viral infection, unspecified',                   'Maladies infectieuses'),
  ('J00',    'Rhinopharyngite aiguë (rhume commun)',                              'Acute nasopharyngitis (common cold)',             'Maladies respiratoires'),
  ('J02.9',  'Pharyngite aiguë, sans précision',                                 'Acute pharyngitis, unspecified',                 'Maladies respiratoires'),
  ('J06.9',  'Infection aiguë des voies respiratoires supérieures, sans précision','Acute upper respiratory infection, unspecified','Maladies respiratoires'),
  ('J18.9',  'Pneumonie, sans précision',                                         'Pneumonia, unspecified',                         'Maladies respiratoires'),
  ('J20.9',  'Bronchite aiguë, sans précision',                                  'Acute bronchitis, unspecified',                  'Maladies respiratoires'),
  ('J45.9',  'Asthme, sans précision',                                            'Asthma, unspecified',                            'Maladies respiratoires'),
  ('I10',    'Hypertension essentielle (primitive)',                              'Essential (primary) hypertension',               'Maladies cardiovasculaires'),
  ('I11.9',  'Cardiopathie hypertensive sans insuffisance cardiaque congestive', 'Hypertensive heart disease without congestive heart failure', 'Maladies cardiovasculaires'),
  ('I25.10', 'Cardiopathie ischémique chronique',                                'Chronic ischemic heart disease',                 'Maladies cardiovasculaires'),
  ('I50.9',  'Insuffisance cardiaque, sans précision',                           'Heart failure, unspecified',                     'Maladies cardiovasculaires'),
  ('K21.9',  'Reflux gastro-œsophagien sans œsophagite',                        'Gastro-oesophageal reflux without oesophagitis', 'Maladies digestives'),
  ('K29.7',  'Gastrite, sans précision',                                          'Gastritis, unspecified',                         'Maladies digestives'),
  ('K59.0',  'Constipation',                                                      'Constipation',                                   'Maladies digestives'),
  ('E11.9',  'Diabète sucré de type 2, sans complication',                       'Type 2 diabetes mellitus without complications', 'Maladies endocriniennes'),
  ('E66.9',  'Obésité, sans précision',                                           'Obesity, unspecified',                           'Maladies endocriniennes'),
  ('E78.5',  'Hyperlipidémie, sans précision',                                   'Hyperlipidaemia, unspecified',                   'Maladies endocriniennes'),
  ('M25.50', 'Douleur articulaire, site non précisé',                            'Pain in unspecified joint',                      'Maladies musculosquelettiques'),
  ('M54.5',  'Lombalgies',                                                        'Low back pain',                                  'Maladies musculosquelettiques'),
  ('M79.3',  'Panniculite, sans précision',                                       'Panniculitis, unspecified',                      'Maladies musculosquelettiques'),
  ('G43.9',  'Migraine, sans précision',                                          'Migraine, unspecified',                          'Maladies neurologiques'),
  ('G44.2',  'Céphalée de tension',                                              'Tension-type headache',                          'Maladies neurologiques'),
  ('L20.9',  'Dermatite atopique, sans précision',                               'Atopic dermatitis, unspecified',                 'Maladies cutanées'),
  ('L30.9',  'Dermatite, sans précision',                                         'Dermatitis, unspecified',                        'Maladies cutanées'),
  ('F41.9',  'Trouble anxieux, sans précision',                                  'Anxiety disorder, unspecified',                  'Santé mentale'),
  ('F32.9',  'Épisode dépressif, sans précision',                                'Depressive episode, unspecified',                'Santé mentale'),
  ('R50.9',  'Fièvre, sans précision',                                            'Fever, unspecified',                             'Symptômes généraux'),
  ('R51',    'Céphalée',                                                          'Headache',                                       'Symptômes généraux'),
  ('R05',    'Toux',                                                              'Cough',                                          'Symptômes généraux'),
  ('R10.4',  'Autres douleurs abdominales et non précisées',                     'Other and unspecified abdominal pain',           'Symptômes généraux')
ON CONFLICT (code) DO NOTHING;

-- ─── 4. Shift Types ───────────────────────────────────────────────────────────
INSERT INTO shift_types (name, start_time, end_time, duration_hours, shift_category, min_rest_hours, color_code)
SELECT 'Jour', '08:00:00', '16:00:00', 8, 'day', 12, '#3b82f6'
WHERE NOT EXISTS (SELECT 1 FROM shift_types WHERE name = 'Jour');

INSERT INTO shift_types (name, start_time, end_time, duration_hours, shift_category, min_rest_hours, color_code)
SELECT 'Nuit', '20:00:00', '08:00:00', 12, 'night', 16, '#1e40af'
WHERE NOT EXISTS (SELECT 1 FROM shift_types WHERE name = 'Nuit');

INSERT INTO shift_types (name, start_time, end_time, duration_hours, shift_category, min_rest_hours, color_code)
SELECT 'Weekend Jour', '08:00:00', '20:00:00', 12, 'weekend', 12, '#10b981'
WHERE NOT EXISTS (SELECT 1 FROM shift_types WHERE name = 'Weekend Jour');

INSERT INTO shift_types (name, start_time, end_time, duration_hours, shift_category, min_rest_hours, color_code)
SELECT 'Garde', '16:00:00', '08:00:00', 16, 'night', 24, '#ef4444'
WHERE NOT EXISTS (SELECT 1 FROM shift_types WHERE name = 'Garde');

-- ─── 5. Tax Brackets (DRC IPR scale) ─────────────────────────────────────────
INSERT INTO tax_brackets (bracket_name, min_amount_cdf, max_amount_cdf, tax_rate, fixed_amount_cdf, effective_from, is_active)
SELECT 'Tranche 1', 0, 524000, 3.00, 0, '2024-01-01', true
WHERE NOT EXISTS (SELECT 1 FROM tax_brackets WHERE bracket_name = 'Tranche 1');

INSERT INTO tax_brackets (bracket_name, min_amount_cdf, max_amount_cdf, tax_rate, fixed_amount_cdf, effective_from, is_active)
SELECT 'Tranche 2', 524001, 1428000, 10.00, 15720, '2024-01-01', true
WHERE NOT EXISTS (SELECT 1 FROM tax_brackets WHERE bracket_name = 'Tranche 2');

INSERT INTO tax_brackets (bracket_name, min_amount_cdf, max_amount_cdf, tax_rate, fixed_amount_cdf, effective_from, is_active)
SELECT 'Tranche 3', 1428001, 2856000, 20.00, 106120, '2024-01-01', true
WHERE NOT EXISTS (SELECT 1 FROM tax_brackets WHERE bracket_name = 'Tranche 3');

INSERT INTO tax_brackets (bracket_name, min_amount_cdf, max_amount_cdf, tax_rate, fixed_amount_cdf, effective_from, is_active)
SELECT 'Tranche 4', 2856001, 5712000, 30.00, 391720, '2024-01-01', true
WHERE NOT EXISTS (SELECT 1 FROM tax_brackets WHERE bracket_name = 'Tranche 4');

INSERT INTO tax_brackets (bracket_name, min_amount_cdf, max_amount_cdf, tax_rate, fixed_amount_cdf, effective_from, is_active)
SELECT 'Tranche 5', 5712001, NULL, 40.00, 1248520, '2024-01-01', true
WHERE NOT EXISTS (SELECT 1 FROM tax_brackets WHERE bracket_name = 'Tranche 5');

-- ─── 6. Exchange Rates ────────────────────────────────────────────────────────
INSERT INTO exchange_rates (rate_date, cdf_to_usd, usd_to_cdf, is_active, notes)
VALUES (CURRENT_DATE, 0.00040, 2500.00, true, 'Taux de change initial')
ON CONFLICT (rate_date) DO NOTHING;

-- ─── 7. Inventory Categories ──────────────────────────────────────────────────
INSERT INTO inventory_categories (name, description, icon, color, sort_order) VALUES
  ('Médicaments',              'Médicaments et produits pharmaceutiques',  'Pill',        '#EF4444', 1),
  ('Matériel Médical',         'Équipements et instruments médicaux',      'Stethoscope', '#3B82F6', 2),
  ('Consommables',             'Fournitures médicales consommables',       'Package',     '#10B981', 3),
  ('Équipement de Protection', 'EPI et équipements de sécurité',           'Shield',      '#F59E0B', 4),
  ('Matériel de Laboratoire',  'Fournitures et réactifs de laboratoire',   'TestTube',    '#8B5CF6', 5),
  ('Matériel Administratif',   'Fournitures de bureau',                    'FileText',    '#6B7280', 6),
  ('Hygiène et Entretien',     'Produits d''hygiène',                      'Sparkles',    '#14B8A6', 7)
ON CONFLICT (name) DO NOTHING;

-- ─── 8. Supply Categories ─────────────────────────────────────────────────────
INSERT INTO supply_categories (name, description) VALUES
  ('Produits de nettoyage',    'Détergents, désinfectants, savons'),
  ('Équipement de protection', 'Gants, masques, tabliers'),
  ('Matériel de nettoyage',    'Balais, serpillières, seaux'),
  ('Consommables hygiene',     'Sacs poubelle, essuie-tout, papier'),
  ('Équipement spécialisé',    'Autoclaves, stérilisateurs, etc.')
ON CONFLICT (name) DO NOTHING;

-- ─── 9. Consultation Templates ────────────────────────────────────────────────
INSERT INTO consultation_templates (name, specialty, is_system_template, is_shared,
  chief_complaint_template, examination_template, treatment_template,
  vital_signs_defaults, suggested_diagnoses)
SELECT
  'Consultation Générale', 'Médecine Générale', true, true,
  'Motif de consultation:', 'Examen clinique:', 'Traitement proposé:',
  '{"temperature":37.0,"blood_pressure":"120/80","heart_rate":75}'::jsonb,
  '["R50.9","R05","R51"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM consultation_templates WHERE name = 'Consultation Générale' AND is_system_template = true);

INSERT INTO consultation_templates (name, specialty, is_system_template, is_shared,
  chief_complaint_template, examination_template, treatment_template,
  vital_signs_defaults, suggested_diagnoses)
SELECT
  'Consultation Cardiologique', 'Cardiologie', true, true,
  'Motif de consultation cardiologique:', 'Auscultation cardiaque:', 'Traitement cardiologique:',
  '{"temperature":37.0,"blood_pressure":"140/90","heart_rate":80}'::jsonb,
  '["I10","I50.9","I25.10"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM consultation_templates WHERE name = 'Consultation Cardiologique' AND is_system_template = true);

INSERT INTO consultation_templates (name, specialty, is_system_template, is_shared,
  chief_complaint_template, examination_template, treatment_template,
  vital_signs_defaults, suggested_diagnoses)
SELECT
  'Consultation Pédiatrique', 'Pédiatrie', true, true,
  'Motif de consultation pédiatrique:', 'Examen pédiatrique:', 'Traitement pédiatrique:',
  '{"temperature":37.0,"blood_pressure":"100/70","heart_rate":90}'::jsonb,
  '["R50.9","J06.9","J00"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM consultation_templates WHERE name = 'Consultation Pédiatrique' AND is_system_template = true);
