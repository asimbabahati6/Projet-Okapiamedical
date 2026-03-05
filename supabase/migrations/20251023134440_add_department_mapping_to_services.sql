/*
  # Add Department Mapping to Services

  ## Overview
  This migration adds a department_id foreign key to the services table to enable
  automatic department detection when users select a service during appointment booking.

  ## Changes

  ### Services Table Updates
  
  **New Column:**
  - `department_id` (uuid, nullable) - Foreign key reference to departments table
  
  **Purpose:**
  - Links services to their corresponding medical departments
  - Enables automatic department selection when a service is chosen
  - Simplifies the appointment booking workflow for public users
  - Nullable to support services that may not belong to a specific department

  ## Department-Service Mapping Logic

  The mapping is based on logical medical service groupings:

  1. **Médecine Générale** (General Medicine)
     - Consultation générale (General Consultation)
     - Kinésithérapie (Physiotherapy)
  
  2. **Chirurgie** (Surgery)
     - Radiologie interventionnelle services (Biopsie, Embolisation, Drainage, Traitement des varices)
  
  3. **Cardiologie** (Cardiology)
     - Explorations cardiaques (Cardiac Explorations)
  
  4. **Pédiatrie** (Pediatrics)
     - Can be assigned to pediatric-specific services if needed
  
  5. **Orthopédie** (Orthopedics)
     - Can be assigned to orthopedic-specific services if needed

  6. **Other Departments**
     - Consultation spécialisée - Can be mapped to specific departments as needed
     - Radiologie diagnostique - Radiology services
     - Dentisterie - Dentistry services
     - Laboratoire médical - Laboratory services
     - Explorations médicales - Various diagnostic explorations

  ## Security
  - No RLS policy changes needed (existing policies cover new column)
  - Foreign key constraint ensures data integrity
  - Index added for improved query performance

  ## Notes
  - The department_id is nullable to allow flexibility
  - Services without a department assignment will work but won't trigger auto-detection
  - This mapping can be updated through the admin interface
  - Medical staff can still manually override department selection if needed
*/

-- Add department_id column to services table
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_services_department_id ON services(department_id);

-- Update services with appropriate department assignments
-- These mappings are based on typical hospital department-service relationships

-- Médecine Générale: General consultations and physiotherapy
UPDATE services SET department_id = (
  SELECT id FROM departments WHERE name ILIKE '%médecine%générale%' OR name ILIKE '%interne%' LIMIT 1
)
WHERE name IN ('Consultation générale', 'Kinésithérapie')
  OR name_en IN ('General Consultation', 'Physiotherapy');

-- Chirurgie: Interventional radiology procedures
UPDATE services SET department_id = (
  SELECT id FROM departments WHERE name ILIKE '%chirurgie%' LIMIT 1
)
WHERE name IN ('Biopsie', 'Embolisation', 'Drainage', 'Traitement des varices')
  OR name_en IN ('Biopsy', 'Embolization', 'Drainage', 'Varicose Vein Treatment');

-- Cardiologie: Cardiac explorations
UPDATE services SET department_id = (
  SELECT id FROM departments WHERE name ILIKE '%cardiologie%' LIMIT 1
)
WHERE name IN ('Explorations cardiaques')
  OR name_en IN ('Cardiac Explorations');

-- Radiologie: Diagnostic radiology services
UPDATE services SET department_id = (
  SELECT id FROM departments WHERE name ILIKE '%radiologie%' LIMIT 1
)
WHERE name IN ('Radiographie', 'Échographie', 'Scanner')
  OR name_en IN ('Radiography', 'Ultrasound', 'CT Scanner')
  OR category_id IN (
    SELECT id FROM service_categories WHERE name = 'Radiologie diagnostique'
  );

-- For specialized consultations, we'll map them to Médecine Générale by default
-- These can be reassigned to specific departments as needed
UPDATE services SET department_id = (
  SELECT id FROM departments WHERE name ILIKE '%médecine%générale%' OR name ILIKE '%interne%' LIMIT 1
)
WHERE name IN ('Consultation spécialisée')
  OR name_en IN ('Specialized Consultation')
  AND department_id IS NULL;

-- Dentistry services - if a dentistry department exists, assign it; otherwise use general medicine
UPDATE services SET department_id = COALESCE(
  (SELECT id FROM departments WHERE name ILIKE '%dentaire%' OR name ILIKE '%dentisterie%' LIMIT 1),
  (SELECT id FROM departments WHERE name ILIKE '%médecine%générale%' LIMIT 1)
)
WHERE name IN ('Dentisterie')
  OR name_en IN ('Dentistry');

-- Laboratory services - assign to Médecine Générale as they support all departments
UPDATE services SET department_id = (
  SELECT id FROM departments WHERE name ILIKE '%médecine%générale%' OR name ILIKE '%interne%' LIMIT 1
)
WHERE category_id IN (
  SELECT id FROM service_categories WHERE name = 'Laboratoire médical'
)
AND department_id IS NULL;

-- Medical exploration services - assign to appropriate departments
UPDATE services SET department_id = (
  SELECT id FROM departments WHERE name ILIKE '%médecine%générale%' OR name ILIKE '%interne%' LIMIT 1
)
WHERE name IN ('Endoscopie digestive', 'Endoscopie bronchique', 'EEG')
  OR name_en IN ('Digestive Endoscopy', 'Bronchial Endoscopy', 'EEG')
  AND department_id IS NULL;

-- Add comment explaining the new column
COMMENT ON COLUMN services.department_id IS 'Foreign key reference to the department that provides this service. Used for automatic department detection in the appointment booking workflow. When a user selects a service, the system automatically assigns the corresponding department.';
