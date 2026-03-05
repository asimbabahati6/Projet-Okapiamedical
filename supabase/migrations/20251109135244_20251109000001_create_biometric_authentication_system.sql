/*
  # Biometric Authentication System for Patient Management

  1. New Tables
    - `patient_biometric_credentials`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patient_registrations or patients)
      - `credential_id` (text, unique) - WebAuthn credential ID
      - `public_key` (text) - Public key for credential verification
      - `counter` (integer) - Anti-replay counter
      - `aaguid` (text) - Authenticator AAGUID
      - `transports` (text[]) - Available transports
      - `device_name` (text) - User-friendly device name
      - `created_at` (timestamptz)
      - `last_used_at` (timestamptz)
      - `is_active` (boolean)

    - `biometric_authentication_logs`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, nullable)
      - `credential_id` (text, nullable)
      - `success` (boolean)
      - `failure_reason` (text, nullable)
      - `action` (text) - enrollment, authentication, revocation
      - `ip_address` (inet, nullable)
      - `user_agent` (text)
      - `timestamp` (timestamptz)

    - `patient_credentials`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patient_registrations)
      - `email` (text, unique)
      - `password_hash` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Schema Changes
    - Add `biometric_enrolled` boolean to `patient_registrations`
    - Add `biometric_consent_given` boolean to `patient_registrations`
    - Add `biometric_consent_date` timestamptz to `patient_registrations`

  3. Security
    - Enable RLS on all new tables
    - Add policies for patients to manage their own credentials
    - Add policies for authenticated staff to view logs
    - Create indexes for efficient lookups
*/

-- Create patient_biometric_credentials table
CREATE TABLE IF NOT EXISTS patient_biometric_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  credential_id text UNIQUE NOT NULL,
  public_key text NOT NULL,
  counter integer DEFAULT 0,
  aaguid text NOT NULL,
  transports text[] DEFAULT ARRAY[]::text[],
  device_name text,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create biometric_authentication_logs table
CREATE TABLE IF NOT EXISTS biometric_authentication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid,
  credential_id text,
  success boolean NOT NULL,
  failure_reason text,
  action text NOT NULL CHECK (action IN ('enrollment', 'authentication', 'revocation')),
  ip_address inet,
  user_agent text,
  timestamp timestamptz DEFAULT now()
);

-- Create patient_credentials table for email/password fallback
CREATE TABLE IF NOT EXISTS patient_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL UNIQUE,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add biometric fields to patient_registrations if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_registrations' AND column_name = 'biometric_enrolled'
  ) THEN
    ALTER TABLE patient_registrations ADD COLUMN biometric_enrolled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_registrations' AND column_name = 'biometric_consent_given'
  ) THEN
    ALTER TABLE patient_registrations ADD COLUMN biometric_consent_given boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_registrations' AND column_name = 'biometric_consent_date'
  ) THEN
    ALTER TABLE patient_registrations ADD COLUMN biometric_consent_date timestamptz;
  END IF;
END $$;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_patient_id
  ON patient_biometric_credentials(patient_id);
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_credential_id
  ON patient_biometric_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_active
  ON patient_biometric_credentials(patient_id, is_active);
CREATE INDEX IF NOT EXISTS idx_biometric_logs_patient_id
  ON biometric_authentication_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_biometric_logs_timestamp
  ON biometric_authentication_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_patient_credentials_patient_id
  ON patient_credentials(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_credentials_email
  ON patient_credentials(email);

-- Enable Row Level Security
ALTER TABLE patient_biometric_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_authentication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_biometric_credentials

-- Patients can view their own credentials (when we add patient auth)
CREATE POLICY "Patients can view own credentials"
  ON patient_biometric_credentials
  FOR SELECT
  TO authenticated
  USING (patient_id::text = auth.uid()::text);

-- Allow public insert during registration
CREATE POLICY "Allow public credential enrollment"
  ON patient_biometric_credentials
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Patients can update their own credentials
CREATE POLICY "Patients can update own credentials"
  ON patient_biometric_credentials
  FOR UPDATE
  TO authenticated
  USING (patient_id::text = auth.uid()::text)
  WITH CHECK (patient_id::text = auth.uid()::text);

-- Staff can view all credentials
CREATE POLICY "Staff can view all credentials"
  ON patient_biometric_credentials
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- RLS Policies for biometric_authentication_logs

-- Allow public insert for logging
CREATE POLICY "Allow public authentication logging"
  ON biometric_authentication_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Staff can view all logs
CREATE POLICY "Staff can view authentication logs"
  ON biometric_authentication_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Patients can view their own logs
CREATE POLICY "Patients can view own logs"
  ON biometric_authentication_logs
  FOR SELECT
  TO authenticated
  USING (patient_id::text = auth.uid()::text);

-- RLS Policies for patient_credentials

-- Allow public insert during registration
CREATE POLICY "Allow public credential creation"
  ON patient_credentials
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Patients can view their own credentials
CREATE POLICY "Patients can view own patient credentials"
  ON patient_credentials
  FOR SELECT
  TO authenticated
  USING (patient_id::text = auth.uid()::text);

-- Patients can update their own credentials
CREATE POLICY "Patients can update own patient credentials"
  ON patient_credentials
  FOR UPDATE
  TO authenticated
  USING (patient_id::text = auth.uid()::text)
  WITH CHECK (patient_id::text = auth.uid()::text);

-- Staff can view all patient credentials
CREATE POLICY "Staff can view patient credentials"
  ON patient_credentials
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patient_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for patient_credentials
DROP TRIGGER IF EXISTS update_patient_credentials_timestamp ON patient_credentials;
CREATE TRIGGER update_patient_credentials_timestamp
  BEFORE UPDATE ON patient_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_credentials_updated_at();

-- Create function to check credential expiration (365 days)
CREATE OR REPLACE FUNCTION check_credential_expiration()
RETURNS void AS $$
BEGIN
  UPDATE patient_biometric_credentials
  SET is_active = false
  WHERE created_at < now() - interval '365 days'
  AND is_active = true;
END;
$$ LANGUAGE plpgsql;
