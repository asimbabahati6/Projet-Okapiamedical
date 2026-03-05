/*
  # Add is_public field to departments table

  1. Changes
    - Add is_public column to departments table (default true)
    - Set Logistique department to is_public = false
    - Create index for performance optimization

  2. Purpose
    - Control visibility of departments on public website
    - Hide internal departments (like Logistique) from public view
    - Maintain full access in back-office for all departments

  3. Security
    - Only super_admin can modify is_public field (enforced in separate RLS migration)
    - All authenticated users can read departments based on context
*/

-- Add is_public column to departments table
ALTER TABLE departments
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Hide Logistique department from public interface
UPDATE departments
SET is_public = false
WHERE name = 'Logistique';

-- Create index for optimizing public department queries
CREATE INDEX IF NOT EXISTS idx_departments_is_public
ON departments(is_public) WHERE is_public = true;

-- Add documentation comment
COMMENT ON COLUMN departments.is_public IS
  'Controls department visibility on public website. Only super_admin can modify this field. Default: true (visible to public).';
