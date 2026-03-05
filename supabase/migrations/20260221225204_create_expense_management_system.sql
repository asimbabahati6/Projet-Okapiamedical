/*
  # Create Expense Management System

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key)
      - `category` (text) - Type de dépense
      - `amount` (decimal) - Montant
      - `description` (text) - Description
      - `expense_date` (date) - Date de la dépense
      - `payment_method` (text) - Méthode de paiement
      - `vendor` (text, nullable) - Fournisseur
      - `receipt_number` (text, nullable) - Numéro de reçu
      - `notes` (text, nullable) - Notes
      - `created_by` (uuid) - Utilisateur
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Policies for admins and finance staff
*/

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN (
    'utilities', 'rent', 'maintenance', 'supplies', 'salaries',
    'equipment', 'marketing', 'insurance', 'transportation', 'other'
  )),
  subcategory text,
  amount decimal(10, 2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN (
    'cash', 'bank_transfer', 'check', 'card', 'mobile_money'
  )),
  vendor text,
  receipt_number text,
  notes text,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- View policy: Admins and finance staff
CREATE POLICY "Finance staff can view expenses" ON expenses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('administrator', 'accountant', 'financial_manager', 'Administrateur', 'Super Admin')
    )
  );

-- Insert policy
CREATE POLICY "Finance staff can insert expenses" ON expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('administrator', 'accountant', 'financial_manager', 'Administrateur', 'Super Admin')
    )
  );

-- Update policy
CREATE POLICY "Finance staff can update expenses" ON expenses
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('administrator', 'accountant', 'financial_manager', 'Administrateur', 'Super Admin')
    )
  );

-- Delete policy: Admins only
CREATE POLICY "Admins can delete expenses" ON expenses
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('administrator', 'Administrateur', 'Super Admin')
    )
  );

-- Trigger function
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS trigger_update_expenses_updated_at ON expenses;
CREATE TRIGGER trigger_update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

-- Sample data
INSERT INTO expenses (category, amount, description, expense_date, payment_method, vendor, receipt_number, notes, created_by)
SELECT
  'utilities', 500.00, 'Facture électricité - Février 2026', '2026-02-15',
  'bank_transfer', 'SNEL', 'ELEC-2026-002', 'Paiement mensuel',
  (SELECT id FROM user_profiles LIMIT 1)
WHERE EXISTS (SELECT 1 FROM user_profiles)
ON CONFLICT DO NOTHING;

INSERT INTO expenses (category, amount, description, expense_date, payment_method, vendor, created_by)
SELECT
  'maintenance', 250.00, 'Réparation climatisation', '2026-02-18',
  'cash', 'Cool Services', (SELECT id FROM user_profiles LIMIT 1)
WHERE EXISTS (SELECT 1 FROM user_profiles)
ON CONFLICT DO NOTHING;

INSERT INTO expenses (category, amount, description, expense_date, payment_method, vendor, created_by)
SELECT
  'supplies', 180.00, 'Fournitures bureau', '2026-02-20',
  'card', 'Papeterie', (SELECT id FROM user_profiles LIMIT 1)
WHERE EXISTS (SELECT 1 FROM user_profiles)
ON CONFLICT DO NOTHING;