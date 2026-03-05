/*
  # Laboratory RBAC Security Policies

  1. Overview
    This migration implements strict Role-Based Access Control for the laboratory module

  2. Access Matrix
    - Admin, Medical Director, Laboratory: Full CRUD access
    - Doctor: Can create (prescribe) and read, but cannot update/delete
    - All other roles: No access (enforced at UI level)

  3. Security Policies
    - SELECT: Admin, Medical Director, Laboratory, Doctor can read
    - INSERT: Admin, Medical Director, Laboratory, Doctor can create (prescribe)
    - UPDATE: Only Admin, Medical Director, Laboratory can modify
    - DELETE: Only Admin, Medical Director, Laboratory can delete

  4. Performance
    - Indexes added for role lookups to optimize RLS policy checks
*/

-- Enable Row Level Security on lab_orders table
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "lab_orders_select_authorized_roles" ON lab_orders;
DROP POLICY IF EXISTS "lab_orders_insert_authorized_roles" ON lab_orders;
DROP POLICY IF EXISTS "lab_orders_update_restricted_roles" ON lab_orders;
DROP POLICY IF EXISTS "lab_orders_delete_restricted_roles" ON lab_orders;

-- SELECT Policy: Admin, Medical Director, Laboratory, Doctor can read
CREATE POLICY "lab_orders_select_authorized_roles"
ON lab_orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin', 'medical_director', 'lab_technician', 'doctor')
  )
);

-- INSERT Policy: Admin, Medical Director, Laboratory, Doctor can create (prescribe)
CREATE POLICY "lab_orders_insert_authorized_roles"
ON lab_orders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin', 'medical_director', 'lab_technician', 'doctor')
  )
);

-- UPDATE Policy: Only Admin, Medical Director, Laboratory can modify results
CREATE POLICY "lab_orders_update_restricted_roles"
ON lab_orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin', 'medical_director', 'lab_technician')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin', 'medical_director', 'lab_technician')
  )
);

-- DELETE Policy: Only Admin, Medical Director, Laboratory can delete
CREATE POLICY "lab_orders_delete_restricted_roles"
ON lab_orders FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
    AND r.name IN ('super_admin', 'hospital_admin', 'medical_director', 'lab_technician')
  )
);

-- Performance: Create indexes for efficient role lookups
CREATE INDEX IF NOT EXISTS idx_lab_orders_doctor_id ON lab_orders(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_id ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_created_at ON lab_orders(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE lab_orders IS 'Laboratory orders with strict RBAC policies: Admin/MedicalDirector/Laboratory have full access, Doctors can create and read only';