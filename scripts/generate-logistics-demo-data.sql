/*
  # Script de Génération de Données de Démonstration - Système Logistique

  Ce script génère des données réalistes pour tester le système de gestion logistique:
  - Catégories d'inventaire
  - Fournisseurs
  - 50 articles d'inventaire variés
  - Mouvements de stock historiques
  - Alertes de tous types et sévérités

  IMPORTANT: Ce script utilise des données fictives pour démonstration uniquement.
*/

-- ============================================================================
-- 1. NETTOYAGE (Optionnel - décommenter pour réinitialiser)
-- ============================================================================
-- DELETE FROM logistics_stock_alerts;
-- DELETE FROM stock_movements;
-- DELETE FROM inventory_items;
-- DELETE FROM suppliers WHERE name LIKE 'Demo%';

-- ============================================================================
-- 2. FOURNISSEURS DE DÉMONSTRATION
-- ============================================================================

INSERT INTO suppliers (name, contact_person, email, phone, address, city, country, rating, is_active)
VALUES
  ('Demo Pharma International', 'Dr. Jean Kabamba', 'contact@demopharma.cd', '+243 999 000 001', '123 Avenue de la Santé', 'Kinshasa', 'RD Congo', 4.5, true),
  ('Demo Medical Supply Co.', 'Marie Tshimanga', 'info@demomedical.cd', '+243 999 000 002', '456 Boulevard Médical', 'Lubumbashi', 'RD Congo', 4.8, true),
  ('Demo Équipements Hospitaliers', 'Pierre Mukendi', 'ventes@demoequip.cd', '+243 999 000 003', '789 Route des Soins', 'Goma', 'RD Congo', 4.2, true),
  ('Demo Laboratoire Distribution', 'Claire Ngandu', 'commandes@demolab.cd', '+243 999 000 004', '321 Avenue Sciences', 'Kinshasa', 'RD Congo', 4.6, true),
  ('Demo Consommables Médicaux', 'Joseph Mwamba', 'j.mwamba@democonso.cd', '+243 999 000 005', '654 Rue Hygiène', 'Kisangani', 'RD Congo', 4.3, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. ARTICLES D'INVENTAIRE VARIÉS (50 articles)
-- ============================================================================

-- Récupérer les IDs des catégories et fournisseurs
DO $$
DECLARE
  cat_medicaments uuid;
  cat_consommables uuid;
  cat_equipements uuid;
  cat_laboratoire uuid;
  cat_hygiene uuid;

  fournisseur1 uuid;
  fournisseur2 uuid;
  fournisseur3 uuid;
  fournisseur4 uuid;
  fournisseur5 uuid;

  item_id uuid;
BEGIN
  -- Récupérer les catégories
  SELECT id INTO cat_medicaments FROM inventory_categories WHERE name = 'Médicaments' LIMIT 1;
  SELECT id INTO cat_consommables FROM inventory_categories WHERE name = 'Consommables Médicaux' LIMIT 1;
  SELECT id INTO cat_equipements FROM inventory_categories WHERE name = 'Équipements Médicaux' LIMIT 1;
  SELECT id INTO cat_laboratoire FROM inventory_categories WHERE name = 'Fournitures de Laboratoire' LIMIT 1;
  SELECT id INTO cat_hygiene FROM inventory_categories WHERE name = 'Hygiène et Désinfection' LIMIT 1;

  -- Récupérer les fournisseurs
  SELECT id INTO fournisseur1 FROM suppliers WHERE name = 'Demo Pharma International' LIMIT 1;
  SELECT id INTO fournisseur2 FROM suppliers WHERE name = 'Demo Medical Supply Co.' LIMIT 1;
  SELECT id INTO fournisseur3 FROM suppliers WHERE name = 'Demo Équipements Hospitaliers' LIMIT 1;
  SELECT id INTO fournisseur4 FROM suppliers WHERE name = 'Demo Laboratoire Distribution' LIMIT 1;
  SELECT id INTO fournisseur5 FROM suppliers WHERE name = 'Demo Consommables Médicaux' LIMIT 1;

  -- ========== MÉDICAMENTS (15 articles) ==========

  -- Stock normal
  INSERT INTO inventory_items (name, description, sku, category_id, supplier_id, current_quantity, min_quantity, max_quantity, reorder_point, unit, unit_price, location, batch_number)
  VALUES
    ('Paracétamol 500mg', 'Comprimés analgésiques et antipyrétiques', 'INV-20241120-PAR500', cat_medicaments, fournisseur1, 5000, 1000, 10000, 2000, 'comprimé', 0.15, 'Pharmacie A1', 'LOT-PAR-2024-11'),
    ('Amoxicilline 500mg', 'Antibiotique à large spectre', 'INV-20241120-AMX500', cat_medicaments, fournisseur1, 3200, 800, 8000, 1500, 'comprimé', 0.45, 'Pharmacie A2', 'LOT-AMX-2024-10'),
    ('Ibuprofène 400mg', 'Anti-inflammatoire non stéroïdien', 'INV-20241120-IBU400', cat_medicaments, fournisseur1, 2800, 500, 6000, 1000, 'comprimé', 0.25, 'Pharmacie A1', 'LOT-IBU-2024-11');

  -- Stock faible
  INSERT INTO inventory_items (name, description, sku, category_id, supplier_id, current_quantity, min_quantity, max_quantity, reorder_point, unit, unit_price, location, batch_number)
  VALUES
    ('Insuline Rapide 100UI/ml', 'Traitement du diabète', 'INV-20241120-INS100', cat_medicaments, fournisseur1, 35, 50, 300, 80, 'flacon', 25.50, 'Réfrigérateur Med', 'LOT-INS-2024-09'),
    ('Morphine Injectable 10mg', 'Analgésique opioïde fort', 'INV-20241120-MOR010', cat_medicaments, fournisseur1, 18, 30, 200, 50, 'ampoule', 8.75, 'Coffre Sécurisé', 'LOT-MOR-2024-10');

  -- Stock critique
  INSERT INTO inventory_items (name, description, sku, category_id, supplier_id, current_quantity, min_quantity, max_quantity, reorder_point, unit, unit_price, location, batch_number)
  VALUES
    ('Adrénaline Injectable 1mg', 'Urgence choc anaphylactique', 'INV-20241120-ADR001', cat_medicaments, fournisseur1, 8, 20, 150, 30, 'ampoule', 12.30, 'Urgences - Armoire A', 'LOT-ADR-2024-11'),
    ('Vaccin COVID-19 Pfizer', 'Vaccination contre COVID-19', 'INV-20241120-VAC001', cat_medicaments, fournisseur1, 12, 50, 500, 80, 'dose', 15.00, 'Réfrigérateur Vaccins', 'LOT-COV-2024-08');

  -- Stock épuisé
  INSERT INTO inventory_items (name, description, sku, category_id, supplier_id, current_quantity, min_quantity, max_quantity, reorder_point, unit, unit_price, location, batch_number)
  VALUES
    ('Artémisinine 50mg', 'Antipaludéen', 'INV-20241120-ART050', cat_medicaments, fournisseur1, 0, 300, 3000, 500, 'comprimé', 1.20, 'Pharmacie B1', 'LOT-ART-2024-07'),
    ('Oxygène Médical 15L', 'Bouteille oxygène médical', 'INV-20241120-OXY015', cat_medicaments, fournisseur3, 0, 10, 50, 15, 'bouteille', 85.00, 'Salle Oxygène', 'CYL-OXY-2024-06');

  -- Expiration proche (dans 15 jours)
  INSERT INTO inventory_items (name, description, sku, category_id, supplier_id, current_quantity, min_quantity, max_quantity, reorder_point, unit, unit_price, location, expiry_date, batch_number)
  VALUES
    ('Sérum Physiologique 500ml', 'Solution NaCl 0.9%', 'INV-20241120-SER500', cat_medicaments, fournisseur2, 250, 100, 1000, 200, 'poche', 2.50, 'Stock Perfusions', (CURRENT_DATE + INTERVAL '15 days'), 'LOT-SER-2024-05'),
    ('Glucose 5% 500ml', 'Perfusion glucosée', 'INV-20241120-GLU500', cat_medicaments, fournisseur2, 180, 80, 800, 150, 'poche', 3.20, 'Stock Perfusions', (CURRENT_DATE + INTERVAL '10 days'), 'LOT-GLU-2024-05');

  -- Déjà expirés
  INSERT INTO inventory_items (name, description, sku, category_id, supplier_id, current_quantity, min_quantity, max_quantity, reorder_point, unit, unit_price, location, expiry_date, batch_number)
  VALUES
    ('Aspirine 100mg', 'Antiagrégant plaquettaire', 'INV-20241120-ASP100', cat_medicaments, fournisseur1, 450, 200, 2000, 400, 'comprimé', 0.08, 'Pharmacie C2', (CURRENT_DATE - INTERVAL '5 days'), 'LOT-ASP-2024-02'),
    ('Vitamine C Injectable', 'Supplément vitaminique', 'INV-20241120-VIT001', cat_medicaments, fournisseur1, 75, 50, 500, 100, 'ampoule', 1.50, 'Pharmacie B3', (CURRENT_DATE - INTERVAL '12 days'), 'LOT-VIT-2024-01');

  -- Surstock
  INSERT INTO inventory_items (name, description, sku, category_id, supplier_id, current_quantity, min_quantity, max_quantity, reorder_point, unit, unit_price, location, batch_number)
  VALUES
    ('Compresse Stérile 10x10cm', 'Compresses non tissées', 'INV-20241120-COM100', cat_medicaments, fournisseur5, 12500, 500, 5000, 1000, 'unité', 0.12, 'Entrepôt Stock', 'LOT-COM-2024-11'),
    ('Bandes Élastiques 10cm', 'Bandages de contention', 'INV-20241120-BAN100', cat_medicaments, fournisseur5, 8200, 300, 3000, 600, 'rouleau', 0.85, 'Entrepôt Stock', 'LOT-BAN-2024-10');

  -- ========== CONSOMMABLES MÉDICAUX (15 articles) ==========

  INSERT INTO inventory_items (name, description, sku, category_id, supplier_id, current_quantity, min_quantity, max_quantity, reorder_point, unit, unit_price, location, batch_number)
  VALUES
    ('Seringues 10ml avec aiguille', 'Usage unique stérile', 'INV-20241120-SER010', cat_consommables, fournisseur2, 3500, 1000, 10000, 2000, 'unité', 0.35, 'Stock Consommables A', 'LOT-SYR-2024-09'),
    ('Gants Latex M (Boîte 100)', 'Gants d''examen non poudrés', 'INV-20241120-GLA100', cat_consommables, fournisseur5, 850, 200, 2000, 400, 'boîte', 8.50, 'Stock Consommables B', 'LOT-GLV-2024-10'),
    ('Cathéters IV 18G', 'Cathéter veineux périphérique', 'INV-20241120-CAT018', cat_consommables, fournisseur2, 450, 100, 1000, 200, 'unité', 1.20, 'Salle Soins', 'LOT-CAT-2024-10'),
    ('Masques Chirurgicaux (Boîte 50)', 'Masques à 3 plis', 'INV-20241120-MAS050', cat_consommables, fournisseur5, 1200, 300, 3000, 600, 'boîte', 12.00, 'Stock EPI', 'LOT-MSK-2024-11'),
    ('Aiguilles 21G x 40mm', 'Aiguilles intramusculaires', 'INV-20241120-AIG210', cat_consommables, fournisseur2, 2800, 500, 5000, 1000, 'unité', 0.15, 'Stock Consommables A', 'LOT-NDL-2024-10'),
    ('Pansements Adhésifs 10x8cm', 'Pansements stériles', 'INV-20241120-PAN108', cat_consommables, fournisseur5, 1500, 400, 4000, 800, 'unité', 0.45, 'Salle Soins', 'LOT-BND-2024-11'),
    ('Draps d''Examen 50x38cm', 'Draps papier jetables', 'INV-20241120-DRA050', cat_consommables, fournisseur5, 25, 80, 800, 150, 'rouleau', 15.50, 'Consultations', 'LOT-SHT-2024-09'),
    ('Sondes Urinaires CH14', 'Sondes vésicales Foley', 'INV-20241120-SON014', cat_consommables, fournisseur2, 65, 50, 500, 100, 'unité', 2.80, 'Bloc Opératoire', 'LOT-CTH-2024-10'),
    ('Tubes Prélèvement EDTA 5ml', 'Tubes hématologie violet', 'INV-20241120-TUB005', cat_consommables, fournisseur4, 1800, 300, 3000, 600, 'unité', 0.55, 'Laboratoire Stock', 'LOT-TUB-2024-11'),
    ('Compresses Non Stériles', 'Compresses hydrophiles', 'INV-20241120-CNS001', cat_consommables, fournisseur5, 5200, 500, 5000, 1000, 'paquet', 2.20, 'Entrepôt', 'LOT-GZE-2024-10'),
    ('Sets de Perfusion Gravity', 'Ligne de perfusion standard', 'INV-20241120-SET001', cat_consommables, fournisseur2, 380, 200, 2000, 400, 'unité', 1.50, 'Stock Perfusions', 'LOT-IVS-2024-10'),
    ('Abaisse-langues Bois', 'Spatules jetables', 'INV-20241120-ABA001', cat_consommables, fournisseur5, 0, 500, 5000, 1000, 'boîte', 3.50, 'Consultations', 'LOT-TSP-2024-08'),
    ('Poches Urine 2L', 'Poches collecte urines', 'INV-20241120-POU002', cat_consommables, fournisseur2, 95, 80, 800, 150, 'unité', 2.10, 'Bloc Opératoire', 'LOT-URB-2024-10'),
    ('Champs Opératoires Stériles', 'Champs chirurgicaux jetables', 'INV-20241120-CHA001', cat_consommables, fournisseur5, 120, 50, 500, 100, 'unité', 5.80, 'Bloc Opératoire', 'LOT-DRP-2024-11'),
    ('Sparadraps 5cm x 5m', 'Adhésif médical hypoallergénique', 'INV-20241120-SPA050', cat_consommables, fournisseur5, 650, 150, 1500, 300, 'rouleau', 1.85, 'Salle Soins', 'LOT-TPE-2024-10');

  -- ========== ÉQUIPEMENTS MÉDICAUX (10 articles) ==========

  INSERT INTO inventory_items (name, description, sku, category_id, supplier_id, current_quantity, min_quantity, max_quantity, reorder_point, unit, unit_price, location, batch_number)
  VALUES
    ('Thermomètre Digital', 'Thermomètre médical frontal', 'INV-20241120-THE001', cat_equipements, fournisseur3, 45, 20, 100, 30, 'unité', 25.00, 'Consultations', 'DEV-THM-2024-08'),
    ('Tensiomètre Automatique', 'Appareil mesure tension artérielle', 'INV-20241120-TEN001', cat_equipements, fournisseur3, 28, 15, 80, 25, 'unité', 85.00, 'Consultations', 'DEV-TEN-2024-09'),
    ('Stéthoscope Littmann Classic', 'Stéthoscope professionnel', 'INV-20241120-STE001', cat_equipements, fournisseur3, 35, 20, 100, 30, 'unité', 120.00, 'Consultations', 'DEV-STH-2024-10'),
    ('Otoscope Diagnostic', 'Examen oreilles avec fibres optiques', 'INV-20241120-OTO001', cat_equipements, fournisseur3, 12, 10, 50, 15, 'unité', 180.00, 'ORL', 'DEV-OTO-2024-09'),
    ('Glucomètre + Lancettes', 'Lecteur glycémie avec accessoires', 'INV-20241120-GLU001', cat_equipements, fournisseur3, 18, 15, 80, 25, 'kit', 55.00, 'Diabétologie', 'DEV-GLU-2024-10'),
    ('Oxymètre de Pouls', 'Mesure saturation oxygène', 'INV-20241120-OXY001', cat_equipements, fournisseur3, 22, 20, 100, 30, 'unité', 45.00, 'Urgences', 'DEV-OXI-2024-11'),
    ('Lampe d''Examen LED', 'Éclairage médical mobile', 'INV-20241120-LAM001', cat_equipements, fournisseur3, 8, 5, 30, 10, 'unité', 320.00, 'Consultations', 'DEV-LMP-2024-08'),
    ('Défibrillateur Automatique', 'DEA avec électrodes adultes', 'INV-20241120-DEF001', cat_equipements, fournisseur3, 3, 2, 10, 3, 'unité', 2500.00, 'Urgences', 'DEV-AED-2024-07'),
    ('Nébuliseur Portable', 'Inhalateur pour aérosols', 'INV-20241120-NEB001', cat_equipements, fournisseur3, 15, 10, 50, 15, 'unité', 95.00, 'Pneumologie', 'DEV-NEB-2024-10'),
    ('Marteau Réflexes Babinski', 'Outil examen neurologique', 'INV-20241120-MAR001', cat_equipements, fournisseur3, 25, 10, 50, 15, 'unité', 15.00, 'Neurologie', 'DEV-RFX-2024-11');

  -- ========== LABORATOIRE (5 articles) ==========

  INSERT INTO inventory_items (name, description, sku, category_id, supplier_id, current_quantity, min_quantity, max_quantity, reorder_point, unit, unit_price, location, batch_number)
  VALUES
    ('Réactif Glucose GOD-PAP', 'Kit dosage glucose enzymatique', 'INV-20241120-REA001', cat_laboratoire, fournisseur4, 15, 10, 100, 20, 'kit', 125.00, 'Laboratoire Biochimie', 'REA-GLU-2024-10'),
    ('Lames Microscope 76x26mm', 'Lames verre porte-objet', 'INV-20241120-LAM002', cat_laboratoire, fournisseur4, 850, 200, 2000, 400, 'boîte', 12.50, 'Laboratoire Micro', 'LAB-SLD-2024-11'),
    ('Lamelles Couvre-Objet', 'Lamelles 22x22mm', 'INV-20241120-LAM003', cat_laboratoire, fournisseur4, 1200, 300, 3000, 600, 'boîte', 8.00, 'Laboratoire Micro', 'LAB-CVR-2024-11'),
    ('Pipettes Pasteur Plastique', 'Pipettes jetables graduées 3ml', 'INV-20241120-PIP001', cat_laboratoire, fournisseur4, 4500, 500, 5000, 1000, 'unité', 0.25, 'Laboratoire Stock', 'LAB-PIP-2024-10'),
    ('Réactif Hémoglobine HiCN', 'Dosage hémoglobine cyanméthémoglobine', 'INV-20241120-REA002', cat_laboratoire, fournisseur4, 8, 12, 80, 20, 'kit', 98.00, 'Laboratoire Hémato', 'REA-HGB-2024-09');

  -- ========== HYGIÈNE (5 articles) ==========

  INSERT INTO inventory_items (name, description, sku, category_id, supplier_id, current_quantity, min_quantity, max_quantity, reorder_point, unit, unit_price, location, batch_number)
  VALUES
    ('Solution Hydroalcoolique 5L', 'Désinfectant mains SHA', 'INV-20241120-SHA005', cat_hygiene, fournisseur5, 85, 50, 500, 100, 'bidon', 28.00, 'Stock Hygiène', 'HYG-SHA-2024-11'),
    ('Eau de Javel 12° 5L', 'Désinfectant surfaces concentré', 'INV-20241120-JAV005', cat_hygiene, fournisseur5, 120, 80, 800, 150, 'bidon', 8.50, 'Entretien', 'HYG-BLC-2024-10'),
    ('Savon Antiseptique Bétadine 500ml', 'Solution moussante iodée', 'INV-20241120-SAV500', cat_hygiene, fournisseur5, 45, 30, 300, 60, 'flacon', 12.50, 'Bloc Opératoire', 'HYG-BET-2024-10'),
    ('Sacs Poubelles DASRI 50L', 'Sacs déchets médicaux', 'INV-20241120-SAC050', cat_hygiene, fournisseur5, 650, 200, 2000, 400, 'rouleau', 18.00, 'Stock Hygiène', 'HYG-WST-2024-11'),
    ('Lingettes Désinfectantes', 'Lingettes surfaces médicales', 'INV-20241120-LIN001', cat_hygiene, fournisseur5, 280, 100, 1000, 200, 'boîte', 15.50, 'Entretien', 'HYG-WIP-2024-10');

END $$;

-- ============================================================================
-- 4. MOUVEMENTS DE STOCK HISTORIQUES (30 derniers jours)
-- ============================================================================

-- Générer des mouvements variés pour simuler l'activité
DO $$
DECLARE
  item_record RECORD;
  movement_date timestamp;
  i integer;
BEGIN
  -- Pour chaque article, générer 2-5 mouvements historiques
  FOR item_record IN
    SELECT id, name, current_quantity, unit
    FROM inventory_items
    WHERE sku LIKE 'INV-20241120-%'
    LIMIT 20  -- Limiter pour performance
  LOOP
    -- Générer 3-4 mouvements aléatoires
    FOR i IN 1..3 LOOP
      movement_date := CURRENT_TIMESTAMP - (random() * INTERVAL '30 days');

      -- Type de mouvement aléatoire
      CASE (random() * 4)::integer
        WHEN 0 THEN -- Entrée
          INSERT INTO stock_movements (
            item_id, movement_type, quantity, previous_quantity, new_quantity,
            reason, reference_number, created_at
          ) VALUES (
            item_record.id,
            'entry',
            (50 + random() * 200)::integer,
            (item_record.current_quantity - 100)::integer,
            item_record.current_quantity,
            'Réception fournisseur',
            'BL-2024-' || LPAD((random() * 999)::integer::text, 3, '0'),
            movement_date
          );
        WHEN 1 THEN -- Sortie
          INSERT INTO stock_movements (
            item_id, movement_type, quantity, previous_quantity, new_quantity,
            reason, created_at
          ) VALUES (
            item_record.id,
            'exit',
            (10 + random() * 50)::integer,
            (item_record.current_quantity + 50)::integer,
            item_record.current_quantity,
            'Distribution service urgences',
            movement_date
          );
        WHEN 2 THEN -- Ajustement
          INSERT INTO stock_movements (
            item_id, movement_type, quantity, previous_quantity, new_quantity,
            reason, notes, created_at
          ) VALUES (
            item_record.id,
            'adjustment',
            item_record.current_quantity,
            (item_record.current_quantity + (random() * 20 - 10))::integer,
            item_record.current_quantity,
            'Inventaire physique mensuel',
            'Écart d''inventaire corrigé',
            movement_date
          );
        ELSE -- Transfert
          INSERT INTO stock_movements (
            item_id, movement_type, quantity, previous_quantity, new_quantity,
            reason, source_location, destination_location, created_at
          ) VALUES (
            item_record.id,
            'transfer',
            (5 + random() * 20)::integer,
            (item_record.current_quantity + 15)::integer,
            item_record.current_quantity,
            'Transfert inter-services',
            'Entrepôt Principal',
            'Pharmacie Service',
            movement_date
          );
      END CASE;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- 5. ALERTES DE DÉMONSTRATION (Tous types et sévérités)
-- ============================================================================

-- Les alertes seront générées automatiquement par les triggers
-- Forcer quelques alertes manuelles pour démonstration complète

DO $$
DECLARE
  item_epuise uuid;
  item_critique uuid;
  item_faible uuid;
  item_expire uuid;
  item_surstock uuid;
BEGIN
  -- Récupérer quelques articles pour alertes
  SELECT id INTO item_epuise FROM inventory_items WHERE current_quantity = 0 AND sku LIKE 'INV-20241120-%' LIMIT 1;
  SELECT id INTO item_critique FROM inventory_items WHERE current_quantity < 15 AND current_quantity > 0 AND sku LIKE 'INV-20241120-%' LIMIT 1;
  SELECT id INTO item_faible FROM inventory_items WHERE current_quantity BETWEEN 20 AND 50 AND sku LIKE 'INV-20241120-%' LIMIT 1;
  SELECT id INTO item_expire FROM inventory_items WHERE expiry_date < CURRENT_DATE AND sku LIKE 'INV-20241120-%' LIMIT 1;
  SELECT id INTO item_surstock FROM inventory_items WHERE current_quantity > max_quantity AND sku LIKE 'INV-20241120-%' LIMIT 1;

  -- Insérer alertes si articles trouvés
  IF item_epuise IS NOT NULL THEN
    INSERT INTO logistics_stock_alerts (item_id, alert_type, severity, message, is_active)
    VALUES (item_epuise, 'out_of_stock', 'critical', 'Stock complètement épuisé - Rupture totale', true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF item_critique IS NOT NULL THEN
    INSERT INTO logistics_stock_alerts (item_id, alert_type, severity, message, is_active)
    VALUES (item_critique, 'critical_stock', 'critical', 'Stock critique - Moins de 50% du minimum requis', true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF item_faible IS NOT NULL THEN
    INSERT INTO logistics_stock_alerts (item_id, alert_type, severity, message, is_active)
    VALUES (item_faible, 'low_stock', 'high', 'Stock faible - En dessous du seuil minimum', true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF item_expire IS NOT NULL THEN
    INSERT INTO logistics_stock_alerts (item_id, alert_type, severity, message, is_active)
    VALUES (item_expire, 'expired', 'high', 'Produit expiré - Retrait immédiat requis', true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF item_surstock IS NOT NULL THEN
    INSERT INTO logistics_stock_alerts (item_id, alert_type, severity, message, is_active)
    VALUES (item_surstock, 'overstocked', 'low', 'Surstock détecté - Quantité dépasse le maximum', true)
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

-- ============================================================================
-- 6. RÉSUMÉ DES DONNÉES GÉNÉRÉES
-- ============================================================================

SELECT
  'Données de démonstration générées avec succès!' as message,
  (SELECT COUNT(*) FROM suppliers WHERE name LIKE 'Demo%') as fournisseurs,
  (SELECT COUNT(*) FROM inventory_items WHERE sku LIKE 'INV-20241120-%') as articles_inventaire,
  (SELECT COUNT(*) FROM stock_movements WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days') as mouvements_30j,
  (SELECT COUNT(*) FROM logistics_stock_alerts WHERE is_active = true) as alertes_actives;
