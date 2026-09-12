import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EPS } from '../lib/tracks';
import { edgeFunctionUrl } from '../lib/fetchEdge';
import { Mail, MessageCircle, LogOut, RefreshCw, X, Link2, Check, Trash2, Music } from 'lucide-react';

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

type Tab = 'contacts' | 'chat' | 'links';

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
          <a href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors tracking-widest uppercase">
            ← Back to site
          </a>
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

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('8pm_admin') === '1');
  const [tab, setTab]       = useState<Tab>('links');
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [chatMsgs, setChatMsgs]   = useState<ChatMessage[]>([]);
  const [trackLinks, setTrackLinks] = useState<TrackLink[]>([]);
  const [loading, setLoading]     = useState(false);
  const [expanded, setExpanded]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [c, m, l] = await Promise.all([
      supabase.from('contacts').select('*').order('created_at', { ascending: false }),
      supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('track_links').select('*').order('ep').order('track_title'),
    ]);
    if (c.data) setContacts(c.data as Contact[]);
    if (m.data) setChatMsgs(m.data as ChatMessage[]);
    if (l.data) setTrackLinks(l.data as TrackLink[]);
    setLoading(false);
  };

  useEffect(() => { if (authed) load(); }, [authed]);

  const logout = () => {
    sessionStorage.removeItem('8pm_admin');
    setAuthed(false);
  };

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const TABS = [
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
            { label: 'Linked Tracks',   value: trackLinks.length, color: '#ec4899' },
            { label: 'Contacts',        value: contacts.length,   color: '#2dd4bf' },
            { label: 'Chat Messages',   value: chatMsgs.length,   color: '#f472b6' },
            { label: 'Chat Users',
              value: new Set(chatMsgs.map(m => m.username)).size,  color: '#5eead4' },
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
