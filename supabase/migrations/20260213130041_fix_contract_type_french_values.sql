/*
  # Fix Contract Type Constraint to Accept French Values

  1. Changes
    - Temporarily disable triggers that might interfere
    - Drop existing contract_type constraints from hr_employees and employee_contracts tables
    - Update existing data from English to French values
    - Add new constraints that accept French contract type values
    - Re-enable triggers
    - Update constraint to allow: 'CDI', 'CDD', 'Stage', 'Freelance', 'Intérim'

  2. Data Migration
    - permanent → CDI
    - temporary → CDD
    - consultant → Freelance

  3. Security
    - No RLS changes required
    - Only constraint modification

  4. Notes
    - This fixes the error: "new row for relation 'hr_employees' violates check constraint 'valid_contract_type'"
    - Maintains data integrity while supporting French contract types
*/

-- Temporarily disable triggers
ALTER TABLE hr_employees DISABLE TRIGGER sync_flags_on_hr_employee;

-- Drop existing contract_type constraints
ALTER TABLE hr_employees DROP CONSTRAINT IF EXISTS valid_contract_type;
ALTER TABLE employee_contracts DROP CONSTRAINT IF EXISTS valid_contract_type;

-- Update existing data to French values
UPDATE hr_employees
SET contract_type = CASE
  WHEN contract_type = 'permanent' THEN 'CDI'
  WHEN contract_type = 'temporary' THEN 'CDD'
  WHEN contract_type = 'consultant' THEN 'Freelance'
  ELSE contract_type
END
WHERE contract_type IN ('permanent', 'temporary', 'consultant');

UPDATE employee_contracts
SET contract_type = CASE
  WHEN contract_type = 'permanent' THEN 'CDI'
  WHEN contract_type = 'temporary' THEN 'CDD'
  WHEN contract_type = 'consultant' THEN 'Freelance'
  ELSE contract_type
END
WHERE contract_type IN ('permanent', 'temporary', 'consultant');

-- Add new constraints with French values
ALTER TABLE hr_employees
ADD CONSTRAINT valid_contract_type CHECK (contract_type IN ('CDI', 'CDD', 'Stage', 'Freelance', 'Intérim'));

ALTER TABLE employee_contracts
ADD CONSTRAINT valid_contract_type CHECK (contract_type IN ('CDI', 'CDD', 'Stage', 'Freelance', 'Intérim'));

-- Re-enable triggers
ALTER TABLE hr_employees ENABLE TRIGGER sync_flags_on_hr_employee;
