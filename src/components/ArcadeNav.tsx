import { useState, useEffect, useCallback, useMemo } from 'react';

interface NavItem {
  label: string;
  target: string;
  external?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'ABOUT US', target: 'about' },
  { label: '8PLUSMUSIC EPs', target: 'releases' },
  { label: 'SOCIALS', target: 'socials' },
  { label: 'UPLOAD YOUR MUSIC', target: 'upload', external: true },
  { label: 'BECOME A FAN', target: 'fans', external: true },
  { label: 'SPONSORSHIP', target: 'sponsors' },
  { label: 'CONTACT', target: 'contact' },
];

export interface ArcadeNavProps {
  onNavigate: (target: string, external?: boolean) => void;
}

export default function ArcadeNav({ onNavigate }: ArcadeNavProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = useCallback((item: NavItem, idx: number) => {
    setActiveIdx(idx);
    setMobileOpen(false);
    onNavigate(item.target, item.external);
  }, [onNavigate]);

  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const toggleSound = () => {
    setSoundOn(prev => {
      const next = !prev;
      if (next && !prefersReducedMotion) {
        playBlip(880, 0.04);
      }
      return next;
    });
  };

  const handleHover = (idx: number) => {
    setHoveredIdx(idx);
    if (soundOn && !prefersReducedMotion) playBlip(440 + idx * 60, 0.03);
  };

  return (
    <>
      <nav
        className="arcade-nav fixed top-0 inset-x-0 z-50"
        style={{
          background: scrolled ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          borderBottom: '2px solid rgba(45, 212, 191, 0.35)',
          transition: 'background 0.2s ease',
        }}
      >
        {/* Scanline texture overlay */}
        <div className="arcade-nav-scanlines pointer-events-none absolute inset-0" />

        {/* Status lights */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 pointer-events-none">
          <span className="arcade-status-dot" style={{ background: '#2dd4bf', animation: 'dotBlink 1.2s ease-in-out infinite' }} />
          <span className="arcade-status-dot" style={{ background: '#ec4899', animation: 'dotBlink 1.8s ease-in-out infinite', animationDelay: '0.3s' }} />
        </div>

        {/* Desktop nav */}
        <div className="relative z-10 hidden md:flex items-center justify-center gap-0 px-6 py-2.5">
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item.target}
              className="arcade-nav-item"
              onMouseEnter={() => handleHover(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onFocus={() => handleHover(i)}
              onBlur={() => setHoveredIdx(null)}
              onClick={() => handleClick(item, i)}
            >
              {(hoveredIdx === i || activeIdx === i) && <span className="arcade-selector">&gt;</span>}
              <span>{item.label}</span>
            </button>
          ))}

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className="arcade-sound-toggle"
            style={{ color: soundOn ? '#2dd4bf' : 'rgba(255,255,255,0.35)' }}
          >
            SOUND: {soundOn ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Mobile nav */}
        <div className="relative z-10 flex md:hidden items-center justify-between px-4 py-2">
          <span className="font-press-start text-white" style={{ fontSize: '8px', letterSpacing: '0.05em' }}>
            8PLUSMUSIC
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              className="arcade-sound-toggle"
              style={{ color: soundOn ? '#2dd4bf' : 'rgba(255,255,255,0.35)', fontSize: '7px', padding: '4px 8px' }}
            >
              {soundOn ? 'SND ON' : 'SND OFF'}
            </button>
            <button
              onClick={() => setMobileOpen(prev => !prev)}
              className="arcade-mobile-btn"
            >
              {mobileOpen ? 'X' : '='}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="relative z-10 md:hidden flex flex-col bg-black border-t border-teal-400/20">
            {NAV_ITEMS.map((item, i) => (
              <button
                key={item.target}
                className="arcade-nav-item-mobile"
                onClick={() => handleClick(item, i)}
                onTouchStart={() => setHoveredIdx(i)}
              >
                {(hoveredIdx === i || activeIdx === i) && <span className="arcade-selector">&gt;</span>}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}

// Tiny Web Audio blip
let audioCtx: AudioContext | null = null;
function playBlip(freq: number, duration: number) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // ignore
  }
}
