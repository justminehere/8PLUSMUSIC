import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const KEY = '8plusmusic_privacy_consent_v3';

export default function PrivacyBanner({ onOpenPolicy }: { onOpenPolicy: () => void }) {
  const [accepted] = useState(() => !!localStorage.getItem(KEY));
  const [scrolled, setScrolled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (accepted) return;
    const check = () => { if (window.scrollY > 60) setScrolled(true); };
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, [accepted]);

  // Auto-dismiss after 9s so it never covers the songs section
  useEffect(() => {
    if (accepted || !scrolled) return;
    const t = setTimeout(() => setDismissed(true), 9000);
    return () => clearTimeout(t);
  }, [accepted, scrolled]);

  const accept = () => {
    localStorage.setItem(KEY, '1');
    setDismissed(true);
  };

  if (accepted || dismissed || !scrolled) return null;

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 privacy-pop"
      style={{ filter: 'drop-shadow(0 0 28px rgba(236,72,153,0.45))' }}
    >
      <div className="relative" style={{ width: 280, height: 260 }}>
        {/* Heart-shaped SVG backdrop */}
        <svg className="absolute inset-0" width="280" height="260" viewBox="0 0 280 260" fill="none">
          <path
            d="M 140,50 C 110,16 45,16 24,62 C 3,108 36,152 140,234 C 244,152 277,108 256,62 C 235,16 170,16 140,50 Z"
            fill="#080808"
            stroke="rgba(236,72,153,0.38)"
            strokeWidth="1.5"
          />
        </svg>

        {/* Close button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute z-10 text-zinc-600 hover:text-zinc-400 transition-colors"
          style={{ top: 68, right: 68 }}
          aria-label="Close"
        >
          <X size={13} />
        </button>

        {/* Content inside heart */}
        <div
          className="absolute inset-0 flex flex-col items-center text-center"
          style={{ padding: '64px 52px 58px' }}
        >
          <span className="font-black text-white text-xs tracking-widest uppercase mb-2">
            Privacy Notice
          </span>

          <p className="text-zinc-500 leading-relaxed mb-3" style={{ fontSize: '10px' }}>
            Contact form submissions stored to reply to you. Chat uses an auto-nickname — no account needed. No tracking cookies.{' '}
            <button
              onClick={onOpenPolicy}
              className="text-pink-400 hover:text-pink-300 underline underline-offset-2 transition-colors"
            >
              Policy
            </button>
          </p>

          <button
            onClick={accept}
            className="px-5 py-1.5 rounded-full font-bold text-black tracking-widest uppercase transition-all hover:opacity-90 active:scale-95"
            style={{
              fontSize: '10px',
              background: 'linear-gradient(90deg, #ec4899 0%, #2dd4bf 100%)',
              boxShadow: '0 0 14px rgba(236,72,153,0.5)',
            }}
          >
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
}
