import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, ExternalLink, Volume2, Heart, ThumbsDown, Trophy, ExternalLink as ExtLink } from 'lucide-react';
import { fetchEdgeJson, isSupabaseConfigured } from '../lib/fetchEdge';
import { supabase } from '../lib/supabase';
import ArcadeBackButton from './ArcadeBackButton';

/* eslint-disable @typescript-eslint/no-explicit-any */

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

type PlayerType = 'youtube' | 'soundcloud' | 'unsupported';

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function detectPlayerType(url: string): PlayerType {
  if (getYouTubeId(url)) return 'youtube';
  if (url.includes('soundcloud.com')) return 'soundcloud';
  return 'unsupported';
}

function getYouTubeEmbedUrl(videoId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
    autoplay: '1',
  });
  if (origin) params.set('origin', origin);
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function getSoundCloudEmbedUrl(url: string): string {
  const params = new URLSearchParams({
    url,
    color: '%23ec4899',
    auto_play: 'true',
    buying: 'false',
    sharing: 'false',
    download: 'false',
    show_artwork: 'true',
    visual: 'true',
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const [iframeKey, setIframeKey] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  // Voting state
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [voteCountdown, setVoteCountdown] = useState(60);
  const [voteBurst, setVoteBurst] = useState<string | null>(null);
  const [chart, setChart] = useState<ChartEntry[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  const voterIdRef = useRef(getOrCreateVoterId());

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const scWidgetRef = useRef<any>(null);
  const isPlayingRef = useRef(false);
  const onSongEndRef = useRef<() => void>(() => {});

  const current = songs[currentIdx];
  const playerType = current ? detectPlayerType(current.song_url) : 'unsupported';
  const ytId = current ? getYouTubeId(current.song_url) : null;

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Keep onSongEndRef fresh
  useEffect(() => {
    onSongEndRef.current = () => {
      const idx = currentIdx;
      const endedSong = songs[idx];
      if (!endedSong) return;

      supabase.from('music_uploads').delete().eq('id', endedSong.id).then();

      const newLength = songs.length - 1;
      setSongs(prev => {
        if (!prev[idx] || prev[idx].id !== endedSong.id) return prev;
        return prev.filter((_, i) => i !== idx);
      });

      if (newLength === 0) {
        setIsPlaying(false);
        setAutoPlay(false);
      } else {
        if (idx >= newLength) {
          setCurrentIdx(Math.max(0, newLength - 1));
        }
        setAutoPlay(true);
        setIsPlaying(true);
      }
    };
  });

  // Fetch queue on mount
  const fetchQueue = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('The music queue is temporarily unavailable.');
      setLoading(false);
      return;
    }
    try {
      const data = await fetchEdgeJson<{ uploads: UploadItem[]; error?: string }>('music-queue');
      if (data.uploads && data.uploads.length > 0) {
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

  // Fetch chart
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
    fetchChart();
  }, [fetchChart]);

  // Load external player APIs once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!(window as any).YT && !document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    if (!(window as any).SC && !document.getElementById('sc-widget-api')) {
      const tag = document.createElement('script');
      tag.id = 'sc-widget-api';
      tag.src = 'https://w.soundcloud.com/player/api.js';
      document.head.appendChild(tag);
    }
  }, []);

  const cleanupPlayers = useCallback(() => {
    if (ytPlayerRef.current) {
      try { ytPlayerRef.current.destroy(); } catch { /* ignore */ }
      ytPlayerRef.current = null;
    }
    if (scWidgetRef.current) {
      try { scWidgetRef.current.pause(); } catch { /* ignore */ }
      scWidgetRef.current = null;
    }
  }, []);

  // Initialize player when the current song changes
  useEffect(() => {
    if (!current || playerType === 'unsupported') return;

    let cancelled = false;
    cleanupPlayers();
    setIframeKey(k => k + 1);

    let attempts = 0;
    const maxAttempts = 30;

    const initTimer = setTimeout(() => {
      const tryInit = () => {
        if (cancelled) return;

        if (playerType === 'youtube' && ytId) {
          if ((window as any).YT && (window as any).YT.Player && iframeRef.current) {
            try {
              ytPlayerRef.current = new (window as any).YT.Player(iframeRef.current, {
                events: {
                  onReady: () => {
                    if (isPlayingRef.current || autoPlay) {
                      try { ytPlayerRef.current?.playVideo(); } catch { /* ignore */ }
                      setIsPlaying(true);
                    }
                  },
                  onStateChange: (e: { data: number }) => {
                    if (e.data === 0) {
                      onSongEndRef.current();
                    } else if (e.data === 1) {
                      setIsPlaying(true);
                    } else if (e.data === 2) {
                      setIsPlaying(false);
                    }
                  },
                },
              });
            } catch { /* ignore */ }
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(tryInit, 200);
          }
        } else if (playerType === 'soundcloud') {
          if ((window as any).SC && (window as any).SC.Widget && iframeRef.current) {
            try {
              scWidgetRef.current = (window as any).SC.Widget(iframeRef.current);
              scWidgetRef.current.bind((window as any).SC.Widget.Events.READY, () => {
                if (isPlayingRef.current || autoPlay) {
                  try { scWidgetRef.current?.play(); } catch { /* ignore */ }
                  setIsPlaying(true);
                }
              });
              scWidgetRef.current.bind((window as any).SC.Widget.Events.FINISH, () => {
                onSongEndRef.current();
              });
              scWidgetRef.current.bind((window as any).SC.Widget.Events.PLAY, () => {
                setIsPlaying(true);
              });
              scWidgetRef.current.bind((window as any).SC.Widget.Events.PAUSE, () => {
                setIsPlaying(false);
              });
            } catch { /* ignore */ }
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(tryInit, 200);
          }
        }
      };
      tryInit();
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
    };
  }, [current?.id, autoPlay]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch vote counts when current song changes
  useEffect(() => {
    if (!current) return;
    setLikes(0);
    setDislikes(0);
    setUserVote(null);
    setVoteCountdown(60);

    const fetchVotes = async () => {
      try {
        const data = await fetchEdgeJson<{ likes: number; dislikes: number }>(
          `song-vote?upload_id=${current.id}`
        );
        setLikes(data.likes || 0);
        setDislikes(data.dislikes || 0);
      } catch {
        // ignore
      }

      // Check if this voter already voted
      try {
        const { data: existing } = await supabase
          .from('song_votes')
          .select('vote_type')
          .eq('upload_id', current.id)
          .eq('voter_id', voterIdRef.current)
          .maybeSingle();
        if (existing) setUserVote(existing.vote_type as 'like' | 'dislike');
      } catch {
        // ignore
      }
    };
    fetchVotes();
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 60-second countdown timer for voting
  useEffect(() => {
    if (!current || voteCountdown <= 0) return;
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
  }, [current?.id, voteCountdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = useCallback(() => {
    if (playerType === 'youtube' && ytPlayerRef.current) {
      if (isPlaying) {
        try { ytPlayerRef.current.pauseVideo(); } catch { /* ignore */ }
        setIsPlaying(false);
      } else {
        try { ytPlayerRef.current.playVideo(); } catch { /* ignore */ }
        setIsPlaying(true);
      }
    } else if (playerType === 'soundcloud' && scWidgetRef.current) {
      if (isPlaying) {
        try { scWidgetRef.current.pause(); } catch { /* ignore */ }
        setIsPlaying(false);
      } else {
        try { scWidgetRef.current.play(); } catch { /* ignore */ }
        setIsPlaying(true);
      }
    } else {
      // For unsupported, toggle the isPlaying flag for UI
      setIsPlaying(p => !p);
    }
  }, [isPlaying, playerType]);

  const playNext = useCallback(() => {
    if (currentIdx < songs.length - 1) {
      cleanupPlayers();
      setCurrentIdx(i => i + 1);
      setAutoPlay(true);
      setIsPlaying(true);
    }
  }, [currentIdx, songs.length, cleanupPlayers]);

  const playPrev = useCallback(() => {
    if (currentIdx > 0) {
      cleanupPlayers();
      setCurrentIdx(i => i - 1);
      setAutoPlay(true);
      setIsPlaying(true);
    }
  }, [currentIdx, cleanupPlayers]);

  const selectSong = useCallback((idx: number) => {
    if (idx === currentIdx) {
      togglePlay();
      return;
    }
    cleanupPlayers();
    setCurrentIdx(idx);
    setAutoPlay(true);
    setIsPlaying(true);
  }, [currentIdx, cleanupPlayers, togglePlay]);

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!current) return;
    if (voteCountdown === 0) return;

    // Optimistic UI
    const prevVote = userVote;
    if (prevVote === voteType) {
      // Toggle off
      if (voteType === 'like') setLikes(l => l - 1);
      else setDislikes(d => d - 1);
      setUserVote(null);
    } else if (prevVote === null) {
      // New vote
      if (voteType === 'like') setLikes(l => l + 1);
      else setDislikes(d => d + 1);
    } else {
      // Switch vote
      if (voteType === 'like') {
        setLikes(l => l + 1);
        setDislikes(d => d - 1);
      } else {
        setDislikes(d => d + 1);
        setLikes(l => l - 1);
      }
    }
    setUserVote(voteType === prevVote ? null : voteType);

    // Animate
    setVoteBurst(voteType === 'like' ? 'LIKE' : 'DISLIKE');
    setTimeout(() => setVoteBurst(null), 1200);

    try {
      const data = await fetchEdgeJson<{ likes: number; dislikes: number }>('song-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upload_id: current.id,
          vote_type: voteType,
          voter_id: voterIdRef.current,
        }),
      });
      setLikes(data.likes || 0);
      setDislikes(data.dislikes || 0);
      // Refresh chart
      fetchChart();
    } catch {
      // Revert on failure
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

  // Compute embed URL
  let embedUrl: string | null = null;
  if (current) {
    if (playerType === 'youtube' && ytId) {
      embedUrl = getYouTubeEmbedUrl(ytId);
    } else if (playerType === 'soundcloud') {
      embedUrl = getSoundCloudEmbedUrl(current.song_url);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full bg-pink-500 opacity-10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-400 opacity-10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <ArcadeBackButton />

        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="font-black tracking-tighter leading-none mb-3" style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)' }}>
            <span className="text-white">8</span>
            <span className="bg-gradient-to-r from-pink-400 via-teal-300 to-pink-400 bg-clip-text text-transparent">Plus</span>
            <span className="text-white">Music</span>
          </h1>
          <p className="text-zinc-500 text-xs tracking-[0.3em] uppercase">Player</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 text-sm">Loading queue...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-sm">{error}</p>
            <a href="/upload" className="inline-flex items-center gap-2 mt-6 text-teal-400 hover:text-teal-300 text-sm transition-colors">
              <Music size={14} />
              Upload a song
            </a>
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-white/10">
            <Music size={32} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-sm">No songs in the queue yet.</p>
            <a href="/upload" className="inline-flex items-center gap-2 mt-6 text-teal-400 hover:text-teal-300 text-sm transition-colors">
              <Music size={14} />
              Be the first to upload
            </a>
          </div>
        ) : (
          <>
            {/* Player section */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden mb-8">
              {/* Now playing info */}
              <div className="p-5 border-b border-white/5">
                <p className="text-xs tracking-widest uppercase text-zinc-600 mb-1">Now Playing</p>
                <h2 className="font-black text-xl text-white truncate">{current.song_name}</h2>
                <p className="text-sm text-zinc-400 mt-1">{current.artist_name}</p>
                <div className="flex items-center gap-3 mt-2">
                  {current.instagram_handle && (
                    <a
                      href={`https://instagram.com/${current.instagram_handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:text-pink-300 text-xs transition-colors"
                    >
                      {current.instagram_handle}
                    </a>
                  )}
                  {current.is_ai_music && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">
                      AI {current.ai_type === 'hybrid' ? '(Hybrid)' : '(Complete)'}
                    </span>
                  )}
                  <a
                    href={current.song_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 text-xs transition-colors"
                  >
                    Open link <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {/* Player */}
              {embedUrl ? (
                <div className="relative w-full bg-black" style={{ minHeight: '166px' }}>
                  <div
                    className={playerType === 'youtube' ? 'aspect-video w-full' : 'w-full'}
                    style={playerType === 'soundcloud' ? { height: '166px' } : undefined}
                  >
                    <iframe
                      key={iframeKey}
                      ref={iframeRef}
                      src={embedUrl}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-zinc-500 text-sm mb-4">
                    This song link can't be embedded directly.
                  </p>
                  <a
                    href={current.song_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-black text-sm"
                    style={{ background: 'linear-gradient(90deg, #ec4899 0%, #2dd4bf 100%)' }}
                  >
                    <ExternalLink size={14} />
                    Open Song
                  </a>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 p-4 border-t border-white/5">
                <button
                  onClick={playPrev}
                  disabled={currentIdx === 0}
                  className="p-3 rounded-full text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-all"
                  aria-label="Previous song"
                >
                  <SkipBack size={18} />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #2dd4bf)' }}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={22} color="black" /> : <Play size={22} color="black" className="ml-1" />}
                </button>
                <button
                  onClick={playNext}
                  disabled={currentIdx === songs.length - 1}
                  className="p-3 rounded-full text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-all"
                  aria-label="Next song"
                >
                  <SkipForward size={18} />
                </button>
              </div>
            </div>

            {/* Voting section */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-8 relative overflow-hidden">
              {/* Vote burst animation */}
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
                <p className="text-xs tracking-widest uppercase text-zinc-500 mb-1">Vote for this song</p>
                {voteCountdown > 0 ? (
                  <p className="text-sm text-zinc-400">
                    <span className="font-mono font-bold" style={{ color: voteCountdown <= 10 ? '#ec4899' : '#2dd4bf' }}>
                      {voteCountdown}
                    </span>
                    <span className="text-zinc-600"> seconds left to vote</span>
                  </p>
                ) : (
                  <p className="text-sm text-zinc-600">Voting closed for this song</p>
                )}
              </div>

              <div className="flex items-center justify-center gap-8">
                {/* Like button — smiley with heart */}
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
                    {/* Smiley with heart SVG */}
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ animation: userVote === 'like' ? 'votePop 0.5s ease' : undefined }}>
                      {/* Face */}
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#ec4899" strokeWidth="2" />
                      {/* Eyes */}
                      <circle cx="13" cy="14" r="1.5" fill="#ec4899" />
                      <circle cx="23" cy="14" r="1.5" fill="#ec4899" />
                      {/* Smile */}
                      <path d="M12 21 Q18 26 24 21" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" fill="none" />
                      {/* Heart */}
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

                {/* Dislike button — crying smiley */}
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
                    {/* Crying smiley SVG */}
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ animation: userVote === 'dislike' ? 'votePop 0.5s ease' : undefined }}>
                      {/* Face */}
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#2dd4bf" strokeWidth="2" />
                      {/* Eyes (sad - downturned) */}
                      <path d="M11 13 L15 14" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" />
                      <path d="M21 14 L25 13" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" />
                      {/* Tears */}
                      <circle cx="13" cy="17" r="1" fill="#2dd4bf" opacity="0.7" />
                      <circle cx="23" cy="17" r="1" fill="#2dd4bf" opacity="0.7" />
                      {/* Frown */}
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

            {/* Queue list */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold tracking-widest uppercase text-zinc-400 mb-4">
                Queue ({songs.length})
              </h3>
              <div className="space-y-2">
                {songs.map((song, i) => (
                  <button
                    key={song.id}
                    onClick={() => selectSong(i)}
                    className={`w-full flex items-center gap-4 rounded-xl p-3 text-left transition-all ${
                      i === currentIdx
                        ? 'bg-pink-500/10 border border-pink-500/30'
                        : 'border border-white/5 hover:border-white/10 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="text-zinc-600 font-mono text-sm w-6 text-right flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{song.song_name}</p>
                      <p className="text-xs text-zinc-500">{song.artist_name}</p>
                    </div>
                    {song.is_paid && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 flex-shrink-0">
                        Priority
                      </span>
                    )}
                    {i === currentIdx && isPlaying && (
                      <Volume2 size={14} className="text-teal-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart — Top 10 */}
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
                        <a
                          href={entry.song_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 hover:text-teal-400 transition-colors"
                        >
                          <ExtLink size={12} />
                        </a>
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
