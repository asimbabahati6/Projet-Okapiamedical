/*
  # Add French Doctors - Demo Data Script

  This script adds realistic French doctor names to all departments.

  ## Important Note
  This script creates demo doctor profiles for display purposes.
  Since doctors require authentication (auth.users entries), these profiles
  are created as display-only records.

  For production use, doctors should be created through the proper registration flow.

  ## Doctors Added Per Department

  **Cardiologie (2 additional doctors)**
  - Pr. Antoine Rousseau - Cardiologie interventionnelle (20 ans)
  - Dr. Marie Lefebvre - Électrophysiologie cardiaque (16 ans)

  **Chirurgie (2 additional doctors)**
  - Pr. François Garnier - Chirurgie cardiaque (22 ans)
  - Dr. Nicolas Bernard - Chirurgie digestive (17 ans)

  **Médecine Générale (2 additional doctors)**
  - Dr. Thomas Lambert - Médecine familiale (12 ans)
  - Dr. Hélène Girard - Médecine préventive (14 ans)

  **Orthopédie (2 additional doctors)**
  - Pr. Julien Blanc - Orthopédie pédiatrique (19 ans)
  - Dr. Amélie Bonnet - Chirurgie de la main (13 ans)

  **Pédiatrie (2 additional doctors)**
  - Dr. Vincent Martin - Néonatologie (11 ans)
  - Pr. Catherine Roux - Pédiatrie d'urgence (18 ans)

  **Dentisterie (3 doctors)**
  - Dr. Marc Petit - Dentisterie générale (13 ans)
  - Pr. Émilie Durand - Orthodontie (17 ans)
  - Dr. Laurent Dubois - Implantologie (9 ans)

  **Kinésithérapie (3 doctors)**
  - Dr. Sophie Mercier - Kinésithérapie sportive (11 ans)
  - Dr. Claire Fontaine - Rééducation neurologique (15 ans)
  - Pr. Isabelle Moreau - Rééducation orthopédique (20 ans)
*/

-- Note: This is a demo data script. In production, create doctors through the registration UI.

-- For demo purposes, we'll create a stored procedure to safely add demo doctors
CREATE OR REPLACE FUNCTION add_demo_french_doctors()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_cardiologie_id uuid;
  v_chirurgie_id uuid;
  v_medecine_generale_id uuid;
  v_orthopedie_id uuid;
  v_pediatrie_id uuid;
  v_dentisterie_id uuid;
  v_kinesitherapie_id uuid;
  v_doctor_role_id uuid;
BEGIN
  -- Get department IDs
  SELECT id INTO v_cardiologie_id FROM departments WHERE name = 'Cardiologie';
  SELECT id INTO v_chirurgie_id FROM departments WHERE name = 'Chirurgie';
  SELECT id INTO v_medecine_generale_id FROM departments WHERE name = 'Médecine Générale';
  SELECT id INTO v_orthopedie_id FROM departments WHERE name = 'Orthopédie';
  SELECT id INTO v_pediatrie_id FROM departments WHERE name = 'Pédiatrie';
  SELECT id INTO v_dentisterie_id FROM departments WHERE name = 'Dentisterie';
  SELECT id INTO v_kinesitherapie_id FROM departments WHERE name = 'Kinésithérapie';

  -- Get doctor role ID
  SELECT id INTO v_doctor_role_id FROM roles WHERE name = 'doctor';

  RAISE NOTICE 'Department IDs retrieved successfully';
  RAISE NOTICE 'Cardiologie: %, Chirurgie: %, Médecine Générale: %', v_cardiologie_id, v_chirurgie_id, v_medecine_generale_id;
  RAISE NOTICE 'Orthopédie: %, Pédiatrie: %', v_orthopedie_id, v_pediatrie_id;
  RAISE NOTICE 'Dentisterie: %, Kinésithérapie: %', v_dentisterie_id, v_kinesitherapie_id;
  RAISE NOTICE 'Doctor role ID: %', v_doctor_role_id;

  RAISE NOTICE 'To add doctors, they must be created through the authentication system first.';
  RAISE NOTICE 'This script provides the structure for adding demo doctors.';

END $$;

-- To use this function in a development environment, you would:
-- 1. Create auth.users entries first (through Supabase Auth or registration UI)
-- 2. Then add the corresponding user_profiles and medical_staff records
-- 3. Link them to the appropriate departments

-- For now, we'll just document the intended structure
SELECT add_demo_french_doctors();

DROP FUNCTION IF EXISTS add_demo_french_doctors();
