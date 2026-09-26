import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const STICKERS: string[] = [
  '/stickers/both_bunnies_2.png',
  '/stickers/both_bunnies_4.png',
  '/stickers/ChatGPT_Image_Aug_22,_2026,_11_41_10_AM.png',
  '/stickers/ChatGPT_Image_Aug_22,_2026,_11_41_52_AM.png',
  '/stickers/stream_sticker_Without_logo.png',
];

export default function StickerCarousel() {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const total = STICKERS.length;
  const hasStickers = total > 0;

  const scrollTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = (i + total) % total;
    const child = track.children[clamped] as HTMLElement | undefined;
    if (child) {
      track.scrollTo({ left: child.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    }
    setIndex(clamped);
  };

  useEffect(() => {
    if (!hasStickers) return;
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let nearest = 0;
      let dist = Infinity;
      Array.from(track.children).forEach((c, i) => {
        const el = c as HTMLElement;
        const mid = el.offsetLeft - track.offsetLeft + el.clientWidth / 2;
        const d = Math.abs(mid - center);
        if (d < dist) { dist = d; nearest = i; }
      });
      setIndex(nearest);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [hasStickers]);

  return (
    <section className="relative py-24 px-6 overflow-hidden bg-black">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-pink-500 opacity-5 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-teal-400 opacity-5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="arcade-section-label mb-3" style={{ color: '#ec4899' }}>STICKER GALLERY</p>
          <h2 className="arcade-section-title text-4xl md:text-5xl">
            Collect Them <span className="bg-gradient-to-r from-pink-400 to-teal-400 bg-clip-text text-transparent">All</span>
          </h2>
        </div>

        {hasStickers ? (
          <div className="relative">
            {/* Carousel track */}
            <div
              ref={trackRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 scrollbar-hide"
            >
              {STICKERS.map((src, i) => (
                <div
                  key={i}
                  className="snap-center flex-shrink-0 w-64 h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center"
                >
                  <img
                    src={src}
                    alt={`Promo sticker ${i + 1}`}
                    className="w-full h-full object-contain p-4"
                  />
                </div>
              ))}
            </div>

            {/* Controls */}
            {total > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => scrollTo(index - 1)}
                  className="p-3 rounded-full border border-pink-500/30 text-pink-400 hover:bg-pink-500/10 hover:border-pink-500/60 transition-all"
                  aria-label="Previous sticker"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-1.5">
                  {STICKERS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => scrollTo(i)}
                      className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-pink-400' : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'}`}
                      aria-label={`Go to sticker ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => scrollTo(index + 1)}
                  className="p-3 rounded-full border border-teal-400/30 text-teal-300 hover:bg-teal-400/10 hover:border-teal-400/60 transition-all"
                  aria-label="Next sticker"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-20 border border-dashed border-white/10 rounded-2xl">
            <p className="text-zinc-600 text-sm tracking-widest uppercase">
              Stickers coming soon
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
