import { useRef, useEffect, useState } from 'react';
import { Play, Music } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Track {
  title: string;
  duration?: string;
  coverUrl?: string;
}

interface EPSectionProps {
  title: string;
  coverColor: string;
  coverAccent: string;
  tracks: Track[];
  imageUrl?: string;
  reverse?: boolean;
}

interface TrackLink {
  track_title: string;
  itunes_url: string;
}

export default function EPSection({ title, coverColor, coverAccent, tracks, imageUrl, reverse }: EPSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from('track_links')
      .select('track_title, itunes_url')
      .eq('ep', title)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        (data as TrackLink[]).forEach(l => { map[l.track_title] = l.itunes_url; });
        setLinks(map);
      });
  }, [title]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { el.classList.add('is-visible'); observer.disconnect(); }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-24 px-6 overflow-hidden bg-black">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: reverse
            ? `radial-gradient(ellipse at 80% 50%, ${coverAccent}18 0%, transparent 60%)`
            : `radial-gradient(ellipse at 20% 50%, ${coverColor}18 0%, transparent 60%)`,
        }}
      />

      <div
        ref={sectionRef}
        className={`reveal-section relative z-10 max-w-6xl mx-auto flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-16 items-start`}
      >
        {/* Large EP cover */}
        <div className="flex-shrink-0 w-64 h-64 md:w-80 md:h-80 relative group self-center lg:self-start lg:sticky lg:top-24">
          <div
            className="w-full h-full rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-1"
            style={{ boxShadow: `0 0 60px ${coverColor}40, 0 20px 80px rgba(0,0,0,0.8)` }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-4"
                style={{
                  background: `linear-gradient(135deg, ${coverColor}30 0%, #0a0a0a 50%, ${coverAccent}30 100%)`,
                  border: `1px solid ${coverColor}30`,
                }}
              >
                <span className="font-black text-white text-xl px-4 tracking-tight text-center">{title}</span>
              </div>
            )}
          </div>
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none animate-pulse-glow"
            style={{ boxShadow: `0 0 80px ${coverColor}40` }}
          />
        </div>

        {/* Tracklist */}
        <div className="flex-1 min-w-0">
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: coverColor }}>
            EP Release
          </p>
          <h2 className="font-black text-5xl md:text-6xl text-white tracking-tighter mb-8 leading-none">
            {title}
          </h2>

          <div className="space-y-1.5">
            {tracks.map((track, i) => (
              <TrackRow
                key={i}
                track={track}
                index={i}
                coverColor={coverColor}
                epCoverUrl={imageUrl}
                itunesUrl={links[track.title]}
              />
            ))}
          </div>

          <div
            className="mt-6 inline-flex items-center gap-2 text-xs tracking-widest uppercase px-5 py-2 rounded-full border"
            style={{ borderColor: `${coverColor}40`, color: coverColor }}
          >
            <span>Coming Soon</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrackRow({
  track,
  index,
  coverColor,
  epCoverUrl,
  itunesUrl,
}: {
  track: Track;
  index: number;
  coverColor: string;
  epCoverUrl?: string;
  itunesUrl?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('track-visible'), index * 55);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  const thumbSrc = track.coverUrl ?? epCoverUrl;
  const linked = !!itunesUrl;

  const inner = (
    <div
      ref={ref}
      className={`track-row group flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all duration-200 ${
        linked ? 'cursor-pointer hover:translate-x-1.5' : 'cursor-default opacity-60'
      }`}
      style={{ background: linked ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)' }}
    >
      {/* Track number */}
      <span className="text-xs w-5 text-center font-mono flex-shrink-0" style={{ color: coverColor, opacity: 0.55 }}>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Small cover thumbnail */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden border"
        style={{ borderColor: `${coverColor}25` }}
      >
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt=""
            className={`w-full h-full object-cover transition-opacity ${linked ? 'opacity-80 group-hover:opacity-100' : 'opacity-40'}`}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${coverColor}30, #1a1a1a)` }}
          >
            <Music size={12} style={{ color: coverColor, opacity: 0.4 }} />
          </div>
        )}
      </div>

      {/* Play icon on hover (only when linked) */}
      {linked && (
        <Play size={13} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: coverColor }} />
      )}

      {/* Title */}
      <span
        className={`font-medium tracking-wide flex-1 text-sm truncate transition-colors ${
          linked ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-600'
        }`}
      >
        {track.title}
      </span>

      {/* iTunes badge when linked */}
      {linked && (
        <span
          className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ background: `${coverColor}22`, color: coverColor, border: `1px solid ${coverColor}40` }}
        >
          iTunes
        </span>
      )}

      {/* Duration */}
      <span className="text-zinc-600 text-xs flex-shrink-0">{track.duration ?? '—:——'}</span>
    </div>
  );

  if (linked) {
    return (
      <a href={itunesUrl} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }

  return inner;
}
