-- Insert 20 Fictional Patient Records
-- This script generates complete patient profiles for testing and development

DO $$
DECLARE
  doctor_ids uuid[] := ARRAY(SELECT id FROM medical_staff LIMIT 5);
  patient_id uuid;
  base_number integer := 6041001;
BEGIN
  -- Patient 1: Jean Mwanza
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041001', 'Jean', 'Mwanza', '1980-03-15', 'male', 'O+',
    '+243 998 456 789', 'jean.mwanza45@gmail.com', 'Avenue Kasa-Vubu 125', 'Kinshasa',
    'Marie Kabila', '+243 997 654 321', 'Épouse',
    'SONAS', 'INS-345678', ARRAY['Pénicilline', 'Arachides'], ARRAY['Hypertension'],
    CASE WHEN array_length(doctor_ids, 1) > 0 THEN doctor_ids[1] ELSE NULL END
  );

  -- Patient 2: Sophie Kasongo
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041002', 'Sophie', 'Kasongo', '1992-07-22', 'female', 'A+',
    '+243 899 123 456', 'sophie.kasongo89@yahoo.fr', 'Boulevard du 30 Juin 456', 'Lubumbashi',
    'Pierre Mukendi', '+243 898 987 654', 'Époux',
    'Générale Assurances', 'INS-567890', ARRAY['Lactose'], ARRAY['Diabète Type 2'],
    CASE WHEN array_length(doctor_ids, 1) > 1 THEN doctor_ids[2] ELSE NULL END
  );

  -- Patient 3: André Tshisekedi
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041003', 'André', 'Tshisekedi', '1975-11-08', 'male', 'B+',
    '+243 999 234 567', 'andre.tshisekedi23@hotmail.com', 'Avenue de la Libération 78', 'Mbuji-Mayi',
    'Jeanne Nkulu', '+243 998 876 543', 'Mère',
    'RAWSUR', 'INS-789012', ARRAY['Pollen', 'Acariens'], ARRAY['Asthme'],
    CASE WHEN array_length(doctor_ids, 1) > 2 THEN doctor_ids[3] ELSE NULL END
  );

  -- Patient 4: Claire Ilunga
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041004', 'Claire', 'Ilunga', '1988-05-19', 'female', 'AB-',
    '+243 998 345 678', 'claire.ilunga67@gmail.com', 'Rue Tabora 234', 'Kananga',
    'François Kalala', '+243 997 765 432', 'Frère',
    'SORAS', 'INS-234567', ARRAY['Aspirine'], '{}',
    CASE WHEN array_length(doctor_ids, 1) > 3 THEN doctor_ids[4] ELSE NULL END
  );

  -- Patient 5: Michel Mulamba
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041005', 'Michel', 'Mulamba', '1965-09-30', 'male', 'A-',
    '+243 899 456 789', 'michel.mulamba12@outlook.com', 'Avenue Wagenia 567', 'Kisangani',
    'Anne Ndala', '+243 898 654 321', 'Épouse',
    'AXA Congo', 'INS-456789', ARRAY['Fruits de mer'], ARRAY['Hypertension', 'Diabète Type 2'],
    CASE WHEN array_length(doctor_ids, 1) > 4 THEN doctor_ids[5] ELSE NULL END
  );

  -- Patient 6: Émilie Kabongo
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041006', 'Émilie', 'Kabongo', '1995-12-11', 'female', 'O-',
    '+243 997 567 890', 'emilie.kabongo34@email.com', 'Rue Lukusa 890', 'Goma',
    'Jacques Mpiana', '+243 999 543 210', 'Père',
    'Allianz Congo', 'INS-678901', ARRAY['Œufs'], ARRAY['Arthrite'],
    CASE WHEN array_length(doctor_ids, 1) > 0 THEN doctor_ids[1] ELSE NULL END
  );

  -- Patient 7: Paul Kikwit
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041007', 'Paul', 'Kikwit', '1983-04-25', 'male', 'B-',
    '+243 998 678 901', 'paul.kikwit56@gmail.com', 'Avenue Sendwe 123', 'Bukavu',
    'Catherine Luboya', '+243 997 432 109', 'Sœur',
    'SECOR', 'INS-890123', '{}', '{}',
    CASE WHEN array_length(doctor_ids, 1) > 1 THEN doctor_ids[2] ELSE NULL END
  );

  -- Patient 8: Isabelle Muteba
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041008', 'Isabelle', 'Muteba', '1990-08-17', 'female', 'AB+',
    '+243 899 789 012', 'isabelle.muteba78@yahoo.fr', 'Boulevard Lumumba 456', 'Matadi',
    'David Kamanda', '+243 898 321 098', 'Ami(e)',
    'SOGECA', 'INS-012345', ARRAY['Poussière'], ARRAY['Migraine chronique'],
    CASE WHEN array_length(doctor_ids, 1) > 2 THEN doctor_ids[3] ELSE NULL END
  );

  -- Patient 9: Thomas Ngoy
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041009', 'Thomas', 'Ngoy', '1978-02-14', 'male', 'A+',
    '+243 997 890 123', 'thomas.ngoy91@hotmail.com', 'Rue Colonel Ebeya 789', 'Kolwezi',
    'Lucie Kayembe', '+243 999 210 987', 'Fille',
    'CONGO ASSURANCES', 'INS-135790', '{}', '{}',
    CASE WHEN array_length(doctor_ids, 1) > 3 THEN doctor_ids[4] ELSE NULL END
  );

  -- Patient 10: Nathalie Mobutu
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041010', 'Nathalie', 'Mobutu', '1987-10-03', 'female', 'O+',
    '+243 998 901 234', 'nathalie.mobutu43@gmail.com', 'Avenue Kabinda 234', 'Kikwit',
    'Antoine Lumumba', '+243 997 109 876', 'Fils',
    'Auto-assuré', 'INS-246801', ARRAY['Pénicilline', 'Arachides'], ARRAY['Hypertension'],
    CASE WHEN array_length(doctor_ids, 1) > 4 THEN doctor_ids[5] ELSE NULL END
  );

  -- Patient 11: Daniel Kabila
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041011', 'Daniel', 'Kabila', '1972-06-28', 'male', 'B+',
    '+243 899 012 345', 'daniel.kabila25@email.com', 'Rue Kisangani 567', 'Kinshasa',
    'Hélène Tshisekedi', '+243 898 998 765', 'Épouse',
    'SONAS', 'INS-357902', ARRAY['Lactose'], ARRAY['Diabète Type 2'],
    CASE WHEN array_length(doctor_ids, 1) > 0 THEN doctor_ids[1] ELSE NULL END
  );

  -- Patient 12: Charlotte Mukendi
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041012', 'Charlotte', 'Mukendi', '1993-01-20', 'female', 'A-',
    '+243 997 123 456', 'charlotte.mukendi67@yahoo.fr', 'Avenue Mobutu 890', 'Lubumbashi',
    'Emmanuel Kasongo', '+243 999 876 543', 'Frère',
    'Générale Assurances', 'INS-468013', ARRAY['Pollen', 'Acariens'], ARRAY['Asthme'],
    CASE WHEN array_length(doctor_ids, 1) > 1 THEN doctor_ids[2] ELSE NULL END
  );

  -- Patient 13: Marc Nkulu
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041013', 'Marc', 'Nkulu', '1985-09-05', 'male', 'AB-',
    '+243 998 234 567', 'marc.nkulu89@outlook.com', 'Avenue Kasa-Vubu 345', 'Mbuji-Mayi',
    'Françoise Ilunga', '+243 997 765 432', 'Mère',
    'RAWSUR', 'INS-579124', ARRAY['Aspirine'], '{}',
    CASE WHEN array_length(doctor_ids, 1) > 2 THEN doctor_ids[3] ELSE NULL END
  );

  -- Patient 14: Céline Kalala
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041014', 'Céline', 'Kalala', '1996-11-12', 'female', 'O-',
    '+243 899 345 678', 'celine.kalala12@gmail.com', 'Boulevard du 30 Juin 678', 'Kananga',
    'Joseph Mulamba', '+243 898 654 321', 'Père',
    'SORAS', 'INS-680235', ARRAY['Fruits de mer'], ARRAY['Hypertension', 'Diabète Type 2'],
    CASE WHEN array_length(doctor_ids, 1) > 3 THEN doctor_ids[4] ELSE NULL END
  );

  -- Patient 15: Jacques Ndala
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041015', 'Jacques', 'Ndala', '1970-03-27', 'male', 'A+',
    '+243 997 456 789', 'jacques.ndala34@email.com', 'Avenue de la Libération 901', 'Kisangani',
    'Élise Kabongo', '+243 999 543 210', 'Épouse',
    'AXA Congo', 'INS-791346', ARRAY['Œufs'], ARRAY['Arthrite'],
    CASE WHEN array_length(doctor_ids, 1) > 4 THEN doctor_ids[5] ELSE NULL END
  );

  -- Patient 16: Anne Mpiana
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041016', 'Anne', 'Mpiana', '1991-07-09', 'female', 'B-',
    '+243 998 567 890', 'anne.mpiana56@yahoo.fr', 'Rue Tabora 456', 'Goma',
    'Marcel Kikwit', '+243 997 432 109', 'Sœur',
    'Allianz Congo', 'INS-902457', '{}', '{}',
    CASE WHEN array_length(doctor_ids, 1) > 0 THEN doctor_ids[1] ELSE NULL END
  );

  -- Patient 17: François Luboya
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041017', 'François', 'Luboya', '1982-12-16', 'male', 'AB+',
    '+243 899 678 901', 'francois.luboya78@hotmail.com', 'Avenue Wagenia 789', 'Bukavu',
    'Sophie Muteba', '+243 898 321 098', 'Ami(e)',
    'SECOR', 'INS-013568', ARRAY['Poussière'], ARRAY['Migraine chronique'],
    CASE WHEN array_length(doctor_ids, 1) > 1 THEN doctor_ids[2] ELSE NULL END
  );

  -- Patient 18: Marie Kamanda
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041018', 'Marie', 'Kamanda', '1989-05-23', 'female', 'O+',
    '+243 997 789 012', 'marie.kamanda91@gmail.com', 'Rue Lukusa 234', 'Matadi',
    'Pierre Ngoy', '+243 999 210 987', 'Fils',
    'SOGECA', 'INS-124679', '{}', '{}',
    CASE WHEN array_length(doctor_ids, 1) > 2 THEN doctor_ids[3] ELSE NULL END
  );

  -- Patient 19: Antoine Kayembe
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041019', 'Antoine', 'Kayembe', '1976-08-31', 'male', 'A-',
    '+243 998 890 123', 'antoine.kayembe43@email.com', 'Avenue Sendwe 567', 'Kolwezi',
    'Jeanne Mobutu', '+243 997 109 876', 'Fille',
    'CONGO ASSURANCES', 'INS-235780', ARRAY['Pénicilline', 'Arachides'], ARRAY['Hypertension'],
    CASE WHEN array_length(doctor_ids, 1) > 3 THEN doctor_ids[4] ELSE NULL END
  );

  -- Patient 20: Lucie Lumumba
  INSERT INTO patients (
    patient_number, first_name, last_name, date_of_birth, gender, blood_group,
    phone, email, address, city,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    insurance_provider, insurance_number, allergies, chronic_conditions, primary_care_physician_id
  ) VALUES (
    'PAT-6041020', 'Lucie', 'Lumumba', '1994-04-18', 'female', 'B+',
    '+243 899 901 234', 'lucie.lumumba25@yahoo.fr', 'Boulevard Lumumba 890', 'Kikwit',
    'Michel Kabila', '+243 898 998 765', 'Époux',
    'Auto-assuré', 'INS-346891', ARRAY['Lactose'], ARRAY['Diabète Type 2'],
    CASE WHEN array_length(doctor_ids, 1) > 4 THEN doctor_ids[5] ELSE NULL END
  );

  RAISE NOTICE 'Successfully inserted 20 fictional patients!';
END $$;

-- Display the inserted patients
SELECT
  patient_number,
  first_name || ' ' || last_name as full_name,
  EXTRACT(YEAR FROM AGE(date_of_birth)) as age,
  gender,
  blood_group,
  city,
  insurance_provider
FROM patients
WHERE patient_number LIKE 'PAT-60410%'
ORDER BY patient_number;
