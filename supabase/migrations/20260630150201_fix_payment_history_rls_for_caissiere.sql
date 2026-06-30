-- Migration: Add caissiere role to payment_history RLS policies

-- Drop and recreate SELECT policy to include caissiere
DROP POLICY IF EXISTS "Users can view payment history" ON payment_history;
CREATE POLICY "Users can view payment history"
  ON payment_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'receptionist', 'doctor', 'caissiere', 'administrative')
    )
  );

-- Drop and recreate INSERT policy to include caissiere
DROP POLICY IF EXISTS "Billing staff can create payment records" ON payment_history;
CREATE POLICY "Billing staff can create payment records"
  ON payment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'receptionist', 'caissiere', 'administrative')
    )
  );

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
