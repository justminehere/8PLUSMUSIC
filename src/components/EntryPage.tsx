import { useState, useEffect, useMemo } from 'react';

type Phase = 'black' | 'glitch' | 'bunny' | 'title' | 'menu' | 'done';

interface MenuItem {
  label: string;
  target: string;
  external?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'ABOUT US', target: 'about' },
  { label: '8PLUSMUSIC EPs', target: 'releases' },
  { label: 'SOCIALS', target: 'socials' },
  { label: 'UPLOAD YOUR MUSIC', target: 'upload', external: true },
  { label: 'BECOME A FAN', target: 'sponsors' },
];

export default function EntryPage({ onNavigate }: { onNavigate: (target: string, external?: boolean) => void }) {
  const [phase, setPhase] = useState<Phase>('black');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase('done');
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('glitch'), 300));
    timers.push(setTimeout(() => setPhase('bunny'), 500));
    timers.push(setTimeout(() => setPhase('title'), 800));
    timers.push(setTimeout(() => setPhase('menu'), 1200));
    timers.push(setTimeout(() => setPhase('done'), 2000));

    return () => timers.forEach(clearTimeout);
  }, [prefersReducedMotion]);

  const skipIntro = () => setPhase('done');

  const handleMenuClick = (item: MenuItem) => {
    try { sessionStorage.setItem('8pm_intro_seen', '1'); } catch { /* ignore */ }
    onNavigate(item.target, item.external);
  };

  const stars = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() < 0.7 ? 1 : 2,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
      color: Math.random() < 0.25 ? '#2dd4bf' : '#ffffff',
    })),
  []);

  const sparks = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 6,
      color: Math.random() < 0.5 ? '#ec4899' : '#2dd4bf',
    })),
  );

  const atmosphereVisible = phase !== 'black';
  const bunnyVisible = phase === 'bunny' || phase === 'title' || phase === 'menu' || phase === 'done';
  const titleVisible = phase === 'title' || phase === 'menu' || phase === 'done';
  const menuVisible = phase === 'menu' || phase === 'done';
  const showSkip = phase !== 'done' && phase !== 'black';

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-y-auto overflow-x-hidden">
      {/* CRT scanlines */}
      {atmosphereVisible && (
        <>
          <div className="entry-scanlines fixed inset-0 pointer-events-none z-30" />
          <div className="entry-scanline-moving fixed inset-x-0 pointer-events-none z-30" />
          <div className="entry-glitch-overlay fixed inset-0 pointer-events-none z-20" />

          {/* Pixel stars */}
          <div className="fixed inset-0 pointer-events-none z-10">
            {stars.map(s => (
              <div
                key={s.id}
                className="entry-star absolute"
                style={{
                  top: `${s.top}%`,
                  left: `${s.left}%`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  background: s.color,
                  animationDelay: `${s.delay}s`,
                  animationDuration: `${s.duration}s`,
                }}
              />
            ))}
          </div>

          {/* Pixel sparks */}
          <div className="fixed inset-0 pointer-events-none z-10">
            {sparks.map(s => (
              <div
                key={s.id}
                className="entry-spark absolute"
                style={{
                  top: `${s.top}%`,
                  left: `${s.left}%`,
                  background: s.color,
                  animationDelay: `${s.delay}s`,
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Glitch flash during intro */}
      {phase === 'glitch' && (
        <div className="entry-glitch-flash fixed inset-0 z-40 pointer-events-none" />
      )}

      {/* Main content — min-height fills screen, but grows if content overflows */}
      <div className="relative z-40 min-h-screen flex flex-col items-center justify-center px-6 py-10">
        {/* Title */}
        {titleVisible && (
          <h1
            className="entry-title font-press-start text-center mb-4 md:mb-6"
            style={{
              color: '#ffffff',
              fontSize: 'clamp(10px, 3vw, 18px)',
              letterSpacing: '0.08em',
              textShadow: '0 0 10px rgba(45, 212, 191, 0.5), 0 0 20px rgba(45, 212, 191, 0.2)',
            }}
          >
            8PLUSMUSIC.COM
          </h1>
        )}

        {/* Bunny GIF — constrained by both width and height so it always fits */}
        {bunnyVisible && (
          <div className="entry-bunny mb-6 md:mb-8 flex justify-center">
            <img
              src="/bunny_lady_gif.gif"
              alt="8PlusMusic Bunny"
              className="entry-bunny-img"
              style={{
                maxWidth: 'min(45vw, 280px)',
                maxHeight: '45vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Menu */}
        {menuVisible && (
          <nav className="flex flex-col items-center gap-2 md:gap-3 w-full max-w-sm">
            {MENU_ITEMS.map((item, i) => (
              <button
                key={item.target}
                className="entry-menu-item"
                style={{ animationDelay: `${i * 100}ms` }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(i)}
                onBlur={() => setHoveredIdx(null)}
                onTouchStart={() => setHoveredIdx(i)}
                onClick={() => handleMenuClick(item)}
              >
                {hoveredIdx === i && <span className="entry-arrow">&gt;</span>}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Skip Intro */}
      {showSkip && (
        <button
          onClick={skipIntro}
          className="entry-skip fixed bottom-5 right-5 z-50"
        >
          SKIP INTRO
        </button>
      )}
    </div>
  );
}
