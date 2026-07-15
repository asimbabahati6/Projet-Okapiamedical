import { supabase } from '../lib/supabase';

export type NotificationType =
  | 'new_prescription'
  | 'prescription_dispensed'
  | 'lab_order_created'
  | 'lab_result_ready'
  | 'critical_lab_value'
  | 'drug_interaction_warning'
  | 'document_shared'
  | 'signature_required'
  | 'workflow_assigned'
  | 'consultation_scheduled'
  | 'medication_low_stock'
  | 'payment_received'
  | 'invoice_partial'
  | 'tarifs_imported';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface NotificationData {
  recipientId: string;
  senderId?: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  relatedDocumentId?: string;
  relatedDocumentType?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export async function sendNotification(data: NotificationData) {
  const { error } = await supabase.rpc('send_actor_notification', {
    p_recipient_id: data.recipientId,
    p_sender_id: data.senderId || null,
    p_notification_type: data.notificationType,
    p_title: data.title,
    p_message: data.message,
    p_priority: data.priority || 'normal',
    p_related_document_id: data.relatedDocumentId || null,
    p_related_document_type: data.relatedDocumentType || null,
    p_action_url: data.actionUrl || null,
    p_metadata: data.metadata || {}
  });

  if (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

export async function getUnreadNotifications(userId: string) {
  const { data, error } = await supabase
    .from('actor_notifications')
    .select('*')
    .eq('recipient_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
}

export async function getAllNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('actor_notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('actor_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('actor_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('actor_notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

export async function notifyPrescriptionCreated(prescriptionId: string, patientName: string, pharmacistIds: string[], doctorId: string) {
  const promises = pharmacistIds.map(pharmacistId =>
    sendNotification({
      recipientId: pharmacistId,
      senderId: doctorId,
      notificationType: 'new_prescription',
      title: 'Nouvelle Ordonnance',
      message: `Nouvelle ordonnance pour ${patientName} nécessite validation`,
      priority: 'normal',
      relatedDocumentId: prescriptionId,
      relatedDocumentType: 'prescription',
      actionUrl: `/tableau-de-bord/prescriptions`
    })
  );

  await Promise.all(promises);
}

export async function notifyLabResultReady(labOrderId: string, doctorId: string, patientName: string, hasCriticalValues: boolean) {
  await sendNotification({
    recipientId: doctorId,
    notificationType: hasCriticalValues ? 'critical_lab_value' : 'lab_result_ready',
    title: hasCriticalValues ? 'Résultat Critique Disponible' : 'Résultat de Laboratoire Disponible',
    message: `Les résultats de laboratoire pour ${patientName} sont disponibles${hasCriticalValues ? ' - Valeurs critiques détectées' : ''}`,
    priority: hasCriticalValues ? 'critical' : 'normal',
    relatedDocumentId: labOrderId,
    relatedDocumentType: 'lab_order',
    actionUrl: `/tableau-de-bord/laboratory`
  });
}

export async function notifyDrugInteraction(pharmacistId: string, prescriptionId: string, patientName: string, interactionDetails: string) {
  await sendNotification({
    recipientId: pharmacistId,
    notificationType: 'drug_interaction_warning',
    title: 'Interaction Médicamenteuse Détectée',
    message: `Interaction détectée pour ${patientName}: ${interactionDetails}`,
    priority: 'high',
    relatedDocumentId: prescriptionId,
    relatedDocumentType: 'prescription',
    actionUrl: `/tableau-de-bord/prescriptions`
  });
}

export async function notifyDocumentShared(recipientId: string, senderId: string, documentType: string, documentTitle: string) {
  await sendNotification({
    recipientId,
    senderId,
    notificationType: 'document_shared',
    title: 'Document Partagé',
    message: `Un nouveau document "${documentTitle}" a été partagé avec vous`,
    priority: 'normal',
    relatedDocumentType: documentType,
    actionUrl: `/tableau-de-bord/documents`
  });
}

export async function notifyLowStock(pharmacistIds: string[], medicationName: string, currentStock: number) {
  const promises = pharmacistIds.map(pharmacistId =>
    sendNotification({
      recipientId: pharmacistId,
      notificationType: 'medication_low_stock',
      title: 'Stock Bas',
      message: `${medicationName} a un stock bas (${currentStock} unités)`,
      priority: 'normal',
      actionUrl: `/tableau-de-bord/pharmacy`
    })
  );

  await Promise.all(promises);
}

export async function notifyPaymentReceived(params: {
  invoiceNumber: string;
  patientName: string;
  amount: number;
  devise: string;
  newStatus: 'paid' | 'partial';
  remainingBalance: number;
  caissierName: string;
}) {
  const billingRoles = ['super_admin', 'hospital_admin', 'directeur_general', 'gestionnaire', 'caissiere', 'finance_manager', 'accountant'];
  const { data: roles } = await supabase.from('roles').select('id, name').in('name', billingRoles);
  if (!roles || roles.length === 0) return;
  const roleIds = roles.map((r: { id: string }) => r.id);
  const { data: recipients } = await supabase
    .from('user_profiles')
    .select('id')
    .in('role_id', roleIds)
    .limit(30);

  if (!recipients || recipients.length === 0) return;

  const type: NotificationType = params.newStatus === 'paid' ? 'payment_received' : 'invoice_partial';
  const title = params.newStatus === 'paid'
    ? `Paiement complet — ${params.invoiceNumber}`
    : `Paiement partiel — ${params.invoiceNumber}`;
  const message = params.newStatus === 'paid'
    ? `${params.patientName} : ${params.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${params.devise} encaisse par ${params.caissierName}`
    : `${params.patientName} : ${params.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${params.devise} encaisse par ${params.caissierName}. Solde restant : ${params.remainingBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD`;

  const promises = recipients.map((r: Record<string, unknown>) =>
    sendNotification({
      recipientId: r.id as string,
      notificationType: type,
      title,
      message,
      priority: params.newStatus === 'paid' ? 'normal' : 'high',
      actionUrl: '/staff/billing',
      metadata: {
        invoice_number: params.invoiceNumber,
        patient_name: params.patientName,
        amount: params.amount,
        devise: params.devise,
        new_status: params.newStatus,
        remaining_balance: params.remainingBalance,
        caissier: params.caissierName,
      },
    }).catch(err => console.warn('Notification not sent:', err.message))
  );

  await Promise.all(promises);
}
