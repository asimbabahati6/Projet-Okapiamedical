/*
  # Update Service Photos for Consultation générale, Échographie, and Scanner

  ## Changes
  
  This migration updates the image URLs for three specific medical services with new
  copyright-free stock photos from Pexels featuring professional medical settings.

  ### Updated Services
  
  1. **Consultation générale** - New image of African healthcare professional conducting consultation
  2. **Échographie** - New image of ultrasound examination with medical professional
  3. **Scanner** - New image of CT scanner equipment and examination

  ## Notes
  
  - All images are sourced from Pexels (free to use without attribution)
  - Images feature diverse, professional medical environments
  - URLs are optimized for web delivery with compression
*/

-- Update Consultation générale photo with new doctor consultation image
UPDATE services 
SET image_url = 'https://images.pexels.com/photos/7089020/pexels-photo-7089020.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Consultation générale';

-- Update Échographie photo with new ultrasound examination image
UPDATE services 
SET image_url = 'https://images.pexels.com/photos/7089391/pexels-photo-7089391.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Échographie';

-- Update Scanner photo with new CT scanner image
UPDATE services 
SET image_url = 'https://images.pexels.com/photos/7089018/pexels-photo-7089018.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Scanner';

-- Also update the Consultation générale category image to match
UPDATE service_categories 
SET image_url = 'https://images.pexels.com/photos/7089020/pexels-photo-7089020.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE name = 'Consultation générale';
