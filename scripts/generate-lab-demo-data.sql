/*
  # Génération de données de démonstration pour le Laboratoire

  Ce script génère des données de test réalistes pour le module laboratoire :
  - 20 ordres d'analyse avec différents statuts
  - Différents niveaux d'urgence (routine, urgent, STAT)
  - Échantillons liés à des patients existants
  - Dates variées pour montrer l'activité
*/

-- Insertion de 20 ordres d'analyse avec des données réalistes
DO $$
DECLARE
  v_patient_ids UUID[];
  v_doctor_ids UUID[];
  v_test_names TEXT[] := ARRAY[
    'Numération Formule Sanguine (NFS)',
    'Glycémie à jeun',
    'Créatinine',
    'Bilan lipidique complet',
    'TSH (Thyroïde)',
    'Transaminases (ASAT, ALAT)',
    'Urée sanguine',
    'CRP (Protéine C-réactive)',
    'Hémoglobine glyquée (HbA1c)',
    'Ferritine',
    'Vitamine D',
    'Acide urique',
    'Électrophorèse des protéines',
    'Bilan hépatique complet',
    'Test sérologique VIH',
    'Test de grossesse (beta-hCG)',
    'Ionogramme sanguin',
    'Calcium sanguin',
    'Phosphatases alcalines',
    'Albumine sérique'
  ];
  v_statuses TEXT[] := ARRAY['prescribed', 'pending_sample', 'sample_received', 'in_progress', 'completed', 'validated'];
  v_urgencies TEXT[] := ARRAY['routine', 'routine', 'routine', 'urgent', 'stat'];
  v_patient_id UUID;
  v_doctor_id UUID;
  v_status TEXT;
  v_urgency TEXT;
  v_test_name TEXT;
  v_created_date TIMESTAMPTZ;
  i INTEGER;
BEGIN
  -- Récupérer des IDs de patients existants
  SELECT ARRAY_AGG(id) INTO v_patient_ids
  FROM patients
  LIMIT 10;

  -- Récupérer des IDs de médecins existants
  SELECT ARRAY_AGG(id) INTO v_doctor_ids
  FROM user_profiles
  WHERE role = 'doctor'
  LIMIT 5;

  -- Si pas assez de patients ou médecins, sortir
  IF array_length(v_patient_ids, 1) IS NULL OR array_length(v_doctor_ids, 1) IS NULL THEN
    RAISE NOTICE 'Pas assez de patients ou médecins dans la base';
    RETURN;
  END IF;

  -- Générer 20 ordres d'analyse
  FOR i IN 1..20 LOOP
    -- Sélectionner aléatoirement un patient, médecin, statut, urgence et test
    v_patient_id := v_patient_ids[1 + floor(random() * array_length(v_patient_ids, 1))];
    v_doctor_id := v_doctor_ids[1 + floor(random() * array_length(v_doctor_ids, 1))];
    v_status := v_statuses[1 + floor(random() * array_length(v_statuses, 1))];
    v_urgency := v_urgencies[1 + floor(random() * array_length(v_urgencies, 1))];
    v_test_name := v_test_names[i];

    -- Date aléatoire dans les 7 derniers jours
    v_created_date := NOW() - (random() * INTERVAL '7 days');

    INSERT INTO lab_orders (
      patient_id,
      prescribed_by,
      test_name,
      test_code,
      status,
      urgency,
      sample_type,
      clinical_info,
      created_at,
      updated_at
    ) VALUES (
      v_patient_id,
      v_doctor_id,
      v_test_name,
      'LAB-' || LPAD(i::TEXT, 4, '0'),
      v_status,
      v_urgency,
      CASE
        WHEN i % 3 = 0 THEN 'Sang'
        WHEN i % 3 = 1 THEN 'Urine'
        ELSE 'Sérum'
      END,
      'Bilan de routine - Contrôle annuel',
      v_created_date,
      CASE
        WHEN v_status IN ('completed', 'validated') THEN v_created_date + INTERVAL '2 hours'
        WHEN v_status = 'in_progress' THEN v_created_date + INTERVAL '1 hour'
        ELSE v_created_date
      END
    );
  END LOOP;

  RAISE NOTICE 'Insertion de 20 ordres d''analyse terminée avec succès';
END $$;

-- Vérification des données insérées
SELECT
  status,
  COUNT(*) as count
FROM lab_orders
GROUP BY status
ORDER BY
  CASE status
    WHEN 'prescribed' THEN 1
    WHEN 'pending_sample' THEN 2
    WHEN 'sample_received' THEN 3
    WHEN 'in_progress' THEN 4
    WHEN 'completed' THEN 5
    WHEN 'validated' THEN 6
  END;

SELECT
  urgency,
  COUNT(*) as count
FROM lab_orders
GROUP BY urgency;
