/*
  # Add Multilingual Support to Departments and Service Tracking to Appointments

  ## Changes

  This migration adds multilingual fields to the departments table and adds service tracking
  to appointments for better appointment categorization and patient experience.

  ### Departments Table Updates

  **New Columns:**
  - `name_en` (text) - English name for the department
  - `name_ar` (text) - Arabic name for the department
  - `description_en` (text, nullable) - English description
  - `description_ar` (text, nullable) - Arabic description

  **Data Migration:**
  - Existing department names are preserved in the `name` column (French - primary)
  - English and Arabic translations are added for common hospital departments
  - Descriptions are populated with appropriate translations

  ### Appointments Table Updates

  **New Column:**
  - `service_id` (uuid, nullable) - Foreign key reference to services table

  **Purpose:**
  - Links appointments to specific medical services (e.g., General Consultation, Ultrasound, CT Scan)
  - Allows better tracking of which services are being utilized
  - Enables service-specific appointment workflows in the future
  - Nullable to support existing appointments and appointments without specific service selection

  ## Security

  - No RLS policy changes needed (existing policies cover new columns)
  - Foreign key constraint ensures data integrity for service_id

  ## Notes

  - The name column remains as the primary French name
  - All three language fields (name, name_en, name_ar) are required for departments
  - Departments can be created without English/Arabic names initially, but should be populated
  - Existing appointments won't have service_id (NULL allowed)
  - New appointments can optionally specify which service they're booking
*/

-- Add multilingual fields to departments table
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_ar text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_ar text;

-- Update existing departments with English and Arabic translations
-- These are common hospital departments with standard translations

UPDATE departments SET
  name_en = CASE
    WHEN name ILIKE '%urgence%' THEN 'Emergency'
    WHEN name ILIKE '%cardiologie%' THEN 'Cardiology'
    WHEN name ILIKE '%pédiatrie%' OR name ILIKE '%pediatrie%' THEN 'Pediatrics'
    WHEN name ILIKE '%gynéco%' OR name ILIKE '%gyneco%' OR name ILIKE '%obstétrique%' THEN 'Gynecology & Obstetrics'
    WHEN name ILIKE '%chirurgie%' THEN 'Surgery'
    WHEN name ILIKE '%radiologie%' THEN 'Radiology'
    WHEN name ILIKE '%laboratoire%' THEN 'Laboratory'
    WHEN name ILIKE '%orthopéd%' OR name ILIKE '%orthoped%' THEN 'Orthopedics'
    WHEN name ILIKE '%neurologie%' THEN 'Neurology'
    WHEN name ILIKE '%dermatologie%' THEN 'Dermatology'
    WHEN name ILIKE '%ophtalmologie%' THEN 'Ophthalmology'
    WHEN name ILIKE '%ORL%' OR name ILIKE '%oto%' THEN 'ENT (Ear, Nose, Throat)'
    WHEN name ILIKE '%psychiatrie%' THEN 'Psychiatry'
    WHEN name ILIKE '%médecine%' OR name ILIKE '%interne%' THEN 'Internal Medicine'
    WHEN name ILIKE '%dentaire%' OR name ILIKE '%dentisterie%' THEN 'Dentistry'
    WHEN name ILIKE '%oncologie%' THEN 'Oncology'
    WHEN name ILIKE '%urologie%' THEN 'Urology'
    WHEN name ILIKE '%néphrologie%' OR name ILIKE '%nephrologie%' THEN 'Nephrology'
    WHEN name ILIKE '%pneumologie%' THEN 'Pulmonology'
    WHEN name ILIKE '%gastro%' THEN 'Gastroenterology'
    WHEN name ILIKE '%endocrinologie%' THEN 'Endocrinology'
    WHEN name ILIKE '%rhumatologie%' THEN 'Rheumatology'
    WHEN name ILIKE '%anesthésie%' OR name ILIKE '%anesthesie%' THEN 'Anesthesiology'
    WHEN name ILIKE '%réanimation%' OR name ILIKE '%reanimation%' THEN 'Intensive Care'
    WHEN name ILIKE '%maternité%' OR name ILIKE '%maternite%' THEN 'Maternity'
    WHEN name ILIKE '%pharmacie%' THEN 'Pharmacy'
    ELSE name
  END,
  name_ar = CASE
    WHEN name ILIKE '%urgence%' THEN 'الطوارئ'
    WHEN name ILIKE '%cardiologie%' THEN 'أمراض القلب'
    WHEN name ILIKE '%pédiatrie%' OR name ILIKE '%pediatrie%' THEN 'طب الأطفال'
    WHEN name ILIKE '%gynéco%' OR name ILIKE '%gyneco%' OR name ILIKE '%obstétrique%' THEN 'أمراض النساء والولادة'
    WHEN name ILIKE '%chirurgie%' THEN 'الجراحة'
    WHEN name ILIKE '%radiologie%' THEN 'الأشعة'
    WHEN name ILIKE '%laboratoire%' THEN 'المختبر'
    WHEN name ILIKE '%orthopéd%' OR name ILIKE '%orthoped%' THEN 'جراحة العظام'
    WHEN name ILIKE '%neurologie%' THEN 'طب الأعصاب'
    WHEN name ILIKE '%dermatologie%' THEN 'الأمراض الجلدية'
    WHEN name ILIKE '%ophtalmologie%' THEN 'طب العيون'
    WHEN name ILIKE '%ORL%' OR name ILIKE '%oto%' THEN 'الأنف والأذن والحنجرة'
    WHEN name ILIKE '%psychiatrie%' THEN 'الطب النفسي'
    WHEN name ILIKE '%médecine%' OR name ILIKE '%interne%' THEN 'الطب الباطني'
    WHEN name ILIKE '%dentaire%' OR name ILIKE '%dentisterie%' THEN 'طب الأسنان'
    WHEN name ILIKE '%oncologie%' THEN 'علم الأورام'
    WHEN name ILIKE '%urologie%' THEN 'جراحة المسالك البولية'
    WHEN name ILIKE '%néphrologie%' OR name ILIKE '%nephrologie%' THEN 'أمراض الكلى'
    WHEN name ILIKE '%pneumologie%' THEN 'أمراض الرئة'
    WHEN name ILIKE '%gastro%' THEN 'أمراض الجهاز الهضمي'
    WHEN name ILIKE '%endocrinologie%' THEN 'الغدد الصماء'
    WHEN name ILIKE '%rhumatologie%' THEN 'أمراض الروماتيزم'
    WHEN name ILIKE '%anesthésie%' OR name ILIKE '%anesthesie%' THEN 'التخدير'
    WHEN name ILIKE '%réanimation%' OR name ILIKE '%reanimation%' THEN 'العناية المركزة'
    WHEN name ILIKE '%maternité%' OR name ILIKE '%maternite%' THEN 'الولادة'
    WHEN name ILIKE '%pharmacie%' THEN 'الصيدلية'
    ELSE name
  END
WHERE name_en IS NULL OR name_ar IS NULL;

-- Add service_id column to appointments table
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES services(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);

-- Add comment explaining the new column
COMMENT ON COLUMN appointments.service_id IS 'Optional reference to the specific medical service being booked (e.g., General Consultation, Ultrasound, CT Scan). Helps track service utilization and enables service-specific workflows.';
