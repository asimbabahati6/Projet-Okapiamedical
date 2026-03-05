/*
  # Add Patient Type and Routing Fields to Waiting List

  1. Changes
    - Add `is_new_patient` boolean field to track patient type selection
    - Add `routing_decision` field to store routing logic outcome
    - Add `routing_notes` field for additional routing information
    - Add `assigned_to` field to track who the patient is assigned to (receptionist or doctor)

  2. Purpose
    - Enable proper patient routing from the waiting list form
    - Track new vs returning patient status
    - Support automated routing to reception or physician
    - Improve patient intake workflow efficiency

  3. Security
    - No RLS changes needed as existing policies cover new fields
*/

-- Add patient type and routing fields to appointment_waiting_list
DO $$
BEGIN
  -- Add is_new_patient field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointment_waiting_list' AND column_name = 'is_new_patient'
  ) THEN
    ALTER TABLE appointment_waiting_list 
    ADD COLUMN is_new_patient boolean DEFAULT false;
  END IF;

  -- Add routing_decision field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointment_waiting_list' AND column_name = 'routing_decision'
  ) THEN
    ALTER TABLE appointment_waiting_list 
    ADD COLUMN routing_decision text CHECK (routing_decision IN ('to_reception', 'to_physician', 'pending'));
  END IF;

  -- Add routing_notes field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointment_waiting_list' AND column_name = 'routing_notes'
  ) THEN
    ALTER TABLE appointment_waiting_list 
    ADD COLUMN routing_notes text;
  END IF;

  -- Add assigned_to field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointment_waiting_list' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE appointment_waiting_list 
    ADD COLUMN assigned_to uuid REFERENCES user_profiles(id);
  END IF;
END $$;

-- Add index for faster routing queries
CREATE INDEX IF NOT EXISTS idx_waiting_list_routing 
ON appointment_waiting_list(routing_decision, is_new_patient, status);

-- Add index for assigned_to lookups
CREATE INDEX IF NOT EXISTS idx_waiting_list_assigned_to 
ON appointment_waiting_list(assigned_to);
