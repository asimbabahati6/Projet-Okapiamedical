import { supabase } from '../lib/supabase';

export interface PatientNotification {
  id: string;
  patientId: string;
  registrationId?: string;
  appointmentId?: string;
  departmentId: string;
  departmentName?: string;
  assignedDoctorId?: string;
  notificationType: 'new_patient' | 'urgent_patient' | 'transfer' | 'reassignment';
  priority: 'low' | 'normal' | 'high' | 'emergency';
  sentToStaffIds: string[];
  sentAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  isRead: boolean;
  messageTitle: string;
  messageBody: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  today: number;
}

class PatientDepartmentNotificationService {
  async getUserNotifications(userId: string, limit = 50): Promise<PatientNotification[]> {
    const { data, error } = await supabase
      .from('patient_assignment_notifications')
      .select(`
        *,
        departments (name)
      `)
      .contains('sent_to_staff_ids', [userId])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }

    return (data || []).map((n) => this.mapNotification(n));
  }

  async getUnreadNotifications(userId: string): Promise<PatientNotification[]> {
    const { data, error } = await supabase
      .from('patient_assignment_notifications')
      .select(`
        *,
        departments (name)
      `)
      .contains('sent_to_staff_ids', [userId])
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }

    return (data || []).map((n) => this.mapNotification(n));
  }

  async getNotificationStats(userId: string): Promise<NotificationStats> {
    const { data, error } = await supabase
      .from('patient_assignment_notifications')
      .select('*')
      .contains('sent_to_staff_ids', [userId]);

    if (error) {
      console.error('Error fetching notification stats:', error);
      return { total: 0, unread: 0, urgent: 0, today: 0 };
    }

    const notifications = data || [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return {
      total: notifications.length,
      unread: notifications.filter((n) => !n.is_read).length,
      urgent: notifications.filter((n) => n.priority === 'high' || n.priority === 'emergency').length,
      today: notifications.filter((n) => new Date(n.created_at) >= todayStart).length,
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('mark_notification_read', {
      notification_id: notificationId,
    });

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  }

  async markMultipleAsRead(notificationIds: string[]): Promise<boolean> {
    const { error } = await supabase
      .from('patient_assignment_notifications')
      .update({ is_read: true, acknowledged_at: new Date().toISOString() })
      .in('id', notificationIds);

    if (error) {
      console.error('Error marking multiple notifications as read:', error);
      return false;
    }

    return true;
  }

  async getDepartmentNotifications(
    departmentId: string,
    limit = 100
  ): Promise<PatientNotification[]> {
    const { data, error } = await supabase
      .from('patient_assignment_notifications')
      .select(`
        *,
        departments (name)
      `)
      .eq('department_id', departmentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching department notifications:', error);
      return [];
    }

    return (data || []).map((n) => this.mapNotification(n));
  }

  async createManualNotification(data: {
    patientId: string;
    departmentId: string;
    assignedDoctorId?: string;
    notificationType?: 'new_patient' | 'urgent_patient' | 'transfer' | 'reassignment';
    priority?: 'low' | 'normal' | 'high' | 'emergency';
    messageTitle: string;
    messageBody: string;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    // Get staff to notify for this department
    const { data: settings } = await supabase
      .from('department_notification_settings')
      .select('notify_roles')
      .eq('department_id', data.departmentId)
      .single();

    const notifyRoles = settings?.notify_roles || ['doctor', 'receptionist'];

    const { data: staff } = await supabase
      .from('user_profiles')
      .select('id, roles(name)')
      .eq('department_id', data.departmentId)
      .eq('is_active', true)
      .in('roles.name', notifyRoles);

    const staffIds = (staff || []).map((s) => s.id);

    const { error } = await supabase
      .from('patient_assignment_notifications')
      .insert({
        patient_id: data.patientId,
        department_id: data.departmentId,
        assigned_doctor_id: data.assignedDoctorId,
        notification_type: data.notificationType || 'new_patient',
        priority: data.priority || 'normal',
        sent_to_staff_ids: staffIds,
        message_title: data.messageTitle,
        message_body: data.messageBody,
        metadata: data.metadata || {},
      });

    if (error) {
      console.error('Error creating manual notification:', error);
      return false;
    }

    return true;
  }

  async getNotificationById(notificationId: string): Promise<PatientNotification | null> {
    const { data, error } = await supabase
      .from('patient_assignment_notifications')
      .select(`
        *,
        departments (name),
        patients (first_name, last_name, patient_number)
      `)
      .eq('id', notificationId)
      .single();

    if (error) {
      console.error('Error fetching notification by id:', error);
      return null;
    }

    return this.mapNotification(data);
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('patient_assignment_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    return true;
  }

  async getEscalatedNotifications(departmentId?: string): Promise<PatientNotification[]> {
    let query = supabase
      .from('patient_assignment_notifications')
      .select(`
        *,
        departments (name)
      `)
      .is('acknowledged_at', null)
      .in('priority', ['high', 'emergency'])
      .lt('sent_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // More than 30 minutes ago

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    const { data, error } = await query.order('sent_at', { ascending: true });

    if (error) {
      console.error('Error fetching escalated notifications:', error);
      return [];
    }

    return (data || []).map((n) => this.mapNotification(n));
  }

  async updateNotificationSettings(
    departmentId: string,
    settings: {
      notifyOnNewPatient?: boolean;
      notifyOnUrgent?: boolean;
      notifyOnTransfer?: boolean;
      notificationChannels?: string[];
      notifyRoles?: string[];
      quietHoursStart?: string;
      quietHoursEnd?: string;
      escalationDelayMinutes?: number;
      escalationEnabled?: boolean;
    }
  ): Promise<boolean> {
    const { error } = await supabase
      .from('department_notification_settings')
      .update({
        notify_on_new_patient: settings.notifyOnNewPatient,
        notify_on_urgent: settings.notifyOnUrgent,
        notify_on_transfer: settings.notifyOnTransfer,
        notification_channels: settings.notificationChannels,
        notify_roles: settings.notifyRoles,
        quiet_hours_start: settings.quietHoursStart,
        quiet_hours_end: settings.quietHoursEnd,
        escalation_delay_minutes: settings.escalationDelayMinutes,
        escalation_enabled: settings.escalationEnabled,
      })
      .eq('department_id', departmentId);

    if (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }

    return true;
  }

  async getNotificationSettings(departmentId: string) {
    const { data, error } = await supabase
      .from('department_notification_settings')
      .select('*')
      .eq('department_id', departmentId)
      .single();

    if (error) {
      console.error('Error fetching notification settings:', error);
      return null;
    }

    return data;
  }

  private mapNotification(data: any): PatientNotification {
    return {
      id: data.id,
      patientId: data.patient_id,
      registrationId: data.registration_id,
      appointmentId: data.appointment_id,
      departmentId: data.department_id,
      departmentName: data.departments?.name,
      assignedDoctorId: data.assigned_doctor_id,
      notificationType: data.notification_type,
      priority: data.priority,
      sentToStaffIds: data.sent_to_staff_ids || [],
      sentAt: data.sent_at,
      acknowledgedBy: data.acknowledged_by,
      acknowledgedAt: data.acknowledged_at,
      isRead: data.is_read,
      messageTitle: data.message_title,
      messageBody: data.message_body,
      metadata: data.metadata || {},
      createdAt: data.created_at,
    };
  }

  subscribeToNotifications(
    userId: string,
    callback: (notification: PatientNotification) => void
  ) {
    // Subscribe to real-time notifications for this user
    const subscription = supabase
      .channel('patient-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patient_assignment_notifications',
          filter: `sent_to_staff_ids=cs.{${userId}}`,
        },
        async (payload) => {
          const notification = this.mapNotification(payload.new);
          callback(notification);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}

export const patientDepartmentNotificationService =
  new PatientDepartmentNotificationService();
