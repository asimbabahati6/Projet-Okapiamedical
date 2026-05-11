import { useMemo } from 'react';
import { useRBAC } from '../contexts/RBACContext';

/**
 * Check a single permission code against the current user's resolved permissions.
 * Returns true if the user (or simulated role) has the specified permission.
 */
export function usePermission(permissionCode: string): boolean {
  const { hasPermission } = useRBAC();
  return useMemo(() => hasPermission(permissionCode), [hasPermission, permissionCode]);
}

/**
 * Check multiple permission codes at once.
 * Returns a record mapping each code to its boolean result.
 */
export function usePermissions(permissionCodes: string[]): Record<string, boolean> {
  const { hasPermission } = useRBAC();
  return useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const code of permissionCodes) {
      result[code] = hasPermission(code);
    }
    return result;
  }, [hasPermission, permissionCodes]);
}

/**
 * Check if the user has ALL of the specified permissions.
 */
export function useRequireAllPermissions(permissionCodes: string[]): boolean {
  const { hasPermission } = useRBAC();
  return useMemo(
    () => permissionCodes.every(code => hasPermission(code)),
    [hasPermission, permissionCodes]
  );
}

/**
 * Check if the user has ANY of the specified permissions.
 */
export function useRequireAnyPermission(permissionCodes: string[]): boolean {
  const { hasPermission } = useRBAC();
  return useMemo(
    () => permissionCodes.some(code => hasPermission(code)),
    [hasPermission, permissionCodes]
  );
}
