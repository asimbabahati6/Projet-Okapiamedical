-- Add caissiere role to the invoices insert policy so cashiers can create invoices
DROP POLICY IF EXISTS "Staff can create invoices" ON invoices;

CREATE POLICY "Staff can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'receptionist', 'doctor', 'caissiere', 'administrative')
    )
  );
