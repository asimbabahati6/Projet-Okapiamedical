/*
# Create Accountant Role and Fix Financial RLS Policies

1. New Role
  - `accountant` (level 4) — Comptable, avec permissions de LECTURE SEULE
    sur les modules financiers (billing.view, billing.view_reports, billing.view_treasury)

2. Security Context
  - Toutes les policies RLS des 7 tables financieres referençaient 'accountant'
    mais ce role n'existait pas en base. Cette migration le cree.
  - Verification automatique que tous les roles references dans les policies existent.

3. Important Notes
  - Le role 'accountant' est au level 4 (en dessous de finance_manager level 3)
  - Permissions READ-ONLY uniquement — pas de droit d'ecriture
*/

-- ============================================================
-- CREATE ROLE: accountant (Comptable)
-- ============================================================
INSERT INTO roles (name, description, level, is_active)
VALUES (
  'accountant',
  'Comptable - Lecture seule sur les modules financiers',
  4,
  true
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- ASSIGN READ-ONLY FINANCIAL PERMISSIONS to accountant
-- ============================================================
DO $$
DECLARE
  v_role_id uuid;
  v_perm_id uuid;
BEGIN
  SELECT id INTO v_role_id FROM roles WHERE name = 'accountant';
  
  IF v_role_id IS NULL THEN
    RAISE NOTICE 'Role accountant not found, skipping permission assignment';
    RETURN;
  END IF;

  -- billing.view
  SELECT id INTO v_perm_id FROM permissions WHERE code = 'billing.view';
  IF v_perm_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_role_id, v_perm_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;

  -- billing.view_reports
  SELECT id INTO v_perm_id FROM permissions WHERE code = 'billing.view_reports';
  IF v_perm_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_role_id, v_perm_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;

  -- billing.view_treasury
  SELECT id INTO v_perm_id FROM permissions WHERE code = 'billing.view_treasury';
  IF v_perm_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_role_id, v_perm_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- VERIFY: all role names referenced in financial policies exist
-- ============================================================
DO $$
DECLARE
  v_missing text[];
  v_role text;
  v_required_roles text[] := ARRAY[
    'super_admin','hospital_admin','directeur_general','medecin_chef_staff',
    'finance_manager','accountant','gestionnaire','caissiere'
  ];
BEGIN
  v_missing := '{}';
  FOREACH v_role IN ARRAY v_required_roles LOOP
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = v_role) THEN
      v_missing := array_append(v_missing, v_role);
    END IF;
  END LOOP;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE WARNING 'MISSING ROLES in financial policies: %', array_to_string(v_missing, ', ');
  ELSE
    RAISE NOTICE 'OK: all roles referenced in financial policies exist';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
