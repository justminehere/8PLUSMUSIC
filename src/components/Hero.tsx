import SoundWave from './SoundWave';

const socials = [
  { label: 'TIKTOK', href: 'https://www.tiktok.com/@8plusmusic?lang=en' },
  { label: 'INSTAGRAM', href: 'https://www.instagram.com/8plusmusic/' },
  { label: 'YOUTUBE', href: 'https://www.youtube.com/channel/UCkmp1KlrwUYSxiHc9wFguvw' },
  { label: 'FACEBOOK', href: 'https://www.facebook.com/8plusmusic' },
  { label: 'SPOTIFY', href: 'https://open.spotify.com/artist/7tClU9LaGgN6jWYy5OuS2R' },
];

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-black px-6 pt-8 pb-20">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-pink-500 opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-teal-400 opacity-10 blur-3xl pointer-events-none" />

      {/* Occasional pixel spark behind bunny */}
      <div className="arcade-hero-spark absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Bunny GIF - central focus */}
      <div className="relative z-10 mb-6 arcade-float">
        <img
          src="/bunny_lady_gif.gif"
          alt="8PlusMusic Bunny RAP"
          className="arcade-bunny-img"
          style={{
            maxWidth: 'min(50vw, 320px)',
            maxHeight: '42vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* RAP large text */}
      <h2
        className="relative z-10 font-black text-white tracking-tighter leading-none mb-4 arcade-rap"
        style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', letterSpacing: '-0.04em' }}
      >
        RAP
      </h2>

      {/* 8PLUSMUSIC.COM arcade title */}
      <h1
        className="relative z-10 font-press-start text-center mb-4 arcade-title-main"
        style={{
          color: '#ffffff',
          fontSize: 'clamp(10px, 3.5vw, 22px)',
          letterSpacing: '0.08em',
          textShadow: '0 0 10px rgba(45, 212, 191, 0.5), 0 0 20px rgba(45, 212, 191, 0.2), 0 0 30px rgba(236, 72, 153, 0.15)',
        }}
      >
        8PLUSMUSIC.COM
      </h1>

      {/* Supporting text */}
      <p
        className="relative z-10 text-center font-press-start mb-8"
        style={{
          fontSize: 'clamp(6px, 1.5vw, 10px)',
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.15em',
        }}
      >
        MUSIC &bull; ART &bull; LIVE &bull; COMMUNITY
      </p>

      {/* Soundwave */}
      <div className="relative z-10 w-full max-w-2xl mb-8">
        <SoundWave />
      </div>

      {/* Status bar */}
      <div className="relative z-10 flex items-center gap-6 mb-10 font-press-start text-white" style={{ fontSize: '7px', letterSpacing: '0.1em' }}>
        <span className="flex items-center gap-2">
          <span className="arcade-status-dot" style={{ background: '#2dd4bf', animation: 'dotBlink 1.2s ease-in-out infinite' }} />
          <span style={{ color: '#2dd4bf' }}>8PLUSMUSIC ONLINE</span>
        </span>
        <span style={{ color: 'rgba(255,255,255,0.25)' }}>|</span>
        <span style={{ color: 'rgba(255,255,255,0.35)' }}>PLAYER 1</span>
      </div>

      {/* Social links - compact section below hero */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <h3
          className="font-press-start text-white text-center"
          style={{ fontSize: 'clamp(8px, 2vw, 12px)', letterSpacing: '0.08em', textShadow: '0 0 8px rgba(45,212,191,0.4)' }}
        >
          CONNECT WITH 8PLUSMUSIC
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg">
          {socials.map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="arcade-social-link"
            >
              {s.label}
            </a>
          ))}
          <a href="/upload" className="arcade-social-link arcade-social-cta">UPLOAD YOUR MUSIC</a>
          <a href="/fans" className="arcade-social-link arcade-social-cta">BECOME A FAN</a>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
        <span className="font-press-start text-zinc-600" style={{ fontSize: '6px', letterSpacing: '0.15em' }}>SCROLL</span>
        <div className="w-px h-6 bg-gradient-to-b from-teal-400 to-transparent animate-bounce" />
      </div>
    </section>
  );
}
