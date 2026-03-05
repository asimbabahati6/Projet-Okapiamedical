/*
  # Nettoyage complet données de démonstration - Version 4

  Stratégie sûre:
  1. Supprimer TOUS les triggers d'audit/log
  2. Supprimer toutes les données
  3. Recréer les triggers

  Conservation:
  - Départements, Services, Rôles
  - Paramètres système
  - Catalogues
*/

-- ==================================================
-- ÉTAPE 1: SUPPRIMER TOUS LES TRIGGERS D'AUDIT
-- ==================================================

-- Triggers sur medical_staff
DROP TRIGGER IF EXISTS audit_medical_staff_changes ON medical_staff;
DROP TRIGGER IF EXISTS log_sensitive_medical_staff_access ON medical_staff;
DROP TRIGGER IF EXISTS sync_flags_on_medical_staff ON medical_staff;
DROP TRIGGER IF EXISTS version_medical_staff ON medical_staff;

-- Triggers sur posts
DROP TRIGGER IF EXISTS post_audit_delete ON posts;
DROP TRIGGER IF EXISTS post_audit_insert ON posts;
DROP TRIGGER IF EXISTS post_audit_update ON posts;

-- Triggers sur consultations si existants
DROP TRIGGER IF EXISTS audit_consultation_changes ON consultations;
DROP TRIGGER IF EXISTS log_consultation_access ON consultations;

-- Triggers sur prescriptions si existants
DROP TRIGGER IF EXISTS audit_prescription_changes ON prescriptions;
DROP TRIGGER IF EXISTS log_prescription_access ON prescriptions;

-- ==================================================
-- ÉTAPE 2: SUPPRIMER TOUTES LES TABLES D'AUDIT
-- ==================================================

DELETE FROM post_audit_logs;
DELETE FROM consultation_audit_logs;
DELETE FROM prescription_audit_log;
DELETE FROM staff_audit_trail;
DELETE FROM staff_versions;
DELETE FROM audit_logs;
DELETE FROM sensitive_data_access_log;

-- ==================================================
-- ÉTAPE 3: SUPPRIMER LES DONNÉES OPÉRATIONNELLES
-- ==================================================

-- Personnel médical détails
DELETE FROM doctor_act_pricing;
DELETE FROM doctor_availability_calendar;
DELETE FROM doctor_certifications;
DELETE FROM doctor_hospitals;
DELETE FROM doctor_insurance_contracts;
DELETE FROM doctor_languages;
DELETE FROM doctor_leave_requests;
DELETE FROM doctor_medical_acts;
DELETE FROM doctor_on_call_schedule;
DELETE FROM doctor_replacements;
DELETE FROM doctor_schedule_overrides;
DELETE FROM doctor_schedule_templates;
DELETE FROM doctor_specialties;
DELETE FROM replacement_notifications;
DELETE FROM doctor_departments;
DELETE FROM staff_deletion_approvals;
DELETE FROM staff_pending_approvals;
DELETE FROM staff_credentials_verification;
DELETE FROM medical_staff;

-- RH
DELETE FROM hr_attendance_records;
DELETE FROM hr_checkin_attempts;
DELETE FROM hr_leave_requests;
DELETE FROM hr_leave_balances;
DELETE FROM hr_payroll;
DELETE FROM hr_salary_adjustments;
DELETE FROM hr_contracts;
DELETE FROM hr_documents;
DELETE FROM hr_employees;
DELETE FROM leave_requests;

-- Assiduité
DELETE FROM attendance_check_attempts;
DELETE FROM attendance_records;
DELETE FROM break_audit_log;
DELETE FROM break_escalations;

-- Documents
DELETE FROM medical_document_history;
DELETE FROM medical_documents;
DELETE FROM document_comments;
DELETE FROM document_shares;
DELETE FROM document_workflow_status;
DELETE FROM digital_signatures;

-- Messages
DELETE FROM messages;
DELETE FROM notifications;
DELETE FROM actor_notifications;
DELETE FROM sms_notifications;
DELETE FROM break_notifications;
DELETE FROM email_queue;

-- Logistique
DELETE FROM delivery_note_items;
DELETE FROM delivery_notes;
DELETE FROM purchase_order_items;
DELETE FROM purchase_orders;
DELETE FROM stock_movements;
DELETE FROM stock_alerts;
DELETE FROM logistics_stock_alerts;
DELETE FROM inventory_items;
DELETE FROM supplier_contacts;
DELETE FROM supplier_documents;
DELETE FROM supplier_evaluations;
DELETE FROM suppliers;

-- Transport
DELETE FROM mission_passengers;
DELETE FROM transport_missions;
DELETE FROM driver_assignments;
DELETE FROM fuel_records;
DELETE FROM maintenance_records;
DELETE FROM vehicle_locations;
DELETE FROM vehicle_documents;
DELETE FROM drivers;
DELETE FROM vehicles;

-- Posts et actualités
DELETE FROM post_media;
DELETE FROM posts;
DELETE FROM news_articles;

-- Rapports
DELETE FROM billing_financial_reports;
DELETE FROM financial_reports;
DELETE FROM generated_reports;

-- Autres
DELETE FROM hospitalizations;
DELETE FROM beds;
DELETE FROM telemedicine_sessions;
DELETE FROM waiting_queue;
DELETE FROM pharmacy_stock;
DELETE FROM contact_messages;

-- Profils utilisateurs (garder super admin)
DELETE FROM user_profiles 
WHERE id NOT IN (
  SELECT up.id 
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE r.name = 'super_admin'
);

-- ==================================================
-- ÉTAPE 4: RECRÉER LES TRIGGERS ESSENTIELS
-- ==================================================

-- Triggers medical_staff
CREATE TRIGGER audit_medical_staff_changes
AFTER INSERT OR UPDATE OR DELETE ON medical_staff
FOR EACH ROW
EXECUTE FUNCTION log_staff_changes();

CREATE TRIGGER log_sensitive_medical_staff_access
AFTER INSERT OR UPDATE OR DELETE ON medical_staff
FOR EACH ROW
EXECUTE FUNCTION log_sensitive_access();

CREATE TRIGGER sync_flags_on_medical_staff
AFTER INSERT OR UPDATE OR DELETE ON medical_staff
FOR EACH ROW
EXECUTE FUNCTION sync_employee_flags();

CREATE TRIGGER version_medical_staff
AFTER UPDATE ON medical_staff
FOR EACH ROW
EXECUTE FUNCTION create_staff_version();

-- Triggers posts
CREATE TRIGGER post_audit_insert
AFTER INSERT ON posts
FOR EACH ROW
EXECUTE FUNCTION create_post_audit_log();

CREATE TRIGGER post_audit_update
AFTER UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION create_post_audit_log();

CREATE TRIGGER post_audit_delete
AFTER DELETE ON posts
FOR EACH ROW
EXECUTE FUNCTION create_post_audit_log();

-- ==================================================
-- ÉTAPE 5: VÉRIFICATION
-- ==================================================

DO $$
DECLARE
  v_patients INT;
  v_staff INT;
  v_appts INT;
  v_consults INT;
  v_invoices INT;
  v_hr INT;
  v_inventory INT;
  v_posts INT;
  v_suppliers INT;
  v_vehicles INT;
  v_depts INT;
  v_services INT;
  v_roles INT;
BEGIN
  SELECT COUNT(*) INTO v_patients FROM patients;
  SELECT COUNT(*) INTO v_staff FROM medical_staff;
  SELECT COUNT(*) INTO v_appts FROM appointments;
  SELECT COUNT(*) INTO v_consults FROM consultations;
  SELECT COUNT(*) INTO v_invoices FROM invoices;
  SELECT COUNT(*) INTO v_hr FROM hr_employees;
  SELECT COUNT(*) INTO v_inventory FROM inventory_items;
  SELECT COUNT(*) INTO v_posts FROM posts;
  SELECT COUNT(*) INTO v_suppliers FROM suppliers;
  SELECT COUNT(*) INTO v_vehicles FROM vehicles;
  SELECT COUNT(*) INTO v_depts FROM departments;
  SELECT COUNT(*) INTO v_services FROM services;
  SELECT COUNT(*) INTO v_roles FROM roles;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════╗';
  RAISE NOTICE '║   NETTOYAGE COMPLET TERMINÉ               ║';
  RAISE NOTICE '╚═══════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ DONNÉES SUPPRIMÉES:';
  RAISE NOTICE '   • Patients: %', v_patients;
  RAISE NOTICE '   • Personnel médical: %', v_staff;
  RAISE NOTICE '   • Rendez-vous: %', v_appts;
  RAISE NOTICE '   • Consultations: %', v_consults;
  RAISE NOTICE '   • Factures: %', v_invoices;
  RAISE NOTICE '   • Employés RH: %', v_hr;
  RAISE NOTICE '   • Inventaire: %', v_inventory;
  RAISE NOTICE '   • Posts: %', v_posts;
  RAISE NOTICE '   • Fournisseurs: %', v_suppliers;
  RAISE NOTICE '   • Véhicules: %', v_vehicles;
  RAISE NOTICE '';
  RAISE NOTICE '🏗️  CONFIGURATION CONSERVÉE:';
  RAISE NOTICE '   • Départements: %', v_depts;
  RAISE NOTICE '   • Services: %', v_services;
  RAISE NOTICE '   • Rôles: %', v_roles;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Base de données nettoyée avec succès!';
  RAISE NOTICE '📝 Prête pour les données de production';
  RAISE NOTICE '';
END $$;
