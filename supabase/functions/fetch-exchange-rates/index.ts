import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FexantRate {
  base_currency: { code: string; name: string };
  target_currency: { code: string; name: string };
  rate: number;
  buy?: number;
  sell?: number;
  date: string;
}

interface FexantResponse {
  success: boolean;
  data: {
    bank: { code: string; name: string };
    date: string;
    rates: FexantRate[];
  };
  error?: { code: string; message: string };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fexantApiKey = Deno.env.get("FEXANT_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let usdRate: number | null = null;
    let eurRate: number | null = null;
    let rateDate: string = new Date().toISOString().split("T")[0];
    let source = "manual";

    if (fexantApiKey) {
      const headers = { "X-API-Key": fexantApiKey };

      // Fetch USD/CDF rate
      const usdResponse = await fetch(
        "https://www.fexant.com/api/v1/rates/BCC/CDF/USD",
        { headers }
      );

      if (usdResponse.ok) {
        const usdData: FexantResponse = await usdResponse.json();
        if (usdData.success && usdData.data?.rates?.length > 0) {
          const rate = usdData.data.rates[0];
          usdRate = rate.rate || rate.sell || rate.buy || null;
          rateDate = usdData.data.date || rateDate;
          source = "fexant_bcc";
        }
      }

      // Fetch EUR/CDF rate
      const eurResponse = await fetch(
        "https://www.fexant.com/api/v1/rates/BCC/CDF/EUR",
        { headers }
      );

      if (eurResponse.ok) {
        const eurData: FexantResponse = await eurResponse.json();
        if (eurData.success && eurData.data?.rates?.length > 0) {
          const rate = eurData.data.rates[0];
          eurRate = rate.rate || rate.sell || rate.buy || null;
        }
      }
    }

    // Fallback: use open exchange rate API if Fexant unavailable
    if (!usdRate) {
      const fallbackRes = await fetch(
        "https://open.er-api.com/v6/latest/USD"
      );
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (fallbackData.rates?.CDF) {
          usdRate = fallbackData.rates.CDF;
          source = "open_er_api";
        }
        if (fallbackData.rates?.CDF && fallbackData.rates?.EUR) {
          eurRate = fallbackData.rates.CDF / fallbackData.rates.EUR;
        }
      }
    }

    if (!usdRate) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unable to fetch exchange rates from any source",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deactivate previous active rates
    await supabase
      .from("exchange_rates")
      .update({ is_active: false })
      .eq("is_active", true);

    // Insert new rates
    const { data: inserted, error: insertError } = await supabase
      .from("exchange_rates")
      .insert({
        rate_date: rateDate,
        usd_to_cdf: usdRate,
        cdf_to_usd: usdRate > 0 ? 1 / usdRate : 0,
        eur_to_cdf: eurRate,
        is_active: true,
        notes: `Taux BCC via ${source} - ${rateDate}`,
      })
      .select()
      .maybeSingle();

    if (insertError) {
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          usd_to_cdf: usdRate,
          eur_to_cdf: eurRate,
          rate_date: rateDate,
          source,
          record: inserted,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
