import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { EPS } from '../lib/tracks';
import { edgeFunctionUrl } from '../lib/fetchEdge';
import { Mail, MessageCircle, LogOut, RefreshCw, X, Link2, Check, Trash2, Music, ArrowUp, ArrowDown, ChevronsUp, Play, Square, ExternalLink } from 'lucide-react';
import ArcadeBackButton from './ArcadeBackButton';

const ADMIN_PASSWORD = 'Jamilujuhudbu1!';
const ADMIN_EMAIL    = 'bunevd@gmail.com';

async function trackLinksApi(body: Record<string, string>) {
  const res = await fetch(edgeFunctionUrl('track-links-admin'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_PASSWORD}`,
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  country: string;
  subject: string;
  message: string;
  created_at: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  Music: '#ec4899',
  Marketing: '#f97316',
  Sales: '#22c55e',
  Distribution: '#3b82f6',
  Sponsorship: '#2dd4bf',
};

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  created_at: string;
}

interface TrackLink {
  id: string;
  ep: string;
  track_title: string;
  itunes_url: string;
}

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
  real_name: string | null;
  phone_number: string | null;
  tiktok_link: string | null;
  production_year: string | null;
  lyrics_writer: string | null;
  note_for_8plus: string | null;
}

type Tab = 'links' | 'contacts' | 'chat' | 'queue';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString([], {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Login ─────────────────────────────────────────────────────────────────────
function Login({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw]       = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem('8pm_admin', '1');
      onLogin();
    } else {
      setError('Incorrect password.');
      setPw('');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-pink-500 opacity-[0.08] blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-teal-400 opacity-[0.08] blur-3xl pointer-events-none" />

      <div
        className="relative z-10 w-full max-w-sm rounded-2xl p-8"
        style={{ background: '#0d0d0d', border: '1px solid rgba(236,72,153,0.2)' }}
      >
        <div className="text-center mb-8">
          <h1 className="font-black text-3xl text-white tracking-tighter mb-1">
            8Plus<span className="bg-gradient-to-r from-pink-400 to-teal-400 bg-clip-text text-transparent">Music</span>
          </h1>
          <p className="text-zinc-500 text-sm tracking-widest uppercase">Admin Dashboard</p>
          <p className="text-zinc-600 text-xs mt-2">{ADMIN_EMAIL}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs tracking-widest uppercase text-zinc-500 mb-2">Password</label>
            <input
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setError(''); }}
              placeholder="Enter admin password"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/50 transition-all"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-black hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(90deg, #ec4899 0%, #2dd4bf 100%)' }}
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <ArcadeBackButton label="BACK TO SITE" />
        </div>
      </div>
    </div>
  );
}

// ── Track Links Manager ───────────────────────────────────────────────────────
function TrackLinksManager({ trackLinks, onRefresh }: { trackLinks: TrackLink[]; onRefresh: () => void }) {
  // draft[ep][trackTitle] = current URL string being edited
  const [drafts, setDrafts]     = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving]     = useState<Record<string, boolean>>({});
  const [saved, setSaved]       = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  const linkMap: Record<string, TrackLink> = {};
  trackLinks.forEach(l => { linkMap[`${l.ep}::${l.track_title}`] = l; });

  const getDraft = (ep: string, title: string) => {
    return drafts[ep]?.[title] ?? linkMap[`${ep}::${title}`]?.itunes_url ?? '';
  };

  const setDraft = (ep: string, title: string, value: string) => {
    setDrafts(prev => ({
      ...prev,
      [ep]: { ...prev[ep], [title]: value },
    }));
  };

  const rowKey = (ep: string, title: string) => `${ep}::${title}`;

  const handleSave = async (ep: string, title: string) => {
    const url = getDraft(ep, title).trim();
    if (!url) return;
    const key = rowKey(ep, title);
    setSaving(p => ({ ...p, [key]: true }));

    await trackLinksApi({ action: 'upsert', ep, track_title: title, itunes_url: url });

    setSaving(p => ({ ...p, [key]: false }));
    setSaved(p => ({ ...p, [key]: true }));
    setTimeout(() => setSaved(p => ({ ...p, [key]: false })), 2000);
    onRefresh();
  };

  const handleDelete = async (ep: string, title: string) => {
    const key = rowKey(ep, title);
    setDeleting(p => ({ ...p, [key]: true }));
    await trackLinksApi({ action: 'delete', ep, track_title: title });
    setDraft(ep, title, '');
    setDeleting(p => ({ ...p, [key]: false }));
    onRefresh();
  };

  return (
    <div className="space-y-8">
      {EPS.map(ep => (
        <div
          key={ep.id}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* EP header */}
          <div
            className="px-5 py-4 flex items-center gap-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: `${ep.coverColor}0a` }}
          >
            <img src={ep.imageUrl} alt={ep.label} className="w-12 h-12 rounded-xl object-cover" />
            <div>
              <h3 className="font-black text-white tracking-tight">{ep.label}</h3>
              <p className="text-xs text-zinc-500">{ep.tracks.length} tracks</p>
            </div>
          </div>

          {/* Track rows */}
          <div className="divide-y divide-white/5">
            {ep.tracks.map((track, i) => {
              const key = rowKey(ep.id, track.title);
              const existing = linkMap[key];
              const draft = getDraft(ep.id, track.title);
              const isSaving  = saving[key];
              const isSaved   = saved[key];
              const isDeleting = deleting[key];
              const hasLink = !!existing;

              return (
                <div key={track.title} className="px-5 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  {/* Number + name */}
                  <div className="flex items-center gap-3 min-w-0 flex-shrink-0 w-48">
                    <span
                      className="text-xs font-mono w-5 text-center flex-shrink-0"
                      style={{ color: ep.coverColor, opacity: 0.5 }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Music size={12} className="flex-shrink-0" style={{ color: ep.coverColor, opacity: 0.5 }} />
                    <span className="text-sm text-zinc-300 truncate font-medium">{track.title}</span>
                  </div>

                  {/* URL input */}
                  <input
                    type="url"
                    value={draft}
                    onChange={e => setDraft(ep.id, track.title, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(ep.id, track.title); }}
                    placeholder="Paste iTunes link..."
                    className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-pink-500/40 transition-all"
                  />

                  {/* Save button */}
                  <button
                    onClick={() => handleSave(ep.id, track.title)}
                    disabled={!draft.trim() || isSaving}
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-90"
                    style={{
                      background: isSaved
                        ? 'rgba(34,197,94,0.2)'
                        : `linear-gradient(135deg, ${ep.coverColor}, ${ep.coverAccent})`,
                    }}
                    title="Save link"
                  >
                    {isSaved
                      ? <Check size={14} className="text-green-400" />
                      : <Link2 size={14} color={isSaving ? '#999' : 'black'} />
                    }
                  </button>

                  {/* Delete button (only if link exists) */}
                  {hasLink && (
                    <button
                      onClick={() => handleDelete(ep.id, track.title)}
                      disabled={isDeleting}
                      className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-red-500/20 transition-all disabled:opacity-30"
                      title="Remove link"
                    >
                      <Trash2 size={14} className="text-zinc-500 hover:text-red-400 transition-colors" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Music Queue Manager ─────────────────────────────────────────────────────
function DetailField({ label, value, link }: { label: string; value: string | null; link?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs tracking-widest uppercase text-zinc-600">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-400 hover:text-teal-300 transition-colors break-all">
          {value}
        </a>
      ) : (
        <span className="text-sm text-zinc-300 break-words">{value}</span>
      )}
    </div>
  );
}

const PLAY_GRACE = 30;
const VOTE_WINDOW = 60;
const SONG_DURATION_MS = (PLAY_GRACE + VOTE_WINDOW) * 1000;

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');

    // YouTube: youtube.com/watch?v=ID or youtu.be/ID or youtube.com/shorts/ID
    if (host === 'youtube.com' && u.pathname === '/watch') {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&controls=1` : null;
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&controls=1` : null;
    }
    if (host === 'youtube.com' && u.pathname.startsWith('/shorts/')) {
      const id = u.pathname.split('/')[2];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&controls=1` : null;
    }

    // SoundCloud: soundcloud.com/...
    if (host === 'soundcloud.com') {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true&color=%23ec4899`;
    }

    // Spotify: open.spotify.com/track/ID
    if (host === 'open.spotify.com') {
      return `https://open.spotify.com/embed${u.pathname}`;
    }

    // Direct audio files
    if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(u.pathname)) {
      return url;
    }

    return null;
  } catch {
    return null;
  }
}

function EmbeddedPlayer({ url }: { url: string }) {
  const embedUrl = toEmbedUrl(url);
  if (!embedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs text-pink-400 hover:text-pink-300 transition-colors py-2"
      >
        <ExternalLink size={12} />
        Open song in new tab
      </a>
    );
  }

  // Direct audio file
  if (embedUrl === url) {
    return (
      <audio key={url} src={url} autoPlay controls className="w-full" style={{ height: 36 }} />
    );
  }

  const isSoundCloud = embedUrl.includes('w.soundcloud.com');
  const isSpotify = embedUrl.includes('open.spotify.com');
  const isYouTube = embedUrl.includes('youtube.com/embed');

  return (
    <iframe
      key={embedUrl}
      src={embedUrl}
      allow="autoplay; encrypted-media; fullscreen"
      frameBorder="0"
      scrolling="no"
      className="w-full rounded-lg"
      style={{ height: isYouTube ? 200 : isSoundCloud ? 166 : isSpotify ? 80 : 64 }}
    />
  );
}

function MusicQueueManager({ items, onRefresh }: { items: UploadItem[]; onRefresh: () => void }) {
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayIndex, setAutoPlayIndex] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sorted = [...items].sort((a, b) => a.queue_position - b.queue_position);
  const dbPlaying = sorted.find(s => s.play_started_at);
  const currentlyPlaying = sorted.find(s => s.id === playingId) ?? dbPlaying;

  const clearSkip = async (item: UploadItem) => {
    setBusy(p => ({ ...p, [item.id]: true }));
    await supabase
      .from('music_uploads')
      .update({ tier: 'free', is_paid: false })
      .eq('id', item.id);
    setBusy(p => ({ ...p, [item.id]: false }));
    onRefresh();
  };

  const swapPositions = async (a: UploadItem, b: UploadItem) => {
    setBusy(p => ({ ...p, [a.id]: true, [b.id]: true }));
    const [r1, r2] = await Promise.all([
      supabase.from('music_uploads').update({ queue_position: b.queue_position }).eq('id', a.id),
      supabase.from('music_uploads').update({ queue_position: a.queue_position }).eq('id', b.id),
    ]);
    setBusy(p => ({ ...p, [a.id]: false, [b.id]: false }));
    if (!r1.error && !r2.error) onRefresh();
  };

  const moveToTop = async (item: UploadItem) => {
    setBusy(p => ({ ...p, [item.id]: true }));
    // Shift all items with lower position down by 1, then set this item to position 1
    const above = sorted.filter(s => s.queue_position < item.queue_position);
    await Promise.all(
      above.map(s =>
        supabase.from('music_uploads').update({ queue_position: s.queue_position + 1 }).eq('id', s.id)
      )
    );
    await supabase.from('music_uploads').update({ queue_position: 1 }).eq('id', item.id);
    setBusy(p => ({ ...p, [item.id]: false }));
    onRefresh();
  };

  const handleDelete = async (item: UploadItem) => {
    setBusy(p => ({ ...p, [item.id]: true }));
    await supabase.from('music_uploads').delete().eq('id', item.id);
    setBusy(p => ({ ...p, [item.id]: false }));
    setConfirmId(null);
    onRefresh();
  };

  const startPlayback = async (item: UploadItem) => {
    setAutoPlay(false);
    setBusy(p => ({ ...p, [item.id]: true }));
    // Clear any previously playing song
    const playing = sorted.filter(s => s.play_started_at && s.id !== item.id);
    await Promise.all(
      playing.map(s =>
        supabase.from('music_uploads').update({ play_started_at: null }).eq('id', s.id)
      )
    );
    // Toggle: if this song is already playing, stop it; otherwise start it
    if (item.play_started_at || playingId === item.id) {
      setPlayingId(null);
      await supabase.from('music_uploads').update({ play_started_at: null }).eq('id', item.id);
    } else {
      setPlayingId(item.id);
      await supabase.from('music_uploads').update({ play_started_at: new Date().toISOString() }).eq('id', item.id);
    }
    setBusy(p => ({ ...p, [item.id]: false }));
    onRefresh();
  };

  const stopAllPlayback = async () => {
    setAutoPlay(false);
    setPlayingId(null);
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    const playing = sorted.filter(s => s.play_started_at);
    await Promise.all(
      playing.map(s =>
        supabase.from('music_uploads').update({ play_started_at: null }).eq('id', s.id)
      )
    );
    onRefresh();
  };

  const playQueueFromStart = async () => {
    if (sorted.length === 0) return;
    setAutoPlay(true);
    setAutoPlayIndex(0);
    // Clear all existing playback
    const playing = sorted.filter(s => s.play_started_at);
    await Promise.all(
      playing.map(s =>
        supabase.from('music_uploads').update({ play_started_at: null }).eq('id', s.id)
      )
    );
    // Start the first song
    const first = sorted[0];
    setPlayingId(first.id);
    await supabase.from('music_uploads').update({ play_started_at: new Date().toISOString() }).eq('id', first.id);
    onRefresh();
  };

  // Auto-advance: when autoPlay is on and a song's voting window ends, advance to the next
  useEffect(() => {
    if (!autoPlay || !currentlyPlaying) return;

    const elapsed = Date.now() - new Date(currentlyPlaying.play_started_at!).getTime();
    const remaining = SONG_DURATION_MS - elapsed;

    if (remaining <= 0) {
      // This song's window is over — advance to the next
      const currentIdx = sorted.findIndex(s => s.id === currentlyPlaying.id);
      const nextIdx = currentIdx + 1;

      if (nextIdx >= sorted.length) {
        // End of queue — stop auto-play
        setAutoPlay(false);
        setPlayingId(null);
        supabase.from('music_uploads').update({ play_started_at: null }).eq('id', currentlyPlaying.id);
        onRefresh();
        return;
      }

      const next = sorted[nextIdx];
      setAutoPlayIndex(nextIdx);
      setPlayingId(next.id);

      (async () => {
        await supabase.from('music_uploads').update({ play_started_at: null }).eq('id', currentlyPlaying.id);
        await supabase.from('music_uploads').update({ play_started_at: new Date().toISOString() }).eq('id', next.id);
        onRefresh();
      })();

      return;
    }

    // Schedule the advance for when this song's window ends
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      const currentIdx = sorted.findIndex(s => s.id === currentlyPlaying.id);
      const nextIdx = currentIdx + 1;

      if (nextIdx >= sorted.length) {
        setAutoPlay(false);
        supabase.from('music_uploads').update({ play_started_at: null }).eq('id', currentlyPlaying.id);
        onRefresh();
        return;
      }

      const next = sorted[nextIdx];
      setAutoPlayIndex(nextIdx);
      setPlayingId(next.id);

      (async () => {
        await supabase.from('music_uploads').update({ play_started_at: null }).eq('id', currentlyPlaying.id);
        await supabase.from('music_uploads').update({ play_started_at: new Date().toISOString() }).eq('id', next.id);
        onRefresh();
      })();
    }, remaining + 500); // small buffer to ensure we're past the window

    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, [autoPlay, currentlyPlaying?.id, currentlyPlaying?.play_started_at]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  if (sorted.length === 0) {
    return (
      <div className="text-center py-16">
        <Music size={32} className="mx-auto text-zinc-700 mb-4" />
        <p className="text-zinc-500 text-sm">No songs in the queue.</p>
      </div>
    );
  }

  const TIER_COLORS: Record<string, string> = {
    free: '#71717a',
    skip_7: '#ec4899',
    skip_15: '#f59e0b',
    spot_1: '#ef4444',
  };

  return (
    <div className="space-y-4">
      {/* Play Queue controls */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: '#111', border: '1px solid rgba(236,72,153,0.15)' }}
      >
        <div className="flex items-center gap-3">
          {currentlyPlaying ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">
                  Now Playing: {currentlyPlaying.song_name}
                </span>
                <span className="text-xs text-zinc-500">
                  {autoPlay
                    ? `Auto-play ${autoPlayIndex + 1}/${sorted.length} — next song in ${PLAY_GRACE + VOTE_WINDOW}s`
                    : 'Single song mode'}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Queue Playback</span>
              <span className="text-xs text-zinc-500">
                Play the entire queue — each song gets {PLAY_GRACE}s grace + {VOTE_WINDOW}s voting
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={playQueueFromStart}
            disabled={sorted.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-black text-sm transition-all hover:opacity-90 disabled:opacity-30"
            style={{ background: 'linear-gradient(90deg, #ec4899, #2dd4bf)' }}
          >
            <Play size={14} />
            Play Queue
          </button>
          {(currentlyPlaying || autoPlay) && (
            <button
              onClick={stopAllPlayback}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            >
              <Square size={12} />
              Stop All
            </button>
          )}
        </div>
      </div>

      {/* Embedded audio player for the currently playing song */}
      {currentlyPlaying && (
        <div
          className="rounded-2xl px-5 py-4"
          style={{ background: '#0d0d0d', border: '1px solid rgba(236,72,153,0.15)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Music size={14} className="text-pink-400" />
            <span className="text-xs tracking-widest uppercase text-zinc-500">
              Audio Player — {currentlyPlaying.song_name}
            </span>
          </div>
          <EmbeddedPlayer url={currentlyPlaying.song_url} />
        </div>
      )}

      {/* Queue list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="divide-y divide-white/5">
        {sorted.map((item, i) => {
          const isBusy = busy[item.id];
          const isFirst = i === 0;
          const isLast = i === sorted.length - 1;

          return (
            <div key={item.id} className="hover:bg-white/[0.02] transition-colors">
              <div className="px-5 py-4 flex items-center gap-3">
                {/* Position number */}
                <span className="text-zinc-600 font-mono text-sm w-8 text-center flex-shrink-0">
                  {i + 1}
                </span>

                {/* Song info */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate">{item.song_name}</span>
                    {item.is_paid && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 inline-flex items-center gap-1"
                        style={{
                          background: `${TIER_COLORS[item.tier] ?? '#71717a'}18`,
                          color: TIER_COLORS[item.tier] ?? '#a1a1aa',
                        }}
                      >
                        {item.tier === 'spot_1' ? 'Spot 1' : item.tier === 'skip_15' ? 'Near Front' : item.tier === 'skip_7' ? 'Skip Ahead' : 'Priority'}
                        <button
                          onClick={(e) => { e.stopPropagation(); clearSkip(item); }}
                          disabled={isBusy}
                          className="ml-0.5 hover:opacity-70 transition-opacity disabled:opacity-30"
                          title="Clear skip status"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    )}
                    {item.is_ai_music && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 flex-shrink-0">
                        {item.ai_type === 'hybrid' ? 'Hybrid AI' : 'Fully AI'}
                      </span>
                    )}
                    {item.production_year && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 flex-shrink-0">
                        {item.production_year}
                      </span>
                    )}
                    <X
                      size={12}
                      className={`text-zinc-600 transition-transform ${expanded === item.id ? 'rotate-0' : '-rotate-45'}`}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-500">{item.artist_name}</span>
                    {item.real_name && (
                      <span className="text-xs text-zinc-600">({item.real_name})</span>
                    )}
                    {item.instagram_handle && (
                      <a
                        href={`https://instagram.com/${item.instagram_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-pink-400 hover:text-pink-300 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        {item.instagram_handle}
                      </a>
                    )}
                    <a
                      href={item.song_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      Open link
                    </a>
                  </div>
                </div>

                {/* Reorder controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startPlayback(item)}
                    disabled={isBusy}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 ${
                      (item.play_started_at || playingId === item.id)
                        ? 'bg-pink-500/20 hover:bg-pink-500/30'
                        : 'bg-white/5 hover:bg-pink-500/20'
                    }`}
                    title={(item.play_started_at || playingId === item.id) ? 'Stop playback / voting' : 'Play — starts 30s voting countdown'}
                  >
                    {(item.play_started_at || playingId === item.id)
                      ? <Square size={12} className="text-pink-400" />
                      : <Play size={14} className="text-pink-400" />
                    }
                  </button>
                  <button
                    onClick={() => moveToTop(item)}
                    disabled={isBusy || isFirst}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-teal-500/20 transition-all disabled:opacity-20"
                    title="Move to top (play next)"
                  >
                    <ChevronsUp size={14} className="text-teal-400" />
                  </button>
                  <button
                    onClick={() => !isFirst && swapPositions(item, sorted[i - 1])}
                    disabled={isBusy || isFirst}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all disabled:opacity-20"
                    title="Move up"
                  >
                    <ArrowUp size={14} className="text-zinc-400" />
                  </button>
                  <button
                    onClick={() => !isLast && swapPositions(item, sorted[i + 1])}
                    disabled={isBusy || isLast}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all disabled:opacity-20"
                    title="Move down"
                  >
                    <ArrowDown size={14} className="text-zinc-400" />
                  </button>
                </div>

                {/* Delete */}
                {confirmId === item.id ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={isBusy}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                    >
                      {isBusy ? 'Deleting...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="px-2 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(item.id)}
                    disabled={isBusy}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-red-500/20 transition-all disabled:opacity-30 flex-shrink-0"
                    title="Delete song"
                  >
                    <Trash2 size={14} className="text-zinc-500 hover:text-red-400 transition-colors" />
                  </button>
                )}
              </div>

              {/* Expanded details */}
              {expanded === item.id && (
                <div className="px-5 pb-5 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <DetailField label="Real Name / Nickname" value={item.real_name} />
                  <DetailField label="Phone Number" value={item.phone_number} />
                  <DetailField label="TikTok Link" value={item.tiktok_link} link={item.tiktok_link || undefined} />
                  <DetailField label="Production Year" value={item.production_year} />
                  <DetailField label="Lyrics Writer" value={item.lyrics_writer} />
                  <DetailField label="AI Type" value={item.ai_type === 'complete' ? 'Fully AI Generated' : item.ai_type === 'hybrid' ? 'Hybrid AI' : null} />
                  <div className="sm:col-span-2">
                    <DetailField label="Note for 8PlusMusic" value={item.note_for_8plus} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('8pm_admin') === '1');
  const [tab, setTab]       = useState<Tab>('queue');
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [chatMsgs, setChatMsgs]   = useState<ChatMessage[]>([]);
  const [trackLinks, setTrackLinks] = useState<TrackLink[]>([]);
  const [queueItems, setQueueItems] = useState<UploadItem[]>([]);
  const [loading, setLoading]     = useState(false);
  const [expanded, setExpanded]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [c, m, l, q] = await Promise.all([
      supabase.from('contacts').select('*').order('created_at', { ascending: false }),
      supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('track_links').select('*').order('ep').order('track_title'),
      supabase.from('music_uploads').select('*').order('queue_position', { ascending: true }),
    ]);
    if (c.data) setContacts(c.data as Contact[]);
    if (m.data) setChatMsgs(m.data as ChatMessage[]);
    if (l.data) setTrackLinks(l.data as TrackLink[]);
    if (q.data) setQueueItems(q.data as UploadItem[]);
    setLoading(false);
  };

  useEffect(() => { if (authed) load(); }, [authed]);

  // Auto-refresh queue every 10 seconds
  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(async () => {
      const q = await supabase.from('music_uploads').select('*').order('queue_position', { ascending: true });
      if (q.data) setQueueItems(q.data as UploadItem[]);
    }, 10000);
    return () => clearInterval(interval);
  }, [authed]);

  const logout = () => {
    sessionStorage.removeItem('8pm_admin');
    setAuthed(false);
  };

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const TABS = [
    { id: 'queue'    as Tab, label: 'Music Queue',           icon: Music },
    { id: 'links'    as Tab, label: 'Track Links',          icon: Link2 },
    { id: 'contacts' as Tab, label: 'Contact Submissions',  icon: Mail },
    { id: 'chat'     as Tab, label: 'Chat Messages',        icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between"
        style={{ background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <h1 className="font-black text-xl tracking-tighter">
            8Plus<span className="bg-gradient-to-r from-pink-400 to-teal-400 bg-clip-text text-transparent">Music</span>
          </h1>
          <span className="text-xs tracking-widest text-zinc-500 uppercase">Admin</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <a
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            ← Site
          </a>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Queue Songs',     value: queueItems.length,  color: '#ec4899' },
            { label: 'Linked Tracks',   value: trackLinks.length,  color: '#2dd4bf' },
            { label: 'Contacts',        value: contacts.length,    color: '#f472b6' },
            { label: 'Chat Messages',   value: chatMsgs.length,    color: '#5eead4' },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-2xl px-5 py-4"
              style={{ background: '#111', border: `1px solid ${stat.color}20` }}
            >
              <p className="text-3xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-zinc-500 mt-1 tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: '#111' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={tab === id
                ? { background: 'linear-gradient(90deg,#ec4899,#2dd4bf)', color: '#000' }
                : { color: '#71717a' }
              }
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Music Queue tab ── */}
        {tab === 'queue' && (
          <MusicQueueManager items={queueItems} onRefresh={load} />
        )}

        {/* ── Track Links tab ── */}
        {tab === 'links' && (
          <TrackLinksManager trackLinks={trackLinks} onRefresh={load} />
        )}

        {/* ── Contacts tab ── */}
        {tab === 'contacts' && (
          <div className="space-y-3">
            {contacts.length === 0 && !loading && (
              <p className="text-zinc-500 text-sm py-12 text-center">No contact submissions yet.</p>
            )}
            {contacts.map(c => (
              <div
                key={c.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="px-5 py-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-white">{c.name}</span>
                      <a
                        href={`mailto:${c.email}`}
                        onClick={e => e.stopPropagation()}
                        className="text-pink-400 text-sm hover:text-pink-300 transition-colors"
                      >
                        {c.email}
                      </a>
                      {c.subject && (
                        <span
                          className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                          style={{
                            background: `${SUBJECT_COLORS[c.subject] ?? '#71717a'}18`,
                            color: SUBJECT_COLORS[c.subject] ?? '#a1a1aa',
                            border: `1px solid ${SUBJECT_COLORS[c.subject] ?? '#71717a'}35`,
                          }}
                        >
                          {c.subject}
                        </span>
                      )}
                      {c.country && (
                        <span className="text-xs text-zinc-600 font-medium">{c.country}</span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-sm mt-1 truncate">{c.message}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-zinc-600 text-xs">{formatDate(c.created_at)}</span>
                    <X
                      size={14}
                      className={`text-zinc-600 transition-transform ${expanded === c.id ? 'rotate-0' : 'rotate-45'}`}
                    />
                  </div>
                </div>

                {expanded === c.id && (
                  <div
                    className="px-5 pb-5 pt-0"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex flex-wrap gap-3 mt-4 mb-3">
                      {c.subject && (
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-full"
                          style={{
                            background: `${SUBJECT_COLORS[c.subject] ?? '#71717a'}18`,
                            color: SUBJECT_COLORS[c.subject] ?? '#a1a1aa',
                            border: `1px solid ${SUBJECT_COLORS[c.subject] ?? '#71717a'}35`,
                          }}
                        >
                          {c.subject}
                        </span>
                      )}
                      {c.country && (
                        <span className="text-xs text-zinc-500 px-3 py-1 rounded-full bg-white/5">
                          {c.country}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{c.message}</p>
                    <div className="mt-4">
                      <a
                        href={`mailto:${c.email}?subject=Re: 8PlusMusic`}
                        className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-semibold text-black"
                        style={{ background: 'linear-gradient(90deg,#ec4899,#2dd4bf)' }}
                      >
                        <Mail size={12} />
                        Reply via email
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Chat tab ── */}
        {tab === 'chat' && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {chatMsgs.length === 0 && !loading && (
              <p className="text-zinc-500 text-sm py-12 text-center">No chat messages yet.</p>
            )}
            <div className="divide-y divide-white/5">
              {chatMsgs.map(msg => (
                <div key={msg.id} className="px-5 py-3 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-black"
                    style={{ background: 'linear-gradient(135deg,#ec4899,#2dd4bf)' }}
                  >
                    {msg.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-teal-400">{msg.username}</span>
                      <span className="text-zinc-600 text-xs">{formatDate(msg.created_at)}</span>
                    </div>
                    <p className="text-zinc-300 text-sm mt-0.5 break-words">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
