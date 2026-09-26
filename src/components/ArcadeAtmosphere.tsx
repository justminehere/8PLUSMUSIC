import { useMemo } from 'react';

export default function ArcadeAtmosphere() {
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const starCount = isMobile ? 15 : 30;
  const sparkCount = isMobile ? 4 : 8;
  const noteCount = isMobile ? 3 : 6;

  const stars = useMemo(() =>
    Array.from({ length: starCount }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() < 0.7 ? 1 : 2,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 4,
      color: Math.random() < 0.25 ? '#2dd4bf' : '#ffffff',
    })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  const sparks = useMemo(() =>
    Array.from({ length: sparkCount }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      color: Math.random() < 0.5 ? '#ec4899' : '#2dd4bf',
    })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  const notes = useMemo(() =>
    Array.from({ length: noteCount }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 15 + Math.random() * 20,
      drift: Math.random() < 0.5 ? 1 : -1,
    })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="arcade-scanlines fixed inset-0" />
        <div className="arcade-grain fixed inset-0" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* CRT scanlines */}
      <div className="arcade-scanlines fixed inset-0" />

      {/* Moving scanline */}
      <div className="arcade-scanline-moving fixed inset-x-0" />

      {/* Screen grain */}
      <div className="arcade-grain fixed inset-0" />

      {/* Rare horizontal glitch */}
      <div className="arcade-glitch-line fixed inset-0" />

      {/* Pixel stars */}
      <div className="fixed inset-0">
        {stars.map(s => (
          <div
            key={s.id}
            className="arcade-star absolute"
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
      <div className="fixed inset-0">
        {sparks.map(s => (
          <div
            key={s.id}
            className="arcade-spark absolute"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              background: s.color,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Drifting music note sprites */}
      <div className="fixed inset-0">
        {notes.map(n => (
          <div
            key={n.id}
            className="arcade-note absolute font-press-start"
            style={{
              top: `${n.top}%`,
              left: `${n.left}%`,
              fontSize: '8px',
              color: n.drift > 0 ? 'rgba(45,212,191,0.12)' : 'rgba(236,72,153,0.12)',
              animationDelay: `${n.delay}s`,
              animationDuration: `${n.duration}s`,
              animationDirection: n.drift > 0 ? 'normal' : 'reverse',
            }}
          >
            ♪
          </div>
        ))}
      </div>
    </div>
  );
}
