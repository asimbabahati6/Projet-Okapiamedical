/*
  # Add Logistician Role and Logistics Department

  1. Changes
    - Add 'logistician' role to roles table if it doesn't exist
    - Add 'Logistique' department to departments table if it doesn't exist
    - Set appropriate permissions and descriptions

  2. Purpose
    - Enable logistics staff management in the hospital system
    - Support supply chain, inventory, and logistics operations
    - Provide proper role-based access control for logistics personnel

  3. Security
    - Role has level 2 access (same as nurses and pharmacists)
    - Department follows existing security patterns
*/

-- Add logistician role if it doesn't exist
INSERT INTO roles (name, description, level, created_at)
VALUES ('logistician', 'Logisticien', 2, now())
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    level = EXCLUDED.level;

-- Add Logistique department if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM departments WHERE name = 'Logistique'
  ) THEN
    INSERT INTO departments (
      name,
      description,
      phone,
      email,
      is_active,
      created_at
    ) VALUES (
      'Logistique',
      'Gestion de la chaîne d''approvisionnement, inventaire et opérations logistiques',
      NULL,
      'logistique@okapia.hospital',
      true,
      now()
    );
  END IF;
END $$;

-- Ensure RLS policies cover the new role
-- (The existing policies should automatically include this role)

-- Add comment for documentation
COMMENT ON TABLE roles IS 'User roles including doctor, nurse, pharmacist, receptionist, logistician, and administrators';
COMMENT ON TABLE departments IS 'Hospital departments including Cardiologie, Pédiatrie, Chirurgie, Urgences, Radiologie, Laboratoire, Pharmacie, Administration, and Logistique';
