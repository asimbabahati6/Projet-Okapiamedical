/*
  # Add Primary Care Physician to Patients

  1. Changes
    - Add `primary_care_physician_id` column to `patients` table
    - Add foreign key constraint to `medical_staff` table
    - Add index for performance optimization
    - Update RLS policies if needed

  2. Purpose
    - Track each patient's primary care physician
    - Enable quick lookup of physician information
    - Improve care coordination and continuity
    - Support HIPAA-compliant patient-physician relationships

  3. Security
    - Maintains existing RLS policies
    - Foreign key ensures data integrity
    - Nullable field allows gradual migration
*/

-- Add primary_care_physician_id column to patients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'primary_care_physician_id'
  ) THEN
    ALTER TABLE patients ADD COLUMN primary_care_physician_id uuid REFERENCES medical_staff(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for performance optimization
CREATE INDEX IF NOT EXISTS idx_patients_primary_care_physician 
ON patients(primary_care_physician_id);

-- Add helpful comment
COMMENT ON COLUMN patients.primary_care_physician_id IS 'Reference to the primary care physician or attending physician for this patient';