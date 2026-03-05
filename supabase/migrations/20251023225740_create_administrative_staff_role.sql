/*
  # Add Administrative Staff Role

  1. Changes
    - Create 'administrative_staff' role for administrative personnel
    - Set appropriate permission level (level 4, same as receptionist)
  
  2. Security
    - Role will use existing RLS policies for user_profiles
*/

-- Create administrative_staff role if it doesn't exist
INSERT INTO roles (id, name, description, level, created_at)
VALUES (
  gen_random_uuid(),
  'administrative_staff',
  'Administrative staff with access to administrative functions',
  4,
  now()
)
ON CONFLICT (name) DO NOTHING;