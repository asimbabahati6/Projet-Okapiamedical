/*
  # Seed Laboratory Tests Catalog

  1. New Data
    - Inserts 98 laboratory analyses into `lab_tests` table
    - Categories: Hematologie, Biochimie, Immunologie, Bacteriologie, Parasitologie, Hormonologie, Urologie, Serologie
    - Each test includes: code, name, category, specimen type, normal range, unit, price (USD), turnaround time (hours)

  2. Notes
    - Prices are in USD (standard B2B pricing for DRC medical laboratories)
    - Turnaround times are in hours
    - All tests are set as active by default
*/

-- Hematologie
INSERT INTO lab_tests (test_code, test_name, category, specimen_type, normal_range, unit, price, turnaround_time, is_active) VALUES
('HEM-001', 'NFS (Numeration Formule Sanguine)', 'Hematologie', 'Sang', '5-10 x10^9/L', 'x10^9/L', 15, 24, true),
('HEM-002', 'Vitesse de Sedimentation (VS)', 'Hematologie', 'Sang', '<20 mm/h', 'mm/h', 8, 2, true),
('HEM-003', 'Groupe Sanguin ABO-Rh', 'Hematologie', 'Sang', '', '', 10, 4, true),
('HEM-004', 'Taux de Reticulocytes', 'Hematologie', 'Sang', '0.5-2.5%', '%', 12, 24, true),
('HEM-005', 'Temps de Quick (TP/INR)', 'Hematologie', 'Sang', '70-100%', '%', 15, 4, true),
('HEM-006', 'Temps de Cephaline Active (TCA)', 'Hematologie', 'Sang', '25-35 sec', 'sec', 15, 4, true),
('HEM-007', 'Fibrinogene', 'Hematologie', 'Sang', '2-4 g/L', 'g/L', 18, 4, true),
('HEM-008', 'D-Dimeres', 'Hematologie', 'Sang', '<500 ng/mL', 'ng/mL', 25, 4, true),
('HEM-009', 'Frottis sanguin (Goutte epaisse)', 'Hematologie', 'Sang', 'Negatif', '', 5, 2, true),
('HEM-010', 'Test d Emmel (Falciformation)', 'Hematologie', 'Sang', 'Negatif', '', 8, 2, true),
('HEM-011', 'Electrophorese de l hemoglobine', 'Hematologie', 'Sang', '', '', 30, 48, true),
('HEM-012', 'Plaquettes (numeration)', 'Hematologie', 'Sang', '150-400 x10^9/L', 'x10^9/L', 10, 4, true)
ON CONFLICT (test_code) DO NOTHING;

-- Biochimie
INSERT INTO lab_tests (test_code, test_name, category, specimen_type, normal_range, unit, price, turnaround_time, is_active) VALUES
('BIO-001', 'Glycemie a jeun', 'Biochimie', 'Sang', '0.70-1.10 g/L', 'g/L', 8, 4, true),
('BIO-002', 'Hemoglobine glycosylee (HbA1c)', 'Biochimie', 'Sang', '4-6%', '%', 20, 24, true),
('BIO-003', 'Uree sanguine', 'Biochimie', 'Sang', '0.15-0.45 g/L', 'g/L', 8, 4, true),
('BIO-004', 'Creatinine', 'Biochimie', 'Sang', '7-13 mg/L', 'mg/L', 8, 4, true),
('BIO-005', 'Acide urique', 'Biochimie', 'Sang', '25-70 mg/L', 'mg/L', 10, 4, true),
('BIO-006', 'Cholesterol total', 'Biochimie', 'Sang', '<2.0 g/L', 'g/L', 10, 4, true),
('BIO-007', 'HDL Cholesterol', 'Biochimie', 'Sang', '>0.40 g/L', 'g/L', 12, 4, true),
('BIO-008', 'LDL Cholesterol', 'Biochimie', 'Sang', '<1.60 g/L', 'g/L', 12, 4, true),
('BIO-009', 'Triglycerides', 'Biochimie', 'Sang', '<1.50 g/L', 'g/L', 10, 4, true),
('BIO-010', 'Bilan lipidique complet', 'Biochimie', 'Sang', '', '', 30, 4, true),
('BIO-011', 'ASAT (TGO)', 'Biochimie', 'Sang', '<35 UI/L', 'UI/L', 10, 4, true),
('BIO-012', 'ALAT (TGP)', 'Biochimie', 'Sang', '<45 UI/L', 'UI/L', 10, 4, true),
('BIO-013', 'Gamma GT', 'Biochimie', 'Sang', '<55 UI/L', 'UI/L', 12, 4, true),
('BIO-014', 'Phosphatases alcalines', 'Biochimie', 'Sang', '30-120 UI/L', 'UI/L', 12, 4, true),
('BIO-015', 'Bilirubine totale', 'Biochimie', 'Sang', '3-10 mg/L', 'mg/L', 10, 4, true),
('BIO-016', 'Bilirubine directe', 'Biochimie', 'Sang', '<3 mg/L', 'mg/L', 10, 4, true),
('BIO-017', 'Proteines totales', 'Biochimie', 'Sang', '60-80 g/L', 'g/L', 10, 4, true),
('BIO-018', 'Albumine', 'Biochimie', 'Sang', '35-50 g/L', 'g/L', 10, 4, true),
('BIO-019', 'Calcium (Calcemie)', 'Biochimie', 'Sang', '85-105 mg/L', 'mg/L', 12, 4, true),
('BIO-020', 'Phosphore', 'Biochimie', 'Sang', '25-50 mg/L', 'mg/L', 12, 4, true),
('BIO-021', 'Magnesium', 'Biochimie', 'Sang', '17-25 mg/L', 'mg/L', 12, 4, true),
('BIO-022', 'Fer serique', 'Biochimie', 'Sang', '60-170 ug/dL', 'ug/dL', 15, 4, true),
('BIO-023', 'Ferritine', 'Biochimie', 'Sang', '20-250 ng/mL', 'ng/mL', 20, 24, true),
('BIO-024', 'CRP (Proteine C-reactive)', 'Biochimie', 'Sang', '<6 mg/L', 'mg/L', 12, 4, true),
('BIO-025', 'Ionogramme (Na, K, Cl)', 'Biochimie', 'Sang', '', '', 20, 4, true),
('BIO-026', 'Amylase', 'Biochimie', 'Sang', '28-100 UI/L', 'UI/L', 15, 4, true),
('BIO-027', 'Lipase', 'Biochimie', 'Sang', '<60 UI/L', 'UI/L', 15, 4, true),
('BIO-028', 'LDH', 'Biochimie', 'Sang', '120-246 UI/L', 'UI/L', 12, 4, true),
('BIO-029', 'CPK (Creatine Phosphokinase)', 'Biochimie', 'Sang', '24-195 UI/L', 'UI/L', 15, 4, true),
('BIO-030', 'Troponine I', 'Biochimie', 'Sang', '<0.04 ng/mL', 'ng/mL', 25, 4, true)
ON CONFLICT (test_code) DO NOTHING;

-- Immunologie
INSERT INTO lab_tests (test_code, test_name, category, specimen_type, normal_range, unit, price, turnaround_time, is_active) VALUES
('IMM-001', 'CRP quantitative', 'Immunologie', 'Sang', '<6 mg/L', 'mg/L', 15, 4, true),
('IMM-002', 'ASLO (Antistreptolysine O)', 'Immunologie', 'Sang', '<200 UI/mL', 'UI/mL', 15, 24, true),
('IMM-003', 'Facteur rhumatoide (FR)', 'Immunologie', 'Sang', '<14 UI/mL', 'UI/mL', 15, 24, true),
('IMM-004', 'Widal (Serodiagnostic)', 'Immunologie', 'Sang', 'Negatif', '', 12, 24, true),
('IMM-005', 'TPHA/VDRL (Syphilis)', 'Immunologie', 'Sang', 'Negatif', '', 15, 24, true),
('IMM-006', 'Test VIH 1 et 2', 'Immunologie', 'Sang', 'Negatif', '', 10, 4, true),
('IMM-007', 'Antigene HBs (Hepatite B)', 'Immunologie', 'Sang', 'Negatif', '', 15, 4, true),
('IMM-008', 'Anticorps anti-HCV (Hepatite C)', 'Immunologie', 'Sang', 'Negatif', '', 20, 24, true),
('IMM-009', 'Anticorps anti-HBs', 'Immunologie', 'Sang', '>10 mUI/mL', 'mUI/mL', 20, 24, true),
('IMM-010', 'IgE totales', 'Immunologie', 'Sang', '<100 UI/mL', 'UI/mL', 25, 48, true),
('IMM-011', 'Toxoplasmose (IgG/IgM)', 'Immunologie', 'Sang', '', '', 30, 48, true),
('IMM-012', 'Rubeole (IgG/IgM)', 'Immunologie', 'Sang', '', '', 30, 48, true),
('IMM-013', 'Beta-hCG (Test grossesse quantitatif)', 'Immunologie', 'Sang', '<5 mUI/mL', 'mUI/mL', 15, 4, true),
('IMM-014', 'PSA (Antigene prostatique)', 'Immunologie', 'Sang', '<4 ng/mL', 'ng/mL', 25, 24, true),
('IMM-015', 'CA 125', 'Immunologie', 'Sang', '<35 UI/mL', 'UI/mL', 30, 48, true),
('IMM-016', 'AFP (Alpha-foetoproteine)', 'Immunologie', 'Sang', '<10 ng/mL', 'ng/mL', 25, 48, true)
ON CONFLICT (test_code) DO NOTHING;

-- Bacteriologie
INSERT INTO lab_tests (test_code, test_name, category, specimen_type, normal_range, unit, price, turnaround_time, is_active) VALUES
('BAC-001', 'ECBU (Examen cytobacteriologique des urines)', 'Bacteriologie', 'Urine', '', '', 15, 72, true),
('BAC-002', 'Coproculture', 'Bacteriologie', 'Selles', '', '', 20, 72, true),
('BAC-003', 'Hemoculture', 'Bacteriologie', 'Sang', '', '', 25, 120, true),
('BAC-004', 'Examen du liquide cephalorachidien', 'Bacteriologie', 'LCR', '', '', 30, 48, true),
('BAC-005', 'Prelevement vaginal', 'Bacteriologie', 'Secretion vaginale', '', '', 15, 72, true),
('BAC-006', 'Prelevement uretral', 'Bacteriologie', 'Secretion uretrale', '', '', 15, 72, true),
('BAC-007', 'Antibiogramme', 'Bacteriologie', 'Variable', '', '', 20, 72, true),
('BAC-008', 'Examen de crachat (BK)', 'Bacteriologie', 'Crachat', 'Negatif', '', 10, 48, true),
('BAC-009', 'GeneXpert (Tuberculose)', 'Bacteriologie', 'Crachat', 'Negatif', '', 35, 4, true),
('BAC-010', 'Culture mycologique', 'Bacteriologie', 'Variable', '', '', 25, 168, true)
ON CONFLICT (test_code) DO NOTHING;

-- Parasitologie
INSERT INTO lab_tests (test_code, test_name, category, specimen_type, normal_range, unit, price, turnaround_time, is_active) VALUES
('PAR-001', 'Goutte epaisse (Paludisme)', 'Parasitologie', 'Sang', 'Negatif', '', 5, 2, true),
('PAR-002', 'TDR Paludisme (Test rapide)', 'Parasitologie', 'Sang', 'Negatif', '', 8, 1, true),
('PAR-003', 'Examen parasitologique des selles', 'Parasitologie', 'Selles', 'Negatif', '', 10, 4, true),
('PAR-004', 'Recherche de Trichomonas', 'Parasitologie', 'Secretion', 'Negatif', '', 8, 2, true),
('PAR-005', 'Recherche de microfilaires', 'Parasitologie', 'Sang', 'Negatif', '', 12, 24, true),
('PAR-006', 'Scotch test (Oxyures)', 'Parasitologie', 'Marge anale', 'Negatif', '', 8, 2, true)
ON CONFLICT (test_code) DO NOTHING;

-- Hormonologie
INSERT INTO lab_tests (test_code, test_name, category, specimen_type, normal_range, unit, price, turnaround_time, is_active) VALUES
('HOR-001', 'TSH (Thyreostimuline)', 'Hormonologie', 'Sang', '0.27-4.20 mUI/L', 'mUI/L', 20, 24, true),
('HOR-002', 'T3 libre', 'Hormonologie', 'Sang', '2.0-4.4 pg/mL', 'pg/mL', 25, 24, true),
('HOR-003', 'T4 libre', 'Hormonologie', 'Sang', '0.93-1.70 ng/dL', 'ng/dL', 25, 24, true),
('HOR-004', 'Cortisol', 'Hormonologie', 'Sang', '6.2-19.4 ug/dL', 'ug/dL', 25, 48, true),
('HOR-005', 'Prolactine', 'Hormonologie', 'Sang', '4.0-15.2 ng/mL', 'ng/mL', 25, 48, true),
('HOR-006', 'FSH', 'Hormonologie', 'Sang', '', 'mUI/mL', 25, 48, true),
('HOR-007', 'LH', 'Hormonologie', 'Sang', '', 'mUI/mL', 25, 48, true),
('HOR-008', 'Estradiol', 'Hormonologie', 'Sang', '', 'pg/mL', 30, 48, true),
('HOR-009', 'Progesterone', 'Hormonologie', 'Sang', '', 'ng/mL', 30, 48, true),
('HOR-010', 'Testosterone', 'Hormonologie', 'Sang', '2.8-8.0 ng/mL', 'ng/mL', 30, 48, true),
('HOR-011', 'Insuline', 'Hormonologie', 'Sang', '2.6-24.9 uUI/mL', 'uUI/mL', 25, 48, true),
('HOR-012', 'Vitamine D (25-OH)', 'Hormonologie', 'Sang', '30-100 ng/mL', 'ng/mL', 30, 48, true),
('HOR-013', 'Vitamine B12', 'Hormonologie', 'Sang', '200-900 pg/mL', 'pg/mL', 25, 48, true)
ON CONFLICT (test_code) DO NOTHING;

-- Urologie
INSERT INTO lab_tests (test_code, test_name, category, specimen_type, normal_range, unit, price, turnaround_time, is_active) VALUES
('URO-001', 'Bandelette urinaire', 'Urologie', 'Urine', '', '', 5, 1, true),
('URO-002', 'Sediment urinaire', 'Urologie', 'Urine', '', '', 8, 2, true),
('URO-003', 'Proteinurie des 24h', 'Urologie', 'Urine', '<150 mg/24h', 'mg/24h', 12, 24, true),
('URO-004', 'Microalbuminurie', 'Urologie', 'Urine', '<30 mg/L', 'mg/L', 15, 24, true),
('URO-005', 'Clearance de la creatinine', 'Urologie', 'Urine+Sang', '>90 mL/min', 'mL/min', 15, 24, true),
('URO-006', 'Ionogramme urinaire', 'Urologie', 'Urine', '', '', 20, 4, true)
ON CONFLICT (test_code) DO NOTHING;

-- Serologie
INSERT INTO lab_tests (test_code, test_name, category, specimen_type, normal_range, unit, price, turnaround_time, is_active) VALUES
('SER-001', 'Test COVID-19 Antigenique', 'Serologie', 'Naso-pharynge', 'Negatif', '', 15, 1, true),
('SER-002', 'Test COVID-19 PCR', 'Serologie', 'Naso-pharynge', 'Negatif', '', 50, 24, true),
('SER-003', 'Dengue (IgG/IgM)', 'Serologie', 'Sang', 'Negatif', '', 20, 4, true),
('SER-004', 'Chikungunya', 'Serologie', 'Sang', 'Negatif', '', 20, 24, true),
('SER-005', 'Fievre Typhoide (Widal)', 'Serologie', 'Sang', 'Negatif', '', 12, 24, true)
ON CONFLICT (test_code) DO NOTHING;
