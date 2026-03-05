/*
  # Add Dentisterie and Kinésithérapie Departments

  1. New Departments
    - `Dentisterie` (Dentistry)
      - Description: Soins dentaires et santé bucco-dentaire
      - Phone: +243 123 456 789
      - Email: dentisterie@okapia-medical.cd
      - is_active: true
      - is_public: true (visible on public website)
    
    - `Kinésithérapie` (Physiotherapy)
      - Description: Rééducation fonctionnelle et thérapie physique
      - Phone: +243 123 456 790
      - Email: kinesitherapie@okapia-medical.cd
      - is_active: true
      - is_public: true (visible on public website)

  2. Purpose
    - Expand medical service offerings
    - Display new departments on public doctors page
    - Enable patient routing to new specialties

  3. Security
    - Both departments are public and visible to all users
    - Standard RLS policies apply from existing department table setup
*/

-- Add Dentisterie (Dentistry) department
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM departments WHERE name = 'Dentisterie'
  ) THEN
    INSERT INTO departments (
      name,
      description,
      phone,
      email,
      is_active,
      is_public
    ) VALUES (
      'Dentisterie',
      'Soins dentaires et santé bucco-dentaire',
      '+243 123 456 789',
      'dentisterie@okapia-medical.cd',
      true,
      true
    );
  END IF;
END $$;

-- Add Kinésithérapie (Physiotherapy) department
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM departments WHERE name = 'Kinésithérapie'
  ) THEN
    INSERT INTO departments (
      name,
      description,
      phone,
      email,
      is_active,
      is_public
    ) VALUES (
      'Kinésithérapie',
      'Rééducation fonctionnelle et thérapie physique',
      '+243 123 456 791',
      'kinesitherapie@okapia-medical.cd',
      true,
      true
    );
  END IF;
END $$;