/*
  # Seed Pharmacy Medications Demo Data

  1. Purpose
    - Populate pharmacy_medications with 45 realistic medications
    - Common drugs used in hospitals in DRC/Central Africa
    - Varied categories, stock levels, expiry dates
    - Pricing in USD

  2. Data Characteristics
    - Mix of stock levels: normal, low (below minimum_stock), out-of-stock (0)
    - Some medications expiring soon (within 3 months)
    - Realistic batch numbers and manufacturers
    - Both prescription-required and OTC medications
*/

INSERT INTO pharmacy_medications (code, name, generic_name, category, dosage, form, unit_price, currency, current_stock, minimum_stock, maximum_stock, expiry_date, manufacturer, batch_number, storage_conditions, requires_prescription, is_active)
VALUES
-- Antibiotiques
('MED-001', 'Amoxicilline 500mg', 'Amoxicillin', 'Antibiotique', '500mg', 'Comprimé', 0.35, 'USD', 450, 100, 1000, '2027-06-15', 'Sanofi', 'LOT-2024-A001', 'Température ambiante', true, true),
('MED-002', 'Ciprofloxacine 500mg', 'Ciprofloxacin', 'Antibiotique', '500mg', 'Comprimé', 0.50, 'USD', 280, 80, 600, '2027-03-20', 'Bayer', 'LOT-2024-A002', 'Température ambiante', true, true),
('MED-003', 'Azithromycine 250mg', 'Azithromycin', 'Antibiotique', '250mg', 'Comprimé', 0.75, 'USD', 180, 60, 400, '2026-12-10', 'Pfizer', 'LOT-2024-A003', 'Température ambiante', true, true),
('MED-004', 'Métronidazole 500mg', 'Metronidazole', 'Antibiotique', '500mg', 'Comprimé', 0.25, 'USD', 520, 100, 800, '2027-09-30', 'Denk Pharma', 'LOT-2024-A004', 'Température ambiante', true, true),
('MED-005', 'Doxycycline 100mg', 'Doxycycline', 'Antibiotique', '100mg', 'Gélule', 0.30, 'USD', 15, 50, 500, '2027-01-15', 'Cipla', 'LOT-2024-A005', 'Protéger de la lumière', true, true),
('MED-006', 'Ceftriaxone 1g', 'Ceftriaxone', 'Antibiotique', '1g', 'Injectable', 2.50, 'USD', 85, 30, 200, '2026-08-20', 'Roche', 'LOT-2024-A006', 'Réfrigérateur 2-8°C', true, true),

-- Antalgiques
('MED-007', 'Paracétamol 500mg', 'Paracetamol', 'Antalgique', '500mg', 'Comprimé', 0.10, 'USD', 1200, 200, 2000, '2027-12-31', 'Denk Pharma', 'LOT-2024-B001', 'Température ambiante', false, true),
('MED-008', 'Paracétamol Sirop 120mg/5ml', 'Paracetamol', 'Antalgique', '120mg/5ml', 'Sirop', 1.50, 'USD', 95, 30, 200, '2026-09-15', 'GSK', 'LOT-2024-B002', 'Température ambiante', false, true),
('MED-009', 'Tramadol 50mg', 'Tramadol', 'Antalgique', '50mg', 'Gélule', 0.45, 'USD', 200, 50, 400, '2027-04-10', 'Grünenthal', 'LOT-2024-B003', 'Température ambiante', true, true),

-- Anti-inflammatoires
('MED-010', 'Ibuprofène 400mg', 'Ibuprofen', 'Anti-inflammatoire', '400mg', 'Comprimé', 0.20, 'USD', 680, 150, 1000, '2027-07-22', 'Reckitt', 'LOT-2024-B004', 'Température ambiante', false, true),
('MED-011', 'Diclofénac 50mg', 'Diclofenac', 'Anti-inflammatoire', '50mg', 'Comprimé', 0.15, 'USD', 420, 100, 800, '2027-05-18', 'Novartis', 'LOT-2024-B005', 'Température ambiante', false, true),
('MED-012', 'Diclofénac 75mg Injectable', 'Diclofenac', 'Anti-inflammatoire', '75mg/3ml', 'Injectable', 1.20, 'USD', 0, 40, 300, '2027-02-28', 'Novartis', 'LOT-2024-B006', 'Température ambiante', true, true),

-- Cardiovasculaire
('MED-013', 'Amlodipine 5mg', 'Amlodipine', 'Cardiovasculaire', '5mg', 'Comprimé', 0.20, 'USD', 340, 80, 600, '2027-11-15', 'Pfizer', 'LOT-2024-C001', 'Température ambiante', true, true),
('MED-014', 'Énalapril 10mg', 'Enalapril', 'Cardiovasculaire', '10mg', 'Comprimé', 0.25, 'USD', 250, 60, 500, '2027-08-20', 'Merck', 'LOT-2024-C002', 'Température ambiante', true, true),
('MED-015', 'Aténolol 50mg', 'Atenolol', 'Cardiovasculaire', '50mg', 'Comprimé', 0.18, 'USD', 180, 50, 400, '2027-06-30', 'AstraZeneca', 'LOT-2024-C003', 'Température ambiante', true, true),
('MED-016', 'Furosémide 40mg', 'Furosemide', 'Cardiovasculaire', '40mg', 'Comprimé', 0.15, 'USD', 8, 50, 500, '2027-04-25', 'Sanofi', 'LOT-2024-C004', 'Température ambiante', true, true),
('MED-017', 'Aspirine 100mg', 'Acetylsalicylic acid', 'Cardiovasculaire', '100mg', 'Comprimé', 0.08, 'USD', 900, 200, 1500, '2028-01-31', 'Bayer', 'LOT-2024-C005', 'Température ambiante', false, true),

-- Antidiabétiques
('MED-018', 'Metformine 500mg', 'Metformin', 'Antidiabétique', '500mg', 'Comprimé', 0.12, 'USD', 560, 100, 800, '2027-10-15', 'Merck', 'LOT-2024-D001', 'Température ambiante', true, true),
('MED-019', 'Glibenclamide 5mg', 'Glibenclamide', 'Antidiabétique', '5mg', 'Comprimé', 0.10, 'USD', 320, 80, 600, '2027-07-10', 'Sanofi', 'LOT-2024-D002', 'Température ambiante', true, true),
('MED-020', 'Insuline NPH 100UI/ml', 'Insulin NPH', 'Antidiabétique', '100UI/ml', 'Injectable', 8.50, 'USD', 25, 15, 60, '2026-07-30', 'Novo Nordisk', 'LOT-2024-D003', 'Réfrigérateur 2-8°C', true, true),

-- Antiparasitaires
('MED-021', 'Artéméther-Luméfantrine', 'Artemether/Lumefantrine', 'Antiparasitaire', '20mg/120mg', 'Comprimé', 1.80, 'USD', 380, 100, 600, '2027-05-20', 'Novartis', 'LOT-2024-E001', 'Température ambiante', true, true),
('MED-022', 'Quinine 300mg', 'Quinine', 'Antiparasitaire', '300mg', 'Comprimé', 0.40, 'USD', 220, 80, 500, '2027-03-15', 'Sanofi', 'LOT-2024-E002', 'Protéger de la lumière', true, true),
('MED-023', 'Albendazole 400mg', 'Albendazole', 'Antiparasitaire', '400mg', 'Comprimé', 0.30, 'USD', 450, 100, 700, '2027-08-10', 'GSK', 'LOT-2024-E003', 'Température ambiante', false, true),
('MED-024', 'Mébendazole 100mg', 'Mebendazole', 'Antiparasitaire', '100mg', 'Comprimé', 0.20, 'USD', 380, 80, 600, '2027-11-25', 'Janssen', 'LOT-2024-E004', 'Température ambiante', false, true),

-- Gastro-intestinal
('MED-025', 'Oméprazole 20mg', 'Omeprazole', 'Gastro-intestinal', '20mg', 'Gélule', 0.25, 'USD', 420, 100, 700, '2027-06-18', 'AstraZeneca', 'LOT-2024-F001', 'Température ambiante', true, true),
('MED-026', 'Métoclopramide 10mg', 'Metoclopramide', 'Gastro-intestinal', '10mg', 'Comprimé', 0.12, 'USD', 280, 60, 500, '2027-04-12', 'Sanofi', 'LOT-2024-F002', 'Température ambiante', true, true),
('MED-027', 'SRO (Sels Réhydratation Orale)', 'Oral Rehydration Salts', 'Gastro-intestinal', '1 sachet', 'Poudre', 0.35, 'USD', 600, 150, 1000, '2028-03-31', 'UNICEF', 'LOT-2024-F003', 'Conserver au sec', false, true),
('MED-028', 'Lopéramide 2mg', 'Loperamide', 'Gastro-intestinal', '2mg', 'Gélule', 0.15, 'USD', 0, 50, 400, '2027-09-22', 'Janssen', 'LOT-2024-F004', 'Température ambiante', false, true),

-- Respiratoire
('MED-029', 'Salbutamol Inhalateur 100mcg', 'Salbutamol', 'Respiratoire', '100mcg/dose', 'Inhalateur', 3.50, 'USD', 45, 20, 100, '2027-02-15', 'GSK', 'LOT-2024-G001', 'Température ambiante', true, true),
('MED-030', 'Prednisolone 5mg', 'Prednisolone', 'Respiratoire', '5mg', 'Comprimé', 0.18, 'USD', 320, 80, 500, '2027-07-30', 'Pfizer', 'LOT-2024-G002', 'Température ambiante', true, true),
('MED-031', 'Dexaméthasone 4mg Injectable', 'Dexamethasone', 'Respiratoire', '4mg/ml', 'Injectable', 1.00, 'USD', 120, 40, 250, '2027-01-20', 'Merck', 'LOT-2024-G003', 'Température ambiante', true, true),

-- Vitamines
('MED-032', 'Fer + Acide Folique', 'Ferrous Sulfate + Folic Acid', 'Vitamine', '200mg+0.4mg', 'Comprimé', 0.08, 'USD', 850, 200, 1500, '2028-06-30', 'UNICEF', 'LOT-2024-H001', 'Température ambiante', false, true),
('MED-033', 'Vitamine C 500mg', 'Ascorbic Acid', 'Vitamine', '500mg', 'Comprimé', 0.10, 'USD', 700, 150, 1200, '2028-01-15', 'Roche', 'LOT-2024-H002', 'Protéger de la lumière', false, true),
('MED-034', 'Vitamine B Complexe', 'Vitamin B Complex', 'Vitamine', '1 comprimé', 'Comprimé', 0.12, 'USD', 480, 100, 800, '2027-11-20', 'Bayer', 'LOT-2024-H003', 'Température ambiante', false, true),
('MED-035', 'Zinc 20mg', 'Zinc Sulfate', 'Vitamine', '20mg', 'Comprimé', 0.06, 'USD', 550, 100, 900, '2028-04-10', 'UNICEF', 'LOT-2024-H004', 'Température ambiante', false, true),

-- Dermatologie
('MED-036', 'Clotrimazole Crème 1%', 'Clotrimazole', 'Dermatologie', '1%', 'Crème', 1.20, 'USD', 75, 25, 150, '2027-03-28', 'Bayer', 'LOT-2024-I001', 'Température ambiante', false, true),
('MED-037', 'Hydrocortisone Crème 1%', 'Hydrocortisone', 'Dermatologie', '1%', 'Crème', 1.50, 'USD', 60, 20, 120, '2027-05-15', 'Pfizer', 'LOT-2024-I002', 'Température ambiante', true, true),
('MED-038', 'Miconazole Crème 2%', 'Miconazole', 'Dermatologie', '2%', 'Crème', 1.30, 'USD', 55, 20, 100, '2027-08-22', 'Janssen', 'LOT-2024-I003', 'Température ambiante', false, true),

-- Neurologique
('MED-039', 'Diazépam 5mg', 'Diazepam', 'Neurologique', '5mg', 'Comprimé', 0.20, 'USD', 150, 40, 300, '2027-06-10', 'Roche', 'LOT-2024-J001', 'Température ambiante', true, true),
('MED-040', 'Phénobarbital 100mg', 'Phenobarbital', 'Neurologique', '100mg', 'Comprimé', 0.15, 'USD', 200, 50, 400, '2027-09-18', 'Sanofi', 'LOT-2024-J002', 'Température ambiante', true, true),
('MED-041', 'Amitriptyline 25mg', 'Amitriptyline', 'Neurologique', '25mg', 'Comprimé', 0.12, 'USD', 180, 40, 300, '2027-04-25', 'Sandoz', 'LOT-2024-J003', 'Température ambiante', true, true),

-- Obstétrique
('MED-042', 'Oxytocine 10UI Injectable', 'Oxytocin', 'Obstétrique', '10UI/ml', 'Injectable', 1.80, 'USD', 40, 20, 100, '2026-11-30', 'Pfizer', 'LOT-2024-K001', 'Réfrigérateur 2-8°C', true, true),
('MED-043', 'Misoprostol 200mcg', 'Misoprostol', 'Obstétrique', '200mcg', 'Comprimé', 0.90, 'USD', 30, 15, 80, '2027-02-10', 'Pfizer', 'LOT-2024-K002', 'Température ambiante', true, true),

-- Ophtalmologie
('MED-044', 'Chloramphénicol Collyre 0.5%', 'Chloramphenicol', 'Ophtalmologie', '0.5%', 'Collyre', 1.00, 'USD', 90, 25, 150, '2026-10-20', 'Cipla', 'LOT-2024-L001', 'Réfrigérateur après ouverture', true, true),
('MED-045', 'Tétracycline Pommade Opht 1%', 'Tetracycline', 'Ophtalmologie', '1%', 'Pommade', 0.80, 'USD', 65, 20, 120, '2027-01-28', 'Pfizer', 'LOT-2024-L002', 'Température ambiante', true, true)
ON CONFLICT DO NOTHING;
