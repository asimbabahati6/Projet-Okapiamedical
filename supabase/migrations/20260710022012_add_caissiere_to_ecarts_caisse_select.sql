/*
# Allow caissiere to SELECT from ecarts_caisse

Adds `caissiere` to the SELECT policy so the cloture page
can check if a closure was already recorded today.
*/

DROP POLICY IF EXISTS "select_ecarts_caisse" ON ecarts_caisse;
CREATE POLICY "select_ecarts_caisse" ON ecarts_caisse FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin','hospital_admin','directeur_general','medecin_chef_staff','finance_manager','accountant','gestionnaire','caissiere')
    )
  );
