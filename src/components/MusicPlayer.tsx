import { useState, useEffect, useCallback } from 'react';
import { Music, Zap, ChevronUp, Crown, Loader2, CheckCircle } from 'lucide-react';
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
    desc: 'Jump past 70% of the queue.',
    accent: '#ec4899',
    icon: Zap,
  },
  {
    id: 'skip_15',
    name: 'Near Front',
    price: 15,
    desc: 'Skip to the top 15% of the queue.',
    accent: '#f59e0b',
    icon: ChevronUp,
  },
  {
    id: 'spot_1',
    name: 'Spot 1',
    price: 40,
    desc: 'Jump to the absolute front.',
    accent: '#ef4444',
    icon: Crown,
  },
];

function getMyUploadIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem('8pm_my_uploads') || '[]');
  } catch {
    return [];
  }
}

export default function MusicPlayer() {
  const [songs, setSongs] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [skipping, setSkipping] = useState(false);
  const [skipSuccess, setSkipSuccess] = useState<string | null>(null);
  const [selectedSkip, setSelectedSkip] = useState<string | null>(null);
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

  // Auto-refresh queue every 10 seconds to catch repositioning
  useEffect(() => {
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const mySongs = songs.filter(s => mySongIds.includes(s.id));

  const handleSkip = async () => {
    if (!selectedSkip || mySongs.length === 0) return;
    setSkipping(true);
    setSkipSuccess(null);
    try {
      // Skip the user's most recent song
      const songToSkip = mySongs[mySongs.length - 1];
      await fetchEdgeJson('skip-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upload_id: songToSkip.id, tier: selectedSkip }),
      });
      setSkipSuccess(selectedSkip);
      setSelectedSkip(null);
      setTimeout(() => setSkipSuccess(null), 4000);
      fetchQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not skip. Please try again.');
    }
    setSkipping(false);
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
            {/* Full Queue */}
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Skip options at the bottom */}
            {mySongs.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-sm font-semibold tracking-widest uppercase text-zinc-400 mb-1">
                  Skip the Queue
                </h3>
                <p className="text-xs text-zinc-600 mb-4">
                  Choose one option to move your song up. The queue rearranges automatically.
                </p>

                <div className="space-y-3 mb-4">
                  {SKIP_TIERS.map(tier => {
                    const Icon = tier.icon;
                    const isSelected = selectedSkip === tier.id;
                    const isSuccess = skipSuccess === tier.id;
                    return (
                      <button
                        key={tier.id}
                        onClick={() => setSelectedSkip(isSelected ? null : tier.id)}
                        disabled={skipping || !!skipSuccess}
                        className={`w-full flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all disabled:opacity-50 ${
                          isSelected
                            ? 'border-pink-500/50 bg-pink-500/5'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${tier.accent}15`, border: `1px solid ${tier.accent}30` }}
                        >
                          {isSuccess ? (
                            <CheckCircle size={18} style={{ color: tier.accent }} />
                          ) : (
                            <Icon size={18} style={{ color: tier.accent }} />
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-sm text-white">{tier.name}</span>
                            <span className="font-black text-lg" style={{ color: tier.accent }}>
                              ${tier.price}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">{tier.desc}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                            isSelected ? 'border-pink-500 bg-pink-500' : 'border-zinc-600'
                          }`}
                        >
                          {isSelected && (
                            <div className="w-full h-full rounded-full bg-pink-500 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {skipSuccess && (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm mb-3">
                    <CheckCircle size={16} />
                    <span>Queue rearranged! Your song moved up.</span>
                  </div>
                )}

                <button
                  onClick={handleSkip}
                  disabled={!selectedSkip || skipping || !!skipSuccess}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold tracking-wide text-black transition-all disabled:opacity-40 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: 'linear-gradient(90deg, #ec4899 0%, #2dd4bf 100%)' }}
                >
                  {skipping ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm">Rearranging queue...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>Skip the Queue</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
                <p className="text-sm text-zinc-400 mb-2">
                  Want to skip ahead in the queue?
                </p>
                <p className="text-xs text-zinc-600">
                  Upload a song first, then come back here to choose a skip option.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
