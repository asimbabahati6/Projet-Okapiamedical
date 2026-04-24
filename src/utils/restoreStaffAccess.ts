import { supabase } from '../lib/supabase';

export interface AccountRestorationResult {
  success: boolean;
  reactivatedCount: number;
  accountsRestored: {
    id: string;
    name: string;
    role: string;
  }[];
  errors: string[];
  timestamp: string;
}

export interface StaffAccessStatus {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  roleBreakdown: {
    roleName: string;
    active: number;
    inactive: number;
    total: number;
  }[];
}

const STAFF_ROLES = [
  'doctor',
  'nurse',
  'receptionist',
  'hospital_admin',
  'super_admin',
  'administrative_staff',
  'pharmacist',
  'logistician'
];

export async function getStaffAccessStatus(): Promise<StaffAccessStatus> {
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        is_active,
        role:roles(name, description, level)
      `)
      .in('role.name', STAFF_ROLES);

    if (error) throw error;

    const roleMap = new Map<string, { active: number; inactive: number; total: number }>();

    profiles?.forEach(profile => {
      const roleName = (profile.role as any)?.name || (profile.role as any)?.[0]?.name || 'unknown';
      if (!roleMap.has(roleName)) {
        roleMap.set(roleName, { active: 0, inactive: 0, total: 0 });
      }
      const stats = roleMap.get(roleName)!;
      stats.total++;
      if (profile.is_active) {
        stats.active++;
      } else {
        stats.inactive++;
      }
    });

    const roleBreakdown = Array.from(roleMap.entries()).map(([roleName, stats]) => ({
      roleName,
      ...stats
    }));

    const totalStaff = profiles?.length || 0;
    const activeStaff = profiles?.filter(p => p.is_active).length || 0;
    const inactiveStaff = totalStaff - activeStaff;

    return {
      totalStaff,
      activeStaff,
      inactiveStaff,
      roleBreakdown
    };
  } catch (error) {
    console.error('Error fetching staff access status:', error);
    return {
      totalStaff: 0,
      activeStaff: 0,
      inactiveStaff: 0,
      roleBreakdown: []
    };
  }
}

export async function getInactiveStaffAccounts() {
  try {
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name')
      .in('name', STAFF_ROLES);

    if (rolesError) throw rolesError;

    const roleIds = roles?.map(r => r.id) || [];

    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        is_active,
        role:roles(name, description)
      `)
      .in('role_id', roleIds)
      .eq('is_active', false);

    if (profilesError) throw profilesError;

    return profiles || [];
  } catch (error) {
    console.error('Error fetching inactive staff accounts:', error);
    return [];
  }
}

export async function restoreAllStaffAccess(
  restoredBy?: string
): Promise<AccountRestorationResult> {
  const result: AccountRestorationResult = {
    success: false,
    reactivatedCount: 0,
    accountsRestored: [],
    errors: [],
    timestamp: new Date().toISOString()
  };

  try {
    const inactiveAccounts = await getInactiveStaffAccounts();

    if (inactiveAccounts.length === 0) {
      result.success = true;
      result.errors.push('Aucun compte staff désactivé trouvé. Tous les employés ont déjà accès.');
      return result;
    }

    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id')
      .in('name', STAFF_ROLES);

    if (rolesError) {
      result.errors.push(`Erreur lors de la récupération des rôles: ${rolesError.message}`);
      return result;
    }

    const roleIds = roles?.map(r => r.id) || [];

    const { data: updatedProfiles, error: updateError } = await supabase
      .from('user_profiles')
      .update({ is_active: true })
      .in('role_id', roleIds)
      .eq('is_active', false)
      .select(`
        id,
        full_name,
        role:roles(name)
      `);

    if (updateError) {
      result.errors.push(`Erreur lors de la mise à jour: ${updateError.message}`);
      return result;
    }

    result.reactivatedCount = updatedProfiles?.length || 0;
    result.accountsRestored = updatedProfiles?.map(profile => ({
      id: profile.id,
      name: profile.full_name,
      role: (profile.role as any)?.name || (profile.role as any)?.[0]?.name || 'unknown'
    })) || [];

    result.success = true;

    console.log(`✅ ${result.reactivatedCount} comptes staff réactivés avec succès`);
    result.accountsRestored.forEach(account => {
      console.log(`  - ${account.name} (${account.role})`);
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    result.errors.push(errorMessage);
    console.error('Error restoring staff access:', error);
    return result;
  }
}

export async function verifySuperAdminAccess(): Promise<{
  hasSuperAdmin: boolean;
  superAdminCount: number;
  activeSuperAdmins: number;
  inactiveSuperAdmins: number;
}> {
  try {
    const { data: superAdminRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'super_admin')
      .maybeSingle();

    if (roleError || !superAdminRole) {
      return {
        hasSuperAdmin: false,
        superAdminCount: 0,
        activeSuperAdmins: 0,
        inactiveSuperAdmins: 0
      };
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, is_active')
      .eq('role_id', superAdminRole.id);

    if (profilesError) throw profilesError;

    const superAdminCount = profiles?.length || 0;
    const activeSuperAdmins = profiles?.filter(p => p.is_active).length || 0;
    const inactiveSuperAdmins = superAdminCount - activeSuperAdmins;

    return {
      hasSuperAdmin: superAdminCount > 0,
      superAdminCount,
      activeSuperAdmins,
      inactiveSuperAdmins
    };
  } catch (error) {
    console.error('Error verifying super admin access:', error);
    return {
      hasSuperAdmin: false,
      superAdminCount: 0,
      activeSuperAdmins: 0,
      inactiveSuperAdmins: 0
    };
  }
}

export function getAllowedStaffRoles(): string[] {
  return [...STAFF_ROLES];
}

export function isStaffRole(roleName: string): boolean {
  return STAFF_ROLES.includes(roleName);
}
