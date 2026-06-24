import { useRef, useEffect } from 'react';

export default function About() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-28 px-6 overflow-hidden bg-zinc-950">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

      <div ref={ref} className="reveal-section relative z-10 max-w-4xl mx-auto text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-teal-400 mb-6">
          About the Label
        </p>

        <h2 className="font-black text-5xl md:text-6xl text-white tracking-tighter mb-10 leading-tight">
          8Plus<span className="bg-gradient-to-r from-pink-400 to-teal-400 bg-clip-text text-transparent">Music</span>
        </h2>

        <p className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
          8PlusMusic is a playful independent music label for cute communities, animal worlds,
          child-friendly music and rap. Your kids are safe with our music — dreamy songs,
          imaginative worlds, and AI-assisted music projects that push the edge of what cute
          sounds like.
        </p>

        <div className="mt-12 h-px max-w-xs mx-auto bg-gradient-to-r from-pink-500 via-teal-400 to-pink-500" />

        <div className="mt-8 flex flex-col items-center gap-1">
          <p className="text-sm tracking-widest uppercase text-zinc-500">
            Produced by{' '}
            <a
              href="https://www.fuenoir.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 font-semibold hover:text-pink-300 underline underline-offset-4 decoration-pink-500/40 transition-colors"
            >
              Fue Noir
            </a>
          </p>
          <p className="text-xs text-zinc-600 tracking-widest">www.fuenoir.com</p>
        </div>
      </div>
    </section>
  );
}
