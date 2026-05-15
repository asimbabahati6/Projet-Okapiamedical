/*
  # Add appointment date and time columns to booking_queue

  1. Modified Tables
    - `booking_queue`
      - `appointment_date` (date) - The date of the appointment
      - `appointment_time` (text) - The time of the appointment
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_queue' AND column_name = 'appointment_date'
  ) THEN
    ALTER TABLE booking_queue ADD COLUMN appointment_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_queue' AND column_name = 'appointment_time'
  ) THEN
    ALTER TABLE booking_queue ADD COLUMN appointment_time TEXT;
  END IF;
END $$;