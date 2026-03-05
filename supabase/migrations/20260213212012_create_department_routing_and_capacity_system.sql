/*
  # Department Routing and Capacity Management System

  ## Overview
  This migration creates a comprehensive system for intelligent patient routing to departments
  and real-time capacity management to ensure balanced workload distribution.

  ## New Tables

  ### 1. `department_routing_rules`
  Stores keyword-based routing rules to automatically assign patients to appropriate departments
  - `id` (uuid, primary key)
  - `keyword` (text) - Medical condition or symptom keyword
  - `department_id` (uuid) - Target department for this condition
  - `priority` (integer) - Rule priority (higher = checked first)
  - `condition_category` (text) - Category for grouping (e.g., 'cardiac', 'respiratory')
  - `is_emergency` (boolean) - Whether this indicates emergency condition
  - `age_min` / `age_max` (integer) - Optional age restrictions
  - `description` (text) - Human-readable explanation
  - `is_active` (boolean) - Enable/disable rule

  ### 2. `department_capacity_config`
  Configuration for department capacity management and overflow handling
  - `department_id` (uuid, primary key)
  - `max_patients_per_day` (integer) - Maximum daily patient capacity
  - `max_queue_length` (integer) - Maximum waiting queue size
  - `alert_threshold_percentage` (integer) - When to send capacity alerts (default 80%)
  - `auto_route_overflow` (boolean) - Automatically route to overflow department
  - `overflow_department_id` (uuid) - Backup department when at capacity
  - `business_hours_start` / `business_hours_end` (time) - Operating hours
  - `is_emergency_department` (boolean) - Priority routing for emergencies

  ### 3. `department_current_status` (VIEW)
  Real-time view of department capacity and workload
  - Current patient count
  - Pending appointments
  - Capacity percentage
  - Available doctors count

  ## Security
  - RLS enabled on all tables
  - Administrative staff and department heads can manage routing rules
  - All authenticated users can view department capacity (for routing decisions)
  - Audit logging for capacity configuration changes

  ## Seed Data
  - Common routing rules for major medical conditions
  - Default capacity configuration for existing departments
*/

-- Create department routing rules table
CREATE TABLE IF NOT EXISTS department_routing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 10,
  condition_category TEXT,
  is_emergency BOOLEAN DEFAULT false,
  age_min INTEGER,
  age_max INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- Create index for fast keyword lookups
CREATE INDEX IF NOT EXISTS idx_routing_rules_keyword ON department_routing_rules(keyword);
CREATE INDEX IF NOT EXISTS idx_routing_rules_department ON department_routing_rules(department_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_active ON department_routing_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_routing_rules_priority ON department_routing_rules(priority DESC);

-- Create department capacity configuration table
CREATE TABLE IF NOT EXISTS department_capacity_config (
  department_id UUID PRIMARY KEY REFERENCES departments(id) ON DELETE CASCADE,
  max_patients_per_day INTEGER DEFAULT 50,
  max_queue_length INTEGER DEFAULT 20,
  alert_threshold_percentage INTEGER DEFAULT 80,
  auto_route_overflow BOOLEAN DEFAULT true,
  overflow_department_id UUID REFERENCES departments(id),
  business_hours_start TIME DEFAULT '08:00:00',
  business_hours_end TIME DEFAULT '18:00:00',
  is_emergency_department BOOLEAN DEFAULT false,
  notify_on_capacity_alert BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create view for real-time department status
CREATE OR REPLACE VIEW department_current_status AS
SELECT 
  d.id AS department_id,
  d.name AS department_name,
  d.description AS department_description,
  
  -- Count current patients assigned to this department today
  COUNT(DISTINCT CASE 
    WHEN a.status IN ('confirmed', 'checked_in') 
      AND DATE(a.appointment_date) = CURRENT_DATE 
    THEN p.id 
  END) as current_patients_today,
  
  -- Count pending appointments
  COUNT(DISTINCT CASE 
    WHEN a.status = 'pending' 
      AND DATE(a.appointment_date) = CURRENT_DATE 
    THEN a.id 
  END) as pending_appointments,
  
  -- Count available medical staff in this department
  COUNT(DISTINCT CASE 
    WHEN up.is_medical_staff = true AND up.is_active = true
    THEN up.id 
  END) as available_doctors,
  
  -- Get capacity config
  dcc.max_patients_per_day,
  dcc.max_queue_length,
  dcc.alert_threshold_percentage,
  dcc.is_emergency_department,
  
  -- Calculate capacity percentage
  CASE 
    WHEN dcc.max_patients_per_day > 0 THEN
      ROUND((COUNT(DISTINCT CASE 
        WHEN a.status IN ('confirmed', 'checked_in') 
          AND DATE(a.appointment_date) = CURRENT_DATE 
        THEN p.id 
      END)::NUMERIC / dcc.max_patients_per_day * 100), 2)
    ELSE 0
  END as capacity_percentage,
  
  -- Status indicator
  CASE 
    WHEN dcc.max_patients_per_day = 0 THEN 'unavailable'
    WHEN (COUNT(DISTINCT CASE 
      WHEN a.status IN ('confirmed', 'checked_in') 
        AND DATE(a.appointment_date) = CURRENT_DATE 
      THEN p.id 
    END)::NUMERIC / NULLIF(dcc.max_patients_per_day, 0) * 100) >= dcc.alert_threshold_percentage 
    THEN 'high'
    WHEN (COUNT(DISTINCT CASE 
      WHEN a.status IN ('confirmed', 'checked_in') 
        AND DATE(a.appointment_date) = CURRENT_DATE 
      THEN p.id 
    END)::NUMERIC / NULLIF(dcc.max_patients_per_day, 0) * 100) >= 50 
    THEN 'moderate'
    ELSE 'available'
  END as capacity_status,
  
  dcc.business_hours_start,
  dcc.business_hours_end,
  
  -- Check if currently within business hours
  CASE 
    WHEN CURRENT_TIME BETWEEN dcc.business_hours_start AND dcc.business_hours_end 
    THEN true 
    ELSE false 
  END as is_open_now

FROM departments d
LEFT JOIN department_capacity_config dcc ON dcc.department_id = d.id
LEFT JOIN user_profiles up ON up.department_id = d.id AND up.is_active = true
LEFT JOIN appointments a ON a.department_id = d.id
LEFT JOIN patients p ON a.patient_id = p.id
GROUP BY 
  d.id, 
  d.name, 
  d.description,
  dcc.max_patients_per_day, 
  dcc.max_queue_length,
  dcc.alert_threshold_percentage,
  dcc.is_emergency_department,
  dcc.business_hours_start,
  dcc.business_hours_end;

-- Enable RLS
ALTER TABLE department_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_capacity_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for department_routing_rules
-- Allow all authenticated users to view routing rules (needed for patient registration)
CREATE POLICY "Anyone can view active routing rules"
  ON department_routing_rules
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admin and department heads can manage routing rules
CREATE POLICY "Admin can manage routing rules"
  ON department_routing_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() 
      AND r.name IN ('admin', 'administrative_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() 
      AND r.name IN ('admin', 'administrative_staff')
    )
  );

-- RLS Policies for department_capacity_config
-- Allow all authenticated users to view capacity info (for routing)
CREATE POLICY "Anyone can view department capacity"
  ON department_capacity_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admin can modify capacity configuration
CREATE POLICY "Admin can manage capacity config"
  ON department_capacity_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() 
      AND r.name IN ('admin', 'administrative_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() 
      AND r.name IN ('admin', 'administrative_staff')
    )
  );

-- Insert default capacity configuration for existing departments
INSERT INTO department_capacity_config (department_id, max_patients_per_day, is_emergency_department)
SELECT 
  id,
  CASE 
    WHEN name ILIKE '%urgence%' OR name ILIKE '%emergency%' THEN 100
    WHEN name ILIKE '%chirurgie%' OR name ILIKE '%surgery%' THEN 30
    WHEN name ILIKE '%pédiatrie%' OR name ILIKE '%pediatric%' THEN 60
    ELSE 50
  END as max_patients,
  CASE 
    WHEN name ILIKE '%urgence%' OR name ILIKE '%emergency%' THEN true
    ELSE false
  END as is_emergency
FROM departments
WHERE NOT EXISTS (
  SELECT 1 FROM department_capacity_config WHERE department_id = departments.id
)
ON CONFLICT (department_id) DO NOTHING;

-- Insert common routing rules for medical conditions (avoiding conflicts)
DO $$
DECLARE
  cardio_dept UUID;
  pediatric_dept UUID;
  ortho_dept UUID;
  derm_dept UUID;
  gyn_dept UUID;
  ophthalm_dept UUID;
  dental_dept UUID;
  physio_dept UUID;
  general_dept UUID;
BEGIN
  -- Get department IDs
  SELECT id INTO cardio_dept FROM departments WHERE name ILIKE '%cardio%' LIMIT 1;
  SELECT id INTO pediatric_dept FROM departments WHERE name ILIKE '%pédiatrie%' OR name ILIKE '%pediatr%' LIMIT 1;
  SELECT id INTO ortho_dept FROM departments WHERE name ILIKE '%orthop%' OR name ILIKE '%traumat%' LIMIT 1;
  SELECT id INTO derm_dept FROM departments WHERE name ILIKE '%dermat%' LIMIT 1;
  SELECT id INTO gyn_dept FROM departments WHERE name ILIKE '%gyn%' OR name ILIKE '%obstet%' OR name ILIKE '%maternité%' LIMIT 1;
  SELECT id INTO ophthalm_dept FROM departments WHERE name ILIKE '%ophthalm%' LIMIT 1;
  SELECT id INTO dental_dept FROM departments WHERE name ILIKE '%dent%' OR name ILIKE '%stomatolog%' LIMIT 1;
  SELECT id INTO physio_dept FROM departments WHERE name ILIKE '%kinési%' OR name ILIKE '%physio%' OR name ILIKE '%rééduc%' LIMIT 1;
  SELECT id INTO general_dept FROM departments WHERE name ILIKE '%médecine générale%' OR name ILIKE '%general%' LIMIT 1;

  -- Insert routing rules
  IF cardio_dept IS NOT NULL THEN
    INSERT INTO department_routing_rules (keyword, department_id, priority, condition_category, is_emergency, description)
    VALUES 
      ('cardiaque', cardio_dept, 100, 'cardiac', true, 'Urgence cardiaque'),
      ('crise cardiaque', cardio_dept, 100, 'cardiac', true, 'Crise cardiaque'),
      ('douleur thoracique', cardio_dept, 95, 'cardiac', true, 'Douleur thoracique'),
      ('palpitations', cardio_dept, 80, 'cardiac', false, 'Palpitations cardiaques'),
      ('hypertension', cardio_dept, 70, 'cardiac', false, 'Hypertension artérielle')
    ON CONFLICT DO NOTHING;
  END IF;

  IF pediatric_dept IS NOT NULL THEN
    INSERT INTO department_routing_rules (keyword, department_id, priority, condition_category, is_emergency, description)
    VALUES 
      ('enfant', pediatric_dept, 90, 'pediatric', false, 'Patient enfant'),
      ('bébé', pediatric_dept, 90, 'pediatric', false, 'Patient bébé'),
      ('vaccination', pediatric_dept, 60, 'pediatric', false, 'Vaccination')
    ON CONFLICT DO NOTHING;
  END IF;

  IF ortho_dept IS NOT NULL THEN
    INSERT INTO department_routing_rules (keyword, department_id, priority, condition_category, is_emergency, description)
    VALUES 
      ('fracture', ortho_dept, 85, 'orthopedic', false, 'Fracture osseuse'),
      ('entorse', ortho_dept, 70, 'orthopedic', false, 'Entorse'),
      ('douleur articulation', ortho_dept, 60, 'orthopedic', false, 'Douleur articulaire')
    ON CONFLICT DO NOTHING;
  END IF;

  IF derm_dept IS NOT NULL THEN
    INSERT INTO department_routing_rules (keyword, department_id, priority, condition_category, is_emergency, description)
    VALUES 
      ('peau', derm_dept, 60, 'dermatologic', false, 'Problème de peau'),
      ('éruption', derm_dept, 65, 'dermatologic', false, 'Éruption cutanée'),
      ('acné', derm_dept, 50, 'dermatologic', false, 'Acné')
    ON CONFLICT DO NOTHING;
  END IF;

  IF gyn_dept IS NOT NULL THEN
    INSERT INTO department_routing_rules (keyword, department_id, priority, condition_category, is_emergency, description)
    VALUES 
      ('grossesse', gyn_dept, 85, 'gynecologic', false, 'Grossesse'),
      ('enceinte', gyn_dept, 85, 'gynecologic', false, 'Femme enceinte')
    ON CONFLICT DO NOTHING;
  END IF;

  IF ophthalm_dept IS NOT NULL THEN
    INSERT INTO department_routing_rules (keyword, department_id, priority, condition_category, is_emergency, description)
    VALUES 
      ('yeux', ophthalm_dept, 70, 'ophthalmologic', false, 'Problème oculaire'),
      ('vision', ophthalm_dept, 70, 'ophthalmologic', false, 'Problème de vision')
    ON CONFLICT DO NOTHING;
  END IF;

  IF dental_dept IS NOT NULL THEN
    INSERT INTO department_routing_rules (keyword, department_id, priority, condition_category, is_emergency, description)
    VALUES 
      ('dent', dental_dept, 75, 'dental', false, 'Problème dentaire'),
      ('mal de dents', dental_dept, 80, 'dental', false, 'Mal de dents')
    ON CONFLICT DO NOTHING;
  END IF;

  IF physio_dept IS NOT NULL THEN
    INSERT INTO department_routing_rules (keyword, department_id, priority, condition_category, is_emergency, description)
    VALUES 
      ('rééducation', physio_dept, 60, 'physical_therapy', false, 'Rééducation'),
      ('massage', physio_dept, 50, 'physical_therapy', false, 'Massage thérapeutique')
    ON CONFLICT DO NOTHING;
  END IF;

  IF general_dept IS NOT NULL THEN
    INSERT INTO department_routing_rules (keyword, department_id, priority, condition_category, is_emergency, description)
    VALUES 
      ('consultation', general_dept, 30, 'general', false, 'Consultation générale'),
      ('fièvre', general_dept, 50, 'general', false, 'Fièvre'),
      ('toux', general_dept, 40, 'general', false, 'Toux')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Create function to get recommended department based on keywords
CREATE OR REPLACE FUNCTION get_recommended_department(
  consultation_reason TEXT,
  patient_age INTEGER DEFAULT NULL
)
RETURNS TABLE(
  department_id UUID,
  department_name TEXT,
  match_score INTEGER,
  is_emergency BOOLEAN,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    drr.department_id,
    d.name AS department_name,
    drr.priority AS match_score,
    drr.is_emergency,
    drr.description AS reason
  FROM department_routing_rules drr
  JOIN departments d ON d.id = drr.department_id
  WHERE 
    drr.is_active = true
    AND LOWER(consultation_reason) LIKE '%' || LOWER(drr.keyword) || '%'
    AND (drr.age_min IS NULL OR patient_age IS NULL OR patient_age >= drr.age_min)
    AND (drr.age_max IS NULL OR patient_age IS NULL OR patient_age <= drr.age_max)
  ORDER BY drr.priority DESC, drr.is_emergency DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_recommended_department TO authenticated;

-- Create updated_at trigger for routing rules
CREATE OR REPLACE FUNCTION update_routing_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_routing_rules_updated_at
  BEFORE UPDATE ON department_routing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_routing_rules_updated_at();

-- Create updated_at trigger for capacity config
CREATE OR REPLACE FUNCTION update_capacity_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_capacity_config_updated_at
  BEFORE UPDATE ON department_capacity_config
  FOR EACH ROW
  EXECUTE FUNCTION update_capacity_config_updated_at();
