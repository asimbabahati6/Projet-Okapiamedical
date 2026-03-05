/*
  # OKAPIA Medical Hospital - Complete 9 Role System with Test Accounts

  1. New Roles
    - `directeur_general` (Level 1) - Prof. BAZEBOSO J.A. - Supreme authority
    - `medecin_chef_staff` (Level 2) - Dr. TOTI B. - Medical supervision
    - `gestionnaire` (Level 3) - Naomie NDAYA - Financial and HR management
    - `radio_chef` (Level 4) - Renedi N. - Radiology department chief
    - `lab_technician` (Level 5) - Laboratory technician
    - `caissiere` (Level 5) - Grace NZOLA - Cash operations
    - `technique` (Level 5) - Merlin B. - Equipment maintenance
    - `radio_tech` (Level 5) - Bermie M. - Radiology technician
    - `hygiene` (Level 6) - Célestine - Cleaning and hygiene

  2. Test Accounts Creation
    - 9 test accounts with email format: role@okapia.com
    - Default password: Okapia2024!

  3. Security
    - Uses Supabase auth.users table with proper password hashing
    - Creates corresponding user_profiles entries
    - RLS policies already handle access control
*/

-- Insert OKAPIA-specific roles (including lab_technician)
INSERT INTO roles (name, description, level) VALUES
  ('directeur_general', 'Directeur Général - Autorité suprême avec accès complet', 1),
  ('medecin_chef_staff', 'Médecin Chef de Staff - Supervision médicale', 2),
  ('gestionnaire', 'Gestionnaire - Gestion financière et RH', 3),
  ('radio_chef', 'Chef Radiologie - Chef du département radiologie', 4),
  ('lab_technician', 'Technicien Laboratoire - Analyses médicales', 5),
  ('caissiere', 'Caissière - Opérations de caisse', 5),
  ('technique', 'Technicien - Maintenance équipements', 5),
  ('radio_tech', 'Technicien Radiologie - Technicien radiologie', 5),
  ('hygiene', 'Agent d''Hygiène - Nettoyage et hygiène', 6)
ON CONFLICT (name) DO NOTHING;

-- Create helper function to create test accounts with proper auth
CREATE OR REPLACE FUNCTION create_okapia_test_account(
  p_email text,
  p_password text,
  p_full_name text,
  p_role_name text,
  p_phone text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_role_id uuid;
  v_encrypted_password text;
BEGIN
  -- Get role ID
  SELECT id INTO v_role_id FROM roles WHERE name = p_role_name;
  
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Role % not found', p_role_name;
  END IF;

  -- Generate user ID
  v_user_id := gen_random_uuid();

  -- Hash password using crypt
  v_encrypted_password := crypt(p_password, gen_salt('bf'));

  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_sent_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    v_encrypted_password,
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', p_full_name),
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
  );

  -- Insert into user_profiles
  INSERT INTO user_profiles (id, role_id, full_name, phone, is_active)
  VALUES (v_user_id, v_role_id, p_full_name, p_phone, true);

  RETURN v_user_id;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, just update the profile
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    UPDATE user_profiles 
    SET role_id = v_role_id, full_name = p_full_name, phone = p_phone, is_active = true
    WHERE id = v_user_id;
    
    RETURN v_user_id;
END;
$$;

-- Create all 9 test accounts
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- 1. Directeur Général
  v_user_id := create_okapia_test_account(
    'directeur@okapia.com',
    'Okapia2024!',
    'Prof. BAZEBOSO J.A.',
    'directeur_general',
    '+243 800 000 001'
  );
  RAISE NOTICE 'Created: directeur@okapia.com';

  -- 2. Médecin Chef de Staff
  v_user_id := create_okapia_test_account(
    'medecin-chef@okapia.com',
    'Okapia2024!',
    'Dr. TOTI B.',
    'medecin_chef_staff',
    '+243 800 000 002'
  );
  RAISE NOTICE 'Created: medecin-chef@okapia.com';

  -- 3. Gestionnaire
  v_user_id := create_okapia_test_account(
    'gestionnaire@okapia.com',
    'Okapia2024!',
    'Naomie NDAYA',
    'gestionnaire',
    '+243 800 000 003'
  );
  RAISE NOTICE 'Created: gestionnaire@okapia.com';

  -- 4. Caissière
  v_user_id := create_okapia_test_account(
    'caissiere@okapia.com',
    'Okapia2024!',
    'Grace NZOLA',
    'caissiere',
    '+243 800 000 004'
  );
  RAISE NOTICE 'Created: caissiere@okapia.com';

  -- 5. Technicien
  v_user_id := create_okapia_test_account(
    'technique@okapia.com',
    'Okapia2024!',
    'Merlin B.',
    'technique',
    '+243 800 000 005'
  );
  RAISE NOTICE 'Created: technique@okapia.com';

  -- 6. Laboratoire
  v_user_id := create_okapia_test_account(
    'labo@okapia.com',
    'Okapia2024!',
    'Technicien Laboratoire',
    'lab_technician',
    '+243 800 000 006'
  );
  RAISE NOTICE 'Created: labo@okapia.com';

  -- 7. Chef Radiologie
  v_user_id := create_okapia_test_account(
    'radio-chef@okapia.com',
    'Okapia2024!',
    'Renedi N.',
    'radio_chef',
    '+243 800 000 007'
  );
  RAISE NOTICE 'Created: radio-chef@okapia.com';

  -- 8. Technicien Radiologie
  v_user_id := create_okapia_test_account(
    'radio-tech@okapia.com',
    'Okapia2024!',
    'Bermie M.',
    'radio_tech',
    '+243 800 000 008'
  );
  RAISE NOTICE 'Created: radio-tech@okapia.com';

  -- 9. Agent d'Hygiène
  v_user_id := create_okapia_test_account(
    'hygiene@okapia.com',
    'Okapia2024!',
    'Célestine',
    'hygiene',
    '+243 800 000 009'
  );
  RAISE NOTICE 'Created: hygiene@okapia.com';

  RAISE NOTICE '✓ Successfully created 9 OKAPIA test accounts';
END $$;

-- Create view to display test account information
CREATE OR REPLACE VIEW test_accounts_info AS
SELECT 
  up.full_name,
  r.name as role_name,
  r.description as role_description,
  r.level as hierarchy_level,
  au.email,
  'Okapia2024!' as default_password,
  up.phone,
  up.is_active,
  au.email_confirmed_at IS NOT NULL as email_confirmed
FROM user_profiles up
JOIN roles r ON up.role_id = r.id
JOIN auth.users au ON au.id = up.id
WHERE up.phone LIKE '+243 800 000%'
ORDER BY r.level, up.full_name;

COMMENT ON VIEW test_accounts_info IS 'OKAPIA Medical test accounts - Email: role@okapia.com, Password: Okapia2024!';
