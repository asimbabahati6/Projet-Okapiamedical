/*
# Ajout du departement Medecine interne et du role Interniste

1. Nouveau departement
   - "Médecine interne" dans la table departments, actif et public

2. Nouveau role
   - "interniste" dans la table roles, niveau 3 (medical), actif

3. Notes
   - Idempotent
*/

-- Departement
INSERT INTO departments (id, name, description, is_active, is_public)
SELECT gen_random_uuid(),
       'Médecine interne',
       'Service de médecine interne – prise en charge diagnostique et thérapeutique des pathologies complexes de l''adulte',
       true,
       true
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Médecine interne');

-- Role
INSERT INTO roles (name, description, level, is_active)
VALUES (
  'interniste',
  'Médecin spécialiste en médecine interne',
  3,
  true
)
ON CONFLICT (name) DO NOTHING;
