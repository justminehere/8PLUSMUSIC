import { useState, useEffect, useCallback, useRef } from 'react';
import { Music, Zap, ChevronUp, Crown, Loader2, CheckCircle, Trophy } from 'lucide-react';
import { fetchEdgeJson, isSupabaseConfigured } from '../lib/fetchEdge';
import { supabase } from '../lib/supabase';
import ArcadeBackButton from './ArcadeBackButton';

interface UploadItem {
  id: string;
  song_name: string;
  song_url: string;
  artist_name: string;
  instagram_handle: string | null;
  is_ai_music: boolean;
  ai_type: string | null;
  tier: string;
  queue_position: number;
  is_paid: boolean;
  created_at: string;
}

interface ChartEntry {
  id: string;
  song_name: string;
  song_url: string;
  artist_name: string;
  likes: number;
  dislikes: number;
  net: number;
}

const TIKTOK_URL = 'https://www.tiktok.com/@8plusmusic?lang=en';

const SKIP_TIERS = [
  { id: 'skip_7', name: 'Skip Ahead', price: 7, desc: 'Jump past 70% of the queue.', accent: '#ec4899', icon: Zap },
  { id: 'skip_15', name: 'Near Front', price: 15, desc: 'Skip to the top 15% of the queue.', accent: '#f59e0b', icon: ChevronUp },
  { id: 'spot_1', name: 'Spot 1', price: 40, desc: 'Jump to the absolute front.', accent: '#ef4444', icon: Crown },
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

export default function MusicPlayer() {
  const [songs, setSongs] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [skippingId, setSkippingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [selectedSkip, setSelectedSkip] = useState<Record<string, string>>({});

  // Voting state
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [voteCountdown, setVoteCountdown] = useState(60);
  const [voteBurst, setVoteBurst] = useState<string | null>(null);
  const [chart, setChart] = useState<ChartEntry[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  const voterIdRef = useRef(getOrCreateVoterId());

  const fetchQueue = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('The music queue is temporarily unavailable.');
      setLoading(false);
      return;
    }
    try {
      const data = await fetchEdgeJson<{ uploads: UploadItem[]; error?: string }>('music-queue');
      if (data.uploads) {
        setSongs(data.uploads);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Could not load the queue. Please try again later.');
    }
    setLoading(false);
  }, []);

  const fetchChart = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setChartLoading(false);
      return;
    }
    try {
      const data = await fetchEdgeJson<{ chart: ChartEntry[] }>('song-vote/chart');
      if (data.chart) setChart(data.chart);
    } catch {
      // chart may not be ready
    }
    setChartLoading(false);
  }, []);

  useEffect(() => {
    fetchQueue();
    fetchChart();
  }, [fetchQueue, fetchChart]);

  // Auto-refresh queue every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // The first song in the queue is the "now playing" song for voting
  const nowPlaying = songs[0];

  // Fetch vote counts when now-playing song changes
  useEffect(() => {
    if (!nowPlaying) return;
    setLikes(0);
    setDislikes(0);
    setUserVote(null);
    setVoteCountdown(60);

    const fetchVotes = async () => {
      try {
        const data = await fetchEdgeJson<{ likes: number; dislikes: number }>(
          `song-vote?upload_id=${nowPlaying.id}`
        );
        setLikes(data.likes || 0);
        setDislikes(data.dislikes || 0);
      } catch {
        // ignore
      }
      try {
        const { data: existing } = await supabase
          .from('song_votes')
          .select('vote_type')
          .eq('upload_id', nowPlaying.id)
          .eq('voter_id', voterIdRef.current)
          .maybeSingle();
        if (existing) setUserVote(existing.vote_type as 'like' | 'dislike');
      } catch {
        // ignore
      }
    };
    fetchVotes();
  }, [nowPlaying?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 60-second countdown timer for voting
  useEffect(() => {
    if (!nowPlaying || voteCountdown <= 0) return;
    const timer = setInterval(() => {
      setVoteCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [nowPlaying?.id, voteCountdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!nowPlaying || voteCountdown === 0) return;

    const prevVote = userVote;
    if (prevVote === voteType) {
      if (voteType === 'like') setLikes(l => l - 1);
      else setDislikes(d => d - 1);
      setUserVote(null);
    } else if (prevVote === null) {
      if (voteType === 'like') setLikes(l => l + 1);
      else setDislikes(d => d + 1);
    } else {
      if (voteType === 'like') {
        setLikes(l => l + 1);
        setDislikes(d => d - 1);
      } else {
        setDislikes(d => d + 1);
        setLikes(l => l - 1);
      }
    }
    setUserVote(voteType === prevVote ? null : voteType);

    setVoteBurst(voteType === 'like' ? 'LIKE' : 'DISLIKE');
    setTimeout(() => setVoteBurst(null), 1200);

    try {
      const data = await fetchEdgeJson<{ likes: number; dislikes: number }>('song-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upload_id: nowPlaying.id,
          vote_type: voteType,
          voter_id: voterIdRef.current,
        }),
      });
      setLikes(data.likes || 0);
      setDislikes(data.dislikes || 0);
      fetchChart();
    } catch {
      if (prevVote === voteType) {
        if (voteType === 'like') setLikes(l => l + 1);
        else setDislikes(d => d + 1);
        setUserVote(voteType);
      } else if (prevVote === null) {
        if (voteType === 'like') setLikes(l => l - 1);
        else setDislikes(d => d - 1);
        setUserVote(null);
      } else {
        if (voteType === 'like') {
          setLikes(l => l - 1);
          setDislikes(d => d + 1);
        } else {
          setDislikes(d => d - 1);
          setLikes(l => l + 1);
        }
        setUserVote(prevVote);
      }
    }
  };

  const handleSkip = async (songId: string) => {
    const tierId = selectedSkip[songId];
    if (!tierId) return;
    setSkippingId(songId);
    setSuccessId(null);
    try {
      await fetchEdgeJson('skip-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upload_id: songId, tier: tierId }),
      });
      setSuccessId(songId);
      setSelectedSkip(prev => { const n = { ...prev }; delete n[songId]; return n; });
      setTimeout(() => setSuccessId(null), 4000);
      fetchQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not skip. Please try again.');
    }
    setSkippingId(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full bg-pink-500 opacity-10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-400 opacity-10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">
        <ArcadeBackButton />

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-black tracking-tighter leading-none mb-3" style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)' }}>
            <span className="text-white">8</span>
            <span className="bg-gradient-to-r from-pink-400 via-teal-300 to-pink-400 bg-clip-text text-transparent">Plus</span>
            <span className="text-white">Music</span>
          </h1>
          <p className="text-zinc-500 text-xs tracking-[0.3em] uppercase">Live Queue</p>
        </div>

        {/* TikTok Live Link */}
        <a
          href={TIKTOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl mb-8 transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: 'linear-gradient(90deg, #ec4899 0%, #2dd4bf 100%)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="black">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .6.05.88.13v-3.5a6.37 6.37 0 0 0-1-.08A6.34 6.34 0 0 0 0 15.82a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a9.69 9.69 0 0 0 5.66 1.81V7.05a4.83 4.83 0 0 1-1.75-.36z" />
          </svg>
          <span className="font-bold text-black text-sm tracking-wide">Watch the Live Stream on TikTok</span>
        </a>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 text-sm">Loading queue...</p>
          </div>
        ) : error && songs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-sm">{error}</p>
          </div>
        ) : (
          <>
            {/* Voting section — for the song at the front of the queue */}
            {nowPlaying && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-8 relative overflow-hidden">
                {voteBurst && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                    style={{ animation: 'voteBurst 1.2s ease-out forwards' }}
                  >
                    <span
                      className="font-black text-6xl"
                      style={{
                        color: voteBurst === 'LIKE' ? '#ec4899' : '#2dd4bf',
                        textShadow: voteBurst === 'LIKE'
                          ? '0 0 20px rgba(236,72,153,0.6)'
                          : '0 0 20px rgba(45,212,191,0.6)',
                      }}
                    >
                      {voteBurst === 'LIKE' ? '♥' : '✕'}
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <p className="text-xs tracking-widest uppercase text-zinc-600 mb-1">Now Playing — Vote Now</p>
                  <h2 className="font-black text-lg text-white truncate">{nowPlaying.song_name}</h2>
                  <p className="text-sm text-zinc-400 mt-0.5">{nowPlaying.artist_name}</p>
                  {voteCountdown > 0 ? (
                    <p className="text-sm text-zinc-400 mt-2">
                      <span className="font-mono font-bold" style={{ color: voteCountdown <= 10 ? '#ec4899' : '#2dd4bf' }}>
                        {voteCountdown}
                      </span>
                      <span className="text-zinc-600"> seconds left to vote</span>
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-600 mt-2">Voting closed for this song</p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-8">
                  {/* Like button */}
                  <button
                    onClick={() => handleVote('like')}
                    disabled={voteCountdown === 0}
                    className="flex flex-col items-center gap-2 group disabled:opacity-30"
                    aria-label="Vote like"
                  >
                    <div
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                        userVote === 'like' ? 'vote-btn-active-pink' : 'vote-btn-idle'
                      }`}
                      style={{
                        borderColor: userVote === 'like' ? '#ec4899' : 'rgba(236,72,153,0.3)',
                        background: userVote === 'like' ? 'rgba(236,72,153,0.15)' : 'rgba(0,0,0,0.4)',
                      }}
                    >
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ animation: userVote === 'like' ? 'votePop 0.5s ease' : undefined }}>
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#ec4899" strokeWidth="2" />
                        <circle cx="13" cy="14" r="1.5" fill="#ec4899" />
                        <circle cx="23" cy="14" r="1.5" fill="#ec4899" />
                        <path d="M12 21 Q18 26 24 21" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" fill="none" />
                        <path
                          d="M18 30 C17 29 15 28 15 26.5 C15 25.5 16 25 17 25.5 C17.5 25 18 25 18 25 C18 25 18.5 25 19 25.5 C20 25 21 25.5 21 26.5 C21 28 19 29 18 30 Z"
                          fill="#ec4899"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-bold" style={{ color: userVote === 'like' ? '#ec4899' : 'rgba(255,255,255,0.5)' }}>
                      {likes}
                    </span>
                  </button>

                  {/* Dislike button */}
                  <button
                    onClick={() => handleVote('dislike')}
                    disabled={voteCountdown === 0}
                    className="flex flex-col items-center gap-2 group disabled:opacity-30"
                    aria-label="Vote dislike"
                  >
                    <div
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                        userVote === 'dislike' ? 'vote-btn-active-teal' : 'vote-btn-idle'
                      }`}
                      style={{
                        borderColor: userVote === 'dislike' ? '#2dd4bf' : 'rgba(45,212,191,0.3)',
                        background: userVote === 'dislike' ? 'rgba(45,212,191,0.15)' : 'rgba(0,0,0,0.4)',
                      }}
                    >
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ animation: userVote === 'dislike' ? 'votePop 0.5s ease' : undefined }}>
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#2dd4bf" strokeWidth="2" />
                        <path d="M11 13 L15 14" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" />
                        <path d="M21 14 L25 13" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="13" cy="17" r="1" fill="#2dd4bf" opacity="0.7" />
                        <circle cx="23" cy="17" r="1" fill="#2dd4bf" opacity="0.7" />
                        <path d="M12 24 Q18 19 24 24" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" fill="none" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold" style={{ color: userVote === 'dislike' ? '#2dd4bf' : 'rgba(255,255,255,0.5)' }}>
                      {dislikes}
                    </span>
                  </button>
                </div>

                {/* Vote bar */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                    <span style={{ color: '#ec4899' }}>{likes} likes</span>
                    <span style={{ color: '#2dd4bf' }}>{dislikes} dislikes</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden flex bg-black/40">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${(likes / Math.max(1, likes + dislikes)) * 100}%`,
                        background: 'linear-gradient(90deg, #ec4899, #f472b6)',
                      }}
                    />
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${(dislikes / Math.max(1, likes + dislikes)) * 100}%`,
                        background: 'linear-gradient(90deg, #2dd4bf, #5eead4)',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Queue with skip options per song */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold tracking-widest uppercase text-zinc-400 mb-4">
                Queue ({songs.length})
              </h3>

              {songs.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
                  <Music size={32} className="mx-auto text-zinc-700 mb-4" />
                  <p className="text-zinc-500 text-sm">No songs in the queue yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {songs.map((song, i) => {
                    const isSkipping = skippingId === song.id;
                    const isSuccess = successId === song.id;
                    const selectedTier = selectedSkip[song.id];

                    return (
                      <div
                        key={song.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          i === 0
                            ? 'bg-teal-500/5 border-teal-500/20'
                            : isSuccess
                            ? 'bg-teal-500/10 border-teal-500/30'
                            : 'border-white/5 hover:border-white/10'
                        }`}
                      >
                        {/* Song info row */}
                        <div className="flex items-center gap-4">
                          <span className="text-zinc-600 font-mono text-sm w-6 text-right flex-shrink-0">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{song.song_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-zinc-500">{song.artist_name}</p>
                              {song.is_ai_music && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-500">
                                  {song.ai_type === 'hybrid' ? 'Hybrid AI' : 'Fully AI'}
                                </span>
                              )}
                            </div>
                          </div>
                          {song.is_paid && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-bold"
                              style={{
                                background: song.tier === 'spot_1' ? '#ef444418' : song.tier === 'skip_15' ? '#f59e0b18' : '#ec489918',
                                color: song.tier === 'spot_1' ? '#ef4444' : song.tier === 'skip_15' ? '#f59e0b' : '#ec4899',
                              }}
                            >
                              {song.tier === 'spot_1' ? 'Spot 1' : song.tier === 'skip_15' ? 'Near Front' : 'Skip Ahead'}
                            </span>
                          )}
                        </div>

                        {/* Skip options for this song */}
                        {isSuccess ? (
                          <div className="flex items-center justify-center gap-2 mt-3 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm">
                            <CheckCircle size={16} />
                            <span>Queue rearranged! This song moved up.</span>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <div className="grid grid-cols-3 gap-2">
                              {SKIP_TIERS.map(tier => {
                                const Icon = tier.icon;
                                const isSelected = selectedTier === tier.id;
                                return (
                                  <button
                                    key={tier.id}
                                    onClick={() =>
                                      setSelectedSkip(prev => ({
                                        ...prev,
                                        [song.id]: isSelected ? undefined : tier.id,
                                      }))
                                    }
                                    disabled={isSkipping}
                                    className={`flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all disabled:opacity-50 ${
                                      isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                                    }`}
                                    style={{
                                      background: isSelected ? `${tier.accent}20` : `${tier.accent}08`,
                                      border: `1px solid ${isSelected ? tier.accent : `${tier.accent}25`}`,
                                    }}
                                  >
                                    <Icon size={14} style={{ color: tier.accent }} />
                                    <span className="text-xs font-bold" style={{ color: tier.accent }}>
                                      ${tier.price}
                                    </span>
                                    <span className="text-[9px] text-zinc-500 text-center leading-tight">
                                      {tier.name}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            {selectedTier && (
                              <button
                                onClick={() => handleSkip(song.id)}
                                disabled={isSkipping}
                                className="w-full flex items-center justify-center gap-2 mt-2 py-2.5 rounded-xl font-bold text-black text-sm transition-all disabled:opacity-50 hover:opacity-90"
                                style={{
                                  background: `linear-gradient(90deg, ${
                                    SKIP_TIERS.find(t => t.id === selectedTier)?.accent ?? '#ec4899'
                                  }, #2dd4bf)`,
                                }}
                              >
                                {isSkipping ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Rearranging...</span>
                                  </>
                                ) : (
                                  <>
                                    <Zap size={14} />
                                    <span>Skip this song</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top 10 Chart */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={16} className="text-pink-400" />
                <h3 className="text-sm font-semibold tracking-widest uppercase text-zinc-400">
                  Top 10 Chart
                </h3>
              </div>
              {chartLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : chart.length === 0 ? (
                <div className="text-center py-8 rounded-xl border border-dashed border-white/10">
                  <Trophy size={24} className="mx-auto text-zinc-700 mb-2" />
                  <p className="text-zinc-500 text-sm">No chart entries yet. Vote to rank songs!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chart.map((entry, i) => (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-4 rounded-xl p-3 transition-all ${
                        i < 3
                          ? 'border border-pink-500/20 bg-pink-500/5'
                          : 'border border-white/5 bg-white/[0.02]'
                      }`}
                    >
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
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-pink-400 font-mono">+{entry.likes}</span>
                        <span className="text-xs text-teal-400 font-mono">-{entry.dislikes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
