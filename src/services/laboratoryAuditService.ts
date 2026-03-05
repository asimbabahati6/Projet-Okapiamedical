import { supabase } from '../lib/supabase';

export interface LabAuditLog {
  id?: string;
  user_id: string;
  user_role: string;
  action_type: 'create' | 'update' | 'delete' | 'view' | 'export' | 'denied';
  order_id?: string;
  success: boolean;
  error_message?: string;
  timestamp?: string;
  ip_address?: string;
}

export interface AuditFilters {
  userId?: string;
  actionType?: string;
  startDate?: string;
  endDate?: string;
  successOnly?: boolean;
}

class LaboratoryAuditService {
  async logAction(entry: Omit<LabAuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('laboratory_audit_logs')
        .insert({
          ...entry,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log audit entry:', error);
      }
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  }

  async logPermissionDenied(
    userId: string,
    userRole: string,
    attemptedAction: string,
    orderId?: string
  ): Promise<void> {
    await this.logAction({
      user_id: userId,
      user_role: userRole,
      action_type: 'denied',
      order_id: orderId,
      success: false,
      error_message: `Permission denied for action: ${attemptedAction}`
    });
  }

  async logSuccessfulAction(
    userId: string,
    userRole: string,
    actionType: 'create' | 'update' | 'delete' | 'view' | 'export',
    orderId?: string
  ): Promise<void> {
    await this.logAction({
      user_id: userId,
      user_role: userRole,
      action_type: actionType,
      order_id: orderId,
      success: true
    });
  }

  async getAuditTrail(filters: AuditFilters = {}): Promise<LabAuditLog[]> {
    try {
      let query = supabase
        .from('laboratory_audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
      }

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      if (filters.successOnly) {
        query = query.eq('success', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      return [];
    }
  }

  async getDeniedAccessAttempts(limit: number = 50): Promise<LabAuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('laboratory_audit_logs')
        .select('*')
        .eq('action_type', 'denied')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching denied access attempts:', error);
      return [];
    }
  }

  async getUserActivitySummary(userId: string): Promise<{
    totalActions: number;
    deniedAttempts: number;
    recentActions: LabAuditLog[];
  }> {
    try {
      const allActions = await this.getAuditTrail({ userId });
      const deniedActions = allActions.filter(a => a.action_type === 'denied');

      return {
        totalActions: allActions.length,
        deniedAttempts: deniedActions.length,
        recentActions: allActions.slice(0, 10)
      };
    } catch (error) {
      console.error('Error fetching user activity summary:', error);
      return {
        totalActions: 0,
        deniedAttempts: 0,
        recentActions: []
      };
    }
  }
}

export const labAuditService = new LaboratoryAuditService();
