import type { UserRole } from '../config/rbac';

export function getAllSimulatorRoles(): UserRole[] {
  return ['admin', 'medical_director', 'doctor', 'administrative', 'receptionist', 'laboratory', 'pharmacist'];
}

export function getRoleDisplayName(role: UserRole): string {
  const map: Record<string, string> = {
    admin: 'Admin',
    medical_director: 'Dir. Médical',
    doctor: 'Médecin',
    administrative: 'Administratif',
    receptionist: 'Réceptionniste',
    laboratory: 'Laborantin',
    pharmacist: 'Pharmacien',
  };
  return map[role] ?? role;
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}
