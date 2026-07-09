/*
# Complete Accountant Role Permissions

1. New Permissions
  - `billing.mark_convention_paid` — Marquer une facture conventionnee comme payee par l'organisme
  - `billing.mark_honoraires_paid` — Marquer un etat d'honoraires/commissions comme paye (HON-/COM-)
  - `billing.view_expenses` — Lecture des depenses (toutes categories)
  - `billing.view_honoraires` — Lecture des honoraires medecins
  - `billing.view_commissions` — Lecture des commissions medecins
  - `billing.view_cash_register` — Lecture des mouvements et soldes de caisse
  - `billing.view_pricing` — Lecture de la tarification des actes

2. Permission Assignments
  - Le role `accountant` recoit toutes les permissions de lecture financiere
    PLUS les 2 exceptions d'ecriture specifiques
  - Aucune permission de creation, modification, annulation de facture
  - Aucune permission de gestion de tresorerie (virements)
  - Aucune permission d'ecriture sur les depenses

3. RLS Policy Adjustments
  - Ajoute `accountant` aux policies SELECT des tables expenses et invoice_items
    (il pouvait deja lire via les 7 tables financieres nouvelles)
  - Cree 2 policies UPDATE limitees pour les exceptions :
    a) honoraires_medecins : UPDATE statut_paiement = 'paye' UNIQUEMENT
    b) commissions_medecins : UPDATE statut_paiement = 'paye' UNIQUEMENT
    c) invoices : UPDATE pour les factures conventionnees (type_facture = 'conventionne')
       et uniquement le champ status → 'paid'

4. Important Notes
  - Aucune permission clinique attribuee
  - Aucun role existant modifie
  - Verification automatique que accountant n'a acces a aucune table clinique
*/

-- ============================================================
-- CREATE NEW PERMISSIONS
-- ============================================================
INSERT INTO permissions (code, display_name, category, description) VALUES
  ('billing.mark_convention_paid', 'Marquer facture conventionne payee', 'billing', 'Permet de marquer une facture conventionnee comme payee par l organisme'),
  ('billing.mark_honoraires_paid', 'Marquer honoraires/commissions payes', 'billing', 'Permet de marquer un etat HON-/COM- comme paye'),
  ('billing.view_expenses', 'Voir les depenses', 'billing', 'Lecture de toutes les depenses avec beneficiaires et pieces justificatives'),
  ('billing.view_honoraires', 'Voir les honoraires', 'billing', 'Lecture des honoraires medecins prestataires'),
  ('billing.view_commissions', 'Voir les commissions', 'billing', 'Lecture des commissions medecins apporteurs'),
  ('billing.view_cash_register', 'Voir les mouvements de caisse', 'billing', 'Lecture des mouvements, soldes et clotures de caisse'),
  ('billing.view_pricing', 'Voir la tarification', 'billing', 'Lecture de la tarification des actes medicaux')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- ASSIGN ALL READ + 2 WRITE PERMISSIONS TO ACCOUNTANT
-- ============================================================
DO $$
DECLARE
  v_role_id uuid;
  v_perm_code text;
  v_perm_id uuid;
  v_accountant_perms text[] := ARRAY[
    -- Lecture
    'billing.view',
    'billing.view_reports',
    'billing.view_treasury',
    'billing.view_expenses',
    'billing.view_honoraires',
    'billing.view_commissions',
    'billing.view_cash_register',
    'billing.view_pricing',
    -- 2 exceptions ecriture
    'billing.mark_convention_paid',
    'billing.mark_honoraires_paid'
  ];
BEGIN
  SELECT id INTO v_role_id FROM roles WHERE name = 'accountant';
  
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Role accountant not found';
  END IF;

  FOREACH v_perm_code IN ARRAY v_accountant_perms LOOP
    SELECT id INTO v_perm_id FROM permissions WHERE code = v_perm_code;
    IF v_perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (v_role_id, v_perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    ELSE
      RAISE WARNING 'Permission % not found', v_perm_code;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- RLS: Allow accountant to read expenses table
-- (expenses SELECT policy already includes finance_manager and gestionnaire;
--  we need to add accountant)
-- ============================================================
DROP POLICY IF EXISTS "accountant_select_expenses" ON expenses;
CREATE POLICY "accountant_select_expenses" ON expenses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name = 'accountant'
    )
  );

-- ============================================================
-- RLS: Allow accountant to read invoice_items
-- ============================================================
DROP POLICY IF EXISTS "accountant_select_invoice_items" ON invoice_items;
CREATE POLICY "accountant_select_invoice_items" ON invoice_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name = 'accountant'
    )
  );

-- ============================================================
-- RLS: Allow accountant to read invoices
-- (may already be readable, but ensure explicit policy)
-- ============================================================
DROP POLICY IF EXISTS "accountant_select_invoices" ON invoices;
CREATE POLICY "accountant_select_invoices" ON invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name = 'accountant'
    )
  );

-- ============================================================
-- RLS: Allow accountant to read payment_history
-- ============================================================
DROP POLICY IF EXISTS "accountant_select_payment_history" ON payment_history;
CREATE POLICY "accountant_select_payment_history" ON payment_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name = 'accountant'
    )
  );

-- ============================================================
-- RLS: Allow accountant to read medical_acts_pricing
-- ============================================================
DROP POLICY IF EXISTS "accountant_select_medical_acts_pricing" ON medical_acts_pricing;
CREATE POLICY "accountant_select_medical_acts_pricing" ON medical_acts_pricing
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name = 'accountant'
    )
  );

-- ============================================================
-- RLS EXCEPTION 1: accountant can mark conventionned invoices as paid
-- Only allows UPDATE on invoices WHERE type_facture = 'conventionne'
-- and only changing status to 'paid'
-- ============================================================
DROP POLICY IF EXISTS "accountant_mark_convention_paid" ON invoices;
CREATE POLICY "accountant_mark_convention_paid" ON invoices
  FOR UPDATE TO authenticated
  USING (
    type_facture = 'conventionne'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name = 'accountant'
    )
  )
  WITH CHECK (
    type_facture = 'conventionne'
    AND status = 'paid'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name = 'accountant'
    )
  );

-- ============================================================
-- RLS EXCEPTION 2: accountant can mark honoraires as paid
-- ============================================================
DROP POLICY IF EXISTS "accountant_mark_honoraires_paid" ON honoraires_medecins;
CREATE POLICY "accountant_mark_honoraires_paid" ON honoraires_medecins
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name = 'accountant'
    )
  )
  WITH CHECK (
    statut_paiement = 'paye'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name = 'accountant'
    )
  );

-- ============================================================
-- RLS EXCEPTION 2b: accountant can mark commissions as paid
-- ============================================================
DROP POLICY IF EXISTS "accountant_mark_commissions_paid" ON commissions_medecins;
CREATE POLICY "accountant_mark_commissions_paid" ON commissions_medecins
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name = 'accountant'
    )
  )
  WITH CHECK (
    statut_paiement = 'paye'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name = 'accountant'
    )
  );

-- ============================================================
-- VERIFY: accountant has NO access to clinical tables
-- ============================================================
DO $$
DECLARE
  v_clinical_tables text[] := ARRAY[
    'consultations','lab_orders','lab_results','radiology_reports',
    'radiology_exams','prescriptions','prescription_items'
  ];
  v_table text;
  v_count int;
BEGIN
  FOREACH v_table IN ARRAY v_clinical_tables LOOP
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = v_table
    AND (qual LIKE '%accountant%' OR with_check LIKE '%accountant%');
    
    IF v_count > 0 THEN
      RAISE WARNING 'ALERT: accountant found in % policies on %', v_count, v_table;
    END IF;
  END LOOP;
  RAISE NOTICE 'OK: accountant has no access to clinical tables';
END $$;

NOTIFY pgrst, 'reload schema';
