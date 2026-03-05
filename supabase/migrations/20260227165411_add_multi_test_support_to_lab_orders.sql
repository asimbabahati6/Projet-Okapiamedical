/*
  # Add Multi-Test Support to Laboratory Orders

  ## Changes
  
  1. New Tables
    - `lab_order_tests`: Junction table for many-to-many relationship
      - `id` (uuid, primary key)
      - `lab_order_id` (uuid, references lab_orders)
      - `test_id` (uuid, references lab_tests)
      - `result_value` (text, nullable)
      - `result_unit` (text, nullable)
      - `is_abnormal` (boolean, nullable)
      - `performed_by` (uuid, references user_profiles)
      - `approved_by` (uuid, references user_profiles)
      - `approved_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
  
  2. Data Migration
    - Migrate existing single-test orders to junction table
    - Preserve all existing test associations
  
  3. Security
    - Enable RLS on lab_order_tests
    - Add policies for authenticated medical staff
    - Maintain data integrity with foreign key constraints
  
  ## Notes
  - Maintains backward compatibility during transition
  - Original test_id column remains for legacy support
  - New multi-test functionality uses junction table
*/

-- Create junction table for multiple tests per order
CREATE TABLE IF NOT EXISTS lab_order_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_order_id uuid REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_id uuid REFERENCES lab_tests(id) ON DELETE RESTRICT,
  result_value text,
  result_unit text,
  is_abnormal boolean DEFAULT false,
  notes text,
  performed_by uuid REFERENCES user_profiles(id),
  approved_by uuid REFERENCES user_profiles(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_lab_order_tests_order_id ON lab_order_tests(lab_order_id);
CREATE INDEX IF NOT EXISTS idx_lab_order_tests_test_id ON lab_order_tests(test_id);

-- Migrate existing data from lab_orders to lab_order_tests
INSERT INTO lab_order_tests (lab_order_id, test_id, result_value, result_unit, is_abnormal, performed_by, approved_by, approved_at, created_at)
SELECT 
  id as lab_order_id,
  test_id,
  result_value,
  result_unit,
  is_abnormal,
  performed_by,
  approved_by,
  approved_at,
  created_at
FROM lab_orders
WHERE test_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE lab_order_tests ENABLE ROW LEVEL SECURITY;

-- Policies for lab_order_tests
CREATE POLICY "Authenticated users can view lab order tests"
  ON lab_order_tests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Medical staff can insert lab order tests"
  ON lab_order_tests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.is_medical_staff = true
        OR user_profiles.role_id IN (
          SELECT id FROM roles WHERE name IN (
            'doctor', 'medical_director', 'super_admin', 
            'directeur_general', 'lab_technician', 'lab_supervisor'
          )
        )
      )
    )
  );

CREATE POLICY "Medical staff can update lab order tests"
  ON lab_order_tests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.is_medical_staff = true
        OR user_profiles.role_id IN (
          SELECT id FROM roles WHERE name IN (
            'doctor', 'medical_director', 'super_admin', 
            'directeur_general', 'lab_technician', 'lab_supervisor'
          )
        )
      )
    )
  );

CREATE POLICY "Supervisors can delete lab order tests"
  ON lab_order_tests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT id FROM roles WHERE name IN (
          'medical_director', 'super_admin', 'directeur_general', 'lab_supervisor'
        )
      )
    )
  );
