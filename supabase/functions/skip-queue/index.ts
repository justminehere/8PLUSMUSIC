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
    const { upload_id, tier } = body;

    if (!upload_id || !tier) {
      return new Response(
        JSON.stringify({ error: "upload_id and tier are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validTiers = ["skip_7", "skip_15", "spot_1"];
    if (!validTiers.includes(tier)) {
      return new Response(
        JSON.stringify({ error: "Invalid skip tier." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the song to skip
    const { data: song, error: songErr } = await supabase
      .from("music_uploads")
      .select("id, queue_position")
      .eq("id", upload_id)
      .maybeSingle();

    if (songErr || !song) {
      return new Response(
        JSON.stringify({ error: "Song not found." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all songs ordered by position
    const { data: allSongs, error: allErr } = await supabase
      .from("music_uploads")
      .select("id, queue_position")
      .order("queue_position", { ascending: true });

    if (allErr || !allSongs) {
      return new Response(
        JSON.stringify({ error: "Could not load queue." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const total = allSongs.length;
    if (total <= 1) {
      return new Response(
        JSON.stringify({ success: true, message: "Only one song in queue." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine target position based on tier
    let targetPosition: number;
    if (tier === "spot_1") {
      targetPosition = 1;
    } else if (tier === "skip_15") {
      targetPosition = Math.max(1, Math.ceil(total * 0.15));
    } else {
      // skip_7 — jump past 70% of queue
      targetPosition = Math.max(1, Math.ceil(total * 0.3));
    }

    const currentPos = song.queue_position;
    if (currentPos === targetPosition) {
      // Already there
      return new Response(
        JSON.stringify({ success: true, message: "Already at target position." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the new ordered list of IDs (excluding the skipped song)
    const otherSongs = allSongs
      .filter(s => s.id !== upload_id)
      .sort((a, b) => a.queue_position - b.queue_position);

    // Insert the skipped song at targetPosition (1-indexed)
    const newOrder = [...otherSongs];
    const insertIdx = Math.min(targetPosition - 1, newOrder.length);
    newOrder.splice(insertIdx, 0, { id: upload_id, queue_position: 0 });

    // Reassign positions 1..N
    const updates = newOrder.map((s, i) => ({
      id: s.id,
      queue_position: i + 1,
    }));

    // Apply updates + mark as paid
    const updatePromises = updates.map(u =>
      supabase
        .from("music_uploads")
        .update({
          queue_position: u.queue_position,
          tier: u.id === upload_id ? tier : undefined,
          is_paid: u.id === upload_id ? true : undefined,
        })
        .eq("id", u.id)
    );
    await Promise.all(updatePromises);

    return new Response(
      JSON.stringify({ success: true, new_position: insertIdx + 1 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
