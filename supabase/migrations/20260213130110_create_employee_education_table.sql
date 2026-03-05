/*
  # Create Employee Education Table

  1. New Table
    - `employee_education`
      - `id` (UUID, primary key)
      - `employee_id` (UUID, foreign key to hr_employees.id)
      - `education_level` (TEXT, values: Bac, Bac+2, Licence, Master, Doctorat)
      - `degree_title` (TEXT, NOT NULL)
      - `institution` (TEXT, NOT NULL)
      - `graduation_year` (INTEGER, NOT NULL)
      - `key_skills` (TEXT[], default empty array)
      - `display_order` (INTEGER, NOT NULL, default 0)
      - `created_at` (TIMESTAMPTZ, default now())
      - `updated_at` (TIMESTAMPTZ, default now())

  2. Constraints
    - Check constraint for education_level
    - Check constraint for graduation_year (>= 1950 AND <= current year)
    - Check constraint for degree_title minimum length
    - Check constraint for institution minimum length
    - Unique constraint on (employee_id, display_order)

  3. Indexes
    - Index on employee_id for faster lookups
    - Index on graduation_year for sorting/filtering

  4. Security
    - Enable Row Level Security
    - SELECT policy for authenticated users
    - INSERT policy for authenticated users
    - UPDATE policy for authenticated users
    - DELETE policy for authenticated users

  5. Notes
    - Supports multiple education entries per employee
    - Skills stored as array for flexibility
    - Display order allows custom ordering of entries
*/

-- Create employee_education table
CREATE TABLE IF NOT EXISTS employee_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  education_level TEXT NOT NULL,
  degree_title TEXT NOT NULL,
  institution TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  key_skills TEXT[] DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_education_level CHECK (education_level IN ('Bac', 'Bac+2', 'Licence', 'Master', 'Doctorat')),
  CONSTRAINT valid_graduation_year CHECK (graduation_year >= 1950 AND graduation_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
  CONSTRAINT valid_degree_title CHECK (LENGTH(degree_title) >= 2),
  CONSTRAINT valid_institution CHECK (LENGTH(institution) >= 2),
  CONSTRAINT unique_employee_display_order UNIQUE(employee_id, display_order)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_education_employee_id ON employee_education(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_education_graduation_year ON employee_education(graduation_year);
CREATE INDEX IF NOT EXISTS idx_employee_education_level ON employee_education(education_level);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_employee_education_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_education_updated_at
  BEFORE UPDATE ON employee_education
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_education_updated_at();

-- Enable Row Level Security
ALTER TABLE employee_education ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_education
CREATE POLICY "Authenticated users can view all education records"
  ON employee_education
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert education records"
  ON employee_education
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update education records"
  ON employee_education
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete education records"
  ON employee_education
  FOR DELETE
  TO authenticated
  USING (true);
