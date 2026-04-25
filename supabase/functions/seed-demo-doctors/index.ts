import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEMO_DOCTORS = [
  {
    email: "dr.mukendi@okapia-demo.cd",
    full_name: "Patrick Mukendi Kabongo",
    department_id: "d1000001-aaaa-bbbb-cccc-000000000001",
    specialization: "Médecine générale",
    consultation_fee: 50,
    telemedicine_enabled: true,
    license: "OM-2024-101",
  },
  {
    email: "dr.tshilombo@okapia-demo.cd",
    full_name: "Marie-Claire Tshilombo Ngoy",
    department_id: "d1000001-aaaa-bbbb-cccc-000000000001",
    specialization: "Médecine interne",
    consultation_fee: 60,
    telemedicine_enabled: true,
    license: "OM-2024-102",
  },
  {
    email: "dr.lukusa@okapia-demo.cd",
    full_name: "Jean-Pierre Lukusa Mpiana",
    department_id: "d1000001-aaaa-bbbb-cccc-000000000002",
    specialization: "Chirurgie générale",
    consultation_fee: 80,
    telemedicine_enabled: false,
    license: "OM-2024-103",
  },
  {
    email: "dr.mwamba@okapia-demo.cd",
    full_name: "Grace Mwamba Ilunga",
    department_id: "d1000001-aaaa-bbbb-cccc-000000000003",
    specialization: "Pédiatrie",
    consultation_fee: 55,
    telemedicine_enabled: true,
    license: "OM-2024-104",
  },
  {
    email: "dr.kasongo@okapia-demo.cd",
    full_name: "Olivier Kasongo Mutombo",
    department_id: "d1000001-aaaa-bbbb-cccc-000000000004",
    specialization: "Gynécologie-Obstétrique",
    consultation_fee: 70,
    telemedicine_enabled: false,
    license: "OM-2024-105",
  },
  {
    email: "dr.kabila@okapia-demo.cd",
    full_name: "Esther Kabila Mbuyi",
    department_id: "d1000001-aaaa-bbbb-cccc-000000000005",
    specialization: "Cardiologie",
    consultation_fee: 75,
    telemedicine_enabled: true,
    license: "OM-2024-106",
  },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: roles } = await supabaseAdmin
      .from("roles")
      .select("id, name")
      .eq("name", "doctor")
      .maybeSingle();

    const doctorRoleId = roles?.id || null;

    const created: string[] = [];
    const skipped: string[] = [];

    for (const doc of DEMO_DOCTORS) {
      const { data: existing } = await supabaseAdmin
        .from("medical_staff")
        .select("id")
        .eq("license_number", doc.license)
        .maybeSingle();

      if (existing) {
        skipped.push(doc.full_name);
        continue;
      }

      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: doc.email,
          password: "OkapiaDemo2026!",
          email_confirm: true,
          user_metadata: { full_name: doc.full_name },
        });

      if (authError) {
        if (authError.message?.includes("already been registered")) {
          skipped.push(doc.full_name);
          continue;
        }
        throw new Error(
          `Auth error for ${doc.full_name}: ${authError.message}`
        );
      }

      const userId = authData.user.id;

      await supabaseAdmin.from("user_profiles").upsert({
        id: userId,
        full_name: doc.full_name,
        role_id: doctorRoleId,
        department_id: doc.department_id,
        is_active: true,
        is_medical_staff: true,
      });

      await supabaseAdmin.from("medical_staff").upsert({
        id: userId,
        display_name: `Dr. ${doc.full_name.split(" ").pop()}`,
        license_number: doc.license,
        specialization: doc.specialization,
        qualifications: ["Docteur en médecine"],
        years_of_experience: 8 + Math.floor(Math.random() * 10),
        consultation_fee: doc.consultation_fee,
        is_accepting_patients: true,
        staff_type: "medecin",
        telemedicine_enabled: doc.telemedicine_enabled,
      });

      created.push(doc.full_name);
    }

    return new Response(
      JSON.stringify({ success: true, created, skipped }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
