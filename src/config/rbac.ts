import { UserRole } from '../core/types/enums';
import type { RBACRole } from '../utils/roleMapping';

export { UserRole };

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  roles: RBACRole[];
  children?: MenuItem[];
}

export const ROLE_LABELS: Record<RBACRole, string> = {
  admin: 'Administrateur',
  medical_director: 'Médecin Directeur',
  doctor: 'Médecin',
  nurse: 'Infirmier(e)',
  administrative: 'Administratif',
  hr_admin: 'Responsable RH',
  accountant: 'Comptable',
  operations: 'Opérations',
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
  patient: 'Patient',
};

const ALL_ROLES: RBACRole[] = Object.keys(ROLE_LABELS) as RBACRole[];
export const ADMIN_ROLES: RBACRole[] = ['admin', 'medical_director', 'directeur_general', 'medecin_chef_staff'];
const MEDICAL_ROLES: RBACRole[] = ['admin', 'medical_director', 'doctor', 'medecin_chef_staff'];
const CLINICAL_ROLES: RBACRole[] = [...MEDICAL_ROLES, 'nurse', 'laboratory', 'pharmacist', 'radio_chef', 'radio_tech'];
const FINANCE_ROLES: RBACRole[] = ['admin', 'accountant', 'gestionnaire', 'directeur_general', 'caissiere'];
const HR_ROLES: RBACRole[] = ['admin', 'hr_admin', 'directeur_general', 'medecin_chef_staff', 'operations'];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  medical_director: ['*'],
  directeur_general: ['*'],
  medecin_chef_staff: ['dashboard', 'patients', 'appointments', 'consultations', 'prescriptions', 'laboratory', 'pharmacy', 'employees', 'reports', 'radiology'],
  doctor: ['dashboard', 'patients', 'appointments', 'consultations', 'prescriptions', 'laboratory', 'radiology'],
  nurse: ['dashboard', 'patients', 'appointments', 'consultations', 'prescriptions', 'patient-flow', 'patient-checkin'],
  administrative: ['dashboard', 'appointments', 'patients', 'billing', 'employees'],
  hr_admin: ['dashboard', 'employees', 'payroll', 'contracts', 'shifts', 'attendance'],
  accountant: ['dashboard', 'billing', 'invoices', 'expenses', 'financial-reports', 'payroll'],
  operations: ['dashboard', 'logistics', 'transport', 'facilities', 'suppliers', 'purchase-orders'],
  receptionist: ['dashboard', 'appointments', 'patients', 'patient-checkin', 'billing'],
  laboratory: ['dashboard', 'laboratory', 'patients'],
  pharmacist: ['dashboard', 'pharmacy', 'prescriptions', 'patients'],
  logistician: ['dashboard', 'logistics', 'suppliers', 'purchase-orders', 'transport'],
  gestionnaire: ['dashboard', 'billing', 'expenses', 'invoices'],
  radio_chef: ['dashboard', 'radiology', 'patients', 'reports'],
  radio_tech: ['dashboard', 'radiology', 'patients'],
  caissiere: ['dashboard', 'billing', 'caisse', 'patients'],
  technique: ['dashboard', 'facilities', 'logistics'],
  hygiene: ['dashboard', 'facilities'],
};

export const MENU_STRUCTURE: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: 'LayoutDashboard',
    path: '/staff/dashboard',
    roles: ALL_ROLES,
  },
  {
    id: 'medical',
    label: 'Médical',
    icon: 'Stethoscope',
    roles: [...CLINICAL_ROLES, 'receptionist', 'administrative', 'caissiere'],
    children: [
      { id: 'appointments', label: 'Rendez-vous', icon: 'Calendar', path: '/staff/appointments', roles: [...MEDICAL_ROLES, 'nurse', 'receptionist', 'administrative', 'caissiere'] },
      { id: 'medical-consultation', label: 'Consultation Médicale', icon: 'Stethoscope', path: '/staff/medical-consultation', roles: [...MEDICAL_ROLES, 'nurse'] },
      { id: 'medical-report', label: 'Rapport Médical', icon: 'ClipboardList', path: '/staff/medical-report', roles: MEDICAL_ROLES },
      { id: 'prescriptions', label: 'Prescriptions', icon: 'Pill', path: '/staff/prescriptions', roles: [...MEDICAL_ROLES, 'nurse', 'pharmacist'] },
      { id: 'patient-flow', label: 'Flux Patients', icon: 'GitBranch', path: '/staff/patient-flow', roles: [...CLINICAL_ROLES, 'receptionist', 'administrative'] },
      { id: 'patient-checkin', label: 'Accueil', icon: 'UserCheck', path: '/staff/patient-checkin', roles: ['admin', 'nurse', 'receptionist', 'administrative'] },
      { id: 'doctors-dashboard', label: 'Médecins', icon: 'BookUser', path: '/staff/doctors-dashboard', roles: ADMIN_ROLES },
    ],
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics',
    icon: 'FlaskConical',
    roles: [...CLINICAL_ROLES, 'radio_chef', 'radio_tech'],
    children: [
      { id: 'laboratory', label: 'Laboratoire', icon: 'FlaskConical', path: '/staff/laboratory', roles: [...MEDICAL_ROLES, 'laboratory'] },
      { id: 'radiology', label: 'Radiologie', icon: 'Activity', path: '/staff/radiology', roles: [...MEDICAL_ROLES, 'radio_chef', 'radio_tech'] },
    ],
  },
  {
    id: 'pharmacy',
    label: 'Pharmacie',
    icon: 'Pill',
    path: '/staff/pharmacy',
    roles: [...MEDICAL_ROLES, 'pharmacist'],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: 'DollarSign',
    roles: FINANCE_ROLES,
    children: [
      { id: 'billing', label: 'Facturation', icon: 'Receipt', path: '/staff/billing', roles: FINANCE_ROLES },
      { id: 'billing-analytics', label: 'Analyses', icon: 'TrendingUp', path: '/staff/billing-analytics', roles: ['admin', 'accountant', 'directeur_general'] },
      { id: 'financial-analytics', label: 'Rapports financiers', icon: 'BarChart3', path: '/staff/financial-analytics', roles: ['admin', 'accountant', 'directeur_general'] },
      { id: 'expenses', label: 'Dépenses', icon: 'Wallet', path: '/staff/expenses', roles: FINANCE_ROLES },
      { id: 'caisse', label: 'Caisse', icon: 'Store', path: '/staff/caisse', roles: ['admin', 'caissiere', 'accountant', 'gestionnaire'] },
      { id: 'medical-acts-pricing', label: 'Tarification actes', icon: 'DollarSign', path: '/staff/medical-acts-pricing', roles: ['admin', 'medical_director', 'caissiere', 'accountant', 'directeur_general'] },
      { id: 'conventions', label: 'Conventions', icon: 'FileCheck', path: '/staff/conventions', roles: FINANCE_ROLES },
      { id: 'medecins-prestataires', label: 'Medecins Prestataires', icon: 'UserCheck', path: '/staff/medecins-prestataires', roles: FINANCE_ROLES },
    ],
  },
  {
    id: 'hr',
    label: 'Ressources Humaines',
    icon: 'UserCog',
    roles: HR_ROLES,
    children: [
      { id: 'employees', label: 'Personnel', icon: 'Users', path: '/staff/employees', roles: HR_ROLES },
      { id: 'unified-personnel', label: 'Répertoire unifié', icon: 'BookUser', path: '/staff/unified-personnel', roles: HR_ROLES },
      { id: 'payroll', label: 'Paie', icon: 'DollarSign', path: '/staff/payroll', roles: ['admin', 'hr_admin', 'accountant', 'directeur_general'] },
      { id: 'contracts', label: 'Contrats', icon: 'FileSignature', path: '/staff/contracts', roles: ['admin', 'hr_admin', 'directeur_general'] },
      { id: 'shifts', label: 'Planning', icon: 'CalendarClock', path: '/staff/shift-scheduling', roles: HR_ROLES },
      { id: 'smart-punch-dashboard', label: 'Tableau pointage', icon: 'BarChart3', path: '/staff/smart-punch-dashboard', roles: ['admin', 'hr_admin', 'directeur_general'] },
    ],
  },
  {
    id: 'smart-punch',
    label: 'Pointage',
    icon: 'Fingerprint',
    path: '/staff/smart-punch',
    roles: ALL_ROLES,
  },
  {
    id: 'logistics',
    label: 'Logistique',
    icon: 'Package',
    roles: ['admin', 'logistician', 'operations', 'technique', 'directeur_general'],
    children: [
      { id: 'logistics-main', label: 'Stock', icon: 'Warehouse', path: '/staff/logistics', roles: ['admin', 'logistician', 'operations', 'technique'] },
      { id: 'suppliers', label: 'Fournisseurs', icon: 'Briefcase', path: '/staff/suppliers', roles: ['admin', 'logistician', 'operations'] },
      { id: 'purchase-orders', label: 'Commandes', icon: 'FileCheck', path: '/staff/purchase-orders', roles: ['admin', 'logistician', 'operations'] },
      { id: 'transport', label: 'Transport', icon: 'Truck', path: '/staff/transport', roles: ['admin', 'logistician', 'operations'] },
      { id: 'facilities', label: 'Installations', icon: 'Building', path: '/staff/facilities', roles: ['admin', 'operations', 'technique'] },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: 'Building2',
    roles: ADMIN_ROLES,
    children: [
      { id: 'administration-main', label: 'Direction', icon: 'Building2', path: '/staff/administration', roles: ADMIN_ROLES },
      { id: 'insurance', label: 'Assurances', icon: 'Shield', path: '/staff/insurance', roles: ['admin', 'accountant', 'directeur_general'] },
      { id: 'doctor-visibility', label: 'Visibilité médecins', icon: 'Settings', path: '/staff/doctor-visibility', roles: ADMIN_ROLES },
      { id: 'role-management', label: 'Gestion des rôles', icon: 'UserCog', path: '/staff/role-management', roles: ['admin', 'medical_director', 'directeur_general'] },
      { id: 'pending-registrations', label: 'Inscriptions en attente', icon: 'UserCheck', path: '/staff/pending-registrations', roles: ['admin', 'directeur_general'] },
      { id: 'permission-management', label: 'Permissions', icon: 'Shield', path: '/staff/permission-management', roles: ['admin', 'directeur_general'] },
      { id: 'activity-log', label: "Journal d'activité", icon: 'ClipboardList', path: '/staff/activity-log', roles: ['admin', 'medical_director', 'directeur_general'] },
      { id: 'staff-access', label: 'Accès Staff', icon: 'BarChart3', path: '/staff/staff-access', roles: ['admin', 'medical_director', 'directeur_general'] },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: 'MessageSquare',
    roles: ALL_ROLES,
    children: [
      { id: 'okapia-connect', label: 'OKAPIA Connect', icon: 'MessageSquare', path: '/staff/okapia-connect', roles: ALL_ROLES },
      { id: 'messaging', label: 'Messagerie', icon: 'MessageSquare', path: '/staff/messaging', roles: ALL_ROLES },
      { id: 'posts', label: 'Actualités', icon: 'Newspaper', path: '/staff/posts', roles: ADMIN_ROLES },
    ],
  },
  {
    id: 'feedback',
    label: 'Retours patients',
    icon: 'Activity',
    path: '/staff/feedback',
    roles: [...ADMIN_ROLES, 'receptionist', 'administrative'],
  },
];

export function hasAccess(userRole: UserRole | string, item: MenuItem): boolean {
  const roleStr = typeof userRole === 'string' ? userRole : '';
  const rbacRole = roleStr as RBACRole;
  const isUserAdmin = ADMIN_ROLES.includes(rbacRole);
  return item.roles.includes(rbacRole) || isUserAdmin;
}

export function filterMenuByRole(menu: MenuItem[], userRole: UserRole | string): MenuItem[] {
  return menu
    .filter(item => hasAccess(userRole, item))
    .map(item => ({
      ...item,
      children: item.children ? item.children.filter(child => hasAccess(userRole, child)) : undefined,
    }))
    .filter(item => !item.children || item.children.length > 0 || item.path);
}
