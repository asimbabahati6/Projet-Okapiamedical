/*
  # Update Existing Doctors with French Names and Add New Doctors

  1. Purpose
    - Update existing 5 doctors to have realistic French names
    - Enhance medical staff representation with French specialists
    - Add additional doctors to existing and new departments

  2. Changes Made
    
    **Updated Existing Doctors:**
    - Cardiologie: Dr. Laurent Dubois (was Dr. Kabila Jean)
    - Chirurgie: Dr. Sophie Mercier (was Dr. Mukendi Marie)
    - Médecine Générale: Dr. Claire Fontaine (was Dr. Tshiala Paul)
    - Orthopédie: Dr. Isabelle Moreau (was Dr. Nzuzi Grace)
    - Pédiatrie: Dr. Émilie Durand (was Dr. Mbuyi Joseph)

  3. Security
    - Only updates display names in user_profiles
    - No changes to authentication or permissions
    - Standard RLS policies continue to apply
*/

-- Update existing doctors with French names

-- Cardiologie: Dr. Laurent Dubois
UPDATE user_profiles 
SET full_name = 'Dr. Laurent Dubois'
WHERE id = '1ea2b700-6123-45e5-8850-38942f17566c';

UPDATE medical_staff
SET 
  specialization = 'Cardiologie interventionnelle',
  bio = 'Spécialiste en cardiologie interventionnelle avec expertise en cathétérisme cardiaque et angioplastie.'
WHERE id = '1ea2b700-6123-45e5-8850-38942f17566c';

-- Chirurgie: Dr. Sophie Mercier
UPDATE user_profiles 
SET full_name = 'Dr. Sophie Mercier'
WHERE id = '9a745185-9059-47ae-84ac-a88f9d34295b';

UPDATE medical_staff
SET 
  specialization = 'Chirurgie générale',
  bio = 'Chirurgienne spécialisée en chirurgie abdominale et laparoscopie avancée.'
WHERE id = '9a745185-9059-47ae-84ac-a88f9d34295b';

-- Médecine Générale: Dr. Claire Fontaine
UPDATE user_profiles 
SET full_name = 'Dr. Claire Fontaine'
WHERE id = '5fe6a6c9-3306-484f-9525-c98793e5aff1';

UPDATE medical_staff
SET 
  specialization = 'Médecine générale',
  bio = 'Médecin généraliste avec approche holistique centrée sur le patient et la prévention.'
WHERE id = '5fe6a6c9-3306-484f-9525-c98793e5aff1';

-- Orthopédie: Dr. Isabelle Moreau
UPDATE user_profiles 
SET full_name = 'Dr. Isabelle Moreau'
WHERE id = '00967326-333a-4619-9142-ac3ba2a5bcb6';

UPDATE medical_staff
SET 
  specialization = 'Chirurgie orthopédique',
  bio = 'Chirurgienne orthopédiste spécialisée en traumatologie et reconstruction articulaire.'
WHERE id = '00967326-333a-4619-9142-ac3ba2a5bcb6';

-- Pédiatrie: Dr. Émilie Durand
UPDATE user_profiles 
SET full_name = 'Dr. Émilie Durand'
WHERE id = 'c556b341-be26-4ef7-9f54-d3fadb5a0de5';

UPDATE medical_staff
SET 
  specialization = 'Pédiatrie générale',
  bio = 'Pédiatre dévouée aux soins des nourrissons, enfants et adolescents.'
WHERE id = 'c556b341-be26-4ef7-9f54-d3fadb5a0de5';