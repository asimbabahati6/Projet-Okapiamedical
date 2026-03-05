/*
  # Module Transport - Système de Gestion Complet

  Système complet de gestion du transport hospitalier incluant flotte, chauffeurs, 
  missions, GPS tracking, carburant et maintenance.

  Tables: 10
  Enums: 7
  Fonctions: 3
  Vues: 1
  Triggers: 7
  Policies RLS: 15
*/

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

DO $$ BEGIN CREATE TYPE vehicle_type AS ENUM ('ambulance', 'car', 'van', 'motorcycle', 'truck');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE vehicle_status AS ENUM ('available', 'in_mission', 'maintenance', 'out_of_service', 'reserved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE mission_type AS ENUM ('emergency', 'appointment', 'transfer', 'delivery', 'routine', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE mission_status AS ENUM ('requested', 'assigned', 'confirmed', 'en_route_pickup', 'picked_up', 'en_route_destination', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE mission_priority AS ENUM ('critical', 'high', 'normal', 'low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE maintenance_type AS ENUM ('preventive', 'corrective', 'inspection', 'repair');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE document_type_vehicle AS ENUM ('insurance', 'registration', 'technical_inspection', 'license', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 2. VÉHICULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number text UNIQUE NOT NULL,
  vin_number text UNIQUE,
  vehicle_type vehicle_type NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer CHECK (year >= 1950 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
  color text,
  seating_capacity integer DEFAULT 4,
  cargo_capacity_kg decimal(10,2),
  has_medical_equipment boolean DEFAULT false,
  has_oxygen boolean DEFAULT false,
  has_stretcher boolean DEFAULT false,
  has_defibrillator boolean DEFAULT false,
  status vehicle_status DEFAULT 'available',
  current_mileage_km decimal(10,2) DEFAULT 0,
  purchase_date date,
  last_service_date date,
  next_service_due_date date,
  next_service_due_mileage_km decimal(10,2),
  purchase_price decimal(12,2),
  current_value decimal(12,2),
  current_location text,
  home_location text DEFAULT 'Hospital Main Parking',
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(vehicle_type);

-- ============================================================================
-- 3. DOCUMENTS VÉHICULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_type document_type_vehicle NOT NULL,
  document_name text NOT NULL,
  document_number text,
  issue_date date,
  expiry_date date,
  document_url text,
  file_size integer,
  mime_type text,
  alert_days_before integer DEFAULT 30,
  notes text,
  uploaded_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_docs_vehicle ON vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_docs_expiry ON vehicle_documents(expiry_date);

-- ============================================================================
-- 4. CHAUFFEURS
-- ============================================================================

CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  license_number text UNIQUE NOT NULL,
  license_issue_date date,
  license_expiry_date date,
  license_categories text[] DEFAULT ARRAY[]::text[],
  has_ambulance_certification boolean DEFAULT false,
  ambulance_cert_expiry date,
  has_first_aid_training boolean DEFAULT false,
  first_aid_cert_expiry date,
  is_available boolean DEFAULT true,
  current_shift_start timestamptz,
  current_shift_end timestamptz,
  total_missions integer DEFAULT 0,
  total_km_driven decimal(10,2) DEFAULT 0,
  average_rating decimal(3,2),
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drivers_user ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(is_available);

-- ============================================================================
-- 5. AFFECTATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS driver_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_until timestamptz,
  is_active boolean DEFAULT true,
  assigned_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver ON driver_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_vehicle ON driver_assignments(vehicle_id);

-- ============================================================================
-- 6. MISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS transport_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_number text UNIQUE NOT NULL,
  mission_type mission_type NOT NULL,
  priority mission_priority DEFAULT 'normal',
  status mission_status DEFAULT 'requested',
  requested_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  requested_at timestamptz DEFAULT now(),
  requested_for timestamptz,
  assigned_vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  assigned_driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  assigned_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  pickup_location text NOT NULL,
  pickup_lat decimal(10,8),
  pickup_lng decimal(11,8),
  destination_location text NOT NULL,
  destination_lat decimal(10,8),
  destination_lng decimal(11,8),
  scheduled_pickup_time timestamptz,
  actual_pickup_time timestamptz,
  scheduled_arrival_time timestamptz,
  actual_arrival_time timestamptz,
  patient_condition text,
  special_requirements text,
  medical_equipment_needed text[],
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  distance_km decimal(10,2),
  duration_minutes integer,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_missions_status ON transport_missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_vehicle ON transport_missions(assigned_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_missions_driver ON transport_missions(assigned_driver_id);

-- ============================================================================
-- 7. PASSAGERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS mission_passengers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES transport_missions(id) ON DELETE CASCADE,
  passenger_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  passenger_name text NOT NULL,
  passenger_type text CHECK (passenger_type IN ('patient', 'staff', 'visitor', 'other')),
  age integer,
  medical_condition text,
  requires_assistance boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mission_passengers_mission ON mission_passengers(mission_id);

-- ============================================================================
-- 8. GPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  mission_id uuid REFERENCES transport_missions(id) ON DELETE SET NULL,
  latitude decimal(10,8) NOT NULL,
  longitude decimal(11,8) NOT NULL,
  altitude decimal(8,2),
  accuracy decimal(8,2),
  speed_kmh decimal(6,2),
  heading decimal(5,2),
  odometer_km decimal(10,2),
  recorded_at timestamptz DEFAULT now(),
  source text DEFAULT 'gps_device'
);

CREATE INDEX IF NOT EXISTS idx_vehicle_locations_vehicle ON vehicle_locations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_time ON vehicle_locations(recorded_at DESC);

-- ============================================================================
-- 9. CARBURANT
-- ============================================================================

CREATE TABLE IF NOT EXISTS fuel_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  refuel_date date DEFAULT CURRENT_DATE,
  refuel_time time DEFAULT CURRENT_TIME,
  liters decimal(8,2) NOT NULL CHECK (liters > 0),
  cost_per_liter decimal(8,2),
  total_cost decimal(10,2) GENERATED ALWAYS AS (liters * cost_per_liter) STORED,
  odometer_reading_km decimal(10,2) NOT NULL,
  km_since_last_refuel decimal(10,2),
  fuel_efficiency_km_per_liter decimal(6,2),
  fuel_station text,
  receipt_number text,
  payment_method text,
  receipt_url text,
  recorded_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fuel_records_vehicle ON fuel_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_date ON fuel_records(refuel_date DESC);

-- ============================================================================
-- 10. MAINTENANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type maintenance_type NOT NULL,
  scheduled_date date,
  actual_date date NOT NULL,
  completed_at timestamptz,
  description text NOT NULL,
  work_performed text,
  parts_replaced text[],
  odometer_reading_km decimal(10,2),
  labor_cost decimal(10,2) DEFAULT 0,
  parts_cost decimal(10,2) DEFAULT 0,
  total_cost decimal(10,2) GENERATED ALWAYS AS (labor_cost + parts_cost) STORED,
  service_provider text,
  invoice_number text,
  invoice_url text,
  is_completed boolean DEFAULT false,
  performed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_records(actual_date DESC);

-- ============================================================================
-- 11. PLANIFICATION MAINTENANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type maintenance_type NOT NULL,
  description text NOT NULL,
  frequency_km integer,
  frequency_months integer,
  last_performed_date date,
  last_performed_km decimal(10,2),
  next_due_date date,
  next_due_km decimal(10,2),
  alert_days_before integer DEFAULT 7,
  alert_km_before integer DEFAULT 500,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_vehicle ON maintenance_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_due_date ON maintenance_schedules(next_due_date);

-- ============================================================================
-- 12. FONCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 decimal, lon1 decimal, lat2 decimal, lon2 decimal
) RETURNS decimal LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  radius_earth_km decimal := 6371;
  dlat decimal; dlon decimal; a decimal; c decimal;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN RETURN NULL; END IF;
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2) * SIN(dlon/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  RETURN ROUND((radius_earth_km * c)::numeric, 2);
END; $$;

CREATE OR REPLACE FUNCTION generate_mission_number() RETURNS text LANGUAGE plpgsql AS $$
DECLARE v_year text; v_month text; v_sequence integer; v_mission_number text;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_month := TO_CHAR(CURRENT_DATE, 'MM');
  SELECT COUNT(*) + 1 INTO v_sequence FROM transport_missions
  WHERE TO_CHAR(created_at, 'YYYY-MM') = v_year || '-' || v_month;
  v_mission_number := 'TM-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::text, 4, '0');
  RETURN v_mission_number;
END; $$;

CREATE OR REPLACE FUNCTION update_vehicle_status_from_missions() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('en_route_pickup', 'picked_up', 'en_route_destination') AND OLD.status != NEW.status THEN
    UPDATE vehicles SET status = 'in_mission', updated_at = now() WHERE id = NEW.assigned_vehicle_id;
  END IF;
  IF NEW.status IN ('completed', 'cancelled') AND OLD.status != NEW.status THEN
    IF NOT EXISTS (
      SELECT 1 FROM transport_missions
      WHERE assigned_vehicle_id = NEW.assigned_vehicle_id
        AND status IN ('assigned', 'confirmed', 'en_route_pickup', 'picked_up', 'en_route_destination')
        AND id != NEW.id
    ) THEN
      UPDATE vehicles SET status = 'available', updated_at = now() WHERE id = NEW.assigned_vehicle_id;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS update_vehicle_status_trigger ON transport_missions;
CREATE TRIGGER update_vehicle_status_trigger
  AFTER UPDATE OF status ON transport_missions
  FOR EACH ROW EXECUTE FUNCTION update_vehicle_status_from_missions();

-- ============================================================================
-- 13. VUES
-- ============================================================================

CREATE OR REPLACE VIEW fleet_overview AS
SELECT
  v.vehicle_type,
  COUNT(*) as total_vehicles,
  COUNT(CASE WHEN v.status = 'available' THEN 1 END) as available,
  COUNT(CASE WHEN v.status = 'in_mission' THEN 1 END) as in_mission,
  COUNT(CASE WHEN v.status = 'maintenance' THEN 1 END) as in_maintenance,
  COUNT(CASE WHEN v.status = 'out_of_service' THEN 1 END) as out_of_service,
  ROUND(AVG(v.current_mileage_km), 0) as avg_mileage_km
FROM vehicles v
WHERE v.is_active = true
GROUP BY v.vehicle_type;

-- ============================================================================
-- 14. TRIGGERS TIMESTAMPS
-- ============================================================================

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_documents_updated_at ON vehicle_documents;
CREATE TRIGGER update_vehicle_documents_updated_at BEFORE UPDATE ON vehicle_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transport_missions_updated_at ON transport_missions;
CREATE TRIGGER update_transport_missions_updated_at BEFORE UPDATE ON transport_missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_records_updated_at ON maintenance_records;
CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_schedules_updated_at ON maintenance_schedules;
CREATE TRIGGER update_maintenance_schedules_updated_at BEFORE UPDATE ON maintenance_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 15. RLS
-- ============================================================================

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers full access vehicles" ON vehicles FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'logistician', 'administrative_staff'))
);

CREATE POLICY "Managers full access docs" ON vehicle_documents FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'logistician', 'administrative_staff'))
);

CREATE POLICY "Managers full access drivers" ON drivers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'logistician', 'administrative_staff'))
);

CREATE POLICY "Managers full access assignments" ON driver_assignments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'logistician', 'administrative_staff'))
);

CREATE POLICY "Staff create missions" ON transport_missions FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Staff see own missions" ON transport_missions FOR SELECT TO authenticated USING (requested_by = auth.uid());
CREATE POLICY "Drivers see assigned missions" ON transport_missions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = auth.uid() AND d.id = assigned_driver_id)
);
CREATE POLICY "Managers full access missions" ON transport_missions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'logistician', 'administrative_staff'))
);

CREATE POLICY "All read passengers" ON mission_passengers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers manage passengers" ON mission_passengers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'logistician', 'administrative_staff'))
);

CREATE POLICY "Managers full locations" ON vehicle_locations FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'logistician', 'administrative_staff'))
);

CREATE POLICY "Managers full fuel" ON fuel_records FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'logistician', 'administrative_staff'))
);

CREATE POLICY "Managers full maintenance" ON maintenance_records FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'logistician', 'administrative_staff'))
);

CREATE POLICY "Managers full schedules" ON maintenance_schedules FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles up JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid() AND r.name IN ('super_admin', 'logistician', 'administrative_staff'))
);
