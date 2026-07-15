/*
# Add UPDATE policy on invoices for billing staff

## Problem
The invoices table had NO UPDATE policy for caissiere, receptionist, or admin roles.
Only accountant could update convention invoices. This caused all payment encaissements
to silently fail — the payment_history row was inserted but the invoice status/balance
never changed.

## Changes
- Adds an UPDATE policy allowing billing staff (super_admin, hospital_admin, receptionist,
  caissiere, administrative, doctor) to update invoices they can already create.
- This enables the EncaisserModal to correctly update paid_amount, balance, and status
  after recording a payment.

## Security
- Scoped to authenticated users with specific billing roles only.
*/

DROP POLICY IF EXISTS "billing_staff_can_update_invoices" ON invoices;
CREATE POLICY "billing_staff_can_update_invoices"
ON invoices FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON r.id = up.role_id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin', 'receptionist', 'caissiere', 'administrative', 'doctor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON r.id = up.role_id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin', 'receptionist', 'caissiere', 'administrative', 'doctor')
  )
);
