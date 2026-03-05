/*
  # Ajout de Templates de Services Médicaux Spécialisés

  1. Nouveaux Codes ICD-10
    - Codes pour Radiologie et Imagerie
    - Codes pour Dentisterie
    - Codes pour Explorations fonctionnelles
    - Codes pour Kinésithérapie

  2. Templates de Consultation par Spécialité (22 templates)

    **Radiologie Diagnostique** (3 templates)
    - Radiologie Standard
    - Échographie
    - Scanner/TDM

    **Radiologie Interventionnelle** (4 templates)
    - Biopsie Guidée
    - Embolisation Thérapeutique
    - Drainage Percutané
    - Sclérothérapie Varices

    **Dentisterie** (4 templates)
    - Consultation Dentaire Générale
    - Soins Conservateurs
    - Chirurgie Dentaire
    - Orthodontie

    **Explorations Médicales** (7 templates)
    - Endoscopie Digestive Haute (FOGD)
    - Coloscopie
    - Bronchoscopie
    - Échocardiographie
    - ECG
    - Épreuve d'Effort
    - EEG

    **Kinésithérapie** (4 templates)
    - Bilan Initial
    - Rééducation Orthopédique
    - Rééducation Respiratoire
    - Rééducation Neurologique

  3. Caractéristiques
    - Champs très détaillés par zone anatomique
    - Terminologie médicale française professionnelle
    - 1 à 3 codes ICD-10 suggérés par template
    - Templates système accessibles à tous
*/

-- ================================================
-- SECTION 1: AJOUT DE CODES ICD-10 COMPLÉMENTAIRES
-- ================================================

INSERT INTO icd10_codes (code, description_fr, description_en, category, subcategory) VALUES
-- Examens et dépistages
('Z01.4', 'Examen échographique', 'Ultrasound examination', 'Examens', 'Imagerie'),
('Z01.6', 'Examen radiologique', 'Radiological examination', 'Examens', 'Imagerie'),
('Z01.8', 'Autres examens médicaux précisés', 'Other specified medical examinations', 'Examens', 'Examens généraux'),
('Z12.0', 'Dépistage tumeur estomac', 'Screening for stomach neoplasm', 'Dépistage', 'Tumeurs'),
('Z12.1', 'Dépistage tumeur intestin', 'Screening for intestinal neoplasm', 'Dépistage', 'Tumeurs'),

-- Pathologies dentaires
('K02.1', 'Carie de la dentine', 'Dental caries of dentine', 'Pathologies dentaires', 'Caries'),
('K02.9', 'Carie dentaire, sans précision', 'Dental caries, unspecified', 'Pathologies dentaires', 'Caries'),
('K04.0', 'Pulpite', 'Pulpitis', 'Pathologies dentaires', 'Pulpe'),
('K04.7', 'Abcès périapical sans fistule', 'Periapical abscess without sinus', 'Pathologies dentaires', 'Infections'),
('K05.0', 'Gingivite aiguë', 'Acute gingivitis', 'Pathologies dentaires', 'Gencives'),
('K05.1', 'Gingivite chronique', 'Chronic gingivitis', 'Pathologies dentaires', 'Gencives'),
('K05.3', 'Parodontite chronique', 'Chronic periodontitis', 'Pathologies dentaires', 'Parodonte'),
('K07.3', 'Anomalies de position des dents', 'Anomalies of tooth position', 'Pathologies dentaires', 'Orthodontie'),
('K08.1', 'Perte de dents due à accident, extraction ou maladie', 'Loss of teeth due to accident, extraction or disease', 'Pathologies dentaires', 'Édentation'),

-- Pathologies pulmonaires et respiratoires
('J40', 'Bronchite, non précisée comme aiguë ou chronique', 'Bronchitis not specified as acute or chronic', 'Maladies respiratoires', 'Bronches'),
('J43.9', 'Emphysème, sans précision', 'Emphysema, unspecified', 'Maladies respiratoires', 'BPCO'),
('J44.9', 'Maladie pulmonaire obstructive chronique, sans précision', 'COPD, unspecified', 'Maladies respiratoires', 'BPCO'),
('J47', 'Bronchectasie', 'Bronchiectasis', 'Maladies respiratoires', 'Bronches'),
('J84.9', 'Maladie pulmonaire interstitielle, sans précision', 'Interstitial pulmonary disease, unspecified', 'Maladies respiratoires', 'Parenchyme'),

-- Pathologies cardiaques
('I20.0', 'Angine de poitrine instable', 'Unstable angina', 'Maladies cardiovasculaires', 'Cardiopathie ischémique'),
('I20.9', 'Angine de poitrine, sans précision', 'Angina pectoris, unspecified', 'Maladies cardiovasculaires', 'Cardiopathie ischémique'),
('I21.9', 'Infarctus aigu du myocarde, sans précision', 'Acute myocardial infarction, unspecified', 'Maladies cardiovasculaires', 'Infarctus'),
('I25.2', 'Infarctus du myocarde, ancien', 'Old myocardial infarction', 'Maladies cardiovasculaires', 'Infarctus'),
('I34.0', 'Insuffisance mitrale', 'Mitral insufficiency', 'Maladies cardiovasculaires', 'Valvulopathies'),
('I35.0', 'Sténose aortique', 'Aortic stenosis', 'Maladies cardiovasculaires', 'Valvulopathies'),
('I48.9', 'Fibrillation et flutter auriculaires, sans précision', 'Atrial fibrillation and flutter, unspecified', 'Maladies cardiovasculaires', 'Arythmies'),
('I49.9', 'Arythmie cardiaque, sans précision', 'Cardiac arrhythmia, unspecified', 'Maladies cardiovasculaires', 'Arythmies'),

-- Pathologies digestives
('K21.0', 'Reflux gastro-œsophagien avec œsophagite', 'GERD with esophagitis', 'Maladies digestives', 'Œsophage'),
('K25.9', 'Ulcère gastrique', 'Gastric ulcer', 'Maladies digestives', 'Estomac'),
('K51.9', 'Rectocolite hémorragique', 'Ulcerative colitis', 'Maladies digestives', 'Intestin'),
('K57.3', 'Maladie diverticulaire de l''intestin', 'Diverticular disease of intestine', 'Maladies digestives', 'Intestin'),
('K63.5', 'Polype du côlon', 'Polyp of colon', 'Maladies digestives', 'Intestin'),
('K80.2', 'Calcul de la vésicule biliaire', 'Calculus of gallbladder', 'Maladies digestives', 'Vésicule'),

-- Pathologies hépatiques et pancréatiques
('K74.6', 'Cirrhose du foie', 'Cirrhosis of liver', 'Maladies digestives', 'Foie'),
('K76.0', 'Stéatose hépatique', 'Fatty liver', 'Maladies digestives', 'Foie'),
('K85.9', 'Pancréatite aiguë', 'Acute pancreatitis', 'Maladies digestives', 'Pancréas'),

-- Pathologies rénales
('N20.0', 'Calcul du rein', 'Kidney stone', 'Maladies génito-urinaires', 'Reins'),
('N28.0', 'Ischémie et infarctus du rein', 'Renal ischemia and infarction', 'Maladies génito-urinaires', 'Reins'),

-- Pathologies neurologiques
('G40.9', 'Épilepsie, sans précision', 'Epilepsy, unspecified', 'Maladies du système nerveux', 'Épilepsie'),
('G20', 'Maladie de Parkinson', 'Parkinson disease', 'Maladies du système nerveux', 'Troubles du mouvement'),
('G35', 'Sclérose en plaques', 'Multiple sclerosis', 'Maladies du système nerveux', 'Démyélinisation'),
('I64', 'Accident vasculaire cérébral', 'Stroke', 'Maladies du système nerveux', 'Vasculaire'),
('R56.0', 'Convulsions fébriles', 'Febrile convulsions', 'Symptômes', 'Neurologiques'),

-- Traumatismes et lésions
('S42.0', 'Fracture de la clavicule', 'Fracture of clavicle', 'Traumatismes', 'Membre supérieur'),
('S72.0', 'Fracture du col du fémur', 'Fracture of femoral neck', 'Traumatismes', 'Membre inférieur'),
('S83.5', 'Entorse et foulure du genou', 'Sprain and strain of knee', 'Traumatismes', 'Membre inférieur'),
('M75.1', 'Syndrome de la coiffe des rotateurs', 'Rotator cuff syndrome', 'Maladies musculo-squelettiques', 'Épaule'),
('M17.9', 'Gonarthrose', 'Gonarthrosis', 'Maladies musculo-squelettiques', 'Genou'),

-- Tumeurs
('C34.9', 'Tumeur maligne des bronches et du poumon, sans précision', 'Malignant neoplasm of bronchus and lung, unspecified', 'Tumeurs', 'Poumon'),
('D12.6', 'Tumeur bénigne du côlon', 'Benign neoplasm of colon', 'Tumeurs', 'Côlon'),

-- Pathologies vasculaires
('I65.2', 'Occlusion et sténose de l''artère carotide', 'Occlusion and stenosis of carotid artery', 'Maladies cardiovasculaires', 'Artériel'),
('I74.3', 'Embolie et thrombose artérielle des membres inférieurs', 'Embolism and thrombosis of arteries of lower extremities', 'Maladies cardiovasculaires', 'Artériel'),
('I80.3', 'Phlébite et thrombophlébite des membres inférieurs', 'Phlebitis and thrombophlebitis of lower extremities', 'Maladies cardiovasculaires', 'Veineux'),
('I83.9', 'Varices des membres inférieurs', 'Varicose veins of lower extremities', 'Maladies cardiovasculaires', 'Veineux'),

-- Collections et abcès
('K65.0', 'Péritonite aiguë', 'Acute peritonitis', 'Maladies digestives', 'Péritoine'),
('K75.0', 'Abcès du foie', 'Abscess of liver', 'Maladies digestives', 'Foie'),
('J86.9', 'Pyothorax', 'Pyothorax', 'Maladies respiratoires', 'Plèvre')

ON CONFLICT (code) DO NOTHING;
