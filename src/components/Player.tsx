import { useRef, useEffect, useState } from 'react';
import { X, Play, Pause, ChevronUp, ChevronDown } from 'lucide-react';
import { usePlayer, closePlayer } from '../lib/playerStore';

let apiPromise: Promise<void> | null = null;
function loadYouTubeAPI(): Promise<void> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>(resolve => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const first = document.getElementsByTagName('script')[0];
    first.parentNode?.insertBefore(tag, first);
    (window as any).onYouTubeIframeAPIReady = () => resolve();
  });
  return apiPromise;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function Player() {
  const player = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!player.videoId) return;
    let cancelled = false;

    loadYouTubeAPI().then(() => {
      if (cancelled || !containerRef.current) return;
      if (playerRef.current) {
        playerRef.current.loadVideoById(player.videoId);
        return;
      }
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: player.videoId,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, controls: 1, modestbranding: 1, rel: 0 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e: any) => {
            setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
          },
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [player.videoId]);

  useEffect(() => {
    if (!player.videoId && playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
      setReady(false);
      setIsPlaying(false);
      setExpanded(false);
    }
  }, [player.videoId]);

  if (!player.videoId) return null;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playerRef.current || !ready) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div
        className="mx-auto mb-4 max-w-3xl rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300"
        style={{
          background: 'rgba(10,10,10,0.94)',
          borderColor: `${player.coverColor}40`,
          boxShadow: `0 -8px 40px ${player.coverColor}30, 0 8px 32px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Video area — visible so audio plays. Collapses to a thin strip when not expanded. */}
        <div
          className="relative w-full bg-black transition-all duration-300 overflow-hidden"
          style={{ height: expanded ? 220 : 0 }}
        >
          <div className="w-full h-full">
            <div ref={containerRef} className="w-full h-full" />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3">
          {/* Cover thumbnail */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border cursor-pointer"
            style={{ borderColor: `${player.coverColor}40` }}
            onClick={() => setExpanded(v => !v)}
            title={expanded ? 'Collapse video' : 'Expand video'}
          >
            {player.coverUrl ? (
              <img src={player.coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full"
                style={{ background: `linear-gradient(135deg, ${player.coverColor}40, #1a1a1a)` }}
              />
            )}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(v => !v)}>
            <p className="text-[10px] tracking-[0.25em] uppercase" style={{ color: player.coverColor }}>
              Now Playing
            </p>
            <p className="text-sm font-medium text-white truncate">{player.title}</p>
          </div>

          {/* Expand/collapse */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            aria-label={expanded ? 'Collapse video' : 'Expand video'}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            style={{ background: `${player.coverColor}22`, border: `1px solid ${player.coverColor}55`, color: player.coverColor }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
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

        {/* Progress bar */}
        {isPlaying && (
          <div className="h-0.5 w-full animate-pulse" style={{ background: player.coverColor, opacity: 0.6 }} />
        )}
      </div>
    </div>
  );
}
