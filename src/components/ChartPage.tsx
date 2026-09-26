import { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, Play, Heart, Zap, Crown, X, ExternalLink, Loader2 } from 'lucide-react';
import { fetchEdgeJson, isSupabaseConfigured } from '../lib/fetchEdge';
import { supabase } from '../lib/supabase';
import { EmbeddedPlayer } from './EmbeddedPlayer';
import ArcadeBackButton from './ArcadeBackButton';

interface ChartEntry {
  id: string;
  song_name: string;
  song_url: string;
  artist_name: string;
  likes: number;
  dislikes: number;
  net: number;
  score: number;
}

type Period = 'week' | 'month' | 'year';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
];

const BOOST_TIERS = [
  { id: 'free', label: 'Free Vote', price: 0, points: 1, accent: '#2dd4bf', icon: Heart },
  { id: 'boost_2', label: 'Boost', price: 2, points: 50, accent: '#ec4899', icon: Zap },
  { id: 'boost_5', label: 'Mega Boost', price: 5, points: 100, accent: '#f472b6', icon: Crown },
];

function getOrCreateVoterId(): string {
  const KEY = '8pm_voter_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = 'voter_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}

export default function ChartPage() {
  const [chart, setChart] = useState<ChartEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('week');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [boosting, setBoosting] = useState<string | null>(null);
  const [boostMsg, setBoostMsg] = useState<string | null>(null);
  const [stripeMsg, setStripeMsg] = useState(false);

  const voterIdRef = useRef(getOrCreateVoterId());

  const fetchChart = useCallback(async (p: Period) => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchEdgeJson<{ chart: ChartEntry[] }>(`song-vote/chart?period=${p}`);
      if (data.chart) {
        setChart(data.chart);
        const scoreMap: Record<string, number> = {};
        data.chart.forEach((e) => { scoreMap[e.id] = e.score; });
        setScores(scoreMap);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchChart(period);
  }, [period, fetchChart]);

  const playingEntry = chart.find((e) => e.id === playingId);

  const handlePlay = (entry: ChartEntry) => {
    if (playingId === entry.id) {
      setPlayingId(null);
    } else {
      setPlayingId(entry.id);
    }
  };

  const handleBoost = async (entry: ChartEntry, tierId: string) => {
    const tier = BOOST_TIERS.find((t) => t.id === tierId);
    if (!tier) return;

    if (tier.price > 0) {
      // Paid boost — needs Stripe
      setStripeMsg(true);
      setBoostMsg(`${tier.label} ($${tier.price}) requires payment setup. Free votes work now!`);
      setTimeout(() => setBoostMsg(null), 5000);
      return;
    }

    // Free boost = +1 like
    setBoosting(entry.id);
    try {
      const data = await fetchEdgeJson<{ likes: number; dislikes: number; score: number }>('song-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upload_id: entry.id,
          voter_id: voterIdRef.current,
          action: 'boost',
          tier: 'free',
        }),
      });
      setScores((prev) => ({ ...prev, [entry.id]: data.score }));
      setBoostMsg(`Voted for "${entry.song_name}"! +1 to chart score.`);
      setTimeout(() => setBoostMsg(null), 3000);
      fetchChart(period);
    } catch {
      setBoostMsg('Could not submit your vote. Please try again.');
      setTimeout(() => setBoostMsg(null), 3000);
    }
    setBoosting(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full bg-pink-500 opacity-10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-400 opacity-10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">
        <ArcadeBackButton href="/player" label="BACK TO QUEUE" />

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-black tracking-tighter leading-none mb-3" style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)' }}>
            <span className="text-white">8</span>
            <span className="bg-gradient-to-r from-pink-400 via-teal-300 to-pink-400 bg-clip-text text-transparent">Plus</span>
            <span className="text-white">Charts</span>
          </h1>
          <p className="text-zinc-500 text-xs tracking-[0.3em] uppercase">Vote • Boost • Climb</p>
        </div>

        {/* Period tabs */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${
                period === p.id
                  ? 'text-black'
                  : 'text-zinc-400 bg-white/5 hover:bg-white/10'
              }`}
              style={
                period === p.id
                  ? { background: 'linear-gradient(90deg, #ec4899, #2dd4bf)' }
                  : undefined
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Now playing */}
        {playingEntry && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs tracking-widest uppercase text-zinc-600 mb-1">Now Playing</p>
                <h2 className="font-black text-lg text-white truncate">{playingEntry.song_name}</h2>
                <p className="text-sm text-zinc-400">{playingEntry.artist_name}</p>
              </div>
              <button
                onClick={() => handlePlay(playingEntry)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0 ml-3"
              >
                <X size={16} className="text-zinc-400" />
              </button>
            </div>

            <EmbeddedPlayer url={playingEntry.song_url} autoplay={true} />

            {/* Boost voting */}
            <div className="mt-5">
              <p className="text-xs tracking-widest uppercase text-zinc-600 mb-3 text-center">
                Boost this song's chart score
              </p>
              <div className="grid grid-cols-3 gap-3">
                {BOOST_TIERS.map((tier) => {
                  const Icon = tier.icon;
                  const isBoosting = boosting === playingEntry.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => handleBoost(playingEntry, tier.id)}
                      disabled={isBoosting && tier.id === 'free'}
                      className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all hover:scale-[1.03] disabled:opacity-50"
                      style={{
                        background: `${tier.accent}15`,
                        border: `1px solid ${tier.accent}40`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 16px ${tier.accent}40`;
                        e.currentTarget.style.borderColor = `${tier.accent}80`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '';
                        e.currentTarget.style.borderColor = `${tier.accent}40`;
                      }}
                    >
                      <Icon size={18} style={{ color: tier.accent }} />
                      <span className="text-sm font-black" style={{ color: tier.accent }}>
                        {tier.price === 0 ? 'FREE' : `$${tier.price}`}
                      </span>
                      <span className="text-[10px] text-zinc-400 text-center leading-tight">
                        +{tier.points} points
                      </span>
                      {isBoosting && tier.id === 'free' && (
                        <Loader2 size={12} className="animate-spin" style={{ color: tier.accent }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Boost message */}
        {boostMsg && (
          <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 mb-6 text-center">
            <p className="text-sm text-teal-300">{boostMsg}</p>
          </div>
        )}

        {/* Stripe setup notice */}
        {stripeMsg && (
          <div className="rounded-xl border border-pink-500/30 bg-pink-500/10 px-4 py-3 mb-6 text-center">
            <p className="text-sm text-pink-300">
              Paid boosts need payment setup. Free votes work right now — connect Stripe to unlock $2 and $5 boosts.
            </p>
            <button
              onClick={() => setStripeMsg(false)}
              className="mt-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Chart list */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 text-sm">Loading chart...</p>
          </div>
        ) : chart.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
            <Trophy size={32} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-sm">No chart entries for this period yet.</p>
            <p className="text-zinc-600 text-xs mt-1">Vote on songs in the Live Queue to build the chart!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chart.map((entry, i) => (
              <div
                key={entry.id}
                className={`rounded-xl p-4 transition-all ${
                  i < 3
                    ? 'border border-pink-500/20 bg-pink-500/5'
                    : 'border border-white/5 bg-white/[0.02]'
                } ${playingId === entry.id ? 'ring-1 ring-teal-500/40' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="font-black text-lg w-8 text-center flex-shrink-0"
                    style={{
                      color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : '#3f3f46',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{entry.song_name}</p>
                    <p className="text-xs text-zinc-500">{entry.artist_name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-pink-400">
                      {scores[entry.id] ?? entry.score}
                    </span>
                    <button
                      onClick={() => handlePlay(entry)}
                      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                        playingId === entry.id
                          ? 'bg-teal-500/20 text-teal-300'
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                      }`}
                      aria-label="Play song"
                    >
                      {playingId === entry.id ? (
                        <X size={14} />
                      ) : (
                        <Play size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
