/*
  # OKAPIA Hospital Management System - Initial Database Schema

  ## Overview
  This migration creates the foundational database structure for the OKAPIA Hospital Management System,
  a comprehensive healthcare platform with dual interfaces for public patients and internal staff.

  ## Tables Created

  ### User Management & Authentication
  1. **roles** - System roles with hierarchical permissions
     - id (uuid, primary key)
     - name (text) - Role name: super_admin, hospital_admin, doctor, nurse, pharmacist, receptionist
     - description (text) - Role description
     - level (integer) - Permission hierarchy level
     - created_at (timestamptz)
  
  2. **user_profiles** - Extended user information beyond auth.users
     - id (uuid, primary key, references auth.users)
     - role_id (uuid, references roles)
     - full_name (text)
     - phone (text)
     - avatar_url (text)
     - department_id (uuid, references departments)
     - is_active (boolean)
     - created_at (timestamptz)
     - updated_at (timestamptz)

  ### Hospital Structure
  3. **departments** - Hospital departments and specializations
     - id (uuid, primary key)
     - name (text)
     - description (text)
     - phone (text)
     - email (text)
     - is_active (boolean)
     - created_at (timestamptz)

  ### Patient Management
  4. **patients** - Patient demographic and contact information
     - id (uuid, primary key)
     - patient_number (text, unique) - Auto-generated patient ID
     - first_name (text)
     - last_name (text)
     - date_of_birth (date)
     - gender (text)
     - blood_group (text)
     - phone (text)
     - email (text)
     - address (text)
     - city (text)
     - emergency_contact_name (text)
     - emergency_contact_phone (text)
     - emergency_contact_relationship (text)
     - insurance_provider (text)
     - insurance_number (text)
     - allergies (text[])
     - chronic_conditions (text[])
     - created_at (timestamptz)
     - updated_at (timestamptz)

  ### Medical Staff
  5. **medical_staff** - Doctor and healthcare provider details
     - id (uuid, primary key, references user_profiles)
     - license_number (text)
     - specialization (text)
     - qualifications (text[])
     - years_of_experience (integer)
     - consultation_fee (numeric)
     - bio (text)
     - is_accepting_patients (boolean)
     - created_at (timestamptz)
     - updated_at (timestamptz)

  ### Appointment System
  6. **appointment_slots** - Doctor availability schedule
     - id (uuid, primary key)
     - doctor_id (uuid, references medical_staff)
     - day_of_week (integer) - 0=Sunday, 6=Saturday
     - start_time (time)
     - end_time (time)
     - slot_duration (integer) - Duration in minutes
     - max_appointments (integer)
     - is_active (boolean)
     - created_at (timestamptz)

  7. **appointments** - Patient appointment bookings
     - id (uuid, primary key)
     - appointment_number (text, unique)
     - patient_id (uuid, references patients)
     - doctor_id (uuid, references medical_staff)
     - department_id (uuid, references departments)
     - appointment_date (date)
     - appointment_time (time)
     - status (text) - pending, confirmed, in_progress, completed, cancelled, no_show
     - appointment_type (text) - consultation, follow_up, emergency
     - reason (text)
     - notes (text)
     - checked_in_at (timestamptz)
     - completed_at (timestamptz)
     - cancelled_at (timestamptz)
     - cancellation_reason (text)
     - created_by (uuid, references user_profiles)
     - created_at (timestamptz)
     - updated_at (timestamptz)

  ### Consultation & Medical Records
  8. **consultations** - Medical consultation records
     - id (uuid, primary key)
     - appointment_id (uuid, references appointments)
     - patient_id (uuid, references patients)
     - doctor_id (uuid, references medical_staff)
     - consultation_date (timestamptz)
     - chief_complaint (text)
     - history_of_present_illness (text)
     - vital_signs (jsonb) - BP, temp, heart rate, etc.
     - physical_examination (text)
     - diagnosis (text)
     - diagnosis_codes (text[]) - ICD-10 codes
     - treatment_plan (text)
     - notes (text)
     - follow_up_date (date)
     - created_at (timestamptz)
     - updated_at (timestamptz)

  9. **prescriptions** - Medication prescriptions
     - id (uuid, primary key)
     - consultation_id (uuid, references consultations)
     - patient_id (uuid, references patients)
     - doctor_id (uuid, references medical_staff)
     - prescription_number (text, unique)
     - medication_name (text)
     - dosage (text)
     - frequency (text)
     - duration (text)
     - quantity (integer)
     - instructions (text)
     - status (text) - pending, dispensed, cancelled
     - dispensed_by (uuid, references user_profiles)
     - dispensed_at (timestamptz)
     - created_at (timestamptz)

  ### Laboratory Services
  10. **lab_tests** - Laboratory test catalog
      - id (uuid, primary key)
      - test_code (text, unique)
      - test_name (text)
      - category (text)
      - specimen_type (text)
      - normal_range (text)
      - unit (text)
      - price (numeric)
      - turnaround_time (integer) - Hours
      - is_active (boolean)
      - created_at (timestamptz)

  11. **lab_orders** - Laboratory test orders
      - id (uuid, primary key)
      - order_number (text, unique)
      - patient_id (uuid, references patients)
      - doctor_id (uuid, references medical_staff)
      - consultation_id (uuid, references consultations)
      - test_id (uuid, references lab_tests)
      - priority (text) - routine, urgent, stat
      - status (text) - pending, collected, in_progress, completed, cancelled
      - specimen_collected_at (timestamptz)
      - result_value (text)
      - result_unit (text)
      - is_abnormal (boolean)
      - notes (text)
      - performed_by (uuid, references user_profiles)
      - approved_by (uuid, references user_profiles)
      - approved_at (timestamptz)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  ### Hospitalization
  12. **wards** - Hospital wards and units
      - id (uuid, primary key)
      - name (text)
      - ward_type (text) - general, icu, maternity, pediatric
      - floor (integer)
      - total_beds (integer)
      - available_beds (integer)
      - created_at (timestamptz)

  13. **beds** - Hospital bed inventory
      - id (uuid, primary key)
      - ward_id (uuid, references wards)
      - bed_number (text)
      - room_number (text)
      - bed_type (text) - standard, icu, isolation
      - status (text) - available, occupied, cleaning, maintenance
      - current_patient_id (uuid, references patients)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  14. **hospitalizations** - Patient admission records
      - id (uuid, primary key)
      - admission_number (text, unique)
      - patient_id (uuid, references patients)
      - doctor_id (uuid, references medical_staff)
      - bed_id (uuid, references beds)
      - admission_date (timestamptz)
      - admission_reason (text)
      - admission_diagnosis (text)
      - status (text) - active, discharged, transferred
      - discharge_date (timestamptz)
      - discharge_summary (text)
      - discharge_instructions (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  ### Pharmacy & Inventory
  15. **medications** - Medication inventory
      - id (uuid, primary key)
      - medication_code (text, unique)
      - generic_name (text)
      - brand_name (text)
      - category (text)
      - dosage_form (text)
      - strength (text)
      - unit_price (numeric)
      - quantity_in_stock (integer)
      - reorder_level (integer)
      - expiry_date (date)
      - supplier (text)
      - is_controlled_substance (boolean)
      - is_active (boolean)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  ### Billing
  16. **invoices** - Patient billing invoices
      - id (uuid, primary key)
      - invoice_number (text, unique)
      - patient_id (uuid, references patients)
      - consultation_id (uuid, references consultations)
      - total_amount (numeric)
      - paid_amount (numeric)
      - balance (numeric)
      - status (text) - pending, partial, paid, cancelled
      - payment_method (text)
      - payment_date (timestamptz)
      - notes (text)
      - created_by (uuid, references user_profiles)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  17. **invoice_items** - Detailed invoice line items
      - id (uuid, primary key)
      - invoice_id (uuid, references invoices)
      - description (text)
      - item_type (text) - consultation, medication, lab_test, procedure
      - quantity (integer)
      - unit_price (numeric)
      - total_price (numeric)
      - created_at (timestamptz)

  ### News & Communications
  18. **news_articles** - Hospital news and announcements
      - id (uuid, primary key)
      - title (text)
      - content (text)
      - author_id (uuid, references user_profiles)
      - featured_image_url (text)
      - is_published (boolean)
      - published_at (timestamptz)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  19. **contact_messages** - Public inquiry submissions
      - id (uuid, primary key)
      - full_name (text)
      - email (text)
      - phone (text)
      - subject (text)
      - message (text)
      - status (text) - new, in_progress, resolved
      - responded_by (uuid, references user_profiles)
      - response (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  ### System & Audit
  20. **audit_logs** - System audit trail
      - id (uuid, primary key)
      - user_id (uuid, references user_profiles)
      - action (text)
      - table_name (text)
      - record_id (uuid)
      - old_values (jsonb)
      - new_values (jsonb)
      - ip_address (text)
      - user_agent (text)
      - created_at (timestamptz)

  21. **notifications** - User notifications
      - id (uuid, primary key)
      - user_id (uuid, references user_profiles)
      - title (text)
      - message (text)
      - type (text) - info, warning, error, success
      - is_read (boolean)
      - link (text)
      - created_at (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies created for role-based access control
  - Audit logging for sensitive operations
  - Automatic timestamp management with triggers

  ## Notes
  - All IDs use UUID v4 for security and scalability
  - Timestamps use timestamptz for timezone awareness
  - Foreign keys ensure referential integrity
  - Indexes created on frequently queried columns
  - Sensible defaults provided for boolean and status fields
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  level integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert default roles
INSERT INTO roles (name, description, level) VALUES
  ('super_admin', 'Full system access and configuration', 1),
  ('hospital_admin', 'Hospital operations and staff management', 2),
  ('doctor', 'Medical consultations and patient care', 3),
  ('nurse', 'Patient care and ward management', 4),
  ('pharmacist', 'Medication dispensing and inventory', 5),
  ('receptionist', 'Appointment scheduling and patient registration', 6)
ON CONFLICT (name) DO NOTHING;

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id),
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  department_id uuid REFERENCES departments(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL,
  blood_group text,
  phone text,
  email text,
  address text,
  city text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  insurance_provider text,
  insurance_number text,
  allergies text[],
  chronic_conditions text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create medical_staff table
CREATE TABLE IF NOT EXISTS medical_staff (
  id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  license_number text,
  specialization text,
  qualifications text[],
  years_of_experience integer DEFAULT 0,
  consultation_fee numeric(10,2),
  bio text,
  is_accepting_patients boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create appointment_slots table
CREATE TABLE IF NOT EXISTS appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES medical_staff(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration integer DEFAULT 30,
  max_appointments integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_number text UNIQUE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES medical_staff(id),
  department_id uuid REFERENCES departments(id),
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text DEFAULT 'pending',
  appointment_type text DEFAULT 'consultation',
  reason text,
  notes text,
  checked_in_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create consultations table
CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES medical_staff(id),
  consultation_date timestamptz DEFAULT now(),
  chief_complaint text,
  history_of_present_illness text,
  vital_signs jsonb,
  physical_examination text,
  diagnosis text,
  diagnosis_codes text[],
  treatment_plan text,
  notes text,
  follow_up_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid REFERENCES consultations(id),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES medical_staff(id),
  prescription_number text UNIQUE NOT NULL,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  duration text,
  quantity integer,
  instructions text,
  status text DEFAULT 'pending',
  dispensed_by uuid REFERENCES user_profiles(id),
  dispensed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create lab_tests table
CREATE TABLE IF NOT EXISTS lab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_code text UNIQUE NOT NULL,
  test_name text NOT NULL,
  category text,
  specimen_type text,
  normal_range text,
  unit text,
  price numeric(10,2),
  turnaround_time integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create lab_orders table
CREATE TABLE IF NOT EXISTS lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES medical_staff(id),
  consultation_id uuid REFERENCES consultations(id),
  test_id uuid REFERENCES lab_tests(id),
  priority text DEFAULT 'routine',
  status text DEFAULT 'pending',
  specimen_collected_at timestamptz,
  result_value text,
  result_unit text,
  is_abnormal boolean DEFAULT false,
  notes text,
  performed_by uuid REFERENCES user_profiles(id),
  approved_by uuid REFERENCES user_profiles(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wards table
CREATE TABLE IF NOT EXISTS wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ward_type text,
  floor integer,
  total_beds integer DEFAULT 0,
  available_beds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create beds table
CREATE TABLE IF NOT EXISTS beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id uuid REFERENCES wards(id) ON DELETE CASCADE,
  bed_number text NOT NULL,
  room_number text,
  bed_type text DEFAULT 'standard',
  status text DEFAULT 'available',
  current_patient_id uuid REFERENCES patients(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hospitalizations table
CREATE TABLE IF NOT EXISTS hospitalizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number text UNIQUE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES medical_staff(id),
  bed_id uuid REFERENCES beds(id),
  admission_date timestamptz DEFAULT now(),
  admission_reason text,
  admission_diagnosis text,
  status text DEFAULT 'active',
  discharge_date timestamptz,
  discharge_summary text,
  discharge_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_code text UNIQUE NOT NULL,
  generic_name text NOT NULL,
  brand_name text,
  category text,
  dosage_form text,
  strength text,
  unit_price numeric(10,2),
  quantity_in_stock integer DEFAULT 0,
  reorder_level integer DEFAULT 10,
  expiry_date date,
  supplier text,
  is_controlled_substance boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  consultation_id uuid REFERENCES consultations(id),
  total_amount numeric(10,2) DEFAULT 0,
  paid_amount numeric(10,2) DEFAULT 0,
  balance numeric(10,2) DEFAULT 0,
  status text DEFAULT 'pending',
  payment_method text,
  payment_date timestamptz,
  notes text,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  item_type text,
  quantity integer DEFAULT 1,
  unit_price numeric(10,2),
  total_price numeric(10,2),
  created_at timestamptz DEFAULT now()
);

-- Create news_articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  author_id uuid REFERENCES user_profiles(id),
  featured_image_url text,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  status text DEFAULT 'new',
  responded_by uuid REFERENCES user_profiles(id),
  response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id),
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department_id ON user_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_patients_patient_number ON patients(patient_number);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_id ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_medications_code ON medications(medication_code);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable Row Level Security on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table (read-only for authenticated users)
CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for departments table
CREATE POLICY "Anyone can view active departments"
  ON departments FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for user_profiles table
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Staff can view other staff profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage user profiles"
  ON user_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for patients table
CREATE POLICY "Authenticated staff can view patients"
  ON patients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Receptionists and admins can create patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'receptionist', 'doctor', 'nurse')
    )
  );

CREATE POLICY "Staff can update patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'receptionist', 'doctor', 'nurse')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'receptionist', 'doctor', 'nurse')
    )
  );

-- RLS Policies for medical_staff table
CREATE POLICY "Anyone can view active medical staff"
  ON medical_staff FOR SELECT
  TO anon, authenticated
  USING (is_accepting_patients = true);

CREATE POLICY "Admins can manage medical staff"
  ON medical_staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for appointment_slots table
CREATE POLICY "Anyone can view active appointment slots"
  ON appointment_slots FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Doctors can manage own appointment slots"
  ON appointment_slots FOR ALL
  TO authenticated
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Admins can manage all appointment slots"
  ON appointment_slots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for appointments table
CREATE POLICY "Staff can view appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create appointments"
  ON appointments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'receptionist', 'doctor', 'nurse')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'receptionist', 'doctor', 'nurse')
    )
  );

-- RLS Policies for consultations table
CREATE POLICY "Doctors can view own consultations"
  ON consultations FOR SELECT
  TO authenticated
  USING (doctor_id = auth.uid());

CREATE POLICY "Medical staff can view consultations"
  ON consultations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'doctor', 'nurse')
    )
  );

CREATE POLICY "Doctors can create consultations"
  ON consultations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('doctor')
    )
  );

CREATE POLICY "Doctors can update own consultations"
  ON consultations FOR UPDATE
  TO authenticated
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

-- RLS Policies for prescriptions table
CREATE POLICY "Doctors and pharmacists can view prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'doctor', 'pharmacist')
    )
  );

CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('doctor')
    )
  );

CREATE POLICY "Pharmacists can update prescriptions"
  ON prescriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('pharmacist', 'doctor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('pharmacist', 'doctor')
    )
  );

-- RLS Policies for lab_tests table
CREATE POLICY "Anyone can view active lab tests"
  ON lab_tests FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage lab tests"
  ON lab_tests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for lab_orders table
CREATE POLICY "Medical staff can view lab orders"
  ON lab_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'doctor', 'nurse')
    )
  );

CREATE POLICY "Doctors can create lab orders"
  ON lab_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('doctor')
    )
  );

CREATE POLICY "Medical staff can update lab orders"
  ON lab_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'doctor', 'nurse')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'doctor', 'nurse')
    )
  );

-- RLS Policies for wards and beds
CREATE POLICY "Staff can view wards"
  ON wards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can view beds"
  ON beds FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and nurses can manage beds"
  ON beds FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'nurse', 'doctor')
    )
  );

-- RLS Policies for hospitalizations table
CREATE POLICY "Medical staff can view hospitalizations"
  ON hospitalizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'doctor', 'nurse')
    )
  );

CREATE POLICY "Doctors can manage hospitalizations"
  ON hospitalizations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'doctor')
    )
  );

-- RLS Policies for medications table
CREATE POLICY "Staff can view medications"
  ON medications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Pharmacists and admins can manage medications"
  ON medications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'pharmacist')
    )
  );

-- RLS Policies for invoices and invoice_items
CREATE POLICY "Staff can view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'receptionist', 'doctor')
    )
  );

CREATE POLICY "Staff can view invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can create invoice items"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for news_articles table
CREATE POLICY "Anyone can view published articles"
  ON news_articles FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage articles"
  ON news_articles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for contact_messages table
CREATE POLICY "Anyone can create contact messages"
  ON contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'receptionist')
    )
  );

CREATE POLICY "Admins can update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'receptionist')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'receptionist')
    )
  );

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to generate patient numbers
CREATE OR REPLACE FUNCTION generate_patient_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM patients;
  new_number := 'PAT' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate appointment numbers
CREATE OR REPLACE FUNCTION generate_appointment_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM appointments WHERE DATE(created_at) = CURRENT_DATE;
  new_number := 'APT' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate prescription numbers
CREATE OR REPLACE FUNCTION generate_prescription_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM prescriptions WHERE DATE(created_at) = CURRENT_DATE;
  new_number := 'RX' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(counter::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate patient number
CREATE OR REPLACE FUNCTION set_patient_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.patient_number IS NULL OR NEW.patient_number = '' THEN
    NEW.patient_number := generate_patient_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_patient_number
  BEFORE INSERT ON patients
  FOR EACH ROW
  EXECUTE FUNCTION set_patient_number();

-- Create trigger to auto-generate appointment number
CREATE OR REPLACE FUNCTION set_appointment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.appointment_number IS NULL OR NEW.appointment_number = '' THEN
    NEW.appointment_number := generate_appointment_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_appointment_number
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_appointment_number();

-- Create trigger to auto-generate prescription number
CREATE OR REPLACE FUNCTION set_prescription_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.prescription_number IS NULL OR NEW.prescription_number = '' THEN
    NEW.prescription_number := generate_prescription_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_prescription_number
  BEFORE INSERT ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_prescription_number();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_staff_updated_at
  BEFORE UPDATE ON medical_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();