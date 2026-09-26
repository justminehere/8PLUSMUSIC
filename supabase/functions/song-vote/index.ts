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

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop() || "";

    // GET /song-vote?upload_id=xxx  → returns vote counts for a song
    if (req.method === "GET" && path === "song-vote") {
      const uploadId = url.searchParams.get("upload_id");
      if (!uploadId) {
        return new Response(JSON.stringify({ error: "Missing upload_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("song_votes")
        .select("vote_type")
        .eq("upload_id", uploadId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const likes = data.filter((v: { vote_type: string }) => v.vote_type === "like").length;
      const dislikes = data.filter((v: { vote_type: string }) => v.vote_type === "dislike").length;

      return new Response(JSON.stringify({ likes, dislikes, total: data.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /song-vote/chart  → returns top 10 songs by net votes (likes - dislikes)
    if (req.method === "GET" && path === "chart") {
      const { data: songs, error: songsErr } = await supabase
        .from("music_uploads")
        .select("id, song_name, song_url, artist_name, created_at");

      if (songsErr) {
        return new Response(JSON.stringify({ error: songsErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: votes, error: votesErr } = await supabase
        .from("song_votes")
        .select("upload_id, vote_type");

      if (votesErr) {
        return new Response(JSON.stringify({ error: votesErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const voteMap = new Map<string, { likes: number; dislikes: number }>();
      for (const v of votes as { upload_id: string; vote_type: string }[]) {
        const entry = voteMap.get(v.upload_id) || { likes: 0, dislikes: 0 };
        if (v.vote_type === "like") entry.likes++;
        else entry.dislikes++;
        voteMap.set(v.upload_id, entry);
      }

      const chart = (songs || []).map((s: any) => {
        const v = voteMap.get(s.id) || { likes: 0, dislikes: 0 };
        return { ...s, likes: v.likes, dislikes: v.dislikes, net: v.likes - v.dislikes };
      });

      chart.sort((a: any, b: any) => {
        if (b.net !== a.net) return b.net - a.net;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      return new Response(JSON.stringify({ chart: chart.slice(0, 10) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /song-vote  → cast or update a vote
    if (req.method === "POST") {
      const body = await req.json();
      const { upload_id, vote_type, voter_id } = body;

      if (!upload_id || !vote_type || !voter_id) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (vote_type !== "like" && vote_type !== "dislike") {
        return new Response(JSON.stringify({ error: "Invalid vote_type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check for existing vote
      const { data: existing } = await supabase
        .from("song_votes")
        .select("id, vote_type")
        .eq("upload_id", upload_id)
        .eq("voter_id", voter_id)
        .maybeSingle();

      if (existing) {
        if (existing.vote_type === vote_type) {
          // Same vote → remove it (toggle off)
          await supabase.from("song_votes").delete().eq("id", existing.id);
        } else {
          // Different vote → update it
          await supabase
            .from("song_votes")
            .update({ vote_type })
            .eq("id", existing.id);
        }
      } else {
        await supabase.from("song_votes").insert({
          upload_id,
          vote_type,
          voter_id,
        });
      }

      // Return updated counts
      const { data: allVotes } = await supabase
        .from("song_votes")
        .select("vote_type")
        .eq("upload_id", upload_id);

      const likes = (allVotes || []).filter((v: { vote_type: string }) => v.vote_type === "like").length;
      const dislikes = (allVotes || []).filter((v: { vote_type: string }) => v.vote_type === "dislike").length;

      return new Response(JSON.stringify({ likes, dislikes, total: (allVotes || []).length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
