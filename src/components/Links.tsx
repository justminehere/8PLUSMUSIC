import { ExternalLink } from 'lucide-react';

interface LinkItem {
  label: string;
  href: string;
  color: string;
  popup: boolean;
}

const links: LinkItem[] = [
  { label: 'dachshund.land',  href: 'https://dachshund.land',   color: '#ec4899', popup: true },
  { label: 'bunny.land',      href: 'https://bunny.land',        color: '#2dd4bf', popup: true },
  { label: 'pawsandtails.vip',href: 'https://pawsandtails.vip', color: '#f472b6', popup: true },
  { label: '8plusmusic.com',  href: 'https://8plusmusic.com',   color: '#5eead4', popup: false },
];

function openPopup(href: string) {
  const w = 1000;
  const h = 700;
  const left = Math.round(window.screenX + (window.outerWidth  - w) / 2);
  const top  = Math.round(window.screenY + (window.outerHeight - h) / 2);
  window.open(
    href,
    '_blank',
    `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
  );
}

export default function Links() {
  return (
    <section className="relative py-24 px-6 bg-black overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-pink-500 opacity-5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-pink-400 mb-4">Our Universe</p>
        <h2 className="font-black text-4xl md:text-5xl text-white tracking-tighter mb-14">
          Explore the Worlds
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {links.map((link) => (
            link.popup ? (
              <button
                key={link.label}
                onClick={() => openPopup(link.href)}
                className="group relative flex items-center justify-between gap-4 px-8 py-6 rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] text-left w-full"
                style={{
                  borderColor: `${link.color}25`,
                  background: `linear-gradient(135deg, ${link.color}08 0%, rgba(0,0,0,0) 100%)`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(135deg, ${link.color}15 0%, transparent 100%)` }}
                />
                <span
                  className="relative z-10 font-black text-xl tracking-tight text-white"
                  style={{ textShadow: `0 0 30px ${link.color}60` }}
                >
                  {link.label}
                </span>
                <ExternalLink
                  size={18}
                  className="relative z-10 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                  style={{ color: link.color }}
                />
              </button>
            ) : (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-between gap-4 px-8 py-6 rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
                style={{
                  borderColor: `${link.color}25`,
                  background: `linear-gradient(135deg, ${link.color}08 0%, rgba(0,0,0,0) 100%)`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(135deg, ${link.color}15 0%, transparent 100%)` }}
                />
                <span
                  className="relative z-10 font-black text-xl tracking-tight text-white"
                  style={{ textShadow: `0 0 30px ${link.color}60` }}
                >
                  {link.label}
                </span>
                <ExternalLink
                  size={18}
                  className="relative z-10 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                  style={{ color: link.color }}
                />
              </a>
            )
          ))}
        </div>
      </div>
    </section>
  );
}
