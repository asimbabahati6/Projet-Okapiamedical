import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationRequest {
  type: "warning_30min" | "exceeded_60min" | "supervisor_escalation" | "early_break_warning";
  staffId: string;
  attendanceRecordId: string;
  staffEmail: string;
  staffName: string;
  breakDuration?: number;
  workHoursBeforeBreak?: number;
  supervisorEmail?: string;
  supervisorName?: string;
}

interface EmailTemplate {
  subject: string;
  body: string;
}

function getEmailTemplate(type: string, data: NotificationRequest): EmailTemplate {
  const templates: Record<string, EmailTemplate> = {
    warning_30min: {
      subject: "⚠️ Alerte Pause - 30 minutes écoulées",
      body: `Bonjour ${data.staffName},\n\n` +
        `Votre pause a maintenant atteint 30 minutes.\n\n` +
        `Rappel : La durée maximale autorisée pour une pause est de 60 minutes.\n` +
        `Il vous reste environ 30 minutes avant la fin automatique de votre pause.\n\n` +
        `Nous vous recommandons de terminer votre pause dans les délais impartis.\n\n` +
        `Cordialement,\n` +
        `Système de Gestion des Présences\n` +
        `OKAPIA Medical`
    },
    exceeded_60min: {
      subject: "🚨 Pause Terminée Automatiquement - Dépassement de Durée",
      body: `Bonjour ${data.staffName},\n\n` +
        `Votre pause a dépassé la durée maximale autorisée de 60 minutes et a été terminée automatiquement par le système.\n\n` +
        `Durée totale de la pause : ${data.breakDuration} minutes\n\n` +
        `Cette action a été enregistrée dans votre dossier de présence et votre superviseur a été notifié.\n\n` +
        `Veuillez reprendre votre travail immédiatement.\n\n` +
        `Si vous avez des questions concernant cette notification, veuillez contacter votre superviseur.\n\n` +
        `Cordialement,\n` +
        `Système de Gestion des Présences\n` +
        `OKAPIA Medical`
    },
    supervisor_escalation: {
      subject: `⚠️ Alerte Superviseur - Pause Dépassée par ${data.staffName}`,
      body: `Bonjour ${data.supervisorName},\n\n` +
        `Ceci est une notification automatique concernant un dépassement de durée de pause.\n\n` +
        `Employé : ${data.staffName}\n` +
        `Date : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n` +
        `Durée de la pause : ${data.breakDuration} minutes (maximum autorisé : 60 minutes)\n` +
        `Dépassement : ${(data.breakDuration || 60) - 60} minutes\n\n` +
        `Le système a automatiquement terminé la pause de l'employé et a enregistré cet incident.\n\n` +
        `Action requise :\n` +
        `- Vérifier que l'employé a repris son travail\n` +
        `- Discuter avec l'employé des politiques de pause si nécessaire\n` +
        `- Consulter le tableau de bord de conformité pour plus de détails\n\n` +
        `Pour accuser réception de cette notification, veuillez consulter le système de gestion des présences.\n\n` +
        `Cordialement,\n` +
        `Système de Gestion des Présences\n` +
        `OKAPIA Medical`
    },
    early_break_warning: {
      subject: "⚠️ Avertissement - Pause Anticipée",
      body: `Bonjour ${data.staffName},\n\n` +
        `Vous avez pris une pause avant d'avoir effectué les 4 heures de travail recommandées.\n\n` +
        `Temps de travail effectué : ${data.workHoursBeforeBreak?.toFixed(2)} heures\n` +
        `Temps recommandé avant pause : 4 heures\n\n` +
        `Bien que les pauses anticipées soient autorisées, nous vous encourageons à respecter les horaires de travail standard pour maintenir une productivité optimale.\n\n` +
        `Rappel : Votre pause ne doit pas dépasser 60 minutes.\n\n` +
        `Cordialement,\n` +
        `Système de Gestion des Présences\n` +
        `OKAPIA Medical`
    }
  };

  return templates[type] || {
    subject: "Notification de Présence",
    body: "Vous avez reçu une notification du système de gestion des présences."
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const notificationData: NotificationRequest = await req.json();
    const { type, staffId, attendanceRecordId, staffEmail, staffName, supervisorEmail, supervisorName } = notificationData;

    const emailTemplate = getEmailTemplate(type, notificationData);
    const recipientEmail = type === "supervisor_escalation" ? supervisorEmail : staffEmail;

    if (!recipientEmail) {
      throw new Error("Recipient email is required");
    }

    const { data: notification, error: notificationError } = await supabase
      .from("break_notifications")
      .insert({
        staff_id: staffId,
        attendance_record_id: attendanceRecordId,
        notification_type: type,
        recipient_email: recipientEmail,
        notification_content: emailTemplate.body,
        delivery_status: "pending"
      })
      .select()
      .single();

    if (notificationError) throw notificationError;

    const { error: queueError } = await supabase
      .from("email_queue")
      .insert({
        notification_id: notification.id,
        recipient_email: recipientEmail,
        subject: emailTemplate.subject,
        body: emailTemplate.body,
        priority: type === "exceeded_60min" || type === "supervisor_escalation" ? 1 : 5
      });

    if (queueError) throw queueError;

    console.log(`Email notification queued: ${type} for ${recipientEmail}`);

    await supabase
      .from("break_notifications")
      .update({ 
        sent_at: new Date().toISOString(),
        delivery_status: "sent" 
      })
      .eq("id", notification.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification sent successfully",
        notificationId: notification.id
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});