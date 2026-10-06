import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { playBlip, playArcadeCoin, playAtariStart, startAmbient, stopAmbient } from '../lib/arcadeSound';

interface NavItem {
  label: string;
  target: string;
  external?: boolean;
  enabled?: boolean;
}

// Feature flags — enable when the matching prompt creates the route
const PROFILES_ENABLED = false;
const LIVE_CREATIONS_ENABLED = false;

// Primary nav items (always visible on desktop when enabled)
const PRIMARY_ITEMS: NavItem[] = [
  { label: '8PLUSMUSIC EPs', target: 'releases' },
  { label: 'UPLOAD YOUR MUSIC', target: 'upload', external: true },
  { label: 'JOIN 8PLUSMUSIC', target: 'fans', external: true },
  { label: '8+ PROFILES', target: 'profiles', external: true, enabled: PROFILES_ENABLED },
  { label: 'LIVE CREATIONS', target: 'live-creations', external: true, enabled: LIVE_CREATIONS_ENABLED },
];

// Secondary nav items (inside MORE dropdown on desktop)
const SECONDARY_ITEMS: NavItem[] = [
  { label: 'ABOUT US', target: 'about' },
  { label: 'SOCIALS', target: 'socials' },
  { label: 'SPONSORSHIP', target: 'sponsors' },
  { label: 'CONTACT', target: 'contact' },
];

// All active items for mobile menu (in display order)
const ALL_ACTIVE_ITEMS: NavItem[] = [
  { label: 'ABOUT US', target: 'about' },
  { label: '8PLUSMUSIC EPs', target: 'releases' },
  { label: 'SOCIALS', target: 'socials' },
  { label: 'UPLOAD YOUR MUSIC', target: 'upload', external: true },
  { label: 'JOIN 8PLUSMUSIC', target: 'fans', external: true },
  ...PROFILES_ENABLED ? [{ label: '8+ PROFILES', target: 'profiles', external: true }] : [],
  ...LIVE_CREATIONS_ENABLED ? [{ label: 'LIVE CREATIONS', target: 'live-creations', external: true }] : [],
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [entered, setEntered] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return () => {
      stopAmbient();
    };
  }, []);

  // Close MORE on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moreOpen]);

  // Mobile menu: Escape to close, focus trap, outside click
  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        mobileCloseRef.current?.focus();
        return;
      }
      if (e.key === 'Tab' && mobileRef.current) {
        const focusable = mobileRef.current.querySelectorAll<HTMLElement>(
          'button, a, input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const handleOutside = (e: MouseEvent) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('mousedown', handleOutside);

    // Focus first menu item
    const firstItem = mobileRef.current?.querySelector<HTMLElement>('button');
    firstItem?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [mobileOpen]);

  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const toggleSound = async () => {
    const next = !soundOn;
    setSoundOn(next);
    if (next && !prefersReducedMotion) {
      await playAtariStart();
      startAmbient();
    } else {
      stopAmbient();
    }
  };

  const handleClick = useCallback((item: NavItem, idx: number) => {
    setActiveIdx(idx);
    setMobileOpen(false);
    setMoreOpen(false);
    if (soundOn && !prefersReducedMotion) {
      playArcadeCoin();
      setTimeout(() => playBlip(330, 0.06, 0.1), 80);
    }
    onNavigate(item.target, item.external);
  }, [onNavigate, soundOn, prefersReducedMotion]);

  const handleHover = (idx: number) => {
    setHoveredIdx(idx);
    if (soundOn && !prefersReducedMotion) playBlip(440 + idx * 60, 0.03, 0.06);
  };

  // Active primary items (filtered by enabled flag)
  const activePrimary = PRIMARY_ITEMS.filter(item => item.enabled !== false);

  // Global index tracking for active state across primary + secondary
  const allItemsForActive = [...activePrimary, ...SECONDARY_ITEMS];

  const getGlobalIdx = (item: NavItem) => {
    const idx = allItemsForActive.findIndex(i => i.target === item.target);
    return idx >= 0 ? idx : null;
  };

  return (
    <>
      <nav
        className={`arcade-nav fixed top-0 inset-x-0 z-50 ${entered ? 'arcade-nav-entered' : ''}`}
        style={{
          background: scrolled ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          borderBottom: '2px solid rgba(45, 212, 191, 0.35)',
          transition: 'background 0.2s ease',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Scanline texture overlay */}
        <div className="arcade-nav-scanlines pointer-events-none absolute inset-0" />

        {/* Animated border glow */}
        <div className="arcade-nav-glow pointer-events-none absolute bottom-0 inset-x-0" />

        {/* Status lights */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 pointer-events-none">
          <span className="arcade-status-dot" style={{ background: '#2dd4bf', animation: 'dotBlink 1.2s ease-in-out infinite' }} />
          <span className="arcade-status-dot" style={{ background: '#ec4899', animation: 'dotBlink 1.8s ease-in-out infinite', animationDelay: '0.3s' }} />
        </div>

        {/* Desktop nav */}
        <div className="relative z-10 hidden md:flex items-center justify-center gap-0 px-6 py-2.5">
          {activePrimary.map((item, i) => {
            const gIdx = getGlobalIdx(item);
            return (
              <button
                key={item.target}
                className="arcade-nav-item arcade-nav-drop"
                style={{ animationDelay: `${i * 80}ms` }}
                onMouseEnter={() => { handleHover(gIdx ?? 0); setMoreOpen(false); }}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => { handleHover(gIdx ?? 0); setMoreOpen(false); }}
                onBlur={() => setHoveredIdx(null)}
                onClick={() => handleClick(item, gIdx ?? 0)}
              >
                {(hoveredIdx === gIdx || activeIdx === gIdx) && <span className="arcade-selector">&gt;</span>}
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* MORE dropdown */}
          <div ref={moreRef} className="relative">
            <button
              className="arcade-nav-item arcade-nav-drop"
              style={{ animationDelay: `${activePrimary.length * 80}ms` }}
              onClick={() => setMoreOpen(prev => !prev)}
              onMouseEnter={() => handleHover(activePrimary.length)}
                onMouseLeave={() => setHoveredIdx(null)}
              aria-expanded={moreOpen}
              aria-haspopup="true"
              aria-label="More navigation"
            >
              {(hoveredIdx === activePrimary.length || moreOpen) && <span className="arcade-selector">&gt;</span>}
              <span>MORE</span>
            </button>

            {moreOpen && (
              <div
                className="absolute right-0 top-full mt-1 flex flex-col gap-0 py-2 rounded-lg overflow-hidden"
                style={{
                  background: 'rgba(0,0,0,0.95)',
                  border: '1px solid rgba(45,212,191,0.3)',
                  minWidth: '140px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {SECONDARY_ITEMS.map((item, i) => {
                  const gIdx = getGlobalIdx(item);
                  return (
                    <button
                      key={item.target}
                      className="arcade-nav-item arcade-nav-drop text-left"
                      style={{ animationDelay: '0ms', padding: '8px 16px' }}
                      onMouseEnter={() => handleHover(gIdx ?? 0)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onFocus={() => handleHover(gIdx ?? 0)}
                      onBlur={() => setHoveredIdx(null)}
                      onClick={() => handleClick(item, gIdx ?? 0)}
                    >
                      {(hoveredIdx === gIdx || activeIdx === gIdx) && <span className="arcade-selector">&gt;</span>}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className="arcade-sound-toggle arcade-nav-drop"
            style={{ color: soundOn ? '#2dd4bf' : 'rgba(255,255,255,0.35)', animationDelay: `${(activePrimary.length + 1) * 80}ms` }}
            aria-label={`Sound ${soundOn ? 'on' : 'off'}`}
          >
            SOUND: {soundOn ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Mobile nav bar */}
        <div className="relative z-10 flex md:hidden items-center justify-between px-4 py-2">
          <span className="font-press-start text-white arcade-nav-drop" style={{ fontSize: '8px', letterSpacing: '0.05em', animationDelay: '0ms' }}>
            8PLUSMUSIC
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              className="arcade-sound-toggle arcade-nav-drop"
              style={{ color: soundOn ? '#2dd4bf' : 'rgba(255,255,255,0.35)', fontSize: '7px', padding: '4px 8px', animationDelay: '80ms' }}
              aria-label={`Sound ${soundOn ? 'on' : 'off'}`}
            >
              {soundOn ? 'SND ON' : 'SND OFF'}
            </button>
            <button
              ref={mobileCloseRef}
              onClick={() => setMobileOpen(prev => !prev)}
              className="arcade-mobile-btn arcade-nav-drop"
              style={{ animationDelay: '160ms' }}
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation menu"
              aria-controls="mobile-nav-menu"
            >
              {mobileOpen ? 'X' : '='}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div
            ref={mobileRef}
            id="mobile-nav-menu"
            className="relative z-10 md:hidden flex flex-col bg-black border-t border-teal-400/20"
            role="menu"
          >
            {ALL_ACTIVE_ITEMS.map((item, i) => {
              const gIdx = i;
              return (
                <button
                  key={item.target}
                  className="arcade-nav-item-mobile arcade-mobile-drop"
                  style={{ animationDelay: `${i * 50}ms`, minHeight: '44px' }}
                  onClick={() => handleClick(item, gIdx)}
                  onTouchStart={() => setHoveredIdx(gIdx)}
                  onMouseEnter={() => setHoveredIdx(gIdx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  role="menuitem"
                >
                  {(hoveredIdx === gIdx || activeIdx === gIdx) && <span className="arcade-selector">&gt;</span>}
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Sound toggle in mobile menu */}
            <button
              className="arcade-nav-item-mobile arcade-mobile-drop"
              style={{ animationDelay: `${ALL_ACTIVE_ITEMS.length * 50}ms`, minHeight: '44px', color: soundOn ? '#2dd4bf' : 'rgba(255,255,255,0.35)' }}
              onClick={() => { toggleSound(); }}
              role="menuitem"
            >
              <span>SOUND: {soundOn ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
