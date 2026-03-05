/*
  # Affectation des médecins aux départements
  
  ## Description
  Cette migration affecte les médecins disponibles aux départements correspondants
  en fonction de leurs spécialisations.
  
  ## Affectations
  1. Cardiologie interventionnelle -> Département Cardiologie
  2. Chirurgie générale -> Département Chirurgie
  3. Médecine générale -> Département Médecine Générale
  4. Chirurgie orthopédique -> Département Orthopédie
  5. Pédiatrie générale -> Département Pédiatrie
  
  ## Tables modifiées
  - doctor_departments : Ajout de 5 nouvelles affectations
*/

-- Affecter le cardiologue au département Cardiologie
INSERT INTO doctor_departments (
  doctor_id,
  department_id,
  is_active,
  assigned_at,
  created_at,
  updated_at
)
SELECT 
  '1ea2b700-6123-45e5-8850-38942f17566c'::uuid,
  'd7a27a55-728b-46c1-a4cd-92737a7e6862'::uuid,
  true,
  now(),
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM doctor_departments 
  WHERE doctor_id = '1ea2b700-6123-45e5-8850-38942f17566c'::uuid 
  AND department_id = 'd7a27a55-728b-46c1-a4cd-92737a7e6862'::uuid
);

-- Affecter le chirurgien général au département Chirurgie
INSERT INTO doctor_departments (
  doctor_id,
  department_id,
  is_active,
  assigned_at,
  created_at,
  updated_at
)
SELECT 
  '9a745185-9059-47ae-84ac-a88f9d34295b'::uuid,
  '29188c05-7910-4f5b-8ab5-d81228ed669e'::uuid,
  true,
  now(),
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM doctor_departments 
  WHERE doctor_id = '9a745185-9059-47ae-84ac-a88f9d34295b'::uuid 
  AND department_id = '29188c05-7910-4f5b-8ab5-d81228ed669e'::uuid
);

-- Affecter le médecin généraliste au département Médecine Générale
INSERT INTO doctor_departments (
  doctor_id,
  department_id,
  is_active,
  assigned_at,
  created_at,
  updated_at
)
SELECT 
  '5fe6a6c9-3306-484f-9525-c98793e5aff1'::uuid,
  '2308fcfd-b71b-4010-b926-f8a351ef7796'::uuid,
  true,
  now(),
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM doctor_departments 
  WHERE doctor_id = '5fe6a6c9-3306-484f-9525-c98793e5aff1'::uuid 
  AND department_id = '2308fcfd-b71b-4010-b926-f8a351ef7796'::uuid
);

-- Affecter le chirurgien orthopédique au département Orthopédie
INSERT INTO doctor_departments (
  doctor_id,
  department_id,
  is_active,
  assigned_at,
  created_at,
  updated_at
)
SELECT 
  '00967326-333a-4619-9142-ac3ba2a5bcb6'::uuid,
  '5503572a-6458-4e7c-b9d4-6ba1a9b47929'::uuid,
  true,
  now(),
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM doctor_departments 
  WHERE doctor_id = '00967326-333a-4619-9142-ac3ba2a5bcb6'::uuid 
  AND department_id = '5503572a-6458-4e7c-b9d4-6ba1a9b47929'::uuid
);

-- Affecter le pédiatre au département Pédiatrie
INSERT INTO doctor_departments (
  doctor_id,
  department_id,
  is_active,
  assigned_at,
  created_at,
  updated_at
)
SELECT 
  'c556b341-be26-4ef7-9f54-d3fadb5a0de5'::uuid,
  'd45c47be-a0d0-413d-ace8-c7ad3e118f7e'::uuid,
  true,
  now(),
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM doctor_departments 
  WHERE doctor_id = 'c556b341-be26-4ef7-9f54-d3fadb5a0de5'::uuid 
  AND department_id = 'd45c47be-a0d0-413d-ace8-c7ad3e118f7e'::uuid
);
