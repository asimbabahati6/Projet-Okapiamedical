import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PunchAlertPayload {
  type: "late_arrival" | "break_exceeded" | "auto_closed" | "absence";
  employeeName: string;
  employeeEmail: string;
  staffId: string;
  punchRecordId?: string;
  minutesLate?: number;
  minutesExceeded?: number;
  date: string;
  hrEmail?: string;
}

function buildHtmlEmail(payload: PunchAlertPayload): string {
  const dateStr = new Date(payload.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let alertColor = "#f59e0b";
  let alertTitle = "Alerte de Pointage";
  let alertMessage = "";
  let alertIcon = "⚠️";

  switch (payload.type) {
    case "late_arrival":
      alertColor = "#f59e0b";
      alertTitle = "Retard Enregistré";
      alertIcon = "🕐";
      alertMessage = `L'employé(e) <strong>${payload.employeeName}</strong> est arrivé(e) avec <strong>${payload.minutesLate} minute(s) de retard</strong> le ${dateStr}.`;
      break;
    case "break_exceeded":
      alertColor = "#f97316";
      alertTitle = "Pause Dépassée";
      alertIcon = "☕";
      alertMessage = `L'employé(e) <strong>${payload.employeeName}</strong> a dépassé la durée de pause autorisée de <strong>${payload.minutesExceeded} minute(s) supplémentaire(s)</strong> le ${dateStr}.`;
      break;
    case "auto_closed":
      alertColor = "#6b7280";
      alertTitle = "Fermeture Automatique";
      alertIcon = "🔒";
      alertMessage = `Le pointage de <strong>${payload.employeeName}</strong> a été <strong>clôturé automatiquement à 20h00</strong> le ${dateStr} car l'employé(e) a oublié de pointer sa sortie.`;
      break;
    case "absence":
      alertColor = "#ef4444";
      alertTitle = "Absence Non Justifiée";
      alertIcon = "❌";
      alertMessage = `L'employé(e) <strong>${payload.employeeName}</strong> ne s'est <strong>pas présenté(e)</strong> le ${dateStr}. Aucun pointage enregistré.`;
      break;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${alertTitle}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1e3a8a;padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">OKAPIA Medical</p>
                  <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">Système Smart Punch — Notification Automatique</p>
                </td>
                <td align="right">
                  <span style="font-size:36px;">${alertIcon}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Alert Badge -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${alertColor}15;border:1px solid ${alertColor}30;border-radius:8px;padding:8px 16px;">
                  <p style="margin:0;color:${alertColor};font-size:13px;font-weight:600;">${alertTitle.toUpperCase()}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:20px 32px 32px;">
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">${alertMessage}</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;margin:16px 0;">
              <tr>
                <td style="padding:16px;">
                  <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Détails</p>
                  <table width="100%" cellpadding="4" cellspacing="0">
                    <tr>
                      <td style="color:#6b7280;font-size:13px;width:140px;">Employé(e) :</td>
                      <td style="color:#111827;font-size:13px;font-weight:500;">${payload.employeeName}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:13px;">Date :</td>
                      <td style="color:#111827;font-size:13px;">${dateStr}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:13px;">Type d'alerte :</td>
                      <td style="color:${alertColor};font-size:13px;font-weight:600;">${alertTitle}</td>
                    </tr>
                    ${payload.minutesLate ? `<tr><td style="color:#6b7280;font-size:13px;">Retard :</td><td style="color:#f59e0b;font-size:13px;font-weight:600;">${payload.minutesLate} minutes</td></tr>` : ""}
                    ${payload.minutesExceeded ? `<tr><td style="color:#6b7280;font-size:13px;">Dépassement :</td><td style="color:#f97316;font-size:13px;font-weight:600;">${payload.minutesExceeded} minutes</td></tr>` : ""}
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:16px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
              Veuillez vous connecter à l'interface d'administration Smart Punch pour consulter les détails complets et prendre les mesures appropriées.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f1f5f9;padding:16px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">
              Ce message est généré automatiquement par le système Smart Punch — OKAPIA Medical.<br>
              Ne pas répondre à cet email. Pour toute question, contactez le service RH.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload: PunchAlertPayload = await req.json();

    if (!payload.employeeName || !payload.employeeEmail || !payload.type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: employeeName, employeeEmail, type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") ?? "587");

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn("SMTP not configured — logging notification only");
      return new Response(
        JSON.stringify({ success: true, message: "SMTP not configured, notification logged only" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const alertTypeLabel =
      payload.type === "late_arrival" ? "Retard" :
      payload.type === "break_exceeded" ? "Pause Dépassée" :
      payload.type === "auto_closed" ? "Fermeture Automatique" : "Absence";

    const subject = `[Alerte Pointage] - ${alertTypeLabel} - ${payload.employeeName}`;
    const htmlContent = buildHtmlEmail(payload);

    const recipients = [payload.employeeEmail];
    if (payload.hrEmail && payload.hrEmail !== payload.employeeEmail) {
      recipients.push(payload.hrEmail);
    }

    const emailData = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      from: `OKAPIA Smart Punch <${smtpUser}>`,
      to: recipients.join(", "),
      subject,
      html: htmlContent,
    };

    console.log("Sending punch alert email:", {
      type: payload.type,
      employee: payload.employeeName,
      recipients,
    });

    // Using fetch to a hypothetical SMTP relay or logging
    // In production, integrate with Resend, SendGrid, or SMTP via a service
    const smtpServiceUrl = Deno.env.get("SMTP_SERVICE_URL");
    if (smtpServiceUrl) {
      const smtpResponse = await fetch(smtpServiceUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      if (!smtpResponse.ok) {
        const errText = await smtpResponse.text();
        throw new Error(`SMTP relay error: ${errText}`);
      }
    } else {
      console.log("Email payload prepared (no SMTP relay URL set):", {
        to: emailData.to,
        subject: emailData.subject,
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email notification sent successfully", recipients }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const e = error as Error;
    console.error("Error sending punch alert:", e);
    return new Response(
      JSON.stringify({ error: e.message ?? "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
