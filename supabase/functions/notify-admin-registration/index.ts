import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RegistrationPayload {
  name: string;
  email: string;
  role: string;
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  hospital_admin: "Administrateur Hospitalier",
  doctor: "Medecin",
  nurse: "Infirmier(ere)",
  pharmacist: "Pharmacien(ne)",
  receptionist: "Receptionniste",
  administrative_staff: "Personnel Administratif",
  logistician: "Logisticien",
  lab_technician: "Laborantin",
  directeur_general: "Directeur General",
  medecin_chef_staff: "Medecin Chef de Staff",
  gestionnaire: "Gestionnaire",
  radio_chef: "Chef Radiologie",
  radio_tech: "Technicien Radiologie",
  caissiere: "Caissiere",
  technique: "Technicien",
  hygiene: "Agent d'Hygiene",
  dentist: "Dentiste",
  physical_therapist: "Kinesitherapeute",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { name, email, role }: RegistrationPayload = await req.json();

    if (!name || !email || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, email, role" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resend = new Resend(resendApiKey);
    const roleDisplayName = ROLE_DISPLAY_NAMES[role] || role;

    const { data, error } = await resend.emails.send({
      from: "OKAPIA System <system@okapia-medical.com>",
      to: ["admin@okapia.com"],
      subject: "Nouvelle inscription en attente de validation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1e40af; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">OKAPIA Medical</h1>
            <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 14px;">Systeme de Gestion du Personnel</p>
          </div>
          <div style="background-color: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1e293b; margin-top: 0;">Nouvelle demande d'acces</h2>
            <p style="color: #475569;">Un nouveau membre du personnel s'est inscrit et attend votre validation :</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 12px; background-color: #ffffff; border: 1px solid #e2e8f0; font-weight: bold; color: #374151; width: 120px;">Nom</td>
                <td style="padding: 12px; background-color: #ffffff; border: 1px solid #e2e8f0; color: #1e293b;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #ffffff; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Email</td>
                <td style="padding: 12px; background-color: #ffffff; border: 1px solid #e2e8f0; color: #1e293b;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background-color: #ffffff; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Role</td>
                <td style="padding: 12px; background-color: #ffffff; border: 1px solid #e2e8f0; color: #1e293b;">${roleDisplayName}</td>
              </tr>
            </table>
            <p style="color: #475569;">Veuillez vous connecter au dashboard pour valider ou rejeter cette inscription.</p>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">Ce message a ete envoye automatiquement par le systeme OKAPIA Medical.</p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send notification email" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in notify-admin-registration:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
