import { supabase } from '@/lib/supabase';

export interface SimulationSession {
  id: string;
  user_id: string;
  actual_role: string;
  simulated_role: string;
  started_at: string;
  ended_at?: string;
  reason?: string;
  auto_end_minutes?: number;
  ended_by?: 'user' | 'admin' | 'timeout' | 'system';
  ip_address?: string;
  user_agent?: string;
}

export interface SimulationAction {
  id: string;
  session_id: string;
  action_type: string;
  resource_type?: string;
  resource_id?: string;
  action_details?: Record<string, any>;
  timestamp: string;
}

export interface SimulationSettings {
  id: string;
  is_globally_enabled: boolean;
  max_session_duration_minutes: number;
  require_reason: boolean;
  allowed_roles: string[];
  warning_minutes_before_end: number;
}

export interface SimulationStatistics {
  total_sessions: number;
  active_sessions: number;
  unique_users: number;
  most_simulated_role: string;
  avg_session_duration_minutes: number;
  total_actions: number;
}

export interface ActiveSessionInfo {
  id: string;
  actual_role: string;
  simulated_role: string;
  started_at: string;
  auto_end_minutes?: number;
  minutes_elapsed: number;
  minutes_remaining?: number;
}

class SimulationAuditService {
  async startSession(params: {
    userId: string;
    actualRole: string;
    simulatedRole: string;
    reason?: string;
    autoEndMinutes?: number;
  }): Promise<string> {
    try {
      const sessionData = {
        user_id: params.userId,
        actual_role: params.actualRole,
        simulated_role: params.simulatedRole,
        reason: params.reason,
        auto_end_minutes: params.autoEndMinutes,
        started_at: new Date().toISOString(),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      };

      const { data, error } = await supabase
        .from('simulation_sessions')
        .insert(sessionData)
        .select('id')
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error starting simulation session:', error);
      throw error;
    }
  }

  async endSession(
    sessionId: string,
    endedBy: 'user' | 'admin' | 'timeout' | 'system' = 'user'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('simulation_sessions')
        .update({
          ended_at: new Date().toISOString(),
          ended_by: endedBy
        })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error ending simulation session:', error);
      throw error;
    }
  }

  async logAction(params: {
    sessionId: string;
    actionType: string;
    resourceType?: string;
    resourceId?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    try {
      const actionData = {
        session_id: params.sessionId,
        action_type: params.actionType,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        action_details: params.details || {},
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('simulation_actions')
        .insert(actionData);

      if (error) throw error;
    } catch (error) {
      console.error('Error logging simulation action:', error);
    }
  }

  async getUserHistory(userId: string, limit: number = 50): Promise<SimulationSession[]> {
    try {
      const { data, error } = await supabase
        .from('simulation_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching user simulation history:', error);
      return [];
    }
  }

  async getActiveSessions(): Promise<SimulationSession[]> {
    try {
      const { data, error } = await supabase
        .from('simulation_sessions')
        .select('*')
        .is('ended_at', null)
        .order('started_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching active simulation sessions:', error);
      return [];
    }
  }

  async getActiveSessionForUser(userId: string): Promise<ActiveSessionInfo | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_active_simulation_session', { p_user_id: userId })
        .maybeSingle();

      if (error) {
        console.error('Error in get_active_simulation_session RPC:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching active simulation session:', error);
      return null;
    }
  }

  async forceEndSession(sessionId: string, adminId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('simulation_sessions')
        .update({
          ended_at: new Date().toISOString(),
          ended_by: 'admin'
        })
        .eq('id', sessionId);

      if (error) throw error;

      await this.logAction({
        sessionId,
        actionType: 'force_end',
        details: { admin_id: adminId }
      });
    } catch (error) {
      console.error('Error force-ending simulation session:', error);
      throw error;
    }
  }

  async getStatistics(
    startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: Date = new Date()
  ): Promise<SimulationStatistics> {
    try {
      const { data, error } = await supabase
        .rpc('get_simulation_statistics', {
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        })
        .single();

      if (error) throw error;

      return data || {
        total_sessions: 0,
        active_sessions: 0,
        unique_users: 0,
        most_simulated_role: '',
        avg_session_duration_minutes: 0,
        total_actions: 0
      };
    } catch (error) {
      console.error('Error fetching simulation statistics:', error);
      return {
        total_sessions: 0,
        active_sessions: 0,
        unique_users: 0,
        most_simulated_role: '',
        avg_session_duration_minutes: 0,
        total_actions: 0
      };
    }
  }

  async getSettings(): Promise<SimulationSettings | null> {
    try {
      const { data, error } = await supabase
        .from('simulation_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching simulation settings:', error);
      return null;
    }
  }

  async updateSettings(settings: Partial<SimulationSettings>): Promise<void> {
    try {
      const { error } = await supabase
        .from('simulation_settings')
        .update(settings)
        .eq('id', settings.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating simulation settings:', error);
      throw error;
    }
  }

  async getSessionActions(sessionId: string): Promise<SimulationAction[]> {
    try {
      const { data, error } = await supabase
        .from('simulation_actions')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching session actions:', error);
      return [];
    }
  }

  async endExpiredSessions(): Promise<void> {
    try {
      const { error } = await supabase.rpc('end_expired_simulation_sessions');

      if (error) throw error;
    } catch (error) {
      console.error('Error ending expired simulation sessions:', error);
    }
  }

  private async getClientIP(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return undefined;
    }
  }

  canUserSimulate(userRole: string, settings: SimulationSettings | null): boolean {
    if (!settings || !settings.is_globally_enabled) {
      return false;
    }

    return settings.allowed_roles.includes(userRole);
  }

  shouldWarnAboutExpiry(session: ActiveSessionInfo | null): boolean {
    if (!session || !session.auto_end_minutes || !session.minutes_remaining) {
      return false;
    }

    return session.minutes_remaining <= 5 && session.minutes_remaining > 0;
  }

  isSessionExpired(session: ActiveSessionInfo | null): boolean {
    if (!session || !session.auto_end_minutes || !session.minutes_remaining) {
      return false;
    }

    return session.minutes_remaining <= 0;
  }
}

export const simulationAuditService = new SimulationAuditService();
