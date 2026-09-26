import { useEffect, useRef } from 'react';

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    if (host === 'youtube.com' && u.pathname === '/watch') return u.searchParams.get('v');
    if (host === 'youtu.be') return u.pathname.slice(1) || null;
    if (host === 'youtube.com' && u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] ?? null;
    return null;
  } catch {
    return null;
  }
}

export function toEmbedUrl(url: string, autoplay: boolean): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    const ap = autoplay ? 'autoplay=1&mute=1&' : '';

    if (host === 'youtube.com' && u.pathname === '/watch') {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}?${ap}controls=1` : null;
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}?${ap}controls=1` : null;
    }
    if (host === 'youtube.com' && u.pathname.startsWith('/shorts/')) {
      const id = u.pathname.split('/')[2];
      return id ? `https://www.youtube.com/embed/${id}?${ap}controls=1` : null;
    }

    if (host === 'soundcloud.com') {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=${autoplay ? 'true' : 'false'}&color=%23ec4899`;
    }

    if (host === 'open.spotify.com') {
      return `https://open.spotify.com/embed${u.pathname}`;
    }

    if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(u.pathname)) {
      return url;
    }

    return null;
  } catch {
    return null;
  }
}

export function YouTubeAutoUnmutePlayer({ videoId, autoplay }: { videoId: string; autoplay: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const unmuteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPlayer = () => {
      if (cancelled || !containerRef.current || !window.YT || !window.YT.Player) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          mute: 1,
          controls: 1,
        },
        events: {
          onReady: (e) => {
            if (!autoplay) return;
            e.target.playVideo();
            let attempts = 0;
            unmuteTimerRef.current = setInterval(() => {
              try {
                e.target.unMute();
                e.target.setVolume(100);
                attempts++;
                if (attempts > 10 && unmuteTimerRef.current) {
                  clearInterval(unmuteTimerRef.current);
                  unmuteTimerRef.current = null;
                }
              } catch {
                if (unmuteTimerRef.current) {
                  clearInterval(unmuteTimerRef.current);
                  unmuteTimerRef.current = null;
                }
              }
            }, 500);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      loadPlayer();
    } else {
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady ?? null;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        loadPlayer();
      };
    }

    return () => {
      cancelled = true;
      if (unmuteTimerRef.current) {
        clearInterval(unmuteTimerRef.current);
        unmuteTimerRef.current = null;
      }
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
    };
  }, [videoId, autoplay]);

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" style={{ height: 200 }} />;
}

export function EmbeddedPlayer({ url, autoplay }: { url: string; autoplay: boolean }) {
  const embedUrl = toEmbedUrl(url, autoplay);
  if (!embedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs text-pink-400 hover:text-pink-300 transition-colors py-2"
      >
        Open song in new tab
      </a>
    );
  }

  if (embedUrl === url) {
    return (
      <audio key={url} src={url} autoPlay={autoplay} controls className="w-full" style={{ height: 36 }} />
    );
  }

  const ytId = extractYouTubeId(url);
  if (ytId) {
    return <YouTubeAutoUnmutePlayer key={ytId} videoId={ytId} autoplay={autoplay} />;
  }

  const isSoundCloud = embedUrl.includes('w.soundcloud.com');
  const isSpotify = embedUrl.includes('open.spotify.com');

  return (
    <iframe
      key={embedUrl}
      src={embedUrl}
      allow="autoplay; encrypted-media; fullscreen"
      frameBorder="0"
      scrolling="no"
      className="w-full rounded-lg"
      style={{ height: isSoundCloud ? 166 : isSpotify ? 80 : 64 }}
    />
  );
}
