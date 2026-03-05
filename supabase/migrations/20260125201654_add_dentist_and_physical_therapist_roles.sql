/*
  # Add Dentist and Physical Therapist Roles

  1. New Roles
    - `dentist` - Dentiste avec accès aux soins dentaires (level 3)
    - `physical_therapist` - Kinésithérapeute pour rééducation (level 3)

  2. Purpose
    - Enable proper role assignment for dental and physical therapy staff
    - Support Phase 1 staffing plan implementation
    - Ensure regulatory compliance with multi-disciplinary coverage requirements

  3. Security
    - RLS policies will inherit from existing medical staff patterns
    - Level 3 grants same privileges as doctors
*/

-- Add dentist role
INSERT INTO roles (id, name, description, level)
VALUES (gen_random_uuid(), 'dentist', 'Soins dentaires et santé bucco-dentaire', 3)
ON CONFLICT (name) DO NOTHING;

-- Add physical therapist role
INSERT INTO roles (id, name, description, level)
VALUES (gen_random_uuid(), 'physical_therapist', 'Kinésithérapie et rééducation fonctionnelle', 3)
ON CONFLICT (name) DO NOTHING;
