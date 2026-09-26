import { useMemo } from 'react';

interface StarSpec {
  top: string;
  size: number;
  delay: string;
  duration: string;
  color: string;
  side: 'left' | 'right';
  col: number;
}

const STAR_COLORS = ['#ffffff', '#2dd4bf', '#ec4899', '#fbbf24', '#a78bfa'];

function buildStars(seed: number, count: number): StarSpec[] {
  const stars: StarSpec[] = [];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < count; i++) {
    const side: 'left' | 'right' = rand() > 0.5 ? 'left' : 'right';
    stars.push({
      top: `${5 + rand() * 90}%`,
      size: 2 + Math.floor(rand() * 4),
      delay: `${(rand() * 4).toFixed(2)}s`,
      duration: `${(1.2 + rand() * 2.5).toFixed(2)}s`,
      color: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
      side,
      col: Math.floor(rand() * 3),
    });
  }
  return stars;
}

export default function FlickeringStars() {
  const stars = useMemo(() => buildStars(42, 60), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {stars.map((star, i) => {
        const xOffset = star.side === 'left'
          ? `${10 + star.col * 6}%`
          : `${90 - star.col * 6}%`;
        return (
          <div
            key={i}
            className="arcade-star"
            style={{
              position: 'absolute',
              top: star.top,
              left: xOffset,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: star.color,
              boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
              transform: 'translate(-50%, -50%)',
              animation: `starFlicker ${star.duration} ease-in-out ${star.delay} infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
