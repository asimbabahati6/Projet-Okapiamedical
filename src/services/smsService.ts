import { supabase } from '../lib/supabase';

export interface SMSConfig {
  provider: 'twilio' | 'africas_talking' | 'vonage' | 'aws_sns';
  isEnabled: boolean;
  settings: Record<string, any>;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export interface SMSNotification {
  id?: string;
  recipientId: string;
  recipientPhone: string;
  message: string;
  notificationType: string;
  relatedRecordType?: string;
  relatedRecordId?: string;
  status?: 'pending' | 'queued' | 'sent' | 'delivered' | 'failed';
  provider?: string;
  metadata?: Record<string, any>;
}

export async function getActiveProvider(): Promise<SMSConfig | null> {
  try {
    const { data, error } = await supabase
      .from('sms_configuration')
      .select('provider, is_enabled, settings')
      .eq('is_enabled', true)
      .single();

    if (error || !data) {
      console.warn('No active SMS provider configured');
      return null;
    }

    return {
      provider: data.provider,
      isEnabled: data.is_enabled,
      settings: data.settings
    };
  } catch (error) {
    console.error('Error fetching SMS configuration:', error);
    return null;
  }
}

export function formatPhoneNumber(phone: string, countryCode: string = '+243'): string {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  if (!cleaned.startsWith(countryCode.replace('+', ''))) {
    cleaned = countryCode.replace('+', '') + cleaned;
  }

  return '+' + cleaned;
}

export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function validateMessage(message: string, maxLength: number = 160): { valid: boolean; length: number; error?: string } {
  const length = message.length;

  if (length === 0) {
    return { valid: false, length, error: 'Message cannot be empty' };
  }

  if (length > maxLength) {
    return { valid: false, length, error: `Message exceeds ${maxLength} characters (${length})` };
  }

  return { valid: true, length };
}

export async function sendSMS(phone: string, message: string, metadata?: Record<string, any>): Promise<SMSResult> {
  try {
    if (!validatePhoneNumber(phone)) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    const messageValidation = validateMessage(message);
    if (!messageValidation.valid) {
      return {
        success: false,
        error: messageValidation.error
      };
    }

    const config = await getActiveProvider();
    if (!config || !config.isEnabled) {
      console.warn('SMS system is disabled or not configured');
      return {
        success: false,
        error: 'SMS system is not enabled'
      };
    }

    const formattedPhone = formatPhoneNumber(phone);

    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        phone: formattedPhone,
        message,
        provider: config.provider,
        metadata
      }
    });

    if (error) {
      console.error('Error calling SMS Edge Function:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: data.success,
      messageId: data.messageId,
      provider: config.provider,
      error: data.error
    };
  } catch (error: any) {
    console.error('Unexpected error sending SMS:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

export async function logSMSNotification(notification: SMSNotification): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('sms_notifications')
      .insert({
        recipient_id: notification.recipientId,
        recipient_phone: notification.recipientPhone,
        message: notification.message,
        notification_type: notification.notificationType,
        related_record_type: notification.relatedRecordType,
        related_record_id: notification.relatedRecordId,
        status: notification.status || 'pending',
        provider: notification.provider || 'twilio',
        metadata: notification.metadata || {}
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error logging SMS notification:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error logging SMS notification:', error);
    return null;
  }
}

export async function updateSMSStatus(
  smsId: string,
  status: 'sent' | 'delivered' | 'failed',
  providerMessageId?: string,
  errorMessage?: string
): Promise<boolean> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'sent' && providerMessageId) {
      updateData.provider_message_id = providerMessageId;
      updateData.sent_at = new Date().toISOString();
    }

    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    if (status === 'failed' && errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('sms_notifications')
      .update(updateData)
      .eq('id', smsId);

    if (error) {
      console.error('Error updating SMS status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating SMS status:', error);
    return false;
  }
}

export async function getSMSNotifications(filters?: {
  recipientId?: string;
  status?: string;
  notificationType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<any[]> {
  try {
    let query = supabase
      .from('sms_notifications')
      .select(`
        *,
        patient:patients(first_name, last_name, patient_number)
      `)
      .order('created_at', { ascending: false });

    if (filters?.recipientId) {
      query = query.eq('recipient_id', filters.recipientId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.notificationType) {
      query = query.eq('notification_type', filters.notificationType);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching SMS notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching SMS notifications:', error);
    return [];
  }
}

export async function getSMSStatistics(startDate?: string, endDate?: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('get_sms_statistics', {
      p_start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      p_end_date: endDate || new Date().toISOString()
    });

    if (error) {
      console.error('Error fetching SMS statistics:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error fetching SMS statistics:', error);
    return null;
  }
}

export async function retrySMS(smsId: string): Promise<SMSResult> {
  try {
    const { data: notification, error: fetchError } = await supabase
      .from('sms_notifications')
      .select('*')
      .eq('id', smsId)
      .single();

    if (fetchError || !notification) {
      return {
        success: false,
        error: 'SMS notification not found'
      };
    }

    if (notification.retry_count >= 3) {
      return {
        success: false,
        error: 'Maximum retry attempts exceeded'
      };
    }

    const { error: updateError } = await supabase
      .from('sms_notifications')
      .update({
        retry_count: notification.retry_count + 1,
        status: 'pending'
      })
      .eq('id', smsId);

    if (updateError) {
      return {
        success: false,
        error: 'Failed to update retry count'
      };
    }

    const result = await sendSMS(notification.recipient_phone, notification.message, {
      ...notification.metadata,
      retry_attempt: notification.retry_count + 1
    });

    if (result.success) {
      await updateSMSStatus(smsId, 'sent', result.messageId);
    } else {
      await updateSMSStatus(smsId, 'failed', undefined, result.error);
    }

    return result;
  } catch (error: any) {
    console.error('Error retrying SMS:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}
