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
      return id ? `https://www.youtube.com/embed/${id}?${ap}controls=1&rel=0&modestbranding=1&enablejsapi=1` : null;
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}?${ap}controls=1&rel=0&modestbranding=1&enablejsapi=1` : null;
    }
    if (host === 'youtube.com' && u.pathname.startsWith('/shorts/')) {
      const id = u.pathname.split('/')[2];
      return id ? `https://www.youtube.com/embed/${id}?${ap}controls=1&rel=0&modestbranding=1&enablejsapi=1` : null;
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

interface PlayerProps {
  videoId: string;
  autoplay: boolean;
  onComplete?: () => void;
  onPlaying?: () => void;
}

export function YouTubeAutoUnmutePlayer({ videoId, autoplay, onComplete, onPlaying }: PlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const unmuteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onPlayingRef = useRef(onPlaying);
  const hasFiredCompleteRef = useRef(false);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onPlayingRef.current = onPlaying; }, [onPlaying]);

  // Listen for YouTube state change via postMessage
  useEffect(() => {
    hasFiredCompleteRef.current = false;

    const handler = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.event !== 'onStateChange' || !data.info) return;

        // 1 = playing, 0 = ended
        if (data.info === 1 && onPlayingRef.current) {
          onPlayingRef.current();
        }
        if (data.info === 0 && !hasFiredCompleteRef.current) {
          hasFiredCompleteRef.current = true;
          if (onCompleteRef.current) onCompleteRef.current();
        }
      } catch {
        // ignore malformed messages
      }
    };

    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
      if (unmuteTimerRef.current) {
        clearInterval(unmuteTimerRef.current);
        unmuteTimerRef.current = null;
      }
    };
  }, [videoId]);

  // Send "listen" command to the iframe so it posts state changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    const sendListen = () => {
      try {
        iframe.contentWindow!.postMessage(
          JSON.stringify({ event: 'listening' }),
          'https://www.youtube.com'
        );
      } catch {
        // ignore
      }
    };

    // YouTube needs repeated "listening" pings until it responds
    sendListen();
    const timer = setInterval(sendListen, 1000);
    const stopTimer = setTimeout(() => clearInterval(timer), 8000);

    // Attempt to unmute after a delay (autoplay starts muted)
    if (autoplay) {
      unmuteTimerRef.current = setInterval(() => {
        try {
          iframe.contentWindow!.postMessage(
            JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
            'https://www.youtube.com'
          );
          iframe.contentWindow!.postMessage(
            JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }),
            'https://www.youtube.com'
          );
        } catch {
          // ignore
        }
      }, 800);
      setTimeout(() => {
        if (unmuteTimerRef.current) {
          clearInterval(unmuteTimerRef.current);
          unmuteTimerRef.current = null;
        }
      }, 6000);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(stopTimer);
      if (unmuteTimerRef.current) {
        clearInterval(unmuteTimerRef.current);
        unmuteTimerRef.current = null;
      }
    };
  }, [videoId, autoplay]);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?${autoplay ? 'autoplay=1&mute=1&' : ''}controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;

  return (
    <iframe
      ref={iframeRef}
      key={videoId}
      src={embedUrl}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      frameBorder="0"
      className="w-full rounded-lg"
      style={{ height: 200 }}
    />
  );
}

interface EmbeddedPlayerProps {
  url: string;
  autoplay: boolean;
  onComplete?: () => void;
  onPlaying?: () => void;
}

export function EmbeddedPlayer({ url, autoplay, onComplete, onPlaying }: EmbeddedPlayerProps) {
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
      <audio
        key={url}
        src={url}
        autoPlay={autoplay}
        controls
        className="w-full"
        style={{ height: 36 }}
        onEnded={onComplete}
        onPlay={onPlaying}
      />
    );
  }

  const ytId = extractYouTubeId(url);
  if (ytId) {
    return <YouTubeAutoUnmutePlayer key={ytId} videoId={ytId} autoplay={autoplay} onComplete={onComplete} onPlaying={onPlaying} />;
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
