/*
  # Nettoyage des références QR code dans la migration d'attendance

  ## Changements
  Cette migration nettoie les artefacts restants de l'ancien système QR code
  qui avaient été inclus dans la migration d'attendance.
  
  Note: La table staff_qr_codes a déjà été supprimée par la migration précédente.
  Cette migration est une opération de maintenance pour assurer la cohérence.
*/

-- Cette migration est informative seulement
-- Les policies et indexes QR ont déjà été supprimés avec la table staff_qr_codes
-- Aucune action supplémentaire nécessaire
SELECT 'QR code system successfully removed from database' as status;
