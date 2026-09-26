import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, ExternalLink, Volume2 } from 'lucide-react';
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
  });
  if (origin) params.set('origin', origin);
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function getSoundCloudEmbedUrl(url: string): string {
  const params = new URLSearchParams({
    url,
    color: '%23ec4899',
    auto_play: 'false',
    buying: 'false',
    sharing: 'false',
    download: 'false',
    show_artwork: 'true',
    visual: 'true',
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function MusicPlayer() {
  const [songs, setSongs] = useState<UploadItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const [iframeKey, setIframeKey] = useState(0);

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

  // Keep onSongEndRef fresh with latest state so event callbacks always see current data
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
      } else {
        if (idx >= newLength) {
          setCurrentIdx(Math.max(0, newLength - 1));
        }
        setIsPlaying(true);
      }
    };
  });

  // Fetch queue on mount
  useEffect(() => {
    const fetchQueue = async () => {
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
    };
    fetchQueue();
  }, []);

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

  // Initialize player when the current song changes (including when songs first load)
  useEffect(() => {
    if (!current || playerType === 'unsupported') return;

    let cancelled = false;
    cleanupPlayers();
    setIframeKey(k => k + 1);

    let attempts = 0;
    const maxAttempts = 25; // 5 seconds at 200ms intervals

    const initTimer = setTimeout(() => {
      const tryInit = () => {
        if (cancelled) return;

        if (playerType === 'youtube' && ytId) {
          if ((window as any).YT && (window as any).YT.Player && iframeRef.current) {
            try {
              ytPlayerRef.current = new (window as any).YT.Player(iframeRef.current, {
                events: {
                  onReady: () => {
                    if (isPlayingRef.current) {
                      try { ytPlayerRef.current?.playVideo(); } catch { /* ignore */ }
                    }
                  },
                  onStateChange: (e: { data: number }) => {
                    if (e.data === 0) {
                      onSongEndRef.current();
                    } else if (e.data === 1) {
                      setIsPlaying(true);
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
                if (isPlayingRef.current) {
                  try { scWidgetRef.current?.play(); } catch { /* ignore */ }
                }
              });
              scWidgetRef.current.bind((window as any).SC.Widget.Events.FINISH, () => {
                onSongEndRef.current();
              });
              scWidgetRef.current.bind((window as any).SC.Widget.Events.PLAY, () => {
                setIsPlaying(true);
              });
            } catch { /* ignore */ }
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(tryInit, 200);
          }
        }
      };
      tryInit();
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
    };
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = useCallback(() => {
    if (playerType === 'youtube' && ytPlayerRef.current) {
      if (isPlaying) {
        try { ytPlayerRef.current.pauseVideo(); } catch { /* ignore */ }
      } else {
        try { ytPlayerRef.current.playVideo(); } catch { /* ignore */ }
      }
    } else if (playerType === 'soundcloud' && scWidgetRef.current) {
      if (isPlaying) {
        try { scWidgetRef.current.pause(); } catch { /* ignore */ }
      } else {
        try { scWidgetRef.current.play(); } catch { /* ignore */ }
      }
    }
    setIsPlaying(p => !p);
  }, [isPlaying, playerType]);

  const playNext = () => {
    if (currentIdx < songs.length - 1) {
      cleanupPlayers();
      setCurrentIdx(i => i + 1);
      setIsPlaying(true);
    }
  };

  const playPrev = () => {
    if (currentIdx > 0) {
      cleanupPlayers();
      setCurrentIdx(i => i - 1);
      setIsPlaying(true);
    }
  };

  const selectSong = (idx: number) => {
    if (idx === currentIdx) {
      togglePlay();
      return;
    }
    cleanupPlayers();
    setCurrentIdx(idx);
    setIsPlaying(true);
  };

  // Compute embed URL — no autoplay in URL; playback is controlled via Player API
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
        {/* Back link */}
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

            {/* Queue list */}
            <div>
              <h3 className="text-sm font-semibold tracking-widest uppercase text-zinc-400 mb-4">
                Up Next ({songs.length})
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
          </>
        )}
      </div>
    </div>
  );
}
