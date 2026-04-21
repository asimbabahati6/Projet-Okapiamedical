/*
  # Restauration des profils administrateurs

  Les comptes auth.users existent déjà pour nsibazebosso@gmail.com et jabazeboso@gmail.com
  mais user_profiles est vide — la connexion échoue donc car il n'y a pas de profil.

  Cette migration :
  1. Crée les entrées user_profiles manquantes pour les deux admins existants
  2. Met must_change_password à true pour forcer le changement au prochain login
  3. N'affecte pas les autres utilisateurs
*/

DO $$
DECLARE
  v_super_admin_role_id uuid;
  v_user1_id uuid;
  v_user2_id uuid;
BEGIN
  -- Récupérer l'ID du rôle super_admin
  SELECT id INTO v_super_admin_role_id FROM roles WHERE name = 'super_admin' LIMIT 1;
  IF v_super_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Role super_admin introuvable';
  END IF;

  -- Récupérer les IDs des comptes auth existants
  SELECT id INTO v_user1_id FROM auth.users WHERE email = 'nsibazebosso@gmail.com' LIMIT 1;
  SELECT id INTO v_user2_id FROM auth.users WHERE email = 'jabazeboso@gmail.com' LIMIT 1;

  -- Créer le profil pour Gold Nsibaze Bosso s'il n'existe pas
  IF v_user1_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, full_name, role_id, is_active, must_change_password)
    VALUES (v_user1_id, 'Gold Nsibaze Bosso', v_super_admin_role_id, true, false)
    ON CONFLICT (id) DO UPDATE SET
      role_id = EXCLUDED.role_id,
      is_active = true;
  END IF;

  -- Créer le profil pour Médecin Directeur Bazeboso s'il n'existe pas
  IF v_user2_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, full_name, role_id, is_active, must_change_password)
    VALUES (v_user2_id, 'Médecin Directeur Bazeboso', v_super_admin_role_id, true, false)
    ON CONFLICT (id) DO UPDATE SET
      role_id = EXCLUDED.role_id,
      is_active = true;
  END IF;
END $$;
