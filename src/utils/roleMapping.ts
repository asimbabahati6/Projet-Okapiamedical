import type { UserRole } from '../config/rbac';
import { UserRole as UserRoleEnum } from '../core/types/enums';
import { ROLE_LABELS } from '../config/rbac';

export type RBACRole = UserRole;

export const ROLE_DISPLAY_NAMES: Record<string, string> = ROLE_LABELS as Record<string, string>;

export function getAllSimulatorRoles(): UserRole[] {
  return [
    'admin', 'medical_director', 'doctor', 'administrative', 'receptionist',
    'laboratory', 'pharmacist', 'directeur_general', 'medecin_chef_staff',
    'radio_chef', 'radio_tech', 'logistician', 'hr_admin', 'accountant',
    'caissiere', 'nurse', 'lab_technician', 'dentist', 'physical_therapist',
  ];
}

export function getRoleDisplayName(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function isAdminRole(role: UserRoleEnum | string): boolean {
  return role === UserRoleEnum.SUPER_ADMIN || role === UserRoleEnum.HOSPITAL_ADMIN
    || role === 'admin' || role === 'super_admin' || role === 'hospital_admin';
}

export function mapRbacToEnum(role: UserRole | string | undefined): UserRoleEnum | undefined {
  if (!role) return undefined;
  const entry = Object.values(UserRoleEnum).find(v => v === role);
  return entry as UserRoleEnum | undefined;
}

export function mapDbToEnum(dbRoleName: string | undefined): UserRoleEnum | undefined {
  if (!dbRoleName) return undefined;
  const entry = Object.values(UserRoleEnum).find(v => v === dbRoleName);
  return entry as UserRoleEnum | undefined;
}
