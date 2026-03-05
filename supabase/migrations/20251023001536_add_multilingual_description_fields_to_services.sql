/*
  # Add Multilingual Description Fields to Services

  ## Changes
  
  ### services table
  - Add `description_en` (text, nullable) - English description
  - Add `description_ar` (text, nullable) - Arabic description
  
  ### service_categories table
  - Add `description_en` (text, nullable) - English description
  - Add `description_ar` (text, nullable) - Arabic description

  ## Notes
  These fields will store detailed technical and medical information about each service
  in multiple languages to support the multilingual interface.
*/

-- Add multilingual description fields to services table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'description_en'
  ) THEN
    ALTER TABLE services ADD COLUMN description_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'description_ar'
  ) THEN
    ALTER TABLE services ADD COLUMN description_ar text;
  END IF;
END $$;

-- Add multilingual description fields to service_categories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_categories' AND column_name = 'description_en'
  ) THEN
    ALTER TABLE service_categories ADD COLUMN description_en text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_categories' AND column_name = 'description_ar'
  ) THEN
    ALTER TABLE service_categories ADD COLUMN description_ar text;
  END IF;
END $$;