import { UserRole } from '@/core/types/enums';

// Type definitions for the three role systems
export type RBACRole = 'admin' | 'medical_director' | 'doctor' | 'administrative' | 'accountant' | 'receptionist' | 'laboratory' | 'pharmacist' | 'logistician' | 'hr_admin' | 'operations' | 'directeur_general' | 'medecin_chef_staff' | 'gestionnaire' | 'radio_chef' | 'radio_tech' | 'caissiere' | 'technique' | 'hygiene';
export type DatabaseRole = 'super_admin' | 'hospital_admin' | 'medical_director' | 'administrative_director' | 'hr_manager' | 'finance_manager' | 'operations_manager' | 'information_systems_coordinator' | 'doctor' | 'dentist' | 'physical_therapist' | 'nurse' | 'pharmacist' | 'administrative_staff' | 'administrative_officer' | 'administrative_assistant' | 'receptionist' | 'lab_technician' | 'logistician' | 'patient' | 'directeur_general' | 'medecin_chef_staff' | 'gestionnaire' | 'radio_chef' | 'radio_tech' | 'caissiere' | 'technique' | 'hygiene';

// Mapping from RBAC roles to UserRole enum
export const RBAC_TO_ENUM_MAP: Record<RBACRole, UserRole> = {
  'admin': UserRole.SUPER_ADMIN,
  'medical_director': UserRole.MEDICAL_DIRECTOR,
  'doctor': UserRole.DOCTOR,
  'pharmacist': UserRole.PHARMACIST,
  'laboratory': UserRole.LAB_TECHNICIAN,
  'receptionist': UserRole.RECEPTIONIST,
  'administrative': UserRole.ADMINISTRATIVE_STAFF,
  'accountant': UserRole.FINANCE_MANAGER,
  'logistician': UserRole.LOGISTICIAN,
  'hr_admin': UserRole.HR_MANAGER,
  'operations': UserRole.OPERATIONS_MANAGER,
  'directeur_general': UserRole.DIRECTEUR_GENERAL,
  'medecin_chef_staff': UserRole.MEDECIN_CHEF_STAFF,
  'gestionnaire': UserRole.GESTIONNAIRE,
  'radio_chef': UserRole.RADIO_CHEF,
  'radio_tech': UserRole.RADIO_TECH,
  'caissiere': UserRole.CAISSIERE,
  'technique': UserRole.TECHNIQUE,
  'hygiene': UserRole.HYGIENE
};

// Mapping from UserRole enum to RBAC roles
export const ENUM_TO_RBAC_MAP: Record<UserRole, RBACRole> = {
  [UserRole.SUPER_ADMIN]: 'admin',
  [UserRole.HOSPITAL_ADMIN]: 'admin',
  [UserRole.MEDICAL_DIRECTOR]: 'medical_director',
  [UserRole.ADMINISTRATIVE_DIRECTOR]: 'administrative',
  [UserRole.HR_MANAGER]: 'hr_admin',
  [UserRole.FINANCE_MANAGER]: 'accountant',
  [UserRole.OPERATIONS_MANAGER]: 'operations',
  [UserRole.INFORMATION_SYSTEMS_COORDINATOR]: 'admin',
  [UserRole.DOCTOR]: 'doctor',
  [UserRole.DENTIST]: 'doctor',
  [UserRole.PHYSICAL_THERAPIST]: 'doctor',
  [UserRole.NURSE]: 'administrative',
  [UserRole.PHARMACIST]: 'pharmacist',
  [UserRole.ADMINISTRATIVE_STAFF]: 'administrative',
  [UserRole.ADMINISTRATIVE_OFFICER]: 'administrative',
  [UserRole.ADMINISTRATIVE_ASSISTANT]: 'receptionist',
  [UserRole.RECEPTIONIST]: 'receptionist',
  [UserRole.LAB_TECHNICIAN]: 'laboratory',
  [UserRole.LOGISTICIAN]: 'logistician',
  [UserRole.PATIENT]: 'receptionist',
  [UserRole.DIRECTEUR_GENERAL]: 'directeur_general',
  [UserRole.MEDECIN_CHEF_STAFF]: 'medecin_chef_staff',
  [UserRole.GESTIONNAIRE]: 'gestionnaire',
  [UserRole.RADIO_CHEF]: 'radio_chef',
  [UserRole.RADIO_TECH]: 'radio_tech',
  [UserRole.CAISSIERE]: 'caissiere',
  [UserRole.TECHNIQUE]: 'technique',
  [UserRole.HYGIENE]: 'hygiene'
};

// Mapping from database roles to UserRole enum
export const DB_TO_ENUM_MAP: Record<DatabaseRole, UserRole> = {
  'super_admin': UserRole.SUPER_ADMIN,
  'hospital_admin': UserRole.HOSPITAL_ADMIN,
  'medical_director': UserRole.MEDICAL_DIRECTOR,
  'administrative_director': UserRole.ADMINISTRATIVE_DIRECTOR,
  'hr_manager': UserRole.HR_MANAGER,
  'finance_manager': UserRole.FINANCE_MANAGER,
  'operations_manager': UserRole.OPERATIONS_MANAGER,
  'information_systems_coordinator': UserRole.INFORMATION_SYSTEMS_COORDINATOR,
  'doctor': UserRole.DOCTOR,
  'dentist': UserRole.DENTIST,
  'physical_therapist': UserRole.PHYSICAL_THERAPIST,
  'nurse': UserRole.NURSE,
  'pharmacist': UserRole.PHARMACIST,
  'administrative_staff': UserRole.ADMINISTRATIVE_STAFF,
  'administrative_officer': UserRole.ADMINISTRATIVE_OFFICER,
  'administrative_assistant': UserRole.ADMINISTRATIVE_ASSISTANT,
  'receptionist': UserRole.RECEPTIONIST,
  'lab_technician': UserRole.LAB_TECHNICIAN,
  'logistician': UserRole.LOGISTICIAN,
  'patient': UserRole.PATIENT,
  'directeur_general': UserRole.DIRECTEUR_GENERAL,
  'medecin_chef_staff': UserRole.MEDECIN_CHEF_STAFF,
  'gestionnaire': UserRole.GESTIONNAIRE,
  'radio_chef': UserRole.RADIO_CHEF,
  'radio_tech': UserRole.RADIO_TECH,
  'caissiere': UserRole.CAISSIERE,
  'technique': UserRole.TECHNIQUE,
  'hygiene': UserRole.HYGIENE
};

// Mapping from database roles to RBAC roles
export const DB_TO_RBAC_MAP: Record<DatabaseRole, RBACRole> = {
  'super_admin': 'admin',
  'hospital_admin': 'admin',
  'medical_director': 'medical_director',
  'administrative_director': 'administrative',
  'hr_manager': 'hr_admin',
  'finance_manager': 'accountant',
  'operations_manager': 'operations',
  'information_systems_coordinator': 'admin',
  'doctor': 'doctor',
  'dentist': 'doctor',
  'physical_therapist': 'doctor',
  'nurse': 'administrative',
  'pharmacist': 'pharmacist',
  'administrative_staff': 'administrative',
  'administrative_officer': 'administrative',
  'administrative_assistant': 'receptionist',
  'receptionist': 'receptionist',
  'lab_technician': 'laboratory',
  'logistician': 'logistician',
  'patient': 'receptionist',
  'directeur_general': 'directeur_general',
  'medecin_chef_staff': 'medecin_chef_staff',
  'gestionnaire': 'gestionnaire',
  'radio_chef': 'radio_chef',
  'radio_tech': 'radio_tech',
  'caissiere': 'caissiere',
  'technique': 'technique',
  'hygiene': 'hygiene'
};

// Conversion functions
export function mapRbacToEnum(rbacRole: RBACRole | string): UserRole {
  return RBAC_TO_ENUM_MAP[rbacRole as RBACRole] || UserRole.DOCTOR;
}

export function mapEnumToRbac(enumRole: UserRole): RBACRole {
  return ENUM_TO_RBAC_MAP[enumRole] || 'doctor';
}

export function mapDbToEnum(dbRole: DatabaseRole | string): UserRole {
  return DB_TO_ENUM_MAP[dbRole as DatabaseRole] || UserRole.DOCTOR;
}

export function mapDbToRbac(dbRole: DatabaseRole | string): RBACRole {
  return DB_TO_RBAC_MAP[dbRole as DatabaseRole] || 'doctor';
}

// Check if a role is an admin role
export function isAdminRole(role: UserRole | RBACRole | DatabaseRole | string): boolean {
  if (typeof role === 'string') {
    return role === 'admin' || role === 'super_admin' || role === 'hospital_admin' ||
           role === 'medical_director' || role === 'administrative_director' ||
           role === 'directeur_general' || role === 'medecin_chef_staff' ||
           role === UserRole.SUPER_ADMIN || role === UserRole.HOSPITAL_ADMIN ||
           role === UserRole.MEDICAL_DIRECTOR || role === UserRole.ADMINISTRATIVE_DIRECTOR ||
           role === UserRole.DIRECTEUR_GENERAL || role === UserRole.MEDECIN_CHEF_STAFF;
  }
  return role === UserRole.SUPER_ADMIN || role === UserRole.HOSPITAL_ADMIN ||
         role === UserRole.MEDICAL_DIRECTOR || role === UserRole.ADMINISTRATIVE_DIRECTOR ||
         role === UserRole.DIRECTEUR_GENERAL || role === UserRole.MEDECIN_CHEF_STAFF;
}

// Get all available RBAC roles for the simulator
export function getAllSimulatorRoles(): RBACRole[] {
  return ['admin', 'medical_director', 'doctor', 'administrative', 'hr_admin', 'accountant', 'operations', 'receptionist', 'laboratory', 'pharmacist', 'logistician', 'directeur_general', 'medecin_chef_staff', 'gestionnaire', 'radio_chef', 'radio_tech', 'caissiere', 'technique', 'hygiene'];
}

// Get role display name
export const ROLE_DISPLAY_NAMES: Record<RBACRole, string> = {
  'admin': 'Administrateur',
  'medical_director': 'Médecin Directeur',
  'doctor': 'Médecin',
  'administrative': 'Administratif/RH',
  'hr_admin': 'Responsable RH',
  'accountant': 'Comptable',
  'operations': 'Responsable Opérations',
  'receptionist': 'Réceptionniste',
  'laboratory': 'Laboratoire',
  'pharmacist': 'Pharmacien',
  'logistician': 'Logisticien',
  'directeur_general': 'Directeur Général',
  'medecin_chef_staff': 'Médecin Chef de Staff',
  'gestionnaire': 'Gestionnaire',
  'radio_chef': 'Chef Radiologie',
  'radio_tech': 'Technicien Radiologie',
  'caissiere': 'Caissière',
  'technique': 'Technicien',
  'hygiene': 'Agent d\'Hygiène'
};

export function getRoleDisplayName(role: RBACRole | string): string {
  return ROLE_DISPLAY_NAMES[role as RBACRole] || role;
}
