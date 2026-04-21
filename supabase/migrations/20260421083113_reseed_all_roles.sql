/*
  # Re-seed All Roles

  Restores every role definition the application depends on after a full data wipe.

  ## Roles Inserted (28 total)
  - Core: super_admin, hospital_admin, doctor, nurse, pharmacist, receptionist
  - Medical: medical_director, dentist, physical_therapist
  - Admin: administrative_staff, administrative_director, hr_manager, finance_manager,
            operations_manager, information_systems_coordinator, administrative_officer,
            administrative_assistant
  - Operations: logistician, patient
  - Okapia-specific: directeur_general, medecin_chef_staff, gestionnaire, radio_chef,
                     lab_technician, caissiere, technique, radio_tech, hygiene

  All inserts use ON CONFLICT (name) DO NOTHING for idempotency.
*/

INSERT INTO roles (name, description, level) VALUES
  -- Core system roles
  ('super_admin',                    'Full system access and configuration',                                     1),
  ('hospital_admin',                 'Hospital operations and staff management',                                 2),
  ('medical_director',               'Médecin Directeur - Supervision médicale globale',                        2),
  ('doctor',                         'Medical consultations and patient care',                                   3),
  ('nurse',                          'Patient care and ward management',                                         4),
  ('pharmacist',                     'Medication dispensing and inventory',                                      5),
  ('receptionist',                   'Appointment scheduling and patient registration',                          6),
  -- Administrative roles
  ('administrative_staff',           'Administrative staff with access to administrative functions',             4),
  ('administrative_director',        'Administrative Director - Head of Administration Department',              2),
  ('hr_manager',                     'Human Resources Manager',                                                  3),
  ('finance_manager',                'Finance & Accounting Manager',                                             3),
  ('operations_manager',             'Operations & Facilities Manager',                                          3),
  ('information_systems_coordinator','Information Systems Coordinator',                                          3),
  ('administrative_officer',         'Administrative Officer - Various administrative functions',                4),
  ('administrative_assistant',       'Administrative Assistant - Support staff',                                 5),
  -- Specialised medical roles
  ('dentist',                        'Soins dentaires et santé bucco-dentaire',                                  3),
  ('physical_therapist',             'Kinésithérapie et rééducation fonctionnelle',                             3),
  -- Operations
  ('logistician',                    'Logisticien',                                                              2),
  ('patient',                        'Patient with access to personal medical records',                          6),
  -- Okapia-specific hierarchy
  ('directeur_general',              'Directeur Général - Autorité suprême avec accès complet',                 1),
  ('medecin_chef_staff',             'Médecin Chef de Staff - Supervision médicale',                            2),
  ('gestionnaire',                   'Gestionnaire - Gestion financière et RH',                                 3),
  ('radio_chef',                     'Chef Radiologie - Chef du département radiologie',                        4),
  ('lab_technician',                 'Technicien Laboratoire - Analyses médicales',                             5),
  ('caissiere',                      'Caissière - Opérations de caisse',                                        5),
  ('technique',                      'Technicien - Maintenance équipements',                                     5),
  ('radio_tech',                     'Technicien Radiologie - Technicien radiologie',                           5),
  ('hygiene',                        'Agent d''Hygiène - Nettoyage et hygiène',                                 6)
ON CONFLICT (name) DO NOTHING;
