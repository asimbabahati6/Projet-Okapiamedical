import { createContext, useContext, useState, type ReactNode } from 'react';
import type { UserRole } from '../config/rbac';
import { hasAccess, DASHBOARD_ALLOWED_ROLES } from '../config/rbac';

interface RBACContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  canAccessDashboard: boolean;
  hasPermission: (roles: UserRole[]) => boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export function RBACProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');

  const canAccessDashboard = hasAccess(currentRole, DASHBOARD_ALLOWED_ROLES);

  function hasPermission(roles: UserRole[]): boolean {
    return hasAccess(currentRole, roles);
  }

  return (
    <RBACContext.Provider value={{ currentRole, setCurrentRole, canAccessDashboard, hasPermission }}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const ctx = useContext(RBACContext);
  if (!ctx) throw new Error('useRBAC must be used within RBACProvider');
  return ctx;
}
