import { useState, useEffect } from 'react';
import { Upload, CheckCircle, Music, Link2, User, Instagram, ChevronRight, Play, Phone, Calendar, FileText, StickyNote } from 'lucide-react';
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

const TIERS = [
  {
    id: 'free',
    name: 'Free Upload',
    price: 0,
    desc: 'Join the queue at the back. Your song will be played in order.',
    accent: '#2dd4bf',
  },
  {
    id: 'skip_7',
    name: 'Skip Ahead',
    price: 7,
    desc: 'Jump past 70% of the queue. Get heard sooner.',
    accent: '#ec4899',
  },
  {
    id: 'skip_15',
    name: 'Near Front',
    price: 15,
    desc: 'Skip to the top 15% of the queue. Almost front of the line.',
    accent: '#f59e0b',
  },
  {
    id: 'spot_1',
    name: 'Spot 1',
    price: 40,
    desc: 'Jump to the absolute front. Your song plays next.',
    accent: '#ef4444',
  },
];

export default function MusicUpload() {
  const [form, setForm] = useState({
    song_name: '',
    song_url: '',
    artist_name: '',
    real_name: '',
    phone_number: '',
    instagram_handle: '',
    tiktok_link: '',
    production_year: '',
    owns_song: false,
    is_fully_ai: false,
    is_hybrid_ai: false,
    wrote_lyrics: false,
    lyrics_writer: '',
    has_note: false,
    note_for_8plus: '',
  });
  const [selectedTier, setSelectedTier] = useState('free');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [queueLoading, setQueueLoading] = useState(true);

  const fetchQueue = async () => {
    setQueueLoading(true);
    if (!isSupabaseConfigured()) {
      setQueueLoading(false);
      return;
    }
    try {
      const data = await fetchEdgeJson<{ uploads: UploadItem[]; total: number }>('music-queue');
      if (data.uploads) {
        setQueue(data.uploads);
        setQueueTotal(data.total ?? 0);
      }
    } catch {
      // Queue may not be ready yet
    }
    setQueueLoading(false);
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const isAnyAi = form.is_fully_ai || form.is_hybrid_ai;
  const aiType = form.is_fully_ai ? 'complete' : form.is_hybrid_ai ? 'hybrid' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.song_name || !form.song_url || !form.artist_name) return;
    if (!form.owns_song) {
      setErrorMsg('Please confirm you own the song.');
      setStatus('error');
      return;
    }

    const tier = TIERS.find(t => t.id === selectedTier)!;

    if (tier.price > 0) {
      setErrorMsg('Paid uploads require Stripe to be configured. Please choose Free Upload for now, or contact us to set up payments.');
      setStatus('error');
      return;
    }

    if (!isSupabaseConfigured()) {
      setErrorMsg('Uploads are temporarily unavailable. Please try again later.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      await fetchEdgeJson('music-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song_name: form.song_name,
          song_url: form.song_url,
          artist_name: form.artist_name,
          instagram_handle: form.instagram_handle,
          owns_song: form.owns_song,
          is_ai_music: isAnyAi,
          ai_type: isAnyAi ? aiType : null,
          tier: selectedTier,
          real_name: form.real_name,
          phone_number: form.phone_number,
          tiktok_link: form.tiktok_link,
          production_year: form.production_year,
          lyrics_writer: form.wrote_lyrics ? form.lyrics_writer : null,
          note_for_8plus: form.has_note ? form.note_for_8plus : null,
        }),
      });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3500);
      setForm({
        song_name: '',
        song_url: '',
        artist_name: '',
        real_name: '',
        phone_number: '',
        instagram_handle: '',
        tiktok_link: '',
        production_year: '',
        owns_song: false,
        is_fully_ai: false,
        is_hybrid_ai: false,
        wrote_lyrics: false,
        lyrics_writer: '',
        has_note: false,
        note_for_8plus: '',
      });
      setSelectedTier('free');
      fetchQueue();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/50 transition-all text-sm';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full bg-pink-500 opacity-10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-400 opacity-10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">
        <ArcadeBackButton />

        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="font-black tracking-tighter leading-none mb-3" style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)' }}>
            <span className="text-white">8</span>
            <span className="bg-gradient-to-r from-pink-400 via-teal-300 to-pink-400 bg-clip-text text-transparent">Plus</span>
            <span className="text-white">Music</span>
          </h1>
          <p className="text-zinc-500 text-xs tracking-[0.3em] uppercase">Upload Your Music</p>
        </div>

        {/* Queue status */}
        <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-zinc-400">Current Queue</h3>
            <a href="/player" className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 text-xs transition-colors">
              <Play size={12} />
              Play songs
            </a>
          </div>
          <p className="text-3xl font-black text-white">
            {queueLoading ? '...' : queueTotal}
            <span className="text-zinc-600 text-base font-normal ml-2">{queueTotal === 1 ? 'song' : 'songs'} in queue</span>
          </p>
          {!queueLoading && queue.length > 0 && (
            <div className="mt-4 space-y-2">
              {queue.slice(0, 5).map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <span className="text-zinc-600 font-mono w-6 text-right">{i + 1}</span>
                  <span className="text-zinc-300 truncate flex-1">{item.song_name}</span>
                  <span className="text-zinc-600 text-xs">{item.artist_name}</span>
                </div>
              ))}
              {queue.length > 5 && (
                <p className="text-zinc-600 text-xs pt-1">+ {queue.length - 5} more...</p>
              )}
            </div>
          )}
        </div>

        {/* Upload form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-xs tracking-widest uppercase text-zinc-500 mb-2">
              <Music size={12} /> Song Name
            </label>
            <input
              type="text"
              value={form.song_name}
              onChange={e => setForm(f => ({ ...f, song_name: e.target.value }))}
              placeholder="Enter your song title"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs tracking-widest uppercase text-zinc-500 mb-2">
              <Link2 size={12} /> Music Link
            </label>
            <input
              type="url"
              value={form.song_url}
              onChange={e => setForm(f => ({ ...f, song_url: e.target.value }))}
              placeholder="https://soundcloud.com/your-song or YouTube link"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs tracking-widest uppercase text-zinc-500 mb-2">
              <User size={12} /> Artist Name
            </label>
            <input
              type="text"
              value={form.artist_name}
              onChange={e => setForm(f => ({ ...f, artist_name: e.target.value }))}
              placeholder="Your artist name"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs tracking-widest uppercase text-zinc-500 mb-2">
              <User size={12} /> Real Name or Nickname (optional)
            </label>
            <input
              type="text"
              value={form.real_name}
              onChange={e => setForm(f => ({ ...f, real_name: e.target.value }))}
              placeholder="Your real name or nickname"
              className={inputClass}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs tracking-widest uppercase text-zinc-500 mb-2">
              <Phone size={12} /> Phone Number with Area Code (optional)
            </label>
            <input
              type="tel"
              value={form.phone_number}
              onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
              placeholder="+1 555 123 4567"
              className={inputClass}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs tracking-widest uppercase text-zinc-500 mb-2">
              <Instagram size={12} /> Instagram Handle (optional)
            </label>
            <input
              type="text"
              value={form.instagram_handle}
              onChange={e => setForm(f => ({ ...f, instagram_handle: e.target.value }))}
              placeholder="@yourhandle"
              className={inputClass}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs tracking-widest uppercase text-zinc-500 mb-2">
              <Link2 size={12} /> TikTok Link (optional)
            </label>
            <input
              type="url"
              value={form.tiktok_link}
              onChange={e => setForm(f => ({ ...f, tiktok_link: e.target.value }))}
              placeholder="https://tiktok.com/@yourhandle"
              className={inputClass}
            />
          </div>

          {/* Production Year */}
          <div>
            <label className="flex items-center gap-2 text-xs tracking-widest uppercase text-zinc-500 mb-2">
              <Calendar size={12} /> Production Year (optional)
            </label>
            <input
              type="text"
              value={form.production_year}
              onChange={e => setForm(f => ({ ...f, production_year: e.target.value }))}
              placeholder="e.g. 2024"
              className={inputClass}
            />
          </div>

          {/* AI Music section — restructured */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
            <p className="text-xs tracking-widest uppercase text-zinc-500">AI Generated Music</p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_fully_ai}
                onChange={e => setForm(f => ({
                  ...f,
                  is_fully_ai: e.target.checked,
                  is_hybrid_ai: e.target.checked ? false : f.is_hybrid_ai,
                }))}
                className="w-5 h-5 rounded accent-pink-500"
              />
              <span className="text-sm text-zinc-300">Fully AI Generated Music</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_hybrid_ai}
                onChange={e => setForm(f => ({
                  ...f,
                  is_hybrid_ai: e.target.checked,
                  is_fully_ai: e.target.checked ? false : f.is_fully_ai,
                }))}
                className="w-5 h-5 rounded accent-teal-400"
              />
              <span className="text-sm text-zinc-300">Hybrid AI Music</span>
            </label>
          </div>

          {/* Lyrics writer */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.wrote_lyrics}
                onChange={e => setForm(f => ({ ...f, wrote_lyrics: e.target.checked }))}
                className="w-5 h-5 rounded accent-pink-500"
              />
              <span className="text-sm text-zinc-300 flex items-center gap-2">
                <FileText size={14} /> Who wrote the lyrics
              </span>
            </label>
            {form.wrote_lyrics && (
              <input
                type="text"
                value={form.lyrics_writer}
                onChange={e => setForm(f => ({ ...f, lyrics_writer: e.target.value }))}
                placeholder="Name of the lyricist"
                className={inputClass}
              />
            )}
          </div>

          {/* Note for 8PlusMusic */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_note}
                onChange={e => setForm(f => ({ ...f, has_note: e.target.checked }))}
                className="w-5 h-5 rounded accent-teal-400"
              />
              <span className="text-sm text-zinc-300 flex items-center gap-2">
                <StickyNote size={14} /> Leave a note for 8PlusMusic
              </span>
            </label>
            {form.has_note && (
              <textarea
                value={form.note_for_8plus}
                onChange={e => setForm(f => ({ ...f, note_for_8plus: e.target.value }))}
                placeholder="Your message to 8PlusMusic..."
                rows={3}
                className={inputClass + ' resize-none'}
              />
            )}
          </div>

          {/* Ownership checkbox */}
          <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <input
              type="checkbox"
              checked={form.owns_song}
              onChange={e => setForm(f => ({ ...f, owns_song: e.target.checked }))}
              className="w-5 h-5 mt-0.5 rounded accent-pink-500 flex-shrink-0"
            />
            <span className="text-sm text-zinc-300 leading-relaxed">
              I confirm that I own the rights to this song and have permission to submit it for playback.
            </span>
          </label>

          {/* Tier selection */}
          <div className="space-y-3 pt-2">
            <p className="text-xs tracking-widest uppercase text-zinc-500">Choose Your Upload Option</p>
            {TIERS.map(tier => (
              <label
                key={tier.id}
                className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all ${
                  selectedTier === tier.id
                    ? 'border-pink-500/50 bg-pink-500/5'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="tier"
                  value={tier.id}
                  checked={selectedTier === tier.id}
                  onChange={e => setSelectedTier(e.target.value)}
                  className="w-5 h-5 accent-pink-500 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-sm text-white">{tier.name}</span>
                    <span className="font-black text-lg" style={{ color: tier.accent }}>
                      ${tier.price}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{tier.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {status === 'error' && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          {status === 'success' ? (
            <div className="flex items-center justify-center gap-3 py-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <CheckCircle size={18} />
              <span className="font-medium">Your song is in the queue!</span>
            </div>
          ) : (
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold tracking-wide text-black transition-all disabled:opacity-60 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'linear-gradient(90deg, #ec4899 0%, #2dd4bf 100%)' }}
            >
              {status === 'loading' ? (
                <span className="text-sm">Submitting...</span>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Submit My Song</span>
                </>
              )}
            </button>
          )}
        </form>

        {/* Player link */}
        <div className="text-center mt-10">
          <a
            href="/player"
            className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm transition-colors"
          >
            Listen to the queue
            <ChevronRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
