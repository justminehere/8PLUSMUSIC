import SoundWave from './SoundWave';

const socials = [
  { label: 'TIKTOK', href: 'https://www.tiktok.com/@8plusmusic?lang=en' },
  { label: 'Instagram', href: 'https://www.instagram.com/8plusmusic/' },
  { label: 'Youtube', href: 'https://www.youtube.com/channel/UCkmp1KlrwUYSxiHc9wFguvw' },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black px-6">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-pink-500 opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-teal-400 opacity-10 blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 text-center mb-8 animate-fade-in-up">
        <h1
          className="font-black tracking-tighter leading-none text-white"
          style={{ fontSize: 'clamp(3.5rem, 12vw, 10rem)', letterSpacing: '-0.04em' }}
        >
          <span className="text-white" style={{ filter: 'drop-shadow(0 0 40px rgba(236,72,153,0.5))' }}>8</span>
          <span className="bg-gradient-to-r from-pink-400 via-teal-300 to-pink-400 bg-clip-text text-transparent">Plus</span>
          <span className="text-white">Music</span>
        </h1>
      </div>

      {/* Soundwave */}
      <div className="relative z-10 w-full max-w-3xl mb-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <SoundWave />
      </div>

      {/* Tagline */}
      <p
        className="relative z-10 text-center text-xl md:text-2xl text-zinc-400 font-light tracking-widest uppercase animate-fade-in"
        style={{ animationDelay: '0.6s' }}
      >
        Music for the next cute universe.
      </p>

      {/* Scroll hint + socials */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '1.5s' }}>
        <div className="flex flex-col items-center gap-2">
          <span className="text-zinc-600 text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-pink-500 to-transparent animate-bounce" />
        </div>
        <h2 className="text-white text-sm md:text-base font-semibold tracking-[0.2em] uppercase">Our socials:</h2>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {socials.map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-teal-300 text-sm md:text-base font-medium tracking-widest uppercase transition-colors"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
