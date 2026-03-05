export interface AppointmentNotificationPayload {
  patientName: string;
  patientEmail?: string | null;
  patientPhone?: string | null;
  validatorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentNumber: string;
}

function buildEmailHtml(p: AppointmentNotificationPayload): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
  .header { background: #0d6b9a; padding: 28px 32px; text-align: center; }
  .header h1 { color: #fff; font-size: 22px; margin: 0; }
  .body { padding: 28px 32px; }
  .body p { color: #374151; line-height: 1.7; font-size: 15px; }
  .highlight { background: #eaf4fb; border-left: 4px solid #0d6b9a; padding: 14px 18px; border-radius: 4px; margin: 18px 0; }
  .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 18px 32px; text-align: center; font-size: 12px; color: #9ca3af; }
  .site-link { color: #0d6b9a; text-decoration: none; font-weight: bold; }
</style></head>
<body>
  <div class="container">
    <div class="header"><h1>OKAPIA MEDICAL</h1></div>
    <div class="body">
      <p>Bonjour <strong>${p.patientName}</strong>,</p>
      <p>Votre demande de rendez-vous a été traitée par notre équipe.</p>
      <div class="highlight">
        <p style="margin:0"><strong>N° RDV :</strong> ${p.appointmentNumber}</p>
        <p style="margin:4px 0 0"><strong>Date :</strong> ${p.appointmentDate} à ${p.appointmentTime}</p>
        <p style="margin:4px 0 0"><strong>Responsable de la validation :</strong> ${p.validatorName}</p>
      </div>
      <p>Veuillez vous présenter à la clinique à l'heure prévue.</p>
      <p style="margin-top:24px">Cordialement,<br/>
      <strong>Direction — Prof BAZEBOSO J.A.</strong><br/>
      <a class="site-link" href="https://www.okapiamedical.com">www.okapiamedical.com</a></p>
    </div>
    <div class="footer">OKAPIA MEDICAL · Kinshasa, République Démocratique du Congo</div>
  </div>
</body>
</html>`;
}

function buildSmsText(p: AppointmentNotificationPayload): string {
  const msg = `OKAPIA MEDICAL: Bonjour ${p.patientName}, votre RDV est validé par ${p.validatorName}. Nous vous attendons. Plus d'infos sur www.okapiamedical.com.`;
  return msg.length <= 160 ? msg : msg.substring(0, 157) + '...';
}

export async function sendAppointmentValidationNotification(
  payload: AppointmentNotificationPayload
): Promise<{ emailSent: boolean; smsSent: boolean; emailPreview: string; smsPreview: string }> {
  const emailHtml = buildEmailHtml(payload);
  const smsText = buildSmsText(payload);

  console.info('[NOTIFICATION] Email preview:', emailHtml);
  console.info('[NOTIFICATION] SMS preview:', smsText);

  await new Promise(r => setTimeout(r, 400));

  return {
    emailSent: true,
    smsSent: true,
    emailPreview: emailHtml,
    smsPreview: smsText,
  };
}

export async function sendFeedbackLinkNotification(payload: {
  patientName: string;
  patientEmail?: string | null;
  feedbackToken: string;
}): Promise<void> {
  const link = `https://www.okapiamedical.com/feedback?token=${payload.feedbackToken}`;
  console.info(`[NOTIFICATION] Feedback link for ${payload.patientName}: ${link}`);
  await new Promise(r => setTimeout(r, 200));
}
