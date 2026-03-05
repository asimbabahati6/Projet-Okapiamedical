/*
  # Add Image URLs to Services System

  ## Changes
  
  This migration adds image_url fields to both service_categories and services tables
  to support displaying photos of Congolese African healthcare professionals and facilities.

  ### Modified Tables
  
  1. `service_categories`
     - Added `image_url` (text, nullable) - URL to category hero/banner image
  
  2. `services`
     - Added `image_url` (text, nullable) - URL to service-specific image
  
  ## Notes
  
  - Images will be sourced from free stock photo services (Pexels, Unsplash)
  - URLs will point to photos featuring African healthcare professionals from Congo/Central Africa
  - Nullable fields allow gradual population of images
*/

-- Add image_url to service_categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_categories' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE service_categories ADD COLUMN image_url text;
  END IF;
END $$;

-- Add image_url to services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE services ADD COLUMN image_url text;
  END IF;
END $$;

-- Update services with appropriate free stock photo URLs from Pexels (African healthcare professionals)
-- Note: Using Pexels photos which are free to use without attribution

-- Consultation générale - African doctor with stethoscope
UPDATE services 
SET image_url = 'https://images.pexels.com/photos/6303774/pexels-photo-6303774.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Consultation générale';

-- Radiographie - Radiology/X-ray
UPDATE services 
SET image_url = 'https://images.pexels.com/photos/7659564/pexels-photo-7659564.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Radiographie';

-- Échographie - Ultrasound examination
UPDATE services 
SET image_url = 'https://images.pexels.com/photos/7637756/pexels-photo-7637756.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Échographie';

-- Scanner - CT Scanner
UPDATE services 
SET image_url = 'https://images.pexels.com/photos/7089170/pexels-photo-7089170.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Scanner';

-- Consultation spécialisée - Specialist consultation
UPDATE services 
SET image_url = 'https://images.pexels.com/photos/6303773/pexels-photo-6303773.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Consultation spécialisée';

-- Dentisterie - Dental care
UPDATE services 
SET image_url = 'https://images.pexels.com/photos/6502307/pexels-photo-6502307.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Dentisterie';

-- Kinésithérapie - Physiotherapy
UPDATE services 
SET image_url = 'https://images.pexels.com/photos/7640432/pexels-photo-7640432.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Kinésithérapie';

-- Laboratoire services
UPDATE services 
SET image_url = 'https://images.pexels.com/photos/8460117/pexels-photo-8460117.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name IN ('Hématologie', 'Biochimie', 'Immunologie', 'Bactériologie', 'Parasitologie');

-- Radiologie interventionnelle services
UPDATE services 
SET image_url = 'https://images.pexels.com/photos/7089019/pexels-photo-7089019.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name IN ('Biopsie', 'Embolisation', 'Drainage', 'Traitement des varices');

-- Explorations médicales services
UPDATE services 
SET image_url = 'https://images.pexels.com/photos/7088531/pexels-photo-7088531.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name IN ('Endoscopie digestive', 'Endoscopie bronchique', 'Explorations cardiaques', 'EEG');

-- Update category images
UPDATE service_categories SET image_url = 'https://images.pexels.com/photos/6303774/pexels-photo-6303774.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE name = 'Consultation générale';
UPDATE service_categories SET image_url = 'https://images.pexels.com/photos/7659564/pexels-photo-7659564.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE name = 'Radiologie diagnostique';
UPDATE service_categories SET image_url = 'https://images.pexels.com/photos/6303773/pexels-photo-6303773.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE name = 'Consultation spécialisée';
UPDATE service_categories SET image_url = 'https://images.pexels.com/photos/7089019/pexels-photo-7089019.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE name = 'Radiologie interventionnelle';
UPDATE service_categories SET image_url = 'https://images.pexels.com/photos/6502307/pexels-photo-6502307.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE name = 'Dentisterie';
UPDATE service_categories SET image_url = 'https://images.pexels.com/photos/8460117/pexels-photo-8460117.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE name = 'Laboratoire médical';
UPDATE service_categories SET image_url = 'https://images.pexels.com/photos/7088531/pexels-photo-7088531.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE name = 'Explorations médicales';
UPDATE service_categories SET image_url = 'https://images.pexels.com/photos/7640432/pexels-photo-7640432.jpeg?auto=compress&cs=tinysrgb&w=800' WHERE name = 'Kinésithérapie';
