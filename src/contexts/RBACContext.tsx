import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserRole } from '../config/rbac';
import { hasAccess, DASHBOARD_ALLOWED_ROLES } from '../config/rbac';
import { useAuth } from './AuthContext';
import type { SimulationSettings, ActiveSessionInfo } from '../services/simulationAuditService';

export type SimulationModeState = 'INACTIVE' | 'ACTIVE' | 'LOCKED';

export interface RBACContextType {
  // Legacy API (used by simple components)
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  canAccessDashboard: boolean;
  hasPermission: (permissionOrRoles: string | string[]) => boolean;

  // Simulation API
  userRole: UserRole;
  actualRole: UserRole;
  isSimulationMode: boolean;
  loading: boolean;
  simulationModeState: SimulationModeState;
  simulationSettings: SimulationSettings | null;
  canUseSimulation: boolean;
  activeSession: ActiveSessionInfo | null;
  currentSessionId: string | null;
  startSimulation: (targetRole: UserRole, reason?: string, durationMinutes?: number) => Promise<void>;
  endSimulation: (endedBy?: 'user' | 'admin' | 'timeout' | 'system') => Promise<void>;
}

const DEFAULT_ROLE: UserRole = 'admin';

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export function RBACProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [simulatedRole, setSimulatedRole] = useState<UserRole | null>(null);
  const [simulationModeState, setSimulationModeState] = useState<SimulationModeState>('INACTIVE');
  const [activeSession, setActiveSession] = useState<ActiveSessionInfo | null>(null);
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings | null>(null);
  const [loading, setLoading] = useState(false);

  // Derive actual role from auth profile
  const actualRole: UserRole = (() => {
    if (!profile?.role) return DEFAULT_ROLE;
    const roleName = typeof profile.role === 'object'
      ? (profile.role as any)?.name
      : profile.role;
    return (roleName as UserRole) || DEFAULT_ROLE;
  })();

  const isSimulationMode = simulatedRole !== null;
  const userRole: UserRole = isSimulationMode ? simulatedRole! : actualRole;

  // Legacy compat
  const [currentRole, setCurrentRole] = useState<UserRole>(DEFAULT_ROLE);
  useEffect(() => {
    setCurrentRole(userRole);
  }, [userRole]);

  const canAccessDashboard = hasAccess(userRole, DASHBOARD_ALLOWED_ROLES);

  const canUseSimulation = actualRole === 'admin' || actualRole === 'super_admin'
    || actualRole === 'hospital_admin' || actualRole === 'directeur_general';

  function hasPermission(permissionOrRoles: string | string[]): boolean {
    const items = Array.isArray(permissionOrRoles) ? permissionOrRoles : [permissionOrRoles];
    // Treat items as role names (legacy usage)
    return hasAccess(userRole, items as UserRole[]);
  }

  async function startSimulation(targetRole: UserRole, _reason?: string, _durationMinutes?: number) {
    setLoading(true);
    try {
      setSimulatedRole(targetRole);
      setSimulationModeState('ACTIVE');
      setActiveSession({
        id: `sim-${Date.now()}`,
        actual_role: actualRole,
        simulated_role: targetRole,
        started_at: new Date().toISOString(),
        auto_end_minutes: _durationMinutes,
        minutes_elapsed: 0,
        minutes_remaining: _durationMinutes,
      });
    } finally {
      setLoading(false);
    }
  }

  async function endSimulation(_endedBy?: 'user' | 'admin' | 'timeout' | 'system') {
    setSimulatedRole(null);
    setSimulationModeState('INACTIVE');
    setActiveSession(null);
  }

  return (
    <RBACContext.Provider value={{
      currentRole,
      setCurrentRole,
      canAccessDashboard,
      hasPermission,
      userRole,
      actualRole,
      isSimulationMode,
      loading,
      simulationModeState,
      simulationSettings,
      canUseSimulation,
      activeSession,
      currentSessionId: activeSession?.id ?? null,
      startSimulation,
      endSimulation,
    }}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const ctx = useContext(RBACContext);
  if (!ctx) throw new Error('useRBAC must be used within RBACProvider');
  return ctx;
}
