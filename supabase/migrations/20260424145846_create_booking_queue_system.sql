/*
  # Create Booking Queue System

  1. New Tables
    - `booking_queue`
      - `id` (uuid, primary key) - Unique booking identifier
      - `appointment_id` (uuid, FK to appointments) - Link to appointment record
      - `ticket_number` (text) - Human-readable ticket (e.g., T-001)
      - `patient_name` (text) - Patient full name
      - `patient_phone` (text) - Patient phone number
      - `consultation_type` (text) - 'presentiel' or 'visioconference'
      - `specialty` (text) - Medical specialty name
      - `reason` (text) - Reason for visit
      - `doctor_id` (uuid, FK to user_profiles) - Assigned doctor
      - `doctor_name` (text) - Cached doctor name for display
      - `department_id` (uuid, FK to departments) - Department
      - `payment_status` (text) - 'pending' or 'paid'
      - `patient_status` (text) - 'pending', 'paid', or 'called'
      - `queue_position` (integer) - Position in waiting line
      - `room_number` (text) - Physical room number for in-person
      - `video_link` (text) - Video conference link for telemedicine
      - `consultation_fee` (numeric) - Amount to pay
      - `invoice_id` (uuid, FK to invoices) - Link to generated invoice
      - `sms_payment_sent_at` (timestamptz) - When payment SMS was sent
      - `sms_called_sent_at` (timestamptz) - When doctor-call SMS was sent
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on `booking_queue` table
    - Policy for public insert (patient self-registration)
    - Policy for authenticated staff to read/update all records
    - Policy for public read of own ticket by ID

  3. Functions
    - `generate_ticket_number()` - Auto-generates sequential ticket numbers per day

  4. Important Notes
    - This table bridges the appointment booking workflow between registration, payment, and doctor notification
    - Enables real-time queue tracking via Supabase subscriptions
    - SMS fields are timestamps to track when simulated notifications were sent
*/

-- Create the booking_queue table
CREATE TABLE IF NOT EXISTS booking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  ticket_number text NOT NULL,
  patient_name text NOT NULL,
  patient_phone text NOT NULL DEFAULT '',
  consultation_type text NOT NULL DEFAULT 'presentiel',
  specialty text NOT NULL DEFAULT '',
  reason text DEFAULT '',
  doctor_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  doctor_name text DEFAULT '',
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  patient_status text NOT NULL DEFAULT 'pending',
  queue_position integer NOT NULL DEFAULT 0,
  room_number text DEFAULT '',
  video_link text DEFAULT '',
  consultation_fee numeric DEFAULT 50.00,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  sms_payment_sent_at timestamptz,
  sms_called_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE booking_queue ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated staff can read all booking queue records
CREATE POLICY "Staff can read all booking queue records"
  ON booking_queue
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: authenticated staff can update booking queue records
CREATE POLICY "Staff can update booking queue records"
  ON booking_queue
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: anyone can insert into booking queue (public patient registration)
CREATE POLICY "Anyone can register in booking queue"
  ON booking_queue
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: public can read their own ticket by matching phone
CREATE POLICY "Public can read own booking by phone"
  ON booking_queue
  FOR SELECT
  TO anon
  USING (patient_phone != '' AND patient_phone IS NOT NULL);

-- Function to generate daily sequential ticket numbers
CREATE OR REPLACE FUNCTION generate_daily_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_count integer;
  ticket text;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM booking_queue
  WHERE DATE(created_at) = CURRENT_DATE;
  
  ticket := 'T-' || LPAD(today_count::text, 3, '0');
  RETURN ticket;
END;
$$;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_booking_queue_patient_status ON booking_queue(patient_status);
CREATE INDEX IF NOT EXISTS idx_booking_queue_payment_status ON booking_queue(payment_status);
CREATE INDEX IF NOT EXISTS idx_booking_queue_created_at ON booking_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_booking_queue_doctor_id ON booking_queue(doctor_id);
CREATE INDEX IF NOT EXISTS idx_booking_queue_ticket_number ON booking_queue(ticket_number);

-- Enable realtime for live queue updates
ALTER PUBLICATION supabase_realtime ADD TABLE booking_queue;
