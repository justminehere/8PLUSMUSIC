import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { consumeContactSubject } from '../lib/contactIntent';
import { fetchEdgeJson, isSupabaseConfigured } from '../lib/fetchEdge';

const SUBJECTS = ['Music', 'Marketing', 'Sales', 'Distribution', 'Sponsorship'] as const;

const SUBJECT_COLORS: Record<string, string> = {
  Music: '#ec4899',
  Marketing: '#f97316',
  Sales: '#22c55e',
  Distribution: '#3b82f6',
  Sponsorship: '#2dd4bf',
};

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    country: '',
    subject: consumeContactSubject(),
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.country || !form.subject || !form.message) return;
    if (!isSupabaseConfigured()) {
      setErrorMsg('Messaging is temporarily unavailable. Please try again later.');
      setStatus('error');
      return;
    }
    setStatus('loading');

    try {
      await fetchEdgeJson('contact-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus('success');
      setForm({ name: '', email: '', country: '', subject: '', message: '' });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="relative py-28 px-6 bg-zinc-950 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />

      <div className="relative z-10 max-w-xl mx-auto">
        <div className="text-center mb-12">
          <p className="arcade-section-label mb-4">Get in Touch</p>
          <h2 className="arcade-section-title text-5xl">MESSAGE 8PLUSMUSIC</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs tracking-widest uppercase text-zinc-500 mb-2">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-zinc-500 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/50 transition-all"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs tracking-widest uppercase text-zinc-500 mb-2">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                placeholder="Where are you from?"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-zinc-500 mb-2">Subject</label>
              <div className="relative">
                <select
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  required
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50 transition-all pr-9"
                  style={{ color: form.subject ? (SUBJECT_COLORS[form.subject] ?? 'white') : '#52525b' }}
                >
                  <option value="" disabled style={{ color: '#52525b', background: '#18181b' }}>Select a subject</option>
                  {SUBJECTS.map(s => (
                    <option key={s} value={s} style={{ color: SUBJECT_COLORS[s], background: '#18181b' }}>{s}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4l4 4 4-4" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-zinc-500 mb-2">Message</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Say hello..."
              required
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/50 transition-all resize-none"
            />
          </div>

          {status === 'error' && (
            <p className="text-red-400 text-sm">{errorMsg || 'Something went wrong. Please try again.'}</p>
          )}

          {status === 'success' ? (
            <div className="flex items-center justify-center gap-3 py-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <CheckCircle size={18} />
              <span className="font-medium">Message sent! We'll be in touch.</span>
            </div>
          ) : (
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold tracking-wide text-black transition-all disabled:opacity-60 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'linear-gradient(90deg, #ec4899 0%, #2dd4bf 100%)' }}
            >
              {status === 'loading' ? (
                <span className="text-sm">Sending...</span>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send Message</span>
                </>
              )}
            </button>
          )}
        </form>
      </div>
    </section>
  );
}
