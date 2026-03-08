import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const IMAGE_PROMPTS = [
  {
    key: "page1",
    prompt: "Clean modern isometric illustration of a team collaboration dashboard with colorful charts, kanban task boards, and diverse student avatars working together, soft gradients, teal and orange accent colors, white background, no text"
  },
  {
    key: "page2",
    prompt: "Flat design illustration of a vibrant Kanban board with colorful sticky notes in columns (todo, in progress, done), deadline clocks, progress bars, drag and drop arrows, teal and orange colors, white background, no text"
  },
  {
    key: "page3",
    prompt: "Modern flat illustration of a scoring and grading dashboard with bar charts, star ratings, gold medals, trophy, percentage circles, leaderboard, teal and orange accent colors, white background, no text"
  },
  {
    key: "page4",
    prompt: "Isometric illustration of project management workspace with team hierarchy org chart, timeline gantt chart, file folders, resource management, teal and orange colors, white background, no text"
  },
  {
    key: "page5",
    prompt: "Futuristic flat illustration of advanced features: AI robot assistant with chat bubbles, document export icons, security shield, notification bells, communication tools, teal and orange accent colors, white background, no text"
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if images already exist
    const { data: existing } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", "intro_images")
      .maybeSingle();

    const body = await req.json().catch(() => ({}));
    const forceRegenerate = body?.force === true;

    if (existing?.value && !forceRegenerate) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Images already exist", 
        images: existing.value 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageUrls: Record<string, string> = {};

    // Generate images sequentially to avoid rate limits
    for (const item of IMAGE_PROMPTS) {
      console.log(`Generating image for ${item.key}...`);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: item.prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Wait and retry once
          console.log(`Rate limited on ${item.key}, waiting 10s...`);
          await new Promise(r => setTimeout(r, 10000));
          const retry = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{ role: "user", content: item.prompt }],
              modalities: ["image", "text"],
            }),
          });
          if (!retry.ok) {
            console.error(`Failed to generate ${item.key} after retry`);
            continue;
          }
          const retryData = await retry.json();
          const retryImg = retryData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (retryImg) {
            const url = await uploadBase64(supabaseAdmin, item.key, retryImg);
            if (url) imageUrls[item.key] = url;
          }
          continue;
        }
        console.error(`Failed to generate ${item.key}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (imageBase64) {
        const url = await uploadBase64(supabaseAdmin, item.key, imageBase64);
        if (url) imageUrls[item.key] = url;
      }

      // Small delay between requests
      await new Promise(r => setTimeout(r, 2000));
    }

    // Save URLs to system_settings
    if (Object.keys(imageUrls).length > 0) {
      const { data: existingSetting } = await supabaseAdmin
        .from("system_settings")
        .select("id")
        .eq("key", "intro_images")
        .maybeSingle();

      if (existingSetting) {
        await supabaseAdmin
          .from("system_settings")
          .update({ value: imageUrls, updated_at: new Date().toISOString() })
          .eq("key", "intro_images");
      } else {
        await supabaseAdmin
          .from("system_settings")
          .insert({ key: "intro_images", value: imageUrls });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      generated: Object.keys(imageUrls).length,
      images: imageUrls 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function uploadBase64(
  supabase: any, 
  key: string, 
  base64Url: string
): Promise<string | null> {
  try {
    // Extract base64 data
    const base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const fileName = `intro-${key}-${Date.now()}.png`;
    
    const { error } = await supabase.storage
      .from("system-assets")
      .upload(fileName, bytes, { 
        contentType: "image/png", 
        upsert: true 
      });

    if (error) {
      console.error(`Upload error for ${key}:`, error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("system-assets")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (e) {
    console.error(`Upload error for ${key}:`, e);
    return null;
  }
}
