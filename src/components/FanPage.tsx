import { use } from 'react';

export default function FanPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-pink-500 opacity-5 blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-teal-400 mb-6">
          Fan Levels
        </p>

        <h1
          className="font-black text-white tracking-tighter leading-none mb-8"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}
        >
          BECOME A <span className="bg-gradient-to-r from-pink-400 to-teal-400 bg-clip-text text-transparent">FAN</span>
        </h1>

        <p className="text-zinc-500 text-lg leading-relaxed max-w-md mx-auto">
          Fan levels and games are coming soon.
        </p>

        <div className="mt-12 h-px max-w-xs mx-auto bg-gradient-to-r from-pink-500 via-teal-400 to-pink-500" />

        <a
          href="/"
          className="mt-10 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-pink-500/30 hover:border-pink-500/70 transition-all duration-300 text-pink-400 font-semibold text-sm tracking-widest uppercase"
        >
          Back to 8PlusMusic
        </a>
      </div>
    </div>
  );
}
