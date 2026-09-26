import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SongRow {
  id: string;
  song_name: string;
  song_url: string;
  artist_name: string;
  created_at: string;
}

function periodStart(period: string): Date | null {
  const now = new Date();
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "month") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  if (period === "year") {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }
  if (period === "all") return null;
  return null;
}

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
        .select("vote_type, weight")
        .eq("upload_id", uploadId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let likes = 0;
      let dislikes = 0;
      for (const v of (data || []) as { vote_type: string; weight: number }[]) {
        if (v.vote_type === "like") likes += v.weight || 1;
        else dislikes += v.weight || 1;
      }

      return new Response(JSON.stringify({ likes, dislikes, total: (data || []).length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /song-vote/chart?period=week|month|year|all  → returns chart sorted by score
    if (req.method === "GET" && path === "chart") {
      const period = url.searchParams.get("period") || "all";
      const since = periodStart(period);

      const { data: songs, error: songsErr } = await supabase
        .from("music_uploads")
        .select("id, song_name, song_url, artist_name, created_at");

      if (songsErr) {
        return new Response(JSON.stringify({ error: songsErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let votesQuery = supabase
        .from("song_votes")
        .select("upload_id, vote_type, weight, created_at");

      if (since) votesQuery = votesQuery.gte("created_at", since.toISOString());

      const { data: votes, error: votesErr } = await votesQuery;

      if (votesErr) {
        return new Response(JSON.stringify({ error: votesErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let boostsQuery = supabase
        .from("chart_boosts")
        .select("upload_id, weight, created_at");

      if (since) boostsQuery = boostsQuery.gte("created_at", since.toISOString());

      const { data: boosts, error: boostsErr } = await boostsQuery;

      if (boostsErr) {
        return new Response(JSON.stringify({ error: boostsErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const scoreMap = new Map<string, { likes: number; dislikes: number; score: number }>();

      for (const v of (votes || []) as { upload_id: string; vote_type: string; weight: number }[]) {
        const entry = scoreMap.get(v.upload_id) || { likes: 0, dislikes: 0, score: 0 };
        if (v.vote_type === "like") {
          entry.likes += v.weight || 1;
          entry.score += v.weight || 1;
        } else {
          entry.dislikes += v.weight || 1;
          entry.score -= v.weight || 1;
        }
        scoreMap.set(v.upload_id, entry);
      }

      for (const b of (boosts || []) as { upload_id: string; weight: number }[]) {
        const entry = scoreMap.get(b.upload_id) || { likes: 0, dislikes: 0, score: 0 };
        entry.likes += b.weight;
        entry.score += b.weight;
        scoreMap.set(b.upload_id, entry);
      }

      const chart = (songs || []).map((s: SongRow) => {
        const v = scoreMap.get(s.id) || { likes: 0, dislikes: 0, score: 0 };
        return { ...s, likes: v.likes, dislikes: v.dislikes, net: v.score, score: v.score };
      });

      chart.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      return new Response(JSON.stringify({ chart: chart.slice(0, 50) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /song-vote  → cast or update a vote
    if (req.method === "POST") {
      const body = await req.json();
      const { upload_id, vote_type, voter_id, action } = body;

      if (!upload_id || !voter_id) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Boost action — insert a chart_boost row (free boost = +1 like)
      if (action === "boost") {
        const tier = body.tier as string;
        if (tier === "free") {
          // Free boost = +1 like vote with weight 1
          const { data: existing } = await supabase
            .from("song_votes")
            .select("id, vote_type, weight")
            .eq("upload_id", upload_id)
            .eq("voter_id", voter_id)
            .eq("vote_type", "like")
            .maybeSingle();

          if (existing) {
            // Already liked — toggle off
            await supabase.from("song_votes").delete().eq("id", existing.id);
          } else {
            // Check if they disliked — remove dislike first
            const { data: existingDislike } = await supabase
              .from("song_votes")
              .select("id")
              .eq("upload_id", upload_id)
              .eq("voter_id", voter_id)
              .eq("vote_type", "dislike")
              .maybeSingle();
            if (existingDislike) {
              await supabase.from("song_votes").delete().eq("id", existingDislike.id);
            }
            await supabase.from("song_votes").insert({
              upload_id,
              vote_type: "like",
              voter_id,
              weight: 1,
            });
          }

          // Return updated score
          const { data: allVotes } = await supabase
            .from("song_votes")
            .select("vote_type, weight")
            .eq("upload_id", upload_id);
          const { data: allBoosts } = await supabase
            .from("chart_boosts")
            .select("weight")
            .eq("upload_id", upload_id);

          let likes = 0;
          let dislikes = 0;
          for (const v of (allVotes || []) as { vote_type: string; weight: number }[]) {
            if (v.vote_type === "like") likes += v.weight || 1;
            else dislikes += v.weight || 1;
          }
          for (const b of (allBoosts || []) as { weight: number }[]) {
            likes += b.weight;
          }

          return new Response(JSON.stringify({ likes, dislikes, score: likes - dislikes }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (tier === "boost_2" || tier === "boost_5") {
          // Paid boost — insert directly (payment verification handled separately)
          const weight = tier === "boost_2" ? 50 : 100;
          const amountCents = tier === "boost_2" ? 200 : 500;

          const { error: insertErr } = await supabase.from("chart_boosts").insert({
            upload_id,
            voter_id,
            tier,
            weight,
            amount_cents: amountCents,
          });

          if (insertErr) {
            return new Response(JSON.stringify({ error: insertErr.message }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Return updated score
          const { data: allVotes } = await supabase
            .from("song_votes")
            .select("vote_type, weight")
            .eq("upload_id", upload_id);
          const { data: allBoosts } = await supabase
            .from("chart_boosts")
            .select("weight")
            .eq("upload_id", upload_id);

          let likes = 0;
          let dislikes = 0;
          for (const v of (allVotes || []) as { vote_type: string; weight: number }[]) {
            if (v.vote_type === "like") likes += v.weight || 1;
            else dislikes += v.weight || 1;
          }
          for (const b of (allBoosts || []) as { weight: number }[]) {
            likes += b.weight;
          }

          return new Response(JSON.stringify({ likes, dislikes, score: likes - dislikes, paid: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: "Invalid boost tier" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Standard like/dislike vote
      if (!vote_type || (vote_type !== "like" && vote_type !== "dislike")) {
        return new Response(JSON.stringify({ error: "Invalid vote_type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existing } = await supabase
        .from("song_votes")
        .select("id, vote_type")
        .eq("upload_id", upload_id)
        .eq("voter_id", voter_id)
        .maybeSingle();

      if (existing) {
        if (existing.vote_type === vote_type) {
          await supabase.from("song_votes").delete().eq("id", existing.id);
        } else {
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

      const { data: allVotes } = await supabase
        .from("song_votes")
        .select("vote_type, weight")
        .eq("upload_id", upload_id);

      let likes = 0;
      let dislikes = 0;
      for (const v of (allVotes || []) as { vote_type: string; weight: number }[]) {
        if (v.vote_type === "like") likes += v.weight || 1;
        else dislikes += v.weight || 1;
      }

      return new Response(JSON.stringify({ likes, dislikes, total: (allVotes || []).length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
