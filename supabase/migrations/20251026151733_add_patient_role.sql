/*
  # Add Patient Role

  1. Changes
    - Add new "patient" role to the roles table
    - This role allows patients to access their own medical records
    - Level 6 indicates limited privileges (patient-level access only)

  2. Security
    - Patients can only view their own data
    - No administrative or medical staff capabilities
*/

-- Insert the patient role
INSERT INTO roles (name, description, level)
VALUES ('patient', 'Patient with access to personal medical records', 6)
ON CONFLICT (name) DO NOTHING;