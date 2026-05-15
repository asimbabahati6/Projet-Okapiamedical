/*
  # Ensure booking_queue table exists with appointment_date and appointment_time columns

  1. New Tables (if not exists)
    - `booking_queue`
      - `id` (uuid, primary key)
      - `ticket_number` (text, not null)
      - `patient_name` (text, not null)
      - `patient_phone` (text)
      - `consultation_type` (text)
      - `payment_status` (text)
      - `patient_status` (text)
      - `queue_position` (integer)
      - `appointment_date` (date) - The scheduled date of the appointment
      - `appointment_time` (text) - The scheduled time of the appointment
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Modified Tables
    - `booking_queue`
      - Added `appointment_date` (date) - The scheduled date of the appointment
      - Added `appointment_time` (text) - The scheduled time of the appointment

  3. Security
    - Enable RLS on `booking_queue` table
    - Policies for authenticated users to manage booking records

  4. Important Notes
    - Uses IF NOT EXISTS to safely handle both fresh installs and existing databases
    - The appointment_date and appointment_time columns allow scheduling bookings for specific dates/times
*/

-- Create the booking_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS booking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid,
  ticket_number text NOT NULL,
  patient_name text NOT NULL,
  patient_phone text NOT NULL DEFAULT '',
  consultation_type text NOT NULL DEFAULT 'presentiel',
  specialty text NOT NULL DEFAULT '',
  reason text DEFAULT '',
  doctor_id uuid,
  doctor_name text DEFAULT '',
  department_id uuid,
  payment_status text NOT NULL DEFAULT 'pending',
  patient_status text NOT NULL DEFAULT 'pending',
  queue_position integer NOT NULL DEFAULT 0,
  room_number text DEFAULT '',
  video_link text DEFAULT '',
  consultation_fee numeric DEFAULT 0,
  invoice_id uuid,
  sms_payment_sent_at timestamptz,
  sms_called_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE booking_queue ENABLE ROW LEVEL SECURITY;

-- Add appointment_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_queue' AND column_name = 'appointment_date'
  ) THEN
    ALTER TABLE booking_queue ADD COLUMN appointment_date DATE;
  END IF;
END $$;

-- Add appointment_time column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_queue' AND column_name = 'appointment_time'
  ) THEN
    ALTER TABLE booking_queue ADD COLUMN appointment_time TEXT;
  END IF;
END $$;

-- Ensure RLS policies exist for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'booking_queue' AND policyname = 'Authenticated users can read booking queue'
  ) THEN
    CREATE POLICY "Authenticated users can read booking queue"
      ON booking_queue FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'booking_queue' AND policyname = 'Authenticated users can insert booking queue'
  ) THEN
    CREATE POLICY "Authenticated users can insert booking queue"
      ON booking_queue FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'booking_queue' AND policyname = 'Authenticated users can update booking queue'
  ) THEN
    CREATE POLICY "Authenticated users can update booking queue"
      ON booking_queue FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;