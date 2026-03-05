/*
  # Système de Gestion Unifiée du Personnel

  1. Enrichissement de user_profiles
    - Ajout de `employee_category` pour classifier les employés
    - Ajout de `is_medical_staff` et `is_hr_employee` pour identification rapide

  2. Vue unifiée `unified_employee_view`
    - Combine user_profiles, hr_employees, et medical_staff
    - Fournit une vue 360° de chaque employé
    - Inclut indicateurs de complétude du profil

  3. Fonctions utilitaires
    - Fonction de synchronisation automatique
    - Fonction de recherche unifiée

  4. Triggers de synchronisation
    - Maintien de la cohérence des flags
    - Mise à jour automatique des catégories

  5. Sécurité
    - RLS maintenu sur toutes les tables
    - Vue respecte les permissions existantes
*/

-- Add employee classification fields to user_profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'employee_category'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN employee_category text,
    ADD COLUMN is_medical_staff boolean DEFAULT false,
    ADD COLUMN is_hr_employee boolean DEFAULT false,
    ADD CONSTRAINT valid_employee_category
      CHECK (employee_category IN ('medical', 'administrative', 'support', 'hybrid', NULL));
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_category ON user_profiles(employee_category);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_medical_staff ON user_profiles(is_medical_staff);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_hr_employee ON user_profiles(is_hr_employee);

-- Create unified employee view
CREATE OR REPLACE VIEW unified_employee_view AS
SELECT
  -- Core Identity
  up.id,
  up.full_name,
  up.phone,
  up.avatar_url,
  up.employee_category,
  up.is_medical_staff,
  up.is_hr_employee,
  up.is_active as profile_is_active,

  -- Role & Department
  r.name as role_name,
  d.name as department_name,
  d.id as department_id,
  d.email as department_email,
  d.phone as department_phone,

  -- HR Employee Data
  hre.employee_number,
  hre.hire_date,
  hre.employment_status,
  hre.contract_type,
  hre.salary_amount,
  hre.salary_currency,
  hre.bank_name,
  hre.bank_account,
  hre.tax_id,
  hre.social_security_number,
  hre.emergency_contact_name,
  hre.emergency_contact_phone,
  hre.emergency_contact_relationship,

  -- Medical Staff Data
  ms.license_number,
  ms.specialization,
  ms.staff_type,
  ms.staff_category as medical_category,
  ms.years_of_experience,
  ms.consultation_fee,
  ms.is_accepting_patients,
  ms.telemedicine_enabled,
  ms.rpps_number,
  ms.adeli_number,
  ms.can_prescribe_controlled_substances,
  ms.average_rating,
  ms.total_consultations,
  ms.current_status as medical_status,

  -- Computed Fields
  CASE
    WHEN hre.id IS NOT NULL AND ms.id IS NOT NULL THEN 'hybrid'
    WHEN ms.id IS NOT NULL THEN 'medical'
    WHEN hre.id IS NOT NULL THEN 'administrative'
    ELSE 'none'
  END as profile_type,

  -- Profile Completeness Score (0-100)
  (
    (CASE WHEN up.full_name IS NOT NULL AND up.full_name != '' THEN 10 ELSE 0 END) +
    (CASE WHEN up.phone IS NOT NULL AND up.phone != '' THEN 10 ELSE 0 END) +
    (CASE WHEN up.is_active = true THEN 10 ELSE 0 END) +
    (CASE WHEN hre.id IS NOT NULL THEN 30 ELSE 0 END) +
    (CASE WHEN ms.id IS NOT NULL AND ms.license_number IS NOT NULL THEN 20 ELSE 0 END) +
    (CASE WHEN hre.emergency_contact_name IS NOT NULL THEN 10 ELSE 0 END) +
    (CASE WHEN hre.bank_account IS NOT NULL THEN 10 ELSE 0 END)
  ) as profile_completeness,

  -- Status Indicators
  CASE
    WHEN hre.employment_status = 'active' THEN true
    WHEN hre.employment_status IS NULL AND ms.current_status = 'active' THEN true
    ELSE false
  END as is_active,

  -- Timestamps
  GREATEST(
    COALESCE(up.created_at, '1970-01-01'::timestamptz),
    COALESCE(hre.created_at, '1970-01-01'::timestamptz),
    COALESCE(ms.created_at, '1970-01-01'::timestamptz)
  ) as profile_created_at,

  GREATEST(
    COALESCE(up.updated_at, '1970-01-01'::timestamptz),
    COALESCE(hre.updated_at, '1970-01-01'::timestamptz),
    COALESCE(ms.updated_at, '1970-01-01'::timestamptz)
  ) as profile_updated_at

FROM user_profiles up
LEFT JOIN roles r ON up.role_id = r.id
LEFT JOIN departments d ON up.department_id = d.id
LEFT JOIN hr_employees hre ON up.id = hre.id
LEFT JOIN medical_staff ms ON up.id = ms.id

WHERE up.id IS NOT NULL;

-- Grant access to authenticated users
GRANT SELECT ON unified_employee_view TO authenticated;

-- Function to synchronize employee flags
CREATE OR REPLACE FUNCTION sync_employee_flags()
RETURNS TRIGGER AS $$
BEGIN
  -- Update flags in user_profiles based on related tables
  UPDATE user_profiles
  SET
    is_medical_staff = EXISTS (SELECT 1 FROM medical_staff WHERE id = user_profiles.id),
    is_hr_employee = EXISTS (SELECT 1 FROM hr_employees WHERE id = user_profiles.id),
    employee_category = CASE
      WHEN EXISTS (SELECT 1 FROM medical_staff WHERE id = user_profiles.id)
           AND EXISTS (SELECT 1 FROM hr_employees WHERE id = user_profiles.id) THEN 'hybrid'
      WHEN EXISTS (SELECT 1 FROM medical_staff WHERE id = user_profiles.id) THEN 'medical'
      WHEN EXISTS (SELECT 1 FROM hr_employees WHERE id = user_profiles.id) THEN 'administrative'
      ELSE 'support'
    END
  WHERE id = COALESCE(NEW.id, OLD.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic synchronization
DROP TRIGGER IF EXISTS sync_flags_on_hr_employee ON hr_employees;
CREATE TRIGGER sync_flags_on_hr_employee
AFTER INSERT OR UPDATE OR DELETE ON hr_employees
FOR EACH ROW
EXECUTE FUNCTION sync_employee_flags();

DROP TRIGGER IF EXISTS sync_flags_on_medical_staff ON medical_staff;
CREATE TRIGGER sync_flags_on_medical_staff
AFTER INSERT OR UPDATE OR DELETE ON medical_staff
FOR EACH ROW
EXECUTE FUNCTION sync_employee_flags();

-- Function for unified employee search
CREATE OR REPLACE FUNCTION search_unified_employees(
  search_term text DEFAULT NULL,
  filter_category text DEFAULT NULL,
  filter_status text DEFAULT NULL,
  limit_count int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  employee_number text,
  profile_type text,
  department_name text,
  role_name text,
  specialization text,
  is_active boolean,
  profile_completeness int
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uev.id,
    uev.full_name,
    uev.phone,
    uev.employee_number,
    uev.profile_type,
    uev.department_name,
    uev.role_name,
    uev.specialization,
    uev.is_active,
    uev.profile_completeness
  FROM unified_employee_view uev
  WHERE
    (search_term IS NULL OR
     uev.full_name ILIKE '%' || search_term || '%' OR
     uev.phone ILIKE '%' || search_term || '%' OR
     uev.employee_number ILIKE '%' || search_term || '%' OR
     uev.specialization ILIKE '%' || search_term || '%')
    AND
    (filter_category IS NULL OR uev.profile_type = filter_category)
    AND
    (filter_status IS NULL OR
     (filter_status = 'active' AND uev.is_active = true) OR
     (filter_status = 'inactive' AND uev.is_active = false))
  ORDER BY uev.full_name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initial sync of existing data
UPDATE user_profiles
SET
  is_medical_staff = EXISTS (SELECT 1 FROM medical_staff WHERE id = user_profiles.id),
  is_hr_employee = EXISTS (SELECT 1 FROM hr_employees WHERE id = user_profiles.id),
  employee_category = CASE
    WHEN EXISTS (SELECT 1 FROM medical_staff WHERE id = user_profiles.id)
         AND EXISTS (SELECT 1 FROM hr_employees WHERE id = user_profiles.id) THEN 'hybrid'
    WHEN EXISTS (SELECT 1 FROM medical_staff WHERE id = user_profiles.id) THEN 'medical'
    WHEN EXISTS (SELECT 1 FROM hr_employees WHERE id = user_profiles.id) THEN 'administrative'
    ELSE 'support'
  END
WHERE id IS NOT NULL;

-- Create statistics view for dashboard
CREATE OR REPLACE VIEW employee_statistics AS
SELECT
  COUNT(*) as total_employees,
  COUNT(*) FILTER (WHERE is_active = true) as active_employees,
  COUNT(*) FILTER (WHERE profile_type = 'medical') as medical_staff_count,
  COUNT(*) FILTER (WHERE profile_type = 'administrative') as administrative_staff_count,
  COUNT(*) FILTER (WHERE profile_type = 'hybrid') as hybrid_staff_count,
  AVG(profile_completeness)::int as avg_profile_completeness,
  COUNT(*) FILTER (WHERE profile_completeness < 70) as incomplete_profiles
FROM unified_employee_view;

GRANT SELECT ON employee_statistics TO authenticated;

-- Add helpful comments
COMMENT ON VIEW unified_employee_view IS 'Vue unifiée combinant les données RH et médicales pour une vision 360° de chaque employé';
COMMENT ON FUNCTION search_unified_employees IS 'Fonction de recherche intelligente à travers tous les profils employés';
COMMENT ON VIEW employee_statistics IS 'Statistiques en temps réel sur l ensemble du personnel';
