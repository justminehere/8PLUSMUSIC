import { useState } from 'react';
import { X, Play, ChevronUp, ChevronDown } from 'lucide-react';
import { usePlayer, closePlayer } from '../lib/playerStore';

export default function Player() {
  const player = usePlayer();
  const [expanded, setExpanded] = useState(false);

  if (!player.videoId) return null;

  const embedSrc = `https://www.youtube.com/embed/${player.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=1`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3">
      <div
        className="mx-auto mb-4 max-w-3xl rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300"
        style={{
          background: 'rgba(10,10,10,0.95)',
          borderColor: `${player.coverColor}40`,
          boxShadow: `0 -8px 40px ${player.coverColor}30, 0 8px 32px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Always-visible iframe so autoplay + audio work.
            Collapsed: small 16:9 thumbnail-size player. Expanded: full-width. */}
        <div
          className="relative w-full bg-black overflow-hidden transition-all duration-300 mx-auto"
          style={{
            aspectRatio: '16 / 9',
            width: expanded ? '100%' : 96,
            height: expanded ? 'auto' : 54,
          }}
        >
          <iframe
            key={player.videoId}
            src={embedSrc}
            title={player.title}
            className="w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          />
        </div>

        <div className="flex items-center gap-3 p-3">
          {/* Cover thumbnail */}
          <div
            className="flex-shrink-0 rounded-lg overflow-hidden border cursor-pointer relative"
            style={{ borderColor: `${player.coverColor}40`, width: 44, height: 44 }}
            onClick={() => setExpanded(v => !v)}
            title={expanded ? 'Collapse video' : 'Show video'}
          >
            {player.coverUrl ? (
              <img src={player.coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full"
                style={{ background: `linear-gradient(135deg, ${player.coverColor}40, #1a1a1a)` }}
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.25)' }}>
              <Play size={14} style={{ color: player.coverColor }} className="ml-0.5" />
            </div>
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(v => !v)}>
            <p className="text-[10px] tracking-[0.25em] uppercase" style={{ color: player.coverColor }}>
              Now Playing
            </p>
            <p className="text-sm font-medium text-white truncate">{player.title}</p>
          </div>

          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: player.coverColor }} />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Live</span>
          </div>

          {/* Expand/collapse */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            aria-label={expanded ? 'Collapse video' : 'Show video'}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>

          {/* Close */}
          <button
            onClick={closePlayer}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            aria-label="Close player"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
