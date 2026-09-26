import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const {
      song_name,
      song_url,
      artist_name,
      instagram_handle,
      owns_song,
      is_ai_music,
      ai_type,
      tier,
      real_name,
      phone_number,
      tiktok_link,
      production_year,
      lyrics_writer,
      note_for_8plus,
    } = body;

    if (!song_name || !song_url || !artist_name) {
      return new Response(
        JSON.stringify({ error: "Song name, song link, and artist name are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!owns_song) {
      return new Response(
        JSON.stringify({ error: "You must confirm that you own the song." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (is_ai_music && !ai_type) {
      return new Response(
        JSON.stringify({ error: "Please select the AI music type." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validTiers = ["free", "skip_7", "skip_15", "spot_1"];
    const finalTier = validTiers.includes(tier) ? tier : "free";

    // Get current max queue position
    const { data: maxRow } = await supabase
      .from("music_uploads")
      .select("queue_position")
      .order("queue_position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const basePosition = (maxRow?.queue_position ?? 0) + 1;
    const isPaid = finalTier !== "free";

    const { data, error } = await supabase
      .from("music_uploads")
      .insert({
        song_name,
        song_url,
        artist_name,
        instagram_handle: instagram_handle || null,
        owns_song,
        is_ai_music: is_ai_music || false,
        ai_type: is_ai_music ? ai_type : null,
        tier: finalTier,
        queue_position: basePosition,
        is_paid: isPaid,
        real_name: real_name || null,
        phone_number: phone_number || null,
        tiktok_link: tiktok_link || null,
        production_year: production_year || null,
        lyrics_writer: lyrics_writer || null,
        note_for_8plus: note_for_8plus || null,
      })
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id, queue_position: basePosition }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
