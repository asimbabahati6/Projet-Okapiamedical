import { useMemo } from 'react';
import { useRBAC } from '../contexts/RBACContext';
import { UserRole as ConfigUserRole } from '../config/rbac';

export interface RolePermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canViewDetails: boolean;
  isReadOnly: boolean;
  role: ConfigUserRole;
}

export type ModuleType = 'laboratory' | 'pharmacy' | 'general';

// Mapping between database roles and config roles
function mapDatabaseRoleToConfigRole(dbRole: string): ConfigUserRole {
  const roleMap: Record<string, ConfigUserRole> = {
    'super_admin': 'admin',
    'hospital_admin': 'admin',
    'medical_director': 'medical_director',
    'doctor': 'doctor',
    'pharmacist': 'pharmacist',
    'lab_technician': 'laboratory',
    'receptionist': 'receptionist',
    'nurse': 'administrative',
    'patient': 'receptionist' // fallback
  };

  return roleMap[dbRole] || 'receptionist';
}

export function useRolePermissions(moduleType: ModuleType = 'general'): RolePermissions {
  const { userRole } = useRBAC();

  const configRole = useMemo(() => mapDatabaseRoleToConfigRole(userRole), [userRole]);

  const permissions = useMemo(() => {
    switch (moduleType) {
      case 'laboratory':
        return getLaboratoryPermissions(configRole);

      case 'pharmacy':
        return getPharmacyPermissions(configRole);

      case 'general':
      default:
        return getGeneralPermissions(configRole);
    }
  }, [configRole, moduleType]);

  return permissions;
}

function getLaboratoryPermissions(role: ConfigUserRole): RolePermissions {
  const basePermissions = {
    role,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canViewDetails: false,
    isReadOnly: true,
  };

  // Full CRUD access: Admin, Medical Director, Laboratory
  if (role === 'admin' || role === 'medical_director' || role === 'laboratory') {
    return {
      ...basePermissions,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: true,
      canViewDetails: true,
      isReadOnly: false,
    };
  }

  // Doctors: Can create (prescribe) and view, but cannot edit/delete results
  if (role === 'doctor') {
    return {
      ...basePermissions,
      canCreate: true,        // Can prescribe lab orders
      canEdit: false,         // Cannot modify results
      canDelete: false,       // Cannot delete
      canExport: true,        // Can export for consultation
      canViewDetails: true,   // Can view details
      isReadOnly: true,       // Read-only for existing results
    };
  }

  // All other roles: No access (menu item hidden)
  return basePermissions;
}

function getPharmacyPermissions(role: ConfigUserRole): RolePermissions {
  const basePermissions = {
    role,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canViewDetails: false,
    isReadOnly: true,
  };

  switch (role) {
    case 'admin':
      return {
        ...basePermissions,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        canViewDetails: true,
        isReadOnly: false,
      };

    case 'pharmacist':
      return {
        ...basePermissions,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        canViewDetails: true,
        isReadOnly: false,
      };

    case 'doctor':
      return {
        ...basePermissions,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: true,
        canViewDetails: true,
        isReadOnly: true,
      };

    default:
      return basePermissions;
  }
}

function getGeneralPermissions(role: ConfigUserRole): RolePermissions {
  const basePermissions = {
    role,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canViewDetails: false,
    isReadOnly: true,
  };

  switch (role) {
    case 'admin':
      return {
        ...basePermissions,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        canViewDetails: true,
        isReadOnly: false,
      };

    case 'doctor':
    case 'administrative':
    case 'accountant':
      return {
        ...basePermissions,
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: true,
        canViewDetails: true,
        isReadOnly: false,
      };

    case 'receptionist':
      return {
        ...basePermissions,
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canExport: false,
        canViewDetails: true,
        isReadOnly: false,
      };

    default:
      return basePermissions;
  }
}
