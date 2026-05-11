import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { UserRole, ROLE_PERMISSIONS } from '../config/rbac';
import { mapDbToRbac, isAdminRole, type RBACRole } from '../utils/roleMapping';
import { simulationAuditService, type SimulationSettings, type ActiveSessionInfo } from '../services/simulationAuditService';

export type SimulationModeState = 'DISABLED' | 'ACTIVE' | 'LOCKED';

interface RBACContextType {
  userRole: UserRole;
  actualRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isSimulationMode: boolean;
  simulationModeState: SimulationModeState;
  setSimulationMode: (mode: boolean) => void;
  hasPermission: (permission: string) => boolean;
  getEffectiveRole: () => UserRole;
  resetSimulation: () => void;
  loading: boolean;
  canUseSimulation: boolean;
  simulationSettings: SimulationSettings | null;
  activeSession: ActiveSessionInfo | null;
  startSimulation: (targetRole: UserRole, reason?: string, autoEndMinutes?: number) => Promise<void>;
  endSimulation: (reason?: string) => Promise<void>;
  currentSessionId: string | null;
  dbPermissions: string[];
  refreshPermissions: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

const SIMULATION_MODE_KEY = 'rbac_simulation_mode';
const SIMULATED_ROLE_KEY = 'rbac_simulated_role';
const SESSION_ID_KEY = 'rbac_session_id';

export function RBACProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [actualRole, setActualRole] = useState<UserRole>('doctor');
  const [userRole, setUserRoleState] = useState<UserRole>('doctor');
  const [isSimulationMode, setSimulationModeState] = useState(false);
  const [simulationModeState, setSimulationModeStateValue] = useState<SimulationModeState>('DISABLED');
  const [loading, setLoading] = useState(true);
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSessionInfo | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [canUseSimulation, setCanUseSimulation] = useState(false);
  const [dbPermissions, setDbPermissions] = useState<string[]>([]);

  useEffect(() => {
    loadSimulationSettings();
  }, []);

  useEffect(() => {
    const savedSimulationMode = sessionStorage.getItem(SIMULATION_MODE_KEY);
    const savedSimulatedRole = sessionStorage.getItem(SIMULATED_ROLE_KEY);
    const savedSessionId = sessionStorage.getItem(SESSION_ID_KEY);

    if (savedSimulationMode === 'true' && savedSimulatedRole && savedSessionId) {
      setSimulationModeState(true);
      setUserRoleState(savedSimulatedRole as UserRole);
      setCurrentSessionId(savedSessionId);
      setSimulationModeStateValue('ACTIVE');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchDbPermissions();
      loadActiveSession();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (actualRole && simulationSettings) {
      const canSimulate = simulationAuditService.canUserSimulate(actualRole, simulationSettings);
      setCanUseSimulation(canSimulate);
    }
  }, [actualRole, simulationSettings]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isSimulationMode && currentSessionId) {
        loadActiveSession();
        simulationAuditService.endExpiredSessions();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isSimulationMode, currentSessionId]);

  async function loadSimulationSettings() {
    try {
      const settings = await simulationAuditService.getSettings();
      setSimulationSettings(settings);

      if (settings && !settings.is_globally_enabled) {
        setSimulationModeStateValue('LOCKED');
      }
    } catch (error) {
      console.error('Error loading simulation settings:', error);
    }
  }

  async function loadActiveSession() {
    if (!user) return;

    try {
      const session = await simulationAuditService.getActiveSessionForUser(user.id);
      setActiveSession(session);

      if (session && simulationAuditService.isSessionExpired(session)) {
        await endSimulation('timeout');
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    }
  }

  async function fetchUserRole() {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role_id, roles(name)')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile?.roles?.name) {
        const rbacRole = mapDbToRbac(profile.roles.name);
        setActualRole(rbacRole as UserRole);

        if (!isSimulationMode) {
          setUserRoleState(rbacRole as UserRole);
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDbPermissions() {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('get_user_permissions');
      if (error) throw error;
      setDbPermissions(data || []);
    } catch (error) {
      console.error('Error fetching DB permissions:', error);
      setDbPermissions([]);
    }
  }

  const refreshPermissions = useCallback(async () => {
    await fetchDbPermissions();
  }, [user]);

  function setUserRole(role: UserRole) {
    setUserRoleState(role);
    if (isSimulationMode) {
      sessionStorage.setItem(SIMULATED_ROLE_KEY, role);
    }
  }

  async function startSimulation(targetRole: UserRole, reason?: string, autoEndMinutes?: number): Promise<void> {
    if (!user || !canUseSimulation) {
      throw new Error('User cannot start simulation');
    }

    if (simulationModeState === 'LOCKED') {
      throw new Error('Simulation mode is currently locked by administrator');
    }

    try {
      const sessionId = await simulationAuditService.startSession({
        userId: user.id,
        actualRole,
        simulatedRole: targetRole,
        reason,
        autoEndMinutes
      });

      setCurrentSessionId(sessionId);
      setUserRoleState(targetRole);
      setSimulationModeState(true);
      setSimulationModeStateValue('ACTIVE');

      sessionStorage.setItem(SIMULATION_MODE_KEY, 'true');
      sessionStorage.setItem(SIMULATED_ROLE_KEY, targetRole);
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);

      await loadActiveSession();

      await simulationAuditService.logAction({
        sessionId,
        actionType: 'simulation_started',
        details: { target_role: targetRole, reason }
      });
    } catch (error) {
      console.error('Error starting simulation:', error);
      throw error;
    }
  }

  async function endSimulation(reason: 'user' | 'admin' | 'timeout' | 'system' = 'user'): Promise<void> {
    if (!currentSessionId) return;

    try {
      await simulationAuditService.endSession(currentSessionId, reason);

      await simulationAuditService.logAction({
        sessionId: currentSessionId,
        actionType: 'simulation_ended',
        details: { ended_by: reason }
      });

      resetSimulation();
    } catch (error) {
      console.error('Error ending simulation:', error);
      throw error;
    }
  }

  function setSimulationMode(mode: boolean) {
    if (mode) {
      console.warn('Use startSimulation() instead of setSimulationMode(true)');
      return;
    }

    endSimulation('user');
  }

  function getEffectiveRole(): UserRole {
    return isSimulationMode ? userRole : actualRole;
  }

  function resetSimulation() {
    setSimulationModeState(false);
    setSimulationModeStateValue('DISABLED');
    setUserRoleState(actualRole);
    setCurrentSessionId(null);
    setActiveSession(null);
    sessionStorage.removeItem(SIMULATION_MODE_KEY);
    sessionStorage.removeItem(SIMULATED_ROLE_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);
  }

  function hasPermission(permission: string): boolean {
    const effectiveRole = getEffectiveRole();

    // Admin roles always have full access
    if (isAdminRole(effectiveRole)) return true;

    // Check DB-backed permissions first (if loaded)
    if (dbPermissions.length > 0) {
      if (dbPermissions.includes('*')) return true;
      if (dbPermissions.includes(permission)) return true;
    }

    // Fallback to static ROLE_PERMISSIONS config
    const staticPerms = ROLE_PERMISSIONS[effectiveRole as RBACRole];
    return staticPerms?.includes('*') || staticPerms?.includes(permission) || false;
  }

  return (
    <RBACContext.Provider
      value={{
        userRole,
        actualRole,
        setUserRole,
        isSimulationMode,
        simulationModeState,
        setSimulationMode,
        hasPermission,
        getEffectiveRole,
        resetSimulation,
        loading,
        canUseSimulation,
        simulationSettings,
        activeSession,
        startSimulation,
        endSimulation,
        currentSessionId,
        dbPermissions,
        refreshPermissions
      }}
    >
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within RBACProvider');
  }
  return context;
}
