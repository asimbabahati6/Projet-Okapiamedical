import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;

  const rand = (set: string) => set[Math.floor(Math.random() * set.length)];

  // Guarantee at least one of each character class
  const required = [rand(upper), rand(lower), rand(digits), rand(symbols)];
  const rest = Array.from({ length: 12 }, () => rand(all));

  const combined = [...required, ...rest];
  // Fisher-Yates shuffle
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join("");
}

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

    // Guard: refuse to run if user_profiles already has rows
    const { count } = await supabaseAdmin
      .from("user_profiles")
      .select("id", { count: "exact", head: true });

    if (count !== null && count > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          already_initialized: true,
          message: "System already initialized — user accounts exist.",
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up role IDs
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("roles")
      .select("id, name")
      .in("name", ["super_admin"]);

    if (rolesError || !roles?.length) {
      throw new Error("Could not find required roles. Run migrations first.");
    }

    const superAdminRole = roles.find((r) => r.name === "super_admin");
    if (!superAdminRole) throw new Error("super_admin role not found");

    const accounts = [
      {
        email: "nsibazebosso@gmail.com",
        full_name: "Gold Nsibaze Bosso",
        role_id: superAdminRole.id,
        role_label: "Super Administrateur",
      },
      {
        email: "jabazeboso@gmail.com",
        full_name: "Médecin Directeur Bazeboso",
        role_id: superAdminRole.id,
        role_label: "Super Administrateur / Médecin Directeur",
      },
    ];

    const results = [];

    for (const account of accounts) {
      const password = generatePassword();

      // Create auth user
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password,
          email_confirm: true,
          user_metadata: { full_name: account.full_name },
        });

      if (authError) {
        throw new Error(`Failed to create auth user ${account.email}: ${authError.message}`);
      }

      // Insert user_profile
      const { error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .insert({
          id: authData.user.id,
          full_name: account.full_name,
          role_id: account.role_id,
          is_active: true,
          must_change_password: true,
        });

      if (profileError) {
        throw new Error(`Failed to create profile for ${account.email}: ${profileError.message}`);
      }

      results.push({
        email: account.email,
        full_name: account.full_name,
        role: account.role_label,
        temporary_password: password,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin accounts created successfully.",
        accounts: results,
        warning: "Save these credentials immediately — passwords will not be shown again.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
