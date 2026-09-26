import ArcadeBackButton from './ArcadeBackButton';

export default function FanPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-pink-500 opacity-5 blur-3xl pointer-events-none" />

      <div className="absolute top-6 left-6 z-20">
        <ArcadeBackButton />
      </div>

      <div className="relative z-10 text-center">
        <p className="arcade-section-label mb-6">Fan Levels</p>

        <h1
          className="arcade-section-title tracking-tighter leading-none mb-8"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}
        >
          BECOME A <span className="bg-gradient-to-r from-pink-400 to-teal-400 bg-clip-text text-transparent">FAN</span>
        </h1>

        <p className="text-zinc-500 text-lg leading-relaxed max-w-md mx-auto">
          Fan levels and games are coming soon.
        </p>

        <div className="arcade-divider max-w-xs mx-auto mt-12" />

        <div className="mt-10">
          <ArcadeBackButton label="BACK TO 8PLUSMUSIC" />
        </div>
      </div>
    </div>
  );
}
