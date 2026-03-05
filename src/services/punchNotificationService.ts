import { supabase } from '../lib/supabase';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-punch-alert`;

export interface PunchAlertPayload {
  type: 'late_arrival' | 'break_exceeded' | 'auto_closed' | 'absence';
  employeeName: string;
  employeeEmail: string;
  staffId: string;
  punchRecordId?: string;
  minutesLate?: number;
  minutesExceeded?: number;
  date: string;
  hrEmail?: string;
}

async function logNotification(payload: PunchAlertPayload, status: 'pending' | 'sent' | 'failed', errorMsg?: string): Promise<string> {
  const subject = buildSubject(payload);
  const body = buildBody(payload);

  const { data } = await supabase.from('smart_punch_notifications').insert({
    punch_record_id: payload.punchRecordId ?? null,
    staff_id: payload.staffId,
    notification_type: payload.type,
    recipient_email: payload.employeeEmail,
    recipient_name: payload.employeeName,
    subject,
    body,
    status,
    attempts: 1,
    last_attempt_at: new Date().toISOString(),
    sent_at: status === 'sent' ? new Date().toISOString() : null,
    error_message: errorMsg ?? null,
    context_data: payload as unknown as Record<string, unknown>,
  }).select('id').single();

  return data?.id ?? '';
}

function buildSubject(payload: PunchAlertPayload): string {
  const typeLabel =
    payload.type === 'late_arrival' ? 'Retard' :
    payload.type === 'break_exceeded' ? 'Pause Dépassée' :
    payload.type === 'auto_closed' ? 'Fermeture Automatique' : 'Absence';
  return `[Alerte Pointage] - ${typeLabel} - ${payload.employeeName}`;
}

function buildBody(payload: PunchAlertPayload): string {
  const dateStr = new Date(payload.date).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  switch (payload.type) {
    case 'late_arrival':
      return `L'employé(e) ${payload.employeeName} est arrivé(e) avec ${payload.minutesLate} minute(s) de retard le ${dateStr}. Veuillez vérifier.`;
    case 'break_exceeded':
      return `L'employé(e) ${payload.employeeName} a dépassé la durée de pause autorisée de ${payload.minutesExceeded} minute(s) supplémentaire(s) le ${dateStr}. Veuillez vérifier.`;
    case 'auto_closed':
      return `Le pointage de ${payload.employeeName} a été clôturé automatiquement à 20h00 le ${dateStr} car l'employé(e) a oublié de pointer sa sortie.`;
    case 'absence':
      return `L'employé(e) ${payload.employeeName} ne s'est pas présenté(e) le ${dateStr}. Aucun pointage enregistré.`;
    default:
      return `Alerte de pointage pour ${payload.employeeName} le ${dateStr}.`;
  }
}

export async function sendPunchAlert(payload: PunchAlertPayload): Promise<boolean> {
  let notifId = '';
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      notifId = await logNotification(payload, 'sent');
      return true;
    } else {
      const errText = await response.text();
      notifId = await logNotification(payload, 'failed', errText);
      return false;
    }
  } catch (err: unknown) {
    const e = err as Error;
    if (!notifId) {
      await logNotification(payload, 'failed', e.message);
    }
    return false;
  }
}

export async function retryFailedNotifications(): Promise<void> {
  const { data: pending } = await supabase
    .from('smart_punch_notifications')
    .select('*')
    .eq('status', 'failed')
    .lt('attempts', 3)
    .order('created_at', { ascending: true })
    .limit(10);

  if (!pending?.length) return;

  for (const notif of pending) {
    const payload: PunchAlertPayload = {
      type: notif.notification_type,
      employeeName: notif.recipient_name ?? '',
      employeeEmail: notif.recipient_email,
      staffId: notif.staff_id,
      punchRecordId: notif.punch_record_id ?? undefined,
      date: new Date().toISOString(),
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      });

      const newStatus = response.ok ? 'sent' : 'failed';
      await supabase
        .from('smart_punch_notifications')
        .update({
          status: newStatus,
          attempts: (notif.attempts ?? 0) + 1,
          last_attempt_at: new Date().toISOString(),
          sent_at: response.ok ? new Date().toISOString() : null,
        })
        .eq('id', notif.id);
    } catch {
      await supabase
        .from('smart_punch_notifications')
        .update({
          attempts: (notif.attempts ?? 0) + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', notif.id);
    }
  }
}
