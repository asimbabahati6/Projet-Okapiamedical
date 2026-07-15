/*
  # Seed Permissions Registry and Role Assignments

  1. Permissions Seeded
    - 10 categories: dashboard, patients, appointments, consultations, prescriptions,
      laboratory, pharmacy, radiology, billing, employees
    - Each category has: view, create, edit, delete, export permissions
    - Additional specialized permissions per module

  2. Role Assignments
    - Maps existing ROLE_PERMISSIONS from the application config into the database
    - Maintains backward compatibility with the current permission structure
    - Admin roles (level 1-2) are not assigned individual permissions (they get wildcard via helper function)

  3. Notes
    - This seeds the initial permission data matching the current hardcoded ROLE_PERMISSIONS
    - Future permission changes can be managed via the admin UI
*/

-- Seed permissions by category
INSERT INTO permissions (code, display_name, category, description) VALUES
  -- Dashboard
  ('dashboard.view', 'Voir le tableau de bord', 'dashboard', 'Acces au tableau de bord principal'),

  -- Patients
  ('patients.view', 'Voir les patients', 'patients', 'Consulter la liste et les fiches patients'),
  ('patients.create', 'Creer un patient', 'patients', 'Enregistrer un nouveau patient'),
  ('patients.edit', 'Modifier un patient', 'patients', 'Modifier les informations patient'),
  ('patients.delete', 'Supprimer un patient', 'patients', 'Supprimer un dossier patient'),
  ('patients.export', 'Exporter les patients', 'patients', 'Exporter les donnees patients'),

  -- Appointments
  ('appointments.view', 'Voir les rendez-vous', 'appointments', 'Consulter les rendez-vous'),
  ('appointments.create', 'Creer un rendez-vous', 'appointments', 'Planifier un nouveau rendez-vous'),
  ('appointments.edit', 'Modifier un rendez-vous', 'appointments', 'Modifier un rendez-vous existant'),
  ('appointments.delete', 'Supprimer un rendez-vous', 'appointments', 'Annuler/supprimer un rendez-vous'),

  -- Consultations
  ('consultations.view', 'Voir les consultations', 'consultations', 'Consulter les historiques de consultation'),
  ('consultations.create', 'Creer une consultation', 'consultations', 'Enregistrer une nouvelle consultation'),
  ('consultations.edit', 'Modifier une consultation', 'consultations', 'Modifier une consultation existante'),
  ('consultations.delete', 'Supprimer une consultation', 'consultations', 'Supprimer une consultation'),
  ('consultations.export', 'Exporter les consultations', 'consultations', 'Exporter les donnees de consultation'),

  -- Prescriptions
  ('prescriptions.view', 'Voir les prescriptions', 'prescriptions', 'Consulter les prescriptions'),
  ('prescriptions.create', 'Creer une prescription', 'prescriptions', 'Rediger une nouvelle prescription'),
  ('prescriptions.edit', 'Modifier une prescription', 'prescriptions', 'Modifier une prescription existante'),

  -- Laboratory
  ('laboratory.view', 'Voir le laboratoire', 'laboratory', 'Acces au module laboratoire'),
  ('laboratory.create_orders', 'Creer des ordres labo', 'laboratory', 'Creer des demandes d analyse'),
  ('laboratory.edit_results', 'Saisir les resultats', 'laboratory', 'Saisir et modifier les resultats'),
  ('laboratory.validate', 'Valider les resultats', 'laboratory', 'Valider les resultats d analyse'),
  ('laboratory.manage_equipment', 'Gerer les equipements', 'laboratory', 'Gerer les equipements du laboratoire'),

  -- Pharmacy
  ('pharmacy.view', 'Voir la pharmacie', 'pharmacy', 'Acces au module pharmacie'),
  ('pharmacy.dispense', 'Dispenser les medicaments', 'pharmacy', 'Delivrer des medicaments'),
  ('pharmacy.manage_inventory', 'Gerer le stock', 'pharmacy', 'Gerer l inventaire de la pharmacie'),
  ('pharmacy.receive_orders', 'Recevoir les commandes', 'pharmacy', 'Enregistrer les receptions'),

  -- Radiology
  ('radiology.view', 'Voir la radiologie', 'radiology', 'Acces au module radiologie'),
  ('radiology.prescribe', 'Prescrire un examen', 'radiology', 'Prescrire un examen radiologique'),
  ('radiology.perform_exams', 'Realiser les examens', 'radiology', 'Effectuer les examens radiologiques'),
  ('radiology.upload_images', 'Telecharger les images', 'radiology', 'Telecharger les images DICOM'),
  ('radiology.write_reports', 'Rediger les rapports', 'radiology', 'Rediger les comptes-rendus'),
  ('radiology.validate_reports', 'Valider les rapports', 'radiology', 'Valider les comptes-rendus'),

  -- Billing / Finance
  ('billing.view', 'Voir la facturation', 'billing', 'Acces au module facturation'),
  ('billing.create_invoices', 'Creer des factures', 'billing', 'Creer de nouvelles factures'),
  ('billing.edit_invoices', 'Modifier les factures', 'billing', 'Modifier les factures existantes'),
  ('billing.cancel_invoices', 'Annuler les factures', 'billing', 'Annuler une facture'),
  ('billing.view_treasury', 'Voir la tresorerie', 'billing', 'Consulter les donnees de tresorerie'),
  ('billing.manage_treasury', 'Gerer la tresorerie', 'billing', 'Modifier les donnees de tresorerie'),
  ('billing.view_reports', 'Voir les rapports financiers', 'billing', 'Consulter les rapports financiers'),
  ('billing.manage_expenses', 'Gerer les depenses', 'billing', 'Creer et gerer les depenses'),
  ('billing.access_cash_register', 'Acces a la caisse', 'billing', 'Operer la caisse'),

  -- Employees / HR
  ('employees.view', 'Voir le personnel', 'employees', 'Consulter la liste du personnel'),
  ('employees.create', 'Ajouter du personnel', 'employees', 'Enregistrer un nouvel employe'),
  ('employees.edit', 'Modifier le personnel', 'employees', 'Modifier les informations employe'),
  ('employees.delete', 'Supprimer le personnel', 'employees', 'Supprimer un employe'),
  ('employees.manage_contracts', 'Gerer les contrats', 'employees', 'Gerer les contrats de travail'),
  ('employees.manage_payroll', 'Gerer la paie', 'employees', 'Administrer la paie'),
  ('employees.manage_attendance', 'Gerer les presences', 'employees', 'Gerer le pointage et les presences'),
  ('employees.manage_shifts', 'Gerer les plannings', 'employees', 'Gerer les plannings de travail'),

  -- Logistics
  ('logistics.view', 'Voir la logistique', 'logistics', 'Acces au module logistique'),
  ('logistics.manage_inventory', 'Gerer les stocks', 'logistics', 'Gerer l inventaire logistique'),
  ('logistics.manage_suppliers', 'Gerer les fournisseurs', 'logistics', 'Gerer les fournisseurs'),
  ('logistics.manage_orders', 'Gerer les commandes', 'logistics', 'Gerer les bons de commande'),
  ('logistics.manage_transport', 'Gerer le transport', 'logistics', 'Gerer les vehicules et transports'),
  ('logistics.manage_facilities', 'Gerer les installations', 'logistics', 'Gerer la maintenance des locaux'),

  -- Administration
  ('admin.manage_roles', 'Gerer les roles', 'admin', 'Administrer les roles et permissions'),
  ('admin.manage_registrations', 'Gerer les inscriptions', 'admin', 'Valider/rejeter les inscriptions'),
  ('admin.manage_departments', 'Gerer les departements', 'admin', 'Administrer les departements'),
  ('admin.manage_settings', 'Gerer les parametres', 'admin', 'Modifier les parametres systeme'),
  ('admin.view_audit_log', 'Voir le journal d audit', 'admin', 'Consulter les logs d audit'),
  ('admin.manage_posts', 'Gerer les actualites', 'admin', 'Publier et gerer les actualites')

ON CONFLICT (code) DO NOTHING;

-- Assign permissions to roles (excluding admin roles which get wildcard)
-- Doctor permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'doctor' AND p.code IN (
  'dashboard.view', 'patients.view', 'patients.create', 'patients.edit', 'patients.export',
  'appointments.view', 'appointments.create', 'appointments.edit',
  'consultations.view', 'consultations.create', 'consultations.edit', 'consultations.export',
  'prescriptions.view', 'prescriptions.create', 'prescriptions.edit',
  'laboratory.view', 'laboratory.create_orders',
  'radiology.view', 'radiology.prescribe'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Nurse permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'nurse' AND p.code IN (
  'dashboard.view', 'patients.view', 'patients.edit',
  'appointments.view',
  'consultations.view',
  'prescriptions.view',
  'laboratory.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Receptionist permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'receptionist' AND p.code IN (
  'dashboard.view',
  'patients.view', 'patients.create', 'patients.edit',
  'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.delete',
  'billing.view', 'billing.create_invoices', 'billing.access_cash_register'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Administrative staff permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'administrative_staff' AND p.code IN (
  'dashboard.view',
  'patients.view', 'patients.create', 'patients.edit',
  'appointments.view', 'appointments.create', 'appointments.edit',
  'billing.view', 'billing.create_invoices',
  'employees.view', 'employees.create', 'employees.edit'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Pharmacist permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'pharmacist' AND p.code IN (
  'dashboard.view',
  'patients.view',
  'prescriptions.view',
  'pharmacy.view', 'pharmacy.dispense', 'pharmacy.manage_inventory', 'pharmacy.receive_orders'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Lab technician permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'lab_technician' AND p.code IN (
  'dashboard.view',
  'patients.view',
  'laboratory.view', 'laboratory.create_orders', 'laboratory.edit_results',
  'laboratory.validate', 'laboratory.manage_equipment'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Logistician permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'logistician' AND p.code IN (
  'dashboard.view',
  'logistics.view', 'logistics.manage_inventory', 'logistics.manage_suppliers',
  'logistics.manage_orders', 'logistics.manage_transport', 'logistics.manage_facilities'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Gestionnaire permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'gestionnaire' AND p.code IN (
  'dashboard.view',
  'billing.view', 'billing.create_invoices', 'billing.edit_invoices',
  'billing.view_treasury', 'billing.manage_expenses', 'billing.view_reports'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Caissiere permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'caissiere' AND p.code IN (
  'dashboard.view',
  'billing.view', 'billing.create_invoices', 'billing.access_cash_register',
  'patients.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Radio chef permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'radio_chef' AND p.code IN (
  'dashboard.view',
  'patients.view',
  'radiology.view', 'radiology.perform_exams', 'radiology.upload_images',
  'radiology.write_reports', 'radiology.validate_reports'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Radio tech permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'radio_tech' AND p.code IN (
  'dashboard.view',
  'patients.view',
  'radiology.view', 'radiology.perform_exams', 'radiology.upload_images',
  'radiology.write_reports'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Medecin chef staff permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'medecin_chef_staff' AND p.code IN (
  'dashboard.view',
  'patients.view', 'patients.create', 'patients.edit', 'patients.export',
  'appointments.view', 'appointments.create', 'appointments.edit',
  'consultations.view', 'consultations.create', 'consultations.edit', 'consultations.export',
  'prescriptions.view', 'prescriptions.create', 'prescriptions.edit',
  'laboratory.view', 'laboratory.create_orders', 'laboratory.validate',
  'pharmacy.view',
  'radiology.view', 'radiology.prescribe', 'radiology.validate_reports',
  'employees.view', 'employees.create', 'employees.edit',
  'billing.view', 'billing.view_reports'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- HR manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'hr_manager' AND p.code IN (
  'dashboard.view',
  'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
  'employees.manage_contracts', 'employees.manage_payroll',
  'employees.manage_attendance', 'employees.manage_shifts'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Finance manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'finance_manager' AND p.code IN (
  'dashboard.view',
  'billing.view', 'billing.create_invoices', 'billing.edit_invoices',
  'billing.cancel_invoices', 'billing.view_treasury', 'billing.manage_treasury',
  'billing.view_reports', 'billing.manage_expenses'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Technique (maintenance) permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'technique' AND p.code IN (
  'dashboard.view',
  'logistics.view', 'logistics.manage_facilities'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Hygiene permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'hygiene' AND p.code IN (
  'dashboard.view',
  'logistics.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Dentist permissions (same as doctor)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'dentist' AND p.code IN (
  'dashboard.view', 'patients.view', 'patients.create', 'patients.edit', 'patients.export',
  'appointments.view', 'appointments.create', 'appointments.edit',
  'consultations.view', 'consultations.create', 'consultations.edit', 'consultations.export',
  'prescriptions.view', 'prescriptions.create', 'prescriptions.edit',
  'laboratory.view', 'laboratory.create_orders',
  'radiology.view', 'radiology.prescribe'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Physical therapist permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'physical_therapist' AND p.code IN (
  'dashboard.view', 'patients.view', 'patients.edit',
  'appointments.view', 'appointments.create', 'appointments.edit',
  'consultations.view', 'consultations.create', 'consultations.edit',
  'prescriptions.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
