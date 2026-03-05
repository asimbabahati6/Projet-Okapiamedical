/*
  # Suppression complète du système QR Code

  ## Changements
  - Supprime la table `staff_qr_codes` et toutes ses données
  - Supprime les policies RLS associées
  - Supprime les indexes associés
  - Supprime les triggers associés

  ## Avertissement
  Cette migration est destructive et irréversible.
  Toutes les données QR codes seront perdues définitivement.
*/

-- Supprimer les policies RLS
DROP POLICY IF EXISTS "Users can view own QR code" ON staff_qr_codes;
DROP POLICY IF EXISTS "Users can insert own QR code" ON staff_qr_codes;
DROP POLICY IF EXISTS "Users can update own QR code" ON staff_qr_codes;
DROP POLICY IF EXISTS "Admins can view all QR codes" ON staff_qr_codes;
DROP POLICY IF EXISTS "Admins can manage all QR codes" ON staff_qr_codes;

-- Supprimer les triggers
DROP TRIGGER IF EXISTS update_staff_qr_codes_updated_at ON staff_qr_codes;

-- Supprimer les indexes
DROP INDEX IF EXISTS idx_staff_qr_codes_staff_id;
DROP INDEX IF EXISTS idx_staff_qr_codes_qr_code_data;
DROP INDEX IF EXISTS idx_staff_qr_codes_is_active;

-- Supprimer la table (CASCADE supprime aussi les contraintes de clés étrangères)
DROP TABLE IF EXISTS staff_qr_codes CASCADE;
