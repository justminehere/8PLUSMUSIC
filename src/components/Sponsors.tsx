import { BadgeCheck, Globe, Palette, Megaphone, Heart, ChevronRight } from 'lucide-react';
import { setContactSubject } from '../lib/contactIntent';

const PERKS = [
  {
    icon: Globe,
    title: 'Website Presence',
    desc: 'Your logo featured on our official sponsor section, release pages, and community pages.',
    color: '#ec4899',
  },
  {
    icon: Palette,
    title: 'Promo Artwork',
    desc: 'Your brand included on selected promotional cover versions, social graphics, banners, and campaign visuals.',
    color: '#2dd4bf',
  },
  {
    icon: Megaphone,
    title: 'Digital Campaigns',
    desc: 'Sponsor mentions across our website, social channels, music announcements, and selected launch posts.',
    color: '#f472b6',
  },
  {
    icon: Heart,
    title: 'Community Releases',
    desc: 'Support playful releases such as dachshund.land and bunny.land, created for cute communities and family-friendly music worlds.',
    color: '#5eead4',
  },
];

export default function Sponsors() {
  const handleCTA = () => {
    setContactSubject('Sponsorship');
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-28 px-6 overflow-hidden bg-zinc-950">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
      <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-pink-500 opacity-[0.06] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full bg-teal-400 opacity-[0.06] blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-xs tracking-widest uppercase font-semibold"
            style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.25)', color: '#ec4899' }}
          >
            <BadgeCheck size={12} />
            Sponsorship Opportunities
          </div>
          <h2 className="font-black text-5xl md:text-6xl text-white tracking-tighter leading-none mb-5">
            Put Your Brand<br />
            <span className="bg-gradient-to-r from-pink-400 to-teal-400 bg-clip-text text-transparent">
              Inside the 8PlusMusic Universe
            </span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            Partner with 8PlusMusic and place your brand in front of our growing music,
            pet, bunny, and cute-community audience.
          </p>
        </div>

        {/* Perks grid */}
        <div className="grid sm:grid-cols-2 gap-5 mb-14">
          {PERKS.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-200"
              style={{ background: '#0d0d0d', border: `1px solid ${color}22` }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${color}18` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <h3 className="font-black text-white text-lg tracking-tight mb-2">{title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* What it looks like */}
        <div
          className="rounded-2xl p-8 mb-14 flex flex-col md:flex-row items-center gap-8"
          style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex -space-x-4 flex-shrink-0">
            <div className="relative">
              <img
                src="/dachshu8ndecover.png"
                alt="Dachshund EP"
                className="w-24 h-24 rounded-xl object-cover shadow-2xl ring-2 ring-black"
              />
              <div
                className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider text-black"
                style={{ background: 'linear-gradient(90deg,#ec4899,#2dd4bf)' }}
              >
                PROMO
              </div>
            </div>
            <div className="relative mt-4">
              <img
                src="/bunnyland_cover.png"
                alt="Bunnyland EP"
                className="w-24 h-24 rounded-xl object-cover shadow-2xl ring-2 ring-black"
              />
              <div
                className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider text-black"
                style={{ background: 'linear-gradient(90deg,#ec4899,#2dd4bf)' }}
              >
                PROMO
              </div>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs tracking-widest uppercase text-teal-400 mb-2 font-semibold">What It Looks Like</p>
            <h3 className="font-black text-white text-2xl tracking-tight mb-3">Your Brand on Our Promo Art</h3>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
              Each sponsor receives visual placement in the 8PlusMusic sponsor area and selected
              promotional artwork connected to our releases. Official streaming cover artwork
              follows the rules of Spotify, Apple Music, Ditto, and other platforms.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleCTA}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-black text-base tracking-wide transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(90deg, #ec4899 0%, #2dd4bf 100%)',
              boxShadow: '0 0 40px rgba(236,72,153,0.35)',
            }}
          >
            Become a Sponsor
            <ChevronRight size={18} />
          </button>
          <p className="text-zinc-600 text-xs mt-4 tracking-wide">
            Fill out the contact form below and select <span className="text-zinc-400">Sponsorship</span> as the subject
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
    </section>
  );
}
