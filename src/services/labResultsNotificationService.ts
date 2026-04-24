import { supabase } from '../lib/supabase';
import { sendSMS, logSMSNotification, validatePhoneNumber, SMSResult } from './smsService';

export interface LabResultNotificationData {
  labOrderId: string;
  patientId: string;
  patientFirstName: string;
  patientLastName: string;
  patientPhone: string;
  orderNumber: string;
  testType?: string;
  isUrgent?: boolean;
  doctorName?: string;
}

export interface NotificationResult {
  success: boolean;
  smsId?: string;
  messageId?: string;
  reason?: string;
  error?: string;
}

export async function getMessageTemplate(templateName: string = 'lab_result_ready'): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('sms_templates')
      .select('message_template')
      .eq('name', templateName)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.warn(`Template ${templateName} not found, using default`);
      return null;
    }

    return data.message_template;
  } catch (error) {
    console.error('Error fetching SMS template:', error);
    return null;
  }
}

export function buildLabResultMessage(
  firstName: string,
  isUrgent: boolean = false,
  customTemplate?: string
): string {
  const defaultTemplate = isUrgent
    ? 'URGENT: {first_name}, contactez immédiatement votre médecin pour vos résultats. OKAPIA Medical'
    : 'Bonjour {first_name}, vos résultats sont chez votre médecin. Prenez RDV pour interprétation. OKAPIA Medical';

  const template = customTemplate || defaultTemplate;
  return template.replace('{first_name}', firstName);
}

export async function notifyPatientLabResultsReady(
  data: LabResultNotificationData
): Promise<NotificationResult> {
  try {
    if (!data.patientPhone || data.patientPhone.trim() === '') {
      console.warn('No phone number for patient:', data.patientId);
      return {
        success: false,
        reason: 'no_phone'
      };
    }

    if (!validatePhoneNumber(data.patientPhone)) {
      console.warn('Invalid phone number format:', data.patientPhone);
      return {
        success: false,
        reason: 'invalid_phone'
      };
    }

    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('sms_notifications_enabled')
      .eq('id', data.patientId)
      .single();

    if (patientError) {
      console.error('Error fetching patient consent:', patientError);
      return {
        success: false,
        reason: 'patient_not_found',
        error: patientError.message
      };
    }

    if (!patient.sms_notifications_enabled) {
      console.warn('Patient has disabled SMS notifications:', data.patientId);
      return {
        success: false,
        reason: 'patient_opted_out'
      };
    }

    const templateName = data.isUrgent ? 'lab_result_ready_urgent' : 'lab_result_ready';
    const customTemplate = await getMessageTemplate(templateName);

    const message = buildLabResultMessage(
      data.patientFirstName,
      data.isUrgent,
      customTemplate || undefined
    );

    if (message.length > 160) {
      console.error('Message exceeds SMS limit:', message.length, 'characters');
      return {
        success: false,
        reason: 'message_too_long',
        error: `Message length: ${message.length} characters`
      };
    }

    const smsId = await logSMSNotification({
      recipientId: data.patientId,
      recipientPhone: data.patientPhone,
      message,
      notificationType: data.isUrgent ? 'lab_result_ready_urgent' : 'lab_result_ready',
      relatedRecordType: 'lab_order',
      relatedRecordId: data.labOrderId,
      status: 'pending',
      metadata: {
        patient_name: `${data.patientFirstName} ${data.patientLastName}`,
        order_number: data.orderNumber,
        test_type: data.testType,
        is_urgent: data.isUrgent,
        doctor_name: data.doctorName,
        status_changed_at: new Date().toISOString()
      }
    });

    if (!smsId) {
      return {
        success: false,
        reason: 'log_failed',
        error: 'Failed to log SMS notification'
      };
    }

    const smsResult: SMSResult = await sendSMS(data.patientPhone, message, {
      notification_id: smsId,
      patient_id: data.patientId,
      lab_order_id: data.labOrderId
    });

    if (smsResult.success) {
      await supabase
        .from('sms_notifications')
        .update({
          status: 'sent',
          provider_message_id: smsResult.messageId,
          sent_at: new Date().toISOString()
        })
        .eq('id', smsId);

      return {
        success: true,
        smsId,
        messageId: smsResult.messageId
      };
    } else {
      await supabase
        .from('sms_notifications')
        .update({
          status: 'failed',
          error_message: smsResult.error
        })
        .eq('id', smsId);

      return {
        success: false,
        smsId,
        reason: 'send_failed',
        error: smsResult.error
      };
    }
  } catch (error: any) {
    console.error('Error sending lab result notification:', error);
    return {
      success: false,
      reason: 'unexpected_error',
      error: error.message || 'Unknown error occurred'
    };
  }
}

export async function notifyLabResultsForOrder(labOrderId: string, isUrgent: boolean = false): Promise<NotificationResult> {
  try {
    const { data: labOrder, error: orderError } = await supabase
      .from('lab_orders')
      .select(`
        id,
        order_number,
        test_type,
        patient_id,
        patient:patients(
          id,
          first_name,
          last_name,
          phone,
          sms_notifications_enabled
        ),
        doctor:user_profiles(
          full_name
        )
      `)
      .eq('id', labOrderId)
      .single();

    if (orderError || !labOrder) {
      console.error('Lab order not found:', labOrderId);
      return {
        success: false,
        reason: 'order_not_found',
        error: orderError?.message
      };
    }

    if (!labOrder.patient) {
      return {
        success: false,
        reason: 'patient_not_found'
      };
    }

    const patient = Array.isArray(labOrder.patient) ? labOrder.patient[0] : labOrder.patient as any;
    const doctor = Array.isArray(labOrder.doctor) ? labOrder.doctor[0] : labOrder.doctor as any;

    const notificationData: LabResultNotificationData = {
      labOrderId: labOrder.id,
      patientId: patient.id,
      patientFirstName: patient.first_name,
      patientLastName: patient.last_name,
      patientPhone: patient.phone || '',
      orderNumber: labOrder.order_number,
      testType: labOrder.test_type,
      isUrgent,
      doctorName: doctor?.full_name
    };

    return await notifyPatientLabResultsReady(notificationData);
  } catch (error: any) {
    console.error('Error notifying patient for lab order:', error);
    return {
      success: false,
      reason: 'unexpected_error',
      error: error.message
    };
  }
}

export async function getLabOrderNotifications(labOrderId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('sms_notifications')
      .select('*')
      .eq('related_record_type', 'lab_order')
      .eq('related_record_id', labOrderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lab order notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching lab order notifications:', error);
    return [];
  }
}

export async function bulkNotifyLabResults(labOrderIds: string[], isUrgent: boolean = false): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: NotificationResult[];
}> {
  const results: NotificationResult[] = [];
  let successful = 0;
  let failed = 0;

  for (const labOrderId of labOrderIds) {
    const result = await notifyLabResultsForOrder(labOrderId, isUrgent);
    results.push(result);

    if (result.success) {
      successful++;
    } else {
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    total: labOrderIds.length,
    successful,
    failed,
    results
  };
}
