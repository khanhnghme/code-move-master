import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if drive is enabled in system_settings
    const { data: setting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "google_drive_config")
      .maybeSingle();

    const enabled = (setting?.value as any)?.enabled === true;
    if (!enabled) {
      return new Response(JSON.stringify({ enabled: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return keys from secrets
    const apiKey = Deno.env.get("GOOGLE_DRIVE_API_KEY") || "";
    const clientId = Deno.env.get("GOOGLE_DRIVE_OAUTH_CLIENT_ID") || "";

    return new Response(
      JSON.stringify({
        enabled: true,
        api_key: apiKey,
        client_id: clientId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
