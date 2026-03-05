/*
  # Fix Prescriptions Table for Items Model

  ## Changes
  - Make old single-medication fields nullable (medication_name, dosage, frequency)
  - These fields are now replaced by prescription_items table
  - Existing prescriptions will still work
  - New prescriptions will use prescription_items
*/

-- Make old fields nullable to support new prescription_items model
ALTER TABLE prescriptions 
  ALTER COLUMN medication_name DROP NOT NULL,
  ALTER COLUMN dosage DROP NOT NULL,
  ALTER COLUMN frequency DROP NOT NULL;

-- Set default values for old fields
ALTER TABLE prescriptions
  ALTER COLUMN medication_name SET DEFAULT '',
  ALTER COLUMN dosage SET DEFAULT '',
  ALTER COLUMN frequency SET DEFAULT '';
