import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS music_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_name text NOT NULL,
  song_url text NOT NULL,
  artist_name text NOT NULL,
  instagram_handle text,
  owns_song boolean NOT NULL DEFAULT false,
  is_ai_music boolean NOT NULL DEFAULT false,
  ai_type text CHECK (ai_type IS NULL OR ai_type IN ('complete', 'hybrid')),
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'skip_7', 'skip_15', 'spot_1')),
  queue_position integer NOT NULL,
  is_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE music_uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_uploads" ON music_uploads;
CREATE POLICY "anon_select_uploads" ON music_uploads FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_uploads" ON music_uploads;
CREATE POLICY "anon_insert_uploads" ON music_uploads FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_uploads" ON music_uploads;
CREATE POLICY "anon_update_uploads" ON music_uploads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_uploads" ON music_uploads;
CREATE POLICY "anon_delete_uploads" ON music_uploads FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_music_uploads_queue_position ON music_uploads (queue_position);
CREATE INDEX IF NOT EXISTS idx_music_uploads_created_at ON music_uploads (created_at DESC);
`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Ensure table exists by running DDL via the pg API
    const pgResponse = await fetch(`${supabaseUrl}/pg/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
        "apikey": serviceKey,
      },
      body: JSON.stringify({ query: CREATE_TABLE_SQL }),
    }).catch(() => null);

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
