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
  play_started_at: string | null;
  played_at: string | null;
}

const TIKTOK_URL = 'https://www.tiktok.com/@8plusmusic?lang=en';

const SKIP_TIERS = [
  { id: 'skip_7', name: 'Skip Ahead', price: 7, desc: 'Jump past 70% of the queue.', accent: '#ec4899', icon: Zap },
  { id: 'skip_15', name: 'Near Front', price: 15, desc: 'Skip to the top 15% of the queue.', accent: '#f59e0b', icon: ChevronUp },
  { id: 'spot_1', name: 'Spot 1', price: 40, desc: 'Jump to the absolute front.', accent: '#ef4444', icon: Crown },
];

const PLAY_GRACE = 30;   // seconds after play button before voting opens
const VOTE_WINDOW = 60;  // seconds of voting

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
  const [voteBurst, setVoteBurst] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const voterIdRef = useRef(getOrCreateVoterId());
  const lastVoteSongIdRef = useRef<string | null>(null);

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

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Auto-refresh queue every 5 seconds for responsive voting sync
  useEffect(() => {
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Tick every second for countdown
  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, []);

  // Find the song the admin started playing
  const playingSong = songs.find(s => s.play_started_at);

  // Compute voting phase from server timestamp
  const playStartMs = playingSong ? new Date(playingSong.play_started_at!).getTime() : 0;
  const elapsedSec = playingSong ? Math.floor((now - playStartMs) / 1000) : 0;

  type VotePhase = 'idle' | 'grace' | 'voting' | 'closed';
  let phase: VotePhase = 'idle';
  let countdown = 0;

  if (playingSong) {
    if (elapsedSec < PLAY_GRACE) {
      phase = 'grace';
      countdown = PLAY_GRACE - elapsedSec;
    } else if (elapsedSec < PLAY_GRACE + VOTE_WINDOW) {
      phase = 'voting';
      countdown = VOTE_WINDOW - (elapsedSec - PLAY_GRACE);
    } else {
      phase = 'closed';
    }
  }

  // Fetch vote counts when the playing song changes
  useEffect(() => {
    if (!playingSong || playingSong.id === lastVoteSongIdRef.current) return;
    lastVoteSongIdRef.current = playingSong.id;

    setLikes(0);
    setDislikes(0);
    setUserVote(null);

    const fetchVotes = async () => {
      try {
        const data = await fetchEdgeJson<{ likes: number; dislikes: number }>(
          `song-vote?upload_id=${playingSong.id}`
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
          .eq('upload_id', playingSong.id)
          .eq('voter_id', voterIdRef.current)
          .maybeSingle();
        if (existing) setUserVote(existing.vote_type as 'like' | 'dislike');
      } catch {
        // ignore
      }
    };
    fetchVotes();
  }, [playingSong?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!playingSong || phase !== 'voting') return;

    const prevVote = userVote;
    // Optimistic update
    if (prevVote === voteType) {
      if (voteType === 'like') setLikes(l => l - 1);
      else setDislikes(d => d - 1);
      setUserVote(null);
    } else if (prevVote === null) {
      if (voteType === 'like') setLikes(l => l + 1);
      else setDislikes(d => d + 1);
      setUserVote(voteType);
    } else {
      if (voteType === 'like') {
        setLikes(l => l + 1);
        setDislikes(d => d - 1);
      } else {
        setDislikes(d => d + 1);
        setLikes(l => l - 1);
      }
      setUserVote(voteType);
    }

    setVoteBurst(voteType === 'like' ? 'LIKE' : 'DISLIKE');
    setTimeout(() => setVoteBurst(null), 1200);

    try {
      const data = await fetchEdgeJson<{ likes: number; dislikes: number }>('song-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upload_id: playingSong.id,
          vote_type: voteType,
          voter_id: voterIdRef.current,
        }),
      });
      setLikes(data.likes || 0);
      setDislikes(data.dislikes || 0);
    } catch {
      // Revert optimistic update on error
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
            {/* Voting section — driven by admin's play button */}
            {playingSong && (
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
                  <p className="text-xs tracking-widest uppercase text-zinc-600 mb-1">
                    {phase === 'grace' ? 'Get Ready — Voting Opens Soon' : phase === 'voting' ? 'Now Playing — Vote Now' : 'Voting Closed'}
                  </p>
                  <h2 className="font-black text-lg text-white truncate">{playingSong.song_name}</h2>
                  <p className="text-sm text-zinc-400 mt-0.5">{playingSong.artist_name}</p>

                  {phase === 'grace' && (
                    <div className="mt-3">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/30">
                        <span className="text-sm text-zinc-400">Voting opens in</span>
                        <span className="font-mono font-black text-2xl text-pink-400" style={{ animation: 'votePop 1s ease infinite' }}>
                          {countdown}
                        </span>
                        <span className="text-sm text-zinc-400">s</span>
                      </div>
                      {/* Progress bar for grace period */}
                      <div className="mt-3 h-1.5 rounded-full bg-black/40 overflow-hidden max-w-xs mx-auto">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-1000"
                          style={{ width: `${((PLAY_GRACE - countdown) / PLAY_GRACE) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {phase === 'voting' && (
                    <p className="text-sm text-zinc-400 mt-2">
                      <span className="font-mono font-bold" style={{ color: countdown <= 10 ? '#ec4899' : '#2dd4bf' }}>
                        {countdown}
                      </span>
                      <span className="text-zinc-600"> seconds left to vote</span>
                    </p>
                  )}

                  {phase === 'closed' && (
                    <p className="text-sm text-zinc-600 mt-2">Voting closed for this song</p>
                  )}
                </div>

                {/* Vote buttons — disabled during grace and closed phases */}
                <div className={`flex items-center justify-center gap-8 ${phase !== 'voting' ? 'opacity-40 pointer-events-none' : ''}`}>
                  {/* Like button with hover glow */}
                  <button
                    onClick={() => handleVote('like')}
                    disabled={phase !== 'voting'}
                    className="flex flex-col items-center gap-2 group"
                    aria-label="Vote like"
                  >
                    <div
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 vote-btn-idle ${
                        userVote === 'like' ? 'vote-btn-active-pink' : ''
                      } ${userVote === 'like' ? '' : 'vote-glow-pink'}`}
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

                  {/* Dislike button with hover glow */}
                  <button
                    onClick={() => handleVote('dislike')}
                    disabled={phase !== 'voting'}
                    className="flex flex-col items-center gap-2 group"
                    aria-label="Vote dislike"
                  >
                    <div
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 vote-btn-idle ${
                        userVote === 'dislike' ? 'vote-btn-active-teal' : ''
                      } ${userVote === 'dislike' ? '' : 'vote-glow-teal'}`}
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
                {(phase === 'voting' || phase === 'closed') && (
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
                )}
              </div>
            )}

            {!playingSong && songs.length > 0 && (() => {
              const sortedSongs = [...songs].sort((a, b) => a.queue_position - b.queue_position);
              const nextSong = sortedSongs[0];
              return (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-8 text-center">
                  <p className="text-xs tracking-widest uppercase text-zinc-600 mb-2">Up Next</p>
                  <h2 className="font-black text-lg text-white truncate mb-1">{nextSong.song_name}</h2>
                  <p className="text-sm text-zinc-400">{nextSong.artist_name}</p>
                  <p className="text-sm text-teal-300 mt-3">
                    Voting for this song will start soon.
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">Voting opens when the creator presses Play.</p>
                </div>
              );
            })()}

            {/* TikTok Live Link — opens in a separate popup window */}
            <button
              onClick={() => window.open(TIKTOK_URL, 'tiktok_live', 'width=420,height=740,scrollbars=yes,resizable=yes')}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl mb-8 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              style={{
                background: 'linear-gradient(90deg, #ec4899 0%, #2dd4bf 100%)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="black">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .6.05.88.13v-3.5a6.37 6.37 0 0 0-1-.08A6.34 6.34 0 0 0 0 15.82a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a9.69 9.69 0 0 0 5.66 1.81V7.05a4.83 4.83 0 0 1-1.75-.36z" />
              </svg>
              <span className="font-bold text-black text-sm tracking-wide">Watch the Live Stream on TikTok</span>
            </button>

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
                                    className={`skip-option-hover flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all disabled:opacity-50 ${
                                      isSelected ? 'scale-[1.02]' : ''
                                    }`}
                                    style={{
                                      background: isSelected ? `${tier.accent}20` : `${tier.accent}08`,
                                      border: `1px solid ${isSelected ? tier.accent : `${tier.accent}25`}`,
                                    }}
                                    onMouseEnter={e => {
                                      if (!isSelected) {
                                        e.currentTarget.style.background = `${tier.accent}15`;
                                        e.currentTarget.style.borderColor = `${tier.accent}50`;
                                        e.currentTarget.style.boxShadow = `0 0 16px ${tier.accent}40`;
                                      }
                                    }}
                                    onMouseLeave={e => {
                                      if (!isSelected) {
                                        e.currentTarget.style.background = `${tier.accent}08`;
                                        e.currentTarget.style.borderColor = `${tier.accent}25`;
                                        e.currentTarget.style.boxShadow = '';
                                      }
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

            {/* Chart link */}
            <a
              href="/chart"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl mb-8 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              style={{
                background: 'linear-gradient(90deg, #2dd4bf 0%, #ec4899 100%)',
              }}
            >
              <Trophy size={20} className="text-black" />
              <span className="font-bold text-black text-sm tracking-wide">View the 8Plus Music Charts</span>
            </a>
          </>
        )}
      </div>
    </div>
  );
}
