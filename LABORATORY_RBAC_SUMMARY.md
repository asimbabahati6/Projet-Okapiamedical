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

function mapDatabaseRoleToConfigRole(dbRole: string): ConfigUserRole {
  const roleMap: Record<string, ConfigUserRole> = {
    'super_admin':                    'admin',
    'hospital_admin':                 'admin',
    'medical_director':               'medical_director',
    'administrative_director':        'administrative',
    'directeur_general':              'directeur_general',
    'medecin_chef_staff':             'medecin_chef_staff',
    'doctor':                         'doctor',
    'dentist':                        'doctor',
    'physical_therapist':             'doctor',
    'nurse':                          'nurse',        // CORRIGÉ (était 'administrative')
    'pharmacist':                     'pharmacist',
    'lab_technician':                 'laboratory',
    'receptionist':                   'receptionist',
    'administrative_staff':           'administrative',
    'administrative_officer':         'administrative',
    'administrative_assistant':       'receptionist',
    'hr_manager':                     'hr_admin',
    'finance_manager':                'accountant',
    'operations_manager':             'operations',
    'logistician':                    'logistician',
    'gestionnaire':                   'gestionnaire',
    'radio_chef':                     'radio_chef',
    'radio_tech':                     'radio_tech',
    'caissiere':                      'caissiere',
    'technique':                      'technique',
    'hygiene':                        'hygiene',
    'patient':                        'patient',      // CORRIGÉ (était 'receptionist')
  };
  return roleMap[dbRole] || 'receptionist';
}

export function useRolePermissions(moduleType: ModuleType = 'general'): RolePermissions {
  const { userRole } = useRBAC();
  const configRole = useMemo(() => mapDatabaseRoleToConfigRole(userRole), [userRole]);
  const permissions = useMemo(() => {
    switch (moduleType) {
      case 'laboratory': return getLaboratoryPermissions(configRole);
      case 'pharmacy':   return getPharmacyPermissions(configRole);
      default:           return getGeneralPermissions(configRole);
    }
  }, [configRole, moduleType]);
  return permissions;
}

function getLaboratoryPermissions(role: ConfigUserRole): RolePermissions {
  const base = { role, canCreate: false, canEdit: false, canDelete: false, canExport: false, canViewDetails: false, isReadOnly: true };
  if (role === 'admin' || role === 'medical_director' || role === 'directeur_general' || role === 'medecin_chef_staff')
    return { ...base, canCreate: true, canEdit: true, canDelete: true, canExport: true, canViewDetails: true, isReadOnly: false };
  if (role === 'laboratory')
    return { ...base, canCreate: true, canEdit: true, canDelete: false, canExport: true, canViewDetails: true, isReadOnly: false };
  if (role === 'doctor')
    return { ...base, canCreate: true, canEdit: false, canDelete: false, canExport: true, canViewDetails: true, isReadOnly: true };
  if (role === 'nurse')
    return { ...base, canCreate: false, canEdit: false, canDelete: false, canExport: false, canViewDetails: true, isReadOnly: true };
  return base;
}

function getPharmacyPermissions(role: ConfigUserRole): RolePermissions {
  const base = { role, canCreate: false, canEdit: false, canDelete: false, canExport: false, canViewDetails: false, isReadOnly: true };
  if (role === 'admin' || role === 'medical_director' || role === 'directeur_general')
    return { ...base, canCreate: true, canEdit: true, canDelete: true, canExport: true, canViewDetails: true, isReadOnly: false };
  if (role === 'pharmacist')
    return { ...base, canCreate: true, canEdit: true, canDelete: true, canExport: true, canViewDetails: true, isReadOnly: false };
  if (role === 'doctor' || role === 'nurse')
    return { ...base, canCreate: false, canEdit: false, canDelete: false, canExport: true, canViewDetails: true, isReadOnly: true };
  return base;
}

function getGeneralPermissions(role: ConfigUserRole): RolePermissions {
  const base = { role, canCreate: false, canEdit: false, canDelete: false, canExport: false, canViewDetails: false, isReadOnly: true };
  if (role === 'admin' || role === 'medical_director' || role === 'directeur_general')
    return { ...base, canCreate: true, canEdit: true, canDelete: true, canExport: true, canViewDetails: true, isReadOnly: false };
  if (role === 'doctor' || role === 'administrative' || role === 'accountant' || role === 'medecin_chef_staff')
    return { ...base, canCreate: true, canEdit: true, canDelete: false, canExport: true, canViewDetails: true, isReadOnly: false };
  if (role === 'nurse')
    return { ...base, canCreate: true, canEdit: true, canDelete: false, canExport: false, canViewDetails: true, isReadOnly: false };
  if (role === 'receptionist')
    return { ...base, canCreate: true, canEdit: true, canDelete: false, canExport: false, canViewDetails: true, isReadOnly: false };
  return base;
}