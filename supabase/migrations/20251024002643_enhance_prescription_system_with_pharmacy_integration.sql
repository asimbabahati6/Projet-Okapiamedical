/*
  # Enhanced Prescription Management System

  ## Overview
  This migration enhances the existing prescription system with:
  1. Pharmacy integration and stock management
  2. Multi-user access control improvements
  3. Export capabilities (metadata for PDF/Excel generation)
  4. Comprehensive audit trail system

  ## New Tables

  ### pharmacies
  Stores pharmacy information for prescription fulfillment
  - License numbers, contact information, locations
  - Active status tracking

  ### pharmacy_stock
  Real-time inventory management
  - Links medications to specific pharmacies
  - Tracks quantities, reorder levels, expiry dates
  - Batch number tracking for traceability

  ### prescription_items
  Detailed line items for prescriptions
  - Multiple medications per prescription
  - Substitution rules and alternatives
  - Stock availability flags

  ### prescription_audit_log
  Complete audit trail for compliance
  - All actions (create, view, edit, dispense, export)
  - User, timestamp, IP tracking
  - Before/after values for changes

  ### stock_alerts
  Automated inventory alerts
  - Low stock, out of stock warnings
  - Expiry notifications
  - Acknowledgment tracking

  ## Table Enhancements

  ### prescriptions
  - Added pharmacy_id for assignment
  - Added expiration_date for validity period
  - Added diagnosis field
  - Added QR code and digital signature fields
  - Improved status tracking

  ## Security
  - RLS policies for role-based access
  - Doctors: full CRUD on their prescriptions
  - Patients: read-only access to their own prescriptions
  - Pharmacists: view assigned + mark as dispensed
  - Comprehensive audit logging
*/

-- Create pharmacies table
CREATE TABLE IF NOT EXISTS pharmacies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  license_number text UNIQUE NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  phone text NOT NULL,
  email text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create pharmacy_stock table to track inventory
CREATE TABLE IF NOT EXISTS pharmacy_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  reorder_level integer NOT NULL DEFAULT 10,
  expiry_date date,
  batch_number text,
  unit_price decimal(10,2),
  last_updated timestamptz DEFAULT now(),
  updated_by uuid REFERENCES user_profiles(id),
  UNIQUE(pharmacy_id, medication_id, batch_number)
);

-- Create prescription_items for detailed medication tracking
CREATE TABLE IF NOT EXISTS prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_id uuid NOT NULL REFERENCES medications(id),
  dosage text NOT NULL,
  quantity integer NOT NULL,
  frequency text NOT NULL,
  duration text NOT NULL,
  instructions text,
  substitution_allowed boolean DEFAULT false,
  stock_available boolean DEFAULT true,
  alternative_medication_id uuid REFERENCES medications(id),
  created_at timestamptz DEFAULT now()
);

-- Create comprehensive audit log
CREATE TABLE IF NOT EXISTS prescription_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('created', 'viewed', 'edited', 'dispensed', 'cancelled', 'exported_pdf', 'exported_excel')),
  performed_by uuid NOT NULL REFERENCES user_profiles(id),
  performed_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  details jsonb,
  old_values jsonb,
  new_values jsonb
);

-- Create stock alerts table
CREATE TABLE IF NOT EXISTS stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  medication_id uuid NOT NULL REFERENCES medications(id),
  alert_type text NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'expired', 'expiring_soon')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message text NOT NULL,
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES user_profiles(id),
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add new columns to prescriptions table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'pharmacy_id') THEN
    ALTER TABLE prescriptions ADD COLUMN pharmacy_id uuid REFERENCES pharmacies(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'expiration_date') THEN
    ALTER TABLE prescriptions ADD COLUMN expiration_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'diagnosis') THEN
    ALTER TABLE prescriptions ADD COLUMN diagnosis text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'notes') THEN
    ALTER TABLE prescriptions ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'qr_code') THEN
    ALTER TABLE prescriptions ADD COLUMN qr_code text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'digital_signature') THEN
    ALTER TABLE prescriptions ADD COLUMN digital_signature text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'prescription_date') THEN
    ALTER TABLE prescriptions ADD COLUMN prescription_date timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'updated_at') THEN
    ALTER TABLE prescriptions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pharmacy_stock_pharmacy ON pharmacy_stock(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_stock_medication ON pharmacy_stock(medication_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_stock_quantity ON pharmacy_stock(quantity);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacy ON prescriptions(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_expiration ON prescriptions(expiration_date);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_medication ON prescription_items(medication_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_prescription ON prescription_audit_log(prescription_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON prescription_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON prescription_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_pharmacy ON stock_alerts(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_acknowledged ON stock_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_severity ON stock_alerts(severity);

-- Enable Row Level Security
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pharmacies
CREATE POLICY "Authenticated users can view active pharmacies"
  ON pharmacies FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can manage pharmacies"
  ON pharmacies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

-- RLS Policies for pharmacy_stock
CREATE POLICY "Healthcare staff can view stock"
  ON pharmacy_stock FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'doctor', 'pharmacist', 'nurse')
    )
  );

CREATE POLICY "Pharmacists and admins can manage stock"
  ON pharmacy_stock FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'pharmacist')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'pharmacist')
    )
  );

-- RLS Policies for prescription_items
CREATE POLICY "Users can view prescription items based on prescription access"
  ON prescription_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_items.prescription_id
      AND (
        p.doctor_id = auth.uid()
        OR p.patient_id IN (SELECT id FROM patients WHERE patient_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN roles r ON up.role_id = r.id
          WHERE up.id = auth.uid()
          AND r.name IN ('super_admin', 'hospital_admin', 'pharmacist')
        )
      )
    )
  );

CREATE POLICY "Doctors can manage their prescription items"
  ON prescription_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_items.prescription_id
      AND p.doctor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_items.prescription_id
      AND p.doctor_id = auth.uid()
    )
  );

-- RLS Policies for prescription_audit_log
CREATE POLICY "Admins can view all audit logs"
  ON prescription_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin')
    )
  );

CREATE POLICY "Doctors can view audit logs for their prescriptions"
  ON prescription_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_audit_log.prescription_id
      AND p.doctor_id = auth.uid()
    )
  );

CREATE POLICY "All authenticated users can create audit logs"
  ON prescription_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (performed_by = auth.uid());

-- RLS Policies for stock_alerts
CREATE POLICY "Healthcare staff can view stock alerts"
  ON stock_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'pharmacist', 'doctor')
    )
  );

CREATE POLICY "System can create stock alerts"
  ON stock_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Pharmacists can acknowledge alerts"
  ON stock_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
      AND r.name IN ('super_admin', 'hospital_admin', 'pharmacist')
    )
  )
  WITH CHECK (acknowledged_by = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prescription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for prescriptions updated_at
DROP TRIGGER IF EXISTS trigger_update_prescription_timestamp ON prescriptions;
CREATE TRIGGER trigger_update_prescription_timestamp
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_prescription_updated_at();

-- Function to check stock levels and create alerts
CREATE OR REPLACE FUNCTION check_stock_levels()
RETURNS TRIGGER AS $$
DECLARE
  med_name text;
BEGIN
  -- Get medication name
  SELECT COALESCE(brand_name, generic_name) INTO med_name
  FROM medications
  WHERE id = NEW.medication_id;

  -- Check for low stock
  IF NEW.quantity <= NEW.reorder_level AND NEW.quantity > 0 THEN
    INSERT INTO stock_alerts (pharmacy_id, medication_id, alert_type, severity, message)
    VALUES (
      NEW.pharmacy_id,
      NEW.medication_id,
      'low_stock',
      CASE 
        WHEN NEW.quantity <= NEW.reorder_level / 2 THEN 'high'
        ELSE 'medium'
      END,
      format('Stock faible pour %s - Quantité: %s, Niveau de réapprovisionnement: %s', med_name, NEW.quantity, NEW.reorder_level)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for out of stock
  IF NEW.quantity = 0 THEN
    INSERT INTO stock_alerts (pharmacy_id, medication_id, alert_type, severity, message)
    VALUES (
      NEW.pharmacy_id,
      NEW.medication_id,
      'out_of_stock',
      'critical',
      format('Stock épuisé pour %s', med_name)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for expiring soon (within 60 days)
  IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date <= CURRENT_DATE + INTERVAL '60 days' AND NEW.expiry_date > CURRENT_DATE THEN
    INSERT INTO stock_alerts (pharmacy_id, medication_id, alert_type, severity, message)
    VALUES (
      NEW.pharmacy_id,
      NEW.medication_id,
      'expiring_soon',
      CASE 
        WHEN NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'high'
        ELSE 'medium'
      END,
      format('Stock expire bientôt pour %s - Date d''expiration: %s', med_name, NEW.expiry_date)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for expired
  IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date <= CURRENT_DATE THEN
    INSERT INTO stock_alerts (pharmacy_id, medication_id, alert_type, severity, message)
    VALUES (
      NEW.pharmacy_id,
      NEW.medication_id,
      'expired',
      'critical',
      format('Stock expiré pour %s - Date d''expiration: %s', med_name, NEW.expiry_date)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stock level monitoring
DROP TRIGGER IF EXISTS trigger_check_stock_levels ON pharmacy_stock;
CREATE TRIGGER trigger_check_stock_levels
  AFTER INSERT OR UPDATE ON pharmacy_stock
  FOR EACH ROW
  EXECUTE FUNCTION check_stock_levels();

-- Function to log prescription views
CREATE OR REPLACE FUNCTION log_prescription_view()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if this is a SELECT operation (triggered by a view)
  INSERT INTO prescription_audit_log (
    prescription_id,
    action,
    performed_by,
    performed_at,
    details
  )
  VALUES (
    NEW.id,
    'viewed',
    auth.uid(),
    now(),
    jsonb_build_object('prescription_number', NEW.prescription_number)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Insert sample pharmacies
INSERT INTO pharmacies (name, license_number, address, city, phone, email) VALUES
('Pharmacie Centrale de Kinshasa', 'PH-KIN-2024-001', 'Avenue de la Libération 123', 'Kinshasa', '+243 999 000 001', 'centrale@pharmacie.cd'),
('Pharmacie du Marché', 'PH-KIN-2024-002', 'Boulevard Lumumba 456', 'Kinshasa', '+243 999 000 002', 'marche@pharmacie.cd'),
('Pharmacie de la Gombe', 'PH-KIN-2024-003', 'Avenue Gombe 789', 'Kinshasa', '+243 999 000 003', 'gombe@pharmacie.cd'),
('Pharmacie Hospitalière', 'PH-KIN-2024-004', 'Complexe Hospitalier', 'Kinshasa', '+243 999 000 004', 'hopital@pharmacie.cd')
ON CONFLICT (license_number) DO NOTHING;

-- Add sample stock for existing medications
INSERT INTO pharmacy_stock (pharmacy_id, medication_id, quantity, reorder_level, batch_number, unit_price)
SELECT 
  p.id as pharmacy_id,
  m.id as medication_id,
  floor(random() * 500 + 100)::integer as quantity,
  50 as reorder_level,
  'BATCH-' || floor(random() * 9000 + 1000)::text as batch_number,
  m.unit_price
FROM pharmacies p
CROSS JOIN medications m
WHERE p.active = true AND m.is_active = true
LIMIT 40
ON CONFLICT DO NOTHING;
