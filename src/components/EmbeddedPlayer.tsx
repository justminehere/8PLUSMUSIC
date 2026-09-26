import { useRef } from 'react';

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

    if (host === 'youtube.com' && u.pathname === '/watch') {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'youtube.com' && u.pathname.startsWith('/shorts/')) {
      const id = u.pathname.split('/')[2];
      return id ? `https://www.youtube.com/embed/${id}` : null;
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

export function YouTubeAutoUnmutePlayer({ videoId, onComplete }: PlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;

  return (
    <div>
      <iframe
        ref={iframeRef}
        key={videoId}
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        frameBorder="0"
        className="w-full rounded-lg"
        style={{ height: 200 }}
        title="YouTube video player"
      />
      {onComplete && (
        <button
          onClick={onComplete}
          className="mt-3 w-full py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-sm font-bold hover:bg-teal-500/20 transition-colors"
        >
          I've finished listening — unlock voting
        </button>
      )}
    </div>
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
      title="Audio player"
    />
  );
}
