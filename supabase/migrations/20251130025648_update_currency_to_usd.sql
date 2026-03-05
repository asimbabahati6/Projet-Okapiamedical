/*
  # Update Currency to USD

  This migration updates all currency fields from XAF to USD across the HR system.

  1. Changes
    - Update hr_employees salary_currency to USD
    - Update hr_contracts salary_currency to USD
    - Update hr_salary_adjustments currency to USD

  2. Notes
    - This migration changes the currency display only
    - No monetary amounts are converted (assumes USD was always intended)
    - All new records will default to USD
*/

-- Update hr_employees table
UPDATE hr_employees
SET salary_currency = 'USD'
WHERE salary_currency != 'USD' OR salary_currency IS NULL;

-- Update hr_contracts table
UPDATE hr_contracts
SET salary_currency = 'USD'
WHERE salary_currency != 'USD' OR salary_currency IS NULL;

-- Update hr_salary_adjustments table
UPDATE hr_salary_adjustments
SET currency = 'USD'
WHERE currency != 'USD' OR currency IS NULL;

-- Update default values for future inserts
ALTER TABLE hr_employees
ALTER COLUMN salary_currency SET DEFAULT 'USD';

ALTER TABLE hr_contracts
ALTER COLUMN salary_currency SET DEFAULT 'USD';

ALTER TABLE hr_salary_adjustments
ALTER COLUMN currency SET DEFAULT 'USD';
