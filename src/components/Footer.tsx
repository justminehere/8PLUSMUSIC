import SoundWave from './SoundWave';
import { ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative py-16 px-6 bg-black overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-8">
        <div className="w-full max-w-sm">
          <SoundWave />
        </div>

        <p className="font-black text-3xl text-white tracking-tighter">
          8Plus<span className="bg-gradient-to-r from-pink-400 to-teal-400 bg-clip-text text-transparent">Music</span>
        </p>

        {/* Producer credit with link */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-zinc-500 text-sm tracking-widest uppercase">Produced by</p>
          <a
            href="https://www.fuenoir.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-6 py-3 rounded-full border border-pink-500/30 hover:border-pink-500/70 transition-all duration-300 hover:bg-pink-500/5"
          >
            <span className="font-black text-xl text-pink-400 group-hover:text-pink-300 transition-colors tracking-tight">
              Fue Noir
            </span>
            <ExternalLink size={14} className="text-pink-500/50 group-hover:text-pink-400 transition-colors" />
          </a>
          <p className="text-zinc-600 text-xs tracking-widest">www.fuenoir.com</p>
        </div>

        <p className="text-zinc-600 text-sm text-center max-w-xs">
          Music for the next cute universe.
        </p>

        <p className="text-zinc-700 text-xs tracking-widest">
          &copy; {new Date().getFullYear()} 8PlusMusic. All rights reserved.
        </p>

        <a
          href="/admin"
          className="text-zinc-800 hover:text-zinc-500 text-xs tracking-widest transition-colors"
        >
          Admin
        </a>
      </div>
    </footer>
  );
}
