import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the user's JWT and get their identity
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Read the user's USDA API key from their settings (RLS scoped)
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("usda_api_key")
      .limit(1)
      .single();

    if (settingsError || !settings?.usda_api_key) {
      return new Response(
        JSON.stringify({ error: "USDA API key not configured. Add it in Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = settings.usda_api_key;
    const body = await req.json();
    const { action } = body;

    let usdaRes: Response;

    if (action === "search") {
      const { query, pageNumber = 1, pageSize = 20 } = body;
      usdaRes = await fetch(`${USDA_BASE_URL}/foods/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
          query,
          pageNumber,
          pageSize,
          dataType: ["Foundation", "SR Legacy", "Branded"],
          sortBy: "dataType.keyword",
          sortOrder: "asc",
        }),
      });
    } else if (action === "details") {
      const { fdcId, nutrients } = body;
      usdaRes = await fetch(
        `${USDA_BASE_URL}/food/${fdcId}?nutrients=${nutrients}`,
        { headers: { "X-Api-Key": apiKey } },
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "search" or "details".' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!usdaRes.ok) {
      return new Response(
        JSON.stringify({ error: `USDA API error: ${usdaRes.status}` }),
        { status: usdaRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await usdaRes.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
