import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRBAC } from '../contexts/RBACContext';
import { MENU_STRUCTURE, ADMIN_ROLES } from '../config/rbac';
import type { RBACRole } from '../utils/roleMapping';

interface RouteGuardProps {
  children: ReactNode;
}

function normalizeStaffPath(path: string): string {
  return path.replace(/^\/tableau-de-bord/, '/staff');
}

function findAllowedRolesForPath(rawPath: string): RBACRole[] | null {
  const path = normalizeStaffPath(rawPath);

  for (const item of MENU_STRUCTURE) {
    if (item.path === path) return item.roles;
    if (item.children) {
      for (const child of item.children) {
        if (child.path === path) return child.roles;
      }
    }
  }

  // For sub-routes (e.g. /staff/radiology/queue), check parent path
  for (const item of MENU_STRUCTURE) {
    if (item.path && path.startsWith(item.path + '/')) return item.roles;
    if (item.children) {
      for (const child of item.children) {
        if (child.path && path.startsWith(child.path + '/')) return child.roles;
      }
    }
  }

  return null;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { userRole, loading } = useRBAC();
  const location = useLocation();

  if (loading) return null;

  const currentPath = location.pathname;
  const allowedRoles = findAllowedRolesForPath(currentPath);

  if (!allowedRoles) return <>{children}</>;

  const rbacRole = userRole as unknown as RBACRole;
  const isUserAdmin = ADMIN_ROLES.includes(rbacRole);

  if (isUserAdmin || allowedRoles.includes(rbacRole)) {
    return <>{children}</>;
  }

  return <Navigate to="/access-denied" replace />;
}
