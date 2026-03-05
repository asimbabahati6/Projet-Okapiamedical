/*
  # Activation de la Telemedicine avec Correction Complete Audit

  ## Description
  Active la telemedicine pour tous les medecins en gerant correctement
  les contraintes d'audit trail et de versioning.

  ## Modifications
  1. Rendre performed_by et created_by nullables pour les migrations systeme
  2. Activer la telemedicine pour 5 medecins
  3. Configurer les plateformes de telemedicine

  ## Tables modifiees
  - staff_audit_trail (performed_by : NULL autorise)
  - staff_versions (created_by : NULL autorise)
  - medical_staff (telemedicine_enabled, telemedicine_platforms)
*/

-- Autoriser NULL sur performed_by et created_by pour les migrations systeme
ALTER TABLE staff_audit_trail 
ALTER COLUMN performed_by DROP NOT NULL;

ALTER TABLE staff_versions 
ALTER COLUMN created_by DROP NOT NULL;

-- Activer la telemedicine pour Dr. Claire Fontaine (Medecine Generale)
UPDATE medical_staff
SET 
  telemedicine_enabled = true,
  telemedicine_platforms = ARRAY['Zoom', 'Google Meet'],
  updated_at = now()
WHERE id = '5fe6a6c9-3306-484f-9525-c98793e5aff1';

-- Activer la telemedicine pour Dr. Sophie Mercier (Chirurgie)
UPDATE medical_staff
SET 
  telemedicine_enabled = true,
  telemedicine_platforms = ARRAY['Zoom', 'Microsoft Teams'],
  updated_at = now()
WHERE id = '9a745185-9059-47ae-84ac-a88f9d34295b';

-- Activer pour Dr. Laurent Dubois (Cardiologie)
UPDATE medical_staff
SET 
  telemedicine_enabled = true,
  telemedicine_platforms = ARRAY['Zoom', 'Google Meet'],
  updated_at = now()
WHERE id = '1ea2b700-6123-45e5-8850-38942f17566c';

-- Activer pour Dr. Isabelle Moreau (Orthopédie)
UPDATE medical_staff
SET 
  telemedicine_enabled = true,
  telemedicine_platforms = ARRAY['Zoom', 'Microsoft Teams'],
  updated_at = now()
WHERE id = '00967326-333a-4619-9142-ac3ba2a5bcb6';

-- Activer pour Dr. Emilie Durand (Pédiatrie)
UPDATE medical_staff
SET 
  telemedicine_enabled = true,
  telemedicine_platforms = ARRAY['Zoom', 'Google Meet'],
  updated_at = now()
WHERE id = 'c556b341-be26-4ef7-9f54-d3fadb5a0de5';
