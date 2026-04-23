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

/** Roles that may access the main DRC dashboard */
export const DASHBOARD_ALLOWED_ROLES: UserRole[] = ['admin', 'medical_director'];

export const MENU_STRUCTURE: MenuItem[] = [
  {
    id: 'medical_pole',
    label: 'Pôle Médical',
    icon: 'Activity',
    category: 'medical',
    roles: ['admin', 'medical_director', 'doctor', 'receptionist', 'directeur_general', 'medecin_chef_staff', 'radio_chef', 'radio_tech'],
    children: [
      {
        id: 'patients',
        label: 'Gestion des Patients',
        icon: 'Users',
        path: '/staff/patients',
        roles: ['admin', 'medical_director', 'doctor', 'receptionist'],
      },
      {
        id: 'appointments',
        label: 'Rendez-vous',
        icon: 'Calendar',
        path: '/staff/appointments',
        roles: ['admin', 'medical_director', 'doctor', 'receptionist'],
      },
      {
        id: 'consultations',
        label: 'Consultations',
        icon: 'Stethoscope',
        path: '/staff/consultations',
        roles: ['admin', 'medical_director', 'doctor'],
      },
      {
        id: 'medical_staff',
        label: 'Personnel Médical',
        icon: 'UserCog',
        path: '/staff/doctors-dashboard',
        roles: ['admin', 'medical_director'],
      },
      {
        id: 'prescriptions',
        label: 'Ordonnances',
        icon: 'FileText',
        path: '/staff/prescriptions',
        roles: ['admin', 'medical_director', 'doctor'],
      },
      {
        id: 'medical_services',
        label: 'Services Médicaux',
        icon: 'Briefcase',
        roles: ['admin', 'medical_director', 'doctor', 'laboratory', 'pharmacist', 'directeur_general', 'medecin_chef_staff', 'radio_chef', 'radio_tech'],
        children: [
          {
            id: 'laboratory',
            label: 'Laboratoire',
            icon: 'FlaskConical',
            path: '/staff/laboratory',
            roles: ['admin', 'medical_director', 'doctor', 'laboratory'],
          },
          {
            id: 'radiology',
            label: 'Radiologie',
            icon: 'Activity',
            path: '/staff/radiology',
            roles: ['admin', 'medical_director', 'doctor', 'directeur_general', 'medecin_chef_staff', 'radio_chef', 'radio_tech'],
          },
          {
            id: 'pharmacy',
            label: 'Pharmacie',
            icon: 'Pill',
            path: '/staff/pharmacy',
            roles: ['admin', 'medical_director', 'doctor', 'pharmacist', 'directeur_general'],
          },
          {
            id: 'pharmacy_inventory',
            label: 'Stock Pharmacie',
            icon: 'Package',
            path: '/staff/pharmacy-inventory',
            roles: ['admin', 'pharmacist', 'directeur_general'],
          },
        ],
      },
    ],
  },
  {
    id: 'administrative_pole',
    label: 'Pôle Administratif',
    icon: 'Building2',
    category: 'administrative',
    roles: ['admin', 'administrative', 'hr_admin', 'operations', 'receptionist'],
    children: [],
  },
];

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
