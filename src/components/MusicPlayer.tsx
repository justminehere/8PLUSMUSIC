import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, ArrowLeft, Music, ExternalLink, Volume2 } from 'lucide-react';

const QUEUE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/music-queue`;

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

function getEmbedUrl(url: string): string | null {
  const ytId = getYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
  // SoundCloud and others: use as iframe with the URL
  if (url.includes('soundcloud.com')) {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ec4899&auto_play=true`;
  }
  return null;
}

export default function MusicPlayer() {
  const [songs, setSongs] = useState<UploadItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch(QUEUE_URL);
        const data = await res.json();
        if (data.uploads && data.uploads.length > 0) {
          setSongs(data.uploads);
        } else if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        setError('Could not load the queue. Please try again later.');
      }
      setLoading(false);
    };
    fetchQueue();
  }, []);

  const current = songs[currentIdx];
  const embedUrl = current ? getEmbedUrl(current.song_url) : null;

  const playNext = () => {
    if (currentIdx < songs.length - 1) {
      setCurrentIdx(i => i + 1);
      setIsPlaying(true);
    }
  };

  const playPrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(i => i - 1);
      setIsPlaying(true);
    }
  };

  const selectSong = (idx: number) => {
    setCurrentIdx(idx);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full bg-pink-500 opacity-10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-400 opacity-10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        {/* Back link */}
        <a href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm mb-8">
          <ArrowLeft size={16} />
          Back to 8PlusMusic
        </a>

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
              {isPlaying && embedUrl ? (
                <div className="aspect-video w-full bg-black">
                  <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              ) : !embedUrl ? (
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
              ) : (
                <div className="p-8 text-center">
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #ec4899, #2dd4bf)' }}
                  >
                    <Play size={24} color="black" className="ml-1" />
                  </button>
                  <p className="text-zinc-500 text-xs">Press play to listen</p>
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
                  onClick={() => setIsPlaying(p => !p)}
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
