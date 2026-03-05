/*
  # Mise à jour des Permissions RLS pour les Contrats - Migration vers RH

  ## Changements
  - Met à jour les policies RLS de la table employee_contracts
  - Accorde l'accès complet aux rôles: super_admin, hospital_admin, hr_manager, administrative_director, administrative_staff
  - Retire l'accès aux rôles financiers en modification (sauf lecture pour certains)

  ## Nouvelles Policies
  1. **HR can view all contracts**
     - Permet aux RH de voir tous les contrats
     - Rôles: super_admin, hospital_admin, hr_manager, administrative_director, administrative_staff

  2. **HR can manage contracts**
     - Permet aux RH de créer, modifier, supprimer les contrats
     - Rôles: super_admin, hospital_admin, hr_manager, administrative_director

  3. **Read-only access for specific roles**
     - Accès en lecture seule pour certains rôles (directeur général, gestionnaires)
     - Permet la consultation sans modification

  ## Sécurité
  - Les contrats sont sensibles et doivent être gérés uniquement par RH
  - Les rôles financiers n'ont plus accès en modification
  - Audit trail maintenu via created_by/updated_at
*/

-- Enable RLS on employee_contracts if not already enabled
ALTER TABLE employee_contracts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage all contracts" ON employee_contracts;
DROP POLICY IF EXISTS "Finance can view contracts" ON employee_contracts;
DROP POLICY IF EXISTS "Finance can manage contracts" ON employee_contracts;
DROP POLICY IF EXISTS "Staff can view own contract" ON employee_contracts;
DROP POLICY IF EXISTS "HR can view all employee contracts" ON employee_contracts;
DROP POLICY IF EXISTS "HR can create employee contracts" ON employee_contracts;
DROP POLICY IF EXISTS "HR can update employee contracts" ON employee_contracts;
DROP POLICY IF EXISTS "HR can delete employee contracts" ON employee_contracts;
DROP POLICY IF EXISTS "Managers can view employee contracts" ON employee_contracts;
DROP POLICY IF EXISTS "Employees can view own contract" ON employee_contracts;

-- Policy 1: HR Admins can view all employee contracts
CREATE POLICY "HR can view all employee contracts"
  ON employee_contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager', 'administrative_director', 'administrative_staff')
    )
  );

-- Policy 2: HR Admins can insert new contracts
CREATE POLICY "HR can create employee contracts"
  ON employee_contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager', 'administrative_director')
    )
  );

-- Policy 3: HR Admins can update contracts
CREATE POLICY "HR can update employee contracts"
  ON employee_contracts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager', 'administrative_director')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager', 'administrative_director')
    )
  );

-- Policy 4: HR Admins can delete contracts
CREATE POLICY "HR can delete employee contracts"
  ON employee_contracts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'hr_manager', 'administrative_director')
    )
  );

-- Policy 5: Read-only access for senior management
CREATE POLICY "Senior management can view employee contracts"
  ON employee_contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('directeur_general', 'operations_manager', 'finance_manager', 'medical_director')
    )
  );

-- Policy 6: Employees can view their own contract
CREATE POLICY "Employees can view own contract"
  ON employee_contracts
  FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid()
  );

-- Create indexes for better performance on role-based queries
CREATE INDEX IF NOT EXISTS idx_employee_contracts_employee_id
  ON employee_contracts(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_contracts_contract_status
  ON employee_contracts(contract_status);

CREATE INDEX IF NOT EXISTS idx_employee_contracts_end_date
  ON employee_contracts(end_date)
  WHERE contract_status = 'active';

-- Add comment to document the change
COMMENT ON TABLE employee_contracts IS
  'Employee contracts managed by HR department. Access restricted to HR roles (hr_manager, administrative_director, administrative_staff). Last updated: 2025-02-25 - Migrated from Finance to HR.';
