export type UserRole =
  | 'admin'
  | 'medical_director'
  | 'doctor'
  | 'administrative'
  | 'hr_admin'
  | 'accountant'
  | 'operations'
  | 'receptionist'
  | 'laboratory'
  | 'pharmacist'
  | 'logistician'
  | 'directeur_general'
  | 'medecin_chef_staff'
  | 'gestionnaire'
  | 'radio_chef'
  | 'radio_tech'
  | 'caissiere'
  | 'technique'
  | 'hygiene'
  | 'super_admin'
  | 'hospital_admin'
  | 'administrative_staff'
  | 'nurse'
  | 'lab_technician'
  | 'dentist'
  | 'physical_therapist'
  | 'hr_manager'
  | 'finance_manager'
  | 'operations_manager'
  | 'administrative_director'
  | 'administrative_officer'
  | 'administrative_assistant'
  | 'information_systems_coordinator';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
  roles: UserRole[];
  category?: 'medical' | 'administrative' | 'commercial';
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  medical_director: 'Médecin Directeur',
  doctor: 'Médecin',
  administrative: 'Administratif/RH',
  hr_admin: 'Responsable RH',
  accountant: 'Comptable',
  operations: 'Responsable Opérations',
  receptionist: 'Réceptionniste',
  laboratory: 'Laboratoire',
  pharmacist: 'Pharmacien',
  logistician: 'Logisticien',
  directeur_general: 'Directeur Général',
  medecin_chef_staff: 'Médecin Chef de Staff',
  gestionnaire: 'Gestionnaire',
  radio_chef: 'Chef Radiologie',
  radio_tech: 'Technicien Radiologie',
  caissiere: 'Caissière',
  technique: 'Technicien',
  hygiene: "Agent d'Hygiène",
  super_admin: 'Super Administrateur',
  hospital_admin: 'Administrateur Hôpital',
  administrative_staff: 'Personnel Administratif',
  nurse: 'Infirmier(ère)',
  lab_technician: 'Technicien Laboratoire',
  dentist: 'Dentiste',
  physical_therapist: 'Kinésithérapeute',
  hr_manager: 'Responsable RH',
  finance_manager: 'Responsable Finances',
  operations_manager: 'Responsable Opérations',
  administrative_director: 'Directeur Administratif',
  administrative_officer: 'Agent Administratif',
  administrative_assistant: 'Assistant Administratif',
  information_systems_coordinator: "Coordinateur Systèmes d'Information",
};

const ALL_ROLES: UserRole[] = [
  'admin', 'medical_director', 'doctor', 'administrative', 'hr_admin', 'accountant',
  'operations', 'receptionist', 'laboratory', 'pharmacist', 'logistician',
  'directeur_general', 'medecin_chef_staff', 'gestionnaire', 'radio_chef', 'radio_tech',
  'caissiere', 'technique', 'hygiene', 'super_admin', 'hospital_admin',
  'administrative_staff', 'nurse', 'lab_technician', 'dentist', 'physical_therapist',
  'hr_manager', 'finance_manager', 'operations_manager', 'administrative_director',
  'administrative_officer', 'administrative_assistant', 'information_systems_coordinator',
];

/** All authenticated roles can access the main dashboard */
export const DASHBOARD_ALLOWED_ROLES: UserRole[] = ALL_ROLES;

export const MENU_STRUCTURE: MenuItem[] = [
  {
    id: 'patients',
    label: 'Gestion des Patients',
    icon: 'Users',
    path: '/staff/patients',
    roles: ['admin', 'medical_director', 'doctor', 'receptionist', 'nurse', 'medecin_chef_staff', 'super_admin', 'hospital_admin'],
  },
  {
    id: 'appointments',
    label: 'Rendez-vous',
    icon: 'Calendar',
    path: '/staff/appointments',
    roles: ['admin', 'medical_director', 'doctor', 'receptionist', 'medecin_chef_staff', 'super_admin', 'hospital_admin'],
  },
  {
    id: 'consultations',
    label: 'Consultations',
    icon: 'Stethoscope',
    path: '/staff/consultations',
    roles: ['admin', 'medical_director', 'doctor', 'medecin_chef_staff', 'nurse', 'super_admin', 'hospital_admin'],
  },
  {
    id: 'medical_staff',
    label: 'Médecins',
    icon: 'UserCog',
    path: '/staff/doctors-dashboard',
    roles: ['admin', 'medical_director', 'medecin_chef_staff', 'directeur_general', 'super_admin', 'hospital_admin'],
  },
  {
    id: 'prescriptions',
    label: 'Ordonnances',
    icon: 'FileText',
    path: '/staff/prescriptions',
    roles: ['admin', 'medical_director', 'doctor', 'medecin_chef_staff', 'pharmacist', 'super_admin', 'hospital_admin'],
  },
  {
    id: 'laboratory',
    label: 'Labo',
    icon: 'FlaskConical',
    path: '/staff/laboratory',
    roles: ['admin', 'medical_director', 'doctor', 'laboratory', 'lab_technician', 'medecin_chef_staff', 'super_admin', 'hospital_admin'],
  },
  {
    id: 'radiology',
    label: 'Radiologie',
    icon: 'Activity',
    path: '/staff/radiology',
    roles: ['admin', 'medical_director', 'doctor', 'directeur_general', 'medecin_chef_staff', 'radio_chef', 'radio_tech', 'super_admin', 'hospital_admin'],
  },
  {
    id: 'pharmacy',
    label: 'Pharmacie',
    icon: 'Pill',
    path: '/staff/pharmacy',
    roles: ['admin', 'medical_director', 'doctor', 'pharmacist', 'directeur_general', 'medecin_chef_staff', 'super_admin', 'hospital_admin'],
  },
  {
    id: 'pharmacy_inventory',
    label: 'Stock Pharmacie',
    icon: 'Package',
    path: '/staff/pharmacy-inventory',
    roles: ['admin', 'pharmacist', 'directeur_general', 'logistician', 'super_admin', 'hospital_admin'],
  },
  {
    id: 'administrative_pole',
    label: 'Pôle Administratif',
    icon: 'Building2',
    category: 'administrative',
    roles: ['admin', 'administrative', 'hr_admin', 'operations', 'receptionist', 'super_admin', 'hospital_admin', 'administrative_staff'],
    children: [],
  },
];

export type Permission = string;

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['all'],
  super_admin: ['all'],
  hospital_admin: ['all'],
  medical_director: ['view_patients', 'manage_patients', 'view_consultations', 'manage_consultations', 'view_staff', 'manage_staff', 'view_reports', 'manage_reports'],
  directeur_general: ['view_patients', 'manage_patients', 'view_financial', 'manage_financial', 'view_reports', 'manage_reports', 'view_staff'],
  medecin_chef_staff: ['view_patients', 'manage_patients', 'view_consultations', 'manage_consultations', 'view_staff'],
  doctor: ['view_patients', 'manage_patients', 'view_consultations', 'create_consultations', 'view_prescriptions', 'create_prescriptions'],
  nurse: ['view_patients', 'view_consultations'],
  dentist: ['view_patients', 'manage_patients', 'view_consultations', 'create_consultations'],
  physical_therapist: ['view_patients', 'view_consultations'],
  receptionist: ['view_patients', 'create_patients', 'view_appointments', 'manage_appointments'],
  administrative: ['view_staff', 'manage_staff', 'view_reports'],
  administrative_staff: ['view_staff'],
  administrative_director: ['view_staff', 'manage_staff', 'view_reports', 'manage_reports'],
  administrative_officer: ['view_staff'],
  administrative_assistant: ['view_staff'],
  hr_admin: ['view_staff', 'manage_staff', 'view_payroll', 'manage_payroll'],
  hr_manager: ['view_staff', 'manage_staff', 'view_payroll', 'manage_payroll'],
  accountant: ['view_financial', 'view_invoices', 'manage_invoices'],
  finance_manager: ['view_financial', 'manage_financial', 'view_invoices', 'manage_invoices'],
  operations: ['view_logistics', 'manage_logistics'],
  operations_manager: ['view_logistics', 'manage_logistics'],
  logistician: ['view_logistics', 'manage_logistics'],
  pharmacist: ['view_pharmacy', 'manage_pharmacy', 'view_prescriptions'],
  laboratory: ['view_lab', 'manage_lab'],
  lab_technician: ['view_lab', 'manage_lab'],
  radio_chef: ['view_radiology', 'manage_radiology', 'validate_report', 'delete_report'],
  radio_tech: ['view_radiology', 'upload_images', 'modify_report'],
  gestionnaire: ['view_financial', 'view_reports'],
  caissiere: ['view_invoices', 'manage_invoices', 'access_cash_register'],
  technique: ['view_maintenance'],
  hygiene: ['view_hygiene', 'manage_hygiene'],
  information_systems_coordinator: ['view_staff', 'view_reports'],
};

export function hasAccess(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

export function filterMenuByRole(menu: MenuItem[], userRole: UserRole): MenuItem[] {
  return menu
    .filter(item => hasAccess(userRole, item.roles))
    .map(item => ({
      ...item,
      children: item.children ? filterMenuByRole(item.children, userRole) : undefined,
    }));
}
