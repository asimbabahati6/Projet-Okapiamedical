-- Script pour ajouter 20 membres du personnel médical fictifs
-- Inclut médecins, infirmiers, pharmaciens, sages-femmes et autres

DO $$
DECLARE
  v_user_id uuid;
  v_role_id uuid;
  v_staff_statuses text[] := ARRAY['available', 'busy', 'on_call', 'in_surgery', 'in_consultation', 'off_duty', 'on_leave'];
  v_staff_types text[] := ARRAY['medecin', 'infirmier', 'pharmacien', 'sage_femme', 'anesthesiste', 'radiologue'];
  v_specializations text[] := ARRAY['Cardiologie', 'Pédiatrie', 'Chirurgie Générale', 'Orthopédie', 'Neurologie', 'Dermatologie', 'Ophtalmologie', 'ORL', 'Gynécologie', 'Psychiatrie'];
  v_names text[] := ARRAY[
    'Dr. Sophie Martin', 'Dr. Jean Dubois', 'Dr. Marie Lefebvre', 'Dr. Pierre Moreau', 'Dr. Claire Bernard',
    'Inf. Antoine Petit', 'Inf. Isabelle Roux', 'Inf. Lucas Garnier', 'Inf. Emma Rousseau', 'Inf. Thomas Girard',
    'Pharm. Julie Simon', 'Pharm. Nicolas Laurent', 'SF. Camille Michel', 'SF. Sarah Lefèvre', 'Dr. Alexandre Fontaine',
    'Dr. Léa Mercier', 'Inf. Maxime Blanc', 'Dr. Chloé Garnier', 'Dr. Hugo Bonnet', 'Inf. Manon Dupont'
  ];
  v_emails text[] := ARRAY[
    'sophie.martin@hospital.cd', 'jean.dubois@hospital.cd', 'marie.lefebvre@hospital.cd', 'pierre.moreau@hospital.cd', 'claire.bernard@hospital.cd',
    'antoine.petit@hospital.cd', 'isabelle.roux@hospital.cd', 'lucas.garnier@hospital.cd', 'emma.rousseau@hospital.cd', 'thomas.girard@hospital.cd',
    'julie.simon@hospital.cd', 'nicolas.laurent@hospital.cd', 'camille.michel@hospital.cd', 'sarah.lefevre@hospital.cd', 'alexandre.fontaine@hospital.cd',
    'lea.mercier@hospital.cd', 'maxime.blanc@hospital.cd', 'chloe.garnier@hospital.cd', 'hugo.bonnet@hospital.cd', 'manon.dupont@hospital.cd'
  ];
  v_phones text[] := ARRAY[
    '+243 81 123 4501', '+243 81 123 4502', '+243 81 123 4503', '+243 81 123 4504', '+243 81 123 4505',
    '+243 81 123 4506', '+243 81 123 4507', '+243 81 123 4508', '+243 81 123 4509', '+243 81 123 4510',
    '+243 81 123 4511', '+243 81 123 4512', '+243 81 123 4513', '+243 81 123 4514', '+243 81 123 4515',
    '+243 81 123 4516', '+243 81 123 4517', '+243 81 123 4518', '+243 81 123 4519', '+243 81 123 4520'
  ];
  v_counter integer := 1;
  v_staff_type text;
  v_category text;
BEGIN
  -- Récupérer l'ID du rôle "medecin" pour les médecins
  SELECT id INTO v_role_id FROM roles WHERE name = 'medecin' LIMIT 1;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Role medecin not found';
  END IF;

  FOREACH v_user_id IN ARRAY ARRAY[
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
  ]
  LOOP
    -- Déterminer le type de personnel selon le compteur
    IF v_counter <= 8 THEN
      v_staff_type := 'medecin';
      v_category := 'medical';
    ELSIF v_counter <= 13 THEN
      v_staff_type := 'infirmier';
      v_category := 'medical';
    ELSIF v_counter <= 15 THEN
      v_staff_type := 'pharmacien';
      v_category := 'pharmaceutical';
    ELSIF v_counter <= 17 THEN
      v_staff_type := 'sage_femme';
      v_category := 'medical';
    ELSIF v_counter = 18 THEN
      v_staff_type := 'anesthesiste';
      v_category := 'medical';
    ELSIF v_counter = 19 THEN
      v_staff_type := 'radiologue';
      v_category := 'medical';
    ELSE
      v_staff_type := 'medecin';
      v_category := 'medical';
    END IF;

    -- Créer le profil utilisateur
    INSERT INTO user_profiles (id, email, full_name, phone, role_id, date_of_birth, address, city, country)
    VALUES (
      v_user_id,
      v_emails[v_counter],
      v_names[v_counter],
      v_phones[v_counter],
      v_role_id,
      NOW() - INTERVAL '25 years' - (v_counter * INTERVAL '2 years'),
      v_counter || ' Avenue de la Santé',
      'Kinshasa',
      'RDC'
    );

    -- Créer l'entrée medical_staff
    INSERT INTO medical_staff (
      id,
      staff_type,
      staff_category,
      license_number,
      rpps_number,
      adeli_number,
      specialization,
      years_of_experience,
      consultation_fee,
      bio,
      is_accepting_patients,
      telemedicine_enabled,
      average_rating,
      total_ratings,
      current_status,
      professional_email,
      professional_phone,
      languages_spoken,
      practice_mode,
      billing_sector,
      can_prescribe_controlled_substances,
      professional_insurance_company,
      professional_insurance_number,
      professional_insurance_expiry,
      max_daily_appointments,
      average_consultation_duration,
      emergency_availability,
      accepts_walk_ins,
      can_work_nights,
      can_work_weekends
    ) VALUES (
      v_user_id,
      v_staff_type,
      v_category,
      'LIC-' || LPAD(v_counter::text, 6, '0'),
      CASE WHEN v_staff_type = 'medecin' THEN 'RPPS-' || LPAD((10000 + v_counter)::text, 11, '0') ELSE NULL END,
      CASE WHEN v_staff_type IN ('infirmier', 'sage_femme') THEN 'ADELI-' || LPAD((20000 + v_counter)::text, 9, '0') ELSE NULL END,
      CASE
        WHEN v_staff_type = 'medecin' THEN v_specializations[(v_counter % 10) + 1]
        WHEN v_staff_type = 'infirmier' THEN CASE (v_counter % 3) WHEN 0 THEN 'Soins Intensifs' WHEN 1 THEN 'Pédiatrie' ELSE 'Urgences' END
        WHEN v_staff_type = 'pharmacien' THEN 'Pharmacie Hospitalière'
        WHEN v_staff_type = 'sage_femme' THEN 'Maternité'
        WHEN v_staff_type = 'anesthesiste' THEN 'Anesthésie-Réanimation'
        WHEN v_staff_type = 'radiologue' THEN 'Radiologie et Imagerie'
        ELSE NULL
      END,
      5 + (v_counter % 20),  -- Entre 5 et 24 ans d'expérience
      CASE
        WHEN v_staff_type = 'medecin' THEN 50 + (v_counter * 5)
        WHEN v_staff_type = 'infirmier' THEN 25 + (v_counter * 2)
        WHEN v_staff_type = 'pharmacien' THEN 40 + (v_counter * 3)
        WHEN v_staff_type = 'sage_femme' THEN 35 + (v_counter * 2)
        ELSE 60 + (v_counter * 4)
      END,
      'Professionnel de santé expérimenté et dévoué avec une approche centrée sur le patient. Spécialisé dans les soins de qualité et l''écoute attentive.',
      (v_counter % 4) != 0,  -- 75% acceptent de nouveaux patients
      (v_counter % 3) = 0,   -- 33% font de la télémédecine
      4.0 + (random() * 1.0),  -- Note entre 4.0 et 5.0
      10 + (v_counter * 5),    -- Entre 10 et 110 avis
      v_staff_statuses[(v_counter % 7) + 1],
      v_emails[v_counter],
      v_phones[v_counter],
      ARRAY['fr', 'ln']::text[],  -- Français et Lingala
      CASE (v_counter % 2) WHEN 0 THEN 'salarie' ELSE 'liberal' END,
      CASE (v_counter % 3) WHEN 0 THEN 'sector_1' WHEN 1 THEN 'sector_2' ELSE 'sector_3' END,
      v_staff_type = 'medecin',
      'Assurance Médicale Internationale',
      'INS-' || LPAD(v_counter::text, 8, '0'),
      NOW()::date + INTERVAL '1 year' + (v_counter * INTERVAL '30 days'),
      15 + (v_counter % 20),  -- Entre 15 et 34 RDV par jour
      20 + ((v_counter % 4) * 10),  -- 20, 30, 40 ou 50 minutes
      (v_counter % 5) = 0,  -- 20% disponibles pour urgences
      (v_counter % 3) = 0,  -- 33% acceptent sans RDV
      (v_counter % 2) = 0,  -- 50% peuvent travailler de nuit
      (v_counter % 3) != 0  -- 66% peuvent travailler le weekend
    );

    v_counter := v_counter + 1;
  END LOOP;

  RAISE NOTICE '20 membres du personnel médical fictifs créés avec succès!';
END $$;
