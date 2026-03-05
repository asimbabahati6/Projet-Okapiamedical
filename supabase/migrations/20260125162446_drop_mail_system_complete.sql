/*
  # Suppression complète du système de gestion du courrier
  
  ## Description
  Cette migration supprime l'intégralité du système de gestion du courrier incluant :
  - Toutes les tables liées au courrier
  - Tous les enums spécifiques au courrier
  - Tous les index, contraintes et politiques RLS associées
  
  ## Tables supprimées
  1. mail_approval_steps
  2. mail_approval_workflows
  3. mail_archive
  4. mail_templates
  5. mail_tracking
  6. mail_responses
  7. mail_assignments
  8. mail_attachments
  9. mail_items
  10. mail_categories
  
  ## Enums supprimés
  1. mail_type_enum
  2. mail_priority_enum
  3. mail_status_enum
  4. mail_format_enum
  5. assignment_status_enum
  6. approval_decision_enum
  7. tracking_event_type_enum
  
  ## Impact
  - DESTRUCTIF : Toutes les données de courrier seront perdues
  - Aucune sauvegarde automatique
  - Cette action est irréversible
*/

-- Suppression des tables (dans l'ordre inverse des dépendances)
DROP TABLE IF EXISTS mail_approval_steps CASCADE;
DROP TABLE IF EXISTS mail_approval_workflows CASCADE;
DROP TABLE IF EXISTS mail_archive CASCADE;
DROP TABLE IF EXISTS mail_templates CASCADE;
DROP TABLE IF EXISTS mail_tracking CASCADE;
DROP TABLE IF EXISTS mail_responses CASCADE;
DROP TABLE IF EXISTS mail_assignments CASCADE;
DROP TABLE IF EXISTS mail_attachments CASCADE;
DROP TABLE IF EXISTS mail_items CASCADE;
DROP TABLE IF EXISTS mail_categories CASCADE;

-- Suppression des enums
DROP TYPE IF EXISTS tracking_event_type_enum CASCADE;
DROP TYPE IF EXISTS approval_decision_enum CASCADE;
DROP TYPE IF EXISTS assignment_status_enum CASCADE;
DROP TYPE IF EXISTS mail_format_enum CASCADE;
DROP TYPE IF EXISTS mail_status_enum CASCADE;
DROP TYPE IF EXISTS mail_priority_enum CASCADE;
DROP TYPE IF EXISTS mail_type_enum CASCADE;
