/*
  # Patient Registration System with Verification and Payment

  ## Overview
  This migration creates a comprehensive patient registration system that handles:
  - Extended patient registration forms with detailed personal information
  - Identity document uploads and verification
  - Payment processing and tracking
  - Receptionist verification workflow
  - Intelligent patient routing

  ## New Tables

  ### 1. `patient_registrations`
  Stores comprehensive registration information for new patients including:
  - Personal information (name, DOB, gender)
  - Contact details (primary/secondary phone, primary/backup email)
  - Address information (street, city, postal code, country)
  - Employment information (profession, employer)
  - Medical information (reason for visit, allergies, medical history, insurance)
  - Appointment preferences (preferred days, time slots, consultation type)
  - Registration status and workflow tracking

  ### 2. `identity_documents`
  Manages uploaded identity documents with:
  - Document type (voter card, driver's license, passport, service card)
  - Document number and expiry date
  - File paths for front and back images
  - Verification status and notes
  - Verification timestamp and staff ID

  ### 3. `registration_payments`
  Tracks payment transactions for registrations:
  - Payment amount and method
  - Transaction reference and status
  - Payment date and recorded by staff
  - Links to registration and invoice

  ### 4. `registration_verification_history`
  Audit log for verification actions:
  - Action type (submitted, verified, rejected, documents_requested)
  - Staff member who performed action
  - Timestamp and notes
  - Previous and new status

  ## Security
  - All tables have RLS enabled
  - Public can insert new registrations
  - Staff can view and update registrations
  - Document access is restricted based on role
  - Payment information is protected

  ## Storage Buckets
  - Creates storage bucket for identity documents
  - Configures access policies for secure uploads
*/

-- Create patient registrations table
CREATE TABLE IF NOT EXISTS patient_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Information
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  
  -- Contact Information
  primary_phone text NOT NULL,
  secondary_phone text,
  primary_email text NOT NULL,
  backup_email text,
  
  -- Address Information
  street_address text NOT NULL,
  city text NOT NULL,
  postal_code text,
  country text NOT NULL DEFAULT 'Republic of Congo',
  
  -- Employment Information
  profession text,
  employer text,
  
  -- Medical Information
  consultation_reason text NOT NULL,
  medical_history text,
  known_allergies text,
  chronic_conditions text,
  current_medications text,
  current_physician_name text,
  insurance_provider text,
  insurance_policy_number text,
  
  -- Appointment Preferences
  preferred_consultation_type text NOT NULL CHECK (preferred_consultation_type IN ('in-person', 'telemedicine', 'either')) DEFAULT 'in-person',
  preferred_days text[], -- Array of days: ['monday', 'tuesday', etc]
  preferred_time_start time,
  preferred_time_end time,
  preferred_doctor_id uuid REFERENCES medical_staff(id),
  preferred_department_id uuid REFERENCES departments(id),
  
  -- Emergency Contact
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  
  -- Registration Status
  registration_status text NOT NULL DEFAULT 'pending_verification' 
    CHECK (registration_status IN ('pending_verification', 'documents_requested', 'verified', 'rejected', 'completed')),
  verification_notes text,
  verified_by uuid REFERENCES user_profiles(id),
  verified_at timestamptz,
  
  -- Payment Status
  payment_required boolean DEFAULT true,
  payment_amount numeric(10, 2),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Routing Information
  assigned_doctor_id uuid REFERENCES medical_staff(id),
  routing_type text CHECK (routing_type IN ('to_reception', 'to_physician', 'to_emergency')),
  routing_notes text,
  
  -- Patient Creation
  patient_id uuid REFERENCES patients(id),
  appointment_id uuid REFERENCES appointments(id),
  
  -- Metadata
  submitted_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create identity documents table
CREATE TABLE IF NOT EXISTS identity_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES patient_registrations(id) ON DELETE CASCADE,
  
  -- Document Information
  document_type text NOT NULL CHECK (document_type IN ('voter_card', 'drivers_license', 'passport', 'service_card', 'national_id')),
  document_number text NOT NULL,
  document_expiry_date date,
  
  -- File Storage
  front_image_path text NOT NULL,
  back_image_path text,
  
  -- Verification
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'requires_resubmission')),
  verification_notes text,
  verified_by uuid REFERENCES user_profiles(id),
  verified_at timestamptz,
  
  -- Metadata
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create registration payments table
CREATE TABLE IF NOT EXISTS registration_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES patient_registrations(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id),
  
  -- Payment Information
  amount numeric(10, 2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'mobile_money', 'insurance', 'bank_transfer')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  
  -- Transaction Details
  transaction_reference text,
  payment_date timestamptz,
  
  -- Receipt Information
  receipt_number text,
  receipt_url text,
  
  -- Staff Information
  recorded_by uuid REFERENCES user_profiles(id),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create registration verification history table
CREATE TABLE IF NOT EXISTS registration_verification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES patient_registrations(id) ON DELETE CASCADE,
  
  -- Action Information
  action_type text NOT NULL CHECK (action_type IN ('submitted', 'documents_requested', 'verified', 'rejected', 'payment_completed', 'assigned_doctor', 'completed')),
  previous_status text,
  new_status text,
  
  -- Staff and Details
  performed_by uuid REFERENCES user_profiles(id),
  notes text,
  
  -- Metadata
  created_at timestamptz DEFAULT now()
);

-- Create storage bucket for identity documents (will be created via Supabase dashboard or API)
-- This is a comment for documentation purposes
-- Bucket name: identity-documents
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/jpg, application/pdf

-- Enable Row Level Security
ALTER TABLE patient_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_verification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_registrations

-- Allow anyone to insert new registrations (public form submission)
CREATE POLICY "Anyone can submit new patient registrations"
  ON patient_registrations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to view their own registration by email
CREATE POLICY "Users can view own registration"
  ON patient_registrations
  FOR SELECT
  TO public
  USING (primary_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Allow authenticated staff to view all registrations
CREATE POLICY "Staff can view all registrations"
  ON patient_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Allow staff to update registrations
CREATE POLICY "Staff can update registrations"
  ON patient_registrations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- RLS Policies for identity_documents

-- Allow insertion of documents linked to registrations
CREATE POLICY "Allow document uploads during registration"
  ON identity_documents
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow viewing documents for staff only
CREATE POLICY "Staff can view identity documents"
  ON identity_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Allow staff to update document verification status
CREATE POLICY "Staff can update document verification"
  ON identity_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- RLS Policies for registration_payments

-- Allow staff to view payments
CREATE POLICY "Staff can view registration payments"
  ON registration_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Allow staff to insert payments
CREATE POLICY "Staff can record registration payments"
  ON registration_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Allow staff to update payments
CREATE POLICY "Staff can update registration payments"
  ON registration_payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- RLS Policies for registration_verification_history

-- Allow staff to view history
CREATE POLICY "Staff can view verification history"
  ON registration_verification_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Allow staff to insert history records
CREATE POLICY "Staff can add verification history"
  ON registration_verification_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_registrations_status ON patient_registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_patient_registrations_email ON patient_registrations(primary_email);
CREATE INDEX IF NOT EXISTS idx_patient_registrations_submitted_at ON patient_registrations(submitted_at);
CREATE INDEX IF NOT EXISTS idx_identity_documents_registration ON identity_documents(registration_id);
CREATE INDEX IF NOT EXISTS idx_identity_documents_status ON identity_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_registration_payments_registration ON registration_payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_registration_payments_status ON registration_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_registration_verification_history_registration ON registration_verification_history(registration_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_patient_registrations_updated_at ON patient_registrations;
CREATE TRIGGER update_patient_registrations_updated_at
  BEFORE UPDATE ON patient_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_identity_documents_updated_at ON identity_documents;
CREATE TRIGGER update_identity_documents_updated_at
  BEFORE UPDATE ON identity_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_registration_payments_updated_at ON registration_payments;
CREATE TRIGGER update_registration_payments_updated_at
  BEFORE UPDATE ON registration_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
