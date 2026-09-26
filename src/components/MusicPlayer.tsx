import { useState, useEffect, useCallback } from 'react';
import { Music, ExternalLink, Zap, ChevronUp, Crown, Loader2, CheckCircle } from 'lucide-react';
import { fetchEdgeJson, isSupabaseConfigured } from '../lib/fetchEdge';
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

const TIKTOK_URL = 'https://www.tiktok.com/@8plusmusic?lang=en';

const SKIP_TIERS = [
  {
    id: 'skip_7',
    name: 'Skip Ahead',
    price: 7,
    desc: 'Jump past 70% of the queue. Get heard sooner.',
    accent: '#ec4899',
    icon: Zap,
  pct: '30%',
  },
  {
    id: 'skip_15',
    name: 'Near Front',
    price: 15,
    desc: 'Skip to the top 15% of the queue. Almost front of the line.',
    accent: '#f59e0b',
    icon: ChevronUp,
    pct: '15%',
  },
  {
    id: 'spot_1',
    name: 'Spot 1',
    price: 40,
    desc: 'Jump to the absolute front. Your song plays next.',
    accent: '#ef4444',
    icon: Crown,
    pct: '1',
  },
];

function getMyUploadIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem('8pm_my_uploads') || '[]');
  } catch {
    return [];
  }
}

function addMyUploadId(id: string) {
  const ids = getMyUploadIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem('8pm_my_uploads', JSON.stringify(ids));
  }
}

export default function MusicPlayer() {
  const [songs, setSongs] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [skipping, setSkipping] = useState<string | null>(null);
  const [skipSuccess, setSkipSuccess] = useState<string | null>(null);
  const [mySongIds] = useState<string[]>(getMyUploadIds);

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

  // Auto-refresh queue every 15 seconds to catch repositioning
  useEffect(() => {
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const mySongs = songs.filter(s => mySongIds.includes(s.id));
  const otherSongs = songs.filter(s => !mySongIds.includes(s.id));

  const handleSkip = async (songId: string, tierId: string) => {
    setSkipping(tierId);
    setSkipSuccess(null);
    try {
      await fetchEdgeJson('skip-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upload_id: songId, tier: tierId }),
      });
      setSkipSuccess(tierId);
      setTimeout(() => setSkipSuccess(null), 3000);
      fetchQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not skip. Please try again.');
    }
    setSkipping(null);
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
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl mb-10 transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: 'linear-gradient(90deg, #ec4899 0%, #2dd4bf 100%)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="black">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .6.05.88.13v-3.5a6.37 6.37 0 0 0-1-.08A6.34 6.34 0 0 0 0 15.82a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a9.69 9.69 0 0 0 5.66 1.81V7.05a4.83 4.83 0 0 1-1.75-.36z" />
          </svg>
          <span className="font-bold text-black text-sm tracking-wide">Watch the Live Stream on TikTok</span>
          <ExternalLink size={14} className="text-black/70" />
        </a>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 text-sm">Loading queue...</p>
          </div>
        ) : error && songs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-sm">{error}</p>
            <a href="/upload" className="inline-flex items-center gap-2 mt-6 text-teal-400 hover:text-teal-300 text-sm transition-colors">
              <Music size={14} />
              Upload a song
            </a>
          </div>
        ) : (
          <>
            {/* My songs that can be skipped */}
            {mySongs.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold tracking-widest uppercase text-zinc-400 mb-4">
                  Your Songs ({mySongs.length})
                </h3>
                <div className="space-y-3">
                  {mySongs.map(song => (
                    <div
                      key={song.id}
                      className="rounded-2xl border border-pink-500/20 bg-pink-500/[0.03] p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-zinc-600 font-mono text-sm w-6 text-right flex-shrink-0">
                          {song.queue_position}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{song.song_name}</p>
                          <p className="text-xs text-zinc-500">{song.artist_name}</p>
                        </div>
                        <a
                          href={song.song_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-teal-400 hover:text-teal-300 transition-colors flex-shrink-0"
                        >
                          Open
                        </a>
                      </div>
                      {/* Skip options for this song */}
                      <div className="grid grid-cols-3 gap-2">
                        {SKIP_TIERS.map(tier => {
                          const Icon = tier.icon;
                          const isSkipping = skipping === tier.id;
                          const isSuccess = skipSuccess === tier.id;
                          return (
                            <button
                              key={tier.id}
                              onClick={() => handleSkip(song.id, tier.id)}
                              disabled={isSkipping || isSuccess}
                              className="flex flex-col items-center gap-1 rounded-xl p-3 transition-all disabled:opacity-50 hover:scale-[1.02]"
                              style={{
                                background: `${tier.accent}10`,
                                border: `1px solid ${tier.accent}30`,
                              }}
                            >
                              {isSuccess ? (
                                <CheckCircle size={16} style={{ color: tier.accent }} />
                              ) : isSkipping ? (
                                <Loader2 size={16} className="animate-spin" style={{ color: tier.accent }} />
                              ) : (
                                <Icon size={16} style={{ color: tier.accent }} />
                              )}
                              <span className="text-xs font-bold" style={{ color: tier.accent }}>
                                {isSuccess ? 'Done!' : `$${tier.price}`}
                              </span>
                              <span className="text-[10px] text-zinc-500 text-center leading-tight">
                                {tier.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Queue */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold tracking-widest uppercase text-zinc-400">
                  Queue ({songs.length})
                </h3>
                <a
                  href="/upload"
                  className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 text-xs transition-colors"
                >
                  <Music size={12} />
                  Upload
                </a>
              </div>

              {songs.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
                  <Music size={32} className="mx-auto text-zinc-700 mb-4" />
                  <p className="text-zinc-500 text-sm">No songs in the queue yet.</p>
                  <a href="/upload" className="inline-flex items-center gap-2 mt-6 text-teal-400 hover:text-teal-300 text-sm transition-colors">
                    <Music size={14} />
                    Be the first to upload
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {songs.map((song, i) => {
                    const isMine = mySongIds.includes(song.id);
                    return (
                      <div
                        key={song.id}
                        className={`flex items-center gap-4 rounded-xl p-3 transition-all ${
                          isMine
                            ? 'bg-pink-500/10 border border-pink-500/30'
                            : i === 0
                            ? 'bg-teal-500/5 border border-teal-500/20'
                            : 'border border-white/5 hover:border-white/10 hover:bg-white/[0.03]'
                        }`}
                      >
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
                        {isMine && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 flex-shrink-0 font-bold">
                            Yours
                          </span>
                        )}
                        <a
                          href={song.song_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 hover:text-teal-400 transition-colors flex-shrink-0"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Skip info for users who haven't uploaded */}
            {mySongs.length === 0 && songs.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
                <p className="text-sm text-zinc-400 mb-2">
                  Want to skip ahead in the queue?
                </p>
                <p className="text-xs text-zinc-600">
                  Upload a song first, then come back here to choose a skip option. Your song moves up automatically.
                </p>
                <a
                  href="/upload"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl font-semibold text-black text-sm transition-all hover:scale-[1.01]"
                  style={{ background: 'linear-gradient(90deg, #ec4899, #2dd4bf)' }}
                >
                  <Music size={14} />
                  Upload a Song
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
