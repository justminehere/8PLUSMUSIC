import { useState, useCallback } from 'react';
import { EPS } from './lib/tracks';
import Hero from './components/Hero';
import EPSection from './components/EPSection';
import About from './components/About';
import Links from './components/Links';
import Sponsors from './components/Sponsors';
import Contact from './components/Contact';
import Footer from './components/Footer';
import StickerCarousel from './components/StickerCarousel';
import AdminDashboard from './components/AdminDashboard';
import PrivacyBanner from './components/PrivacyBanner';
import PrivacyPolicy from './components/PrivacyPolicy';
import MusicUpload from './components/MusicUpload';
import MusicPlayer from './components/MusicPlayer';
import EntryPage from './components/EntryPage';
import FanPage from './components/FanPage';

function isAdminRoute() {
  return (
    window.location.pathname === '/admin' ||
    window.location.hash === '#admin'
  );
}

function isUploadRoute() {
  const p = window.location.pathname.toLowerCase();
  return p === '/upload' || p === '/u' || p === '/music_upload';
}

function isPlayerRoute() {
  return (
    window.location.pathname === '/player' ||
    window.location.pathname.toLowerCase() === '/player'
  );
}

function isFanRoute() {
  const p = window.location.pathname.toLowerCase();
  return p === '/fan' || p === '/fans';
}

export default function App() {
  const [policyOpen, setPolicyOpen] = useState(false);
  const [showEntry, setShowEntry] = useState(true);

  const openMenu = useCallback(() => setShowEntry(true), []);

  const handleNavigate = useCallback((target: string, external?: boolean) => {
    setShowEntry(false);
    if (external) {
      window.location.href = '/' + target;
      return;
    }
    requestAnimationFrame(() => {
      const el = document.getElementById(target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }, []);

  if (isAdminRoute()) {
    return <AdminDashboard />;
  }

  if (isUploadRoute()) {
    return <MusicUpload />;
  }

  if (isPlayerRoute()) {
    return <MusicPlayer />;
  }

  if (isFanRoute()) {
    return <FanPage />;
  }

  const [dachshundEp1, dachshundEp2, bunny] = EPS;

  return (
    <div className="min-h-screen bg-black">
      {showEntry && <EntryPage onNavigate={handleNavigate} onClose={() => setShowEntry(false)} />}

      <Hero />

      <section id="releases">
        <EPSection
          title={dachshundEp1.label}
          coverColor={dachshundEp1.coverColor}
          coverAccent={dachshundEp1.coverAccent}
          tracks={dachshundEp1.tracks}
          imageUrl={dachshundEp1.imageUrl}
        />

        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <EPSection
          title={dachshundEp2.label}
          coverColor={dachshundEp2.coverColor}
          coverAccent={dachshundEp2.coverAccent}
          tracks={dachshundEp2.tracks}
          imageUrl={dachshundEp2.imageUrl}
          reverse
        />

        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <EPSection
          title={bunny.label}
          coverColor={bunny.coverColor}
          coverAccent={bunny.coverAccent}
          tracks={bunny.tracks}
          imageUrl={bunny.imageUrl}
        />
      </section>

      <section id="about"><About /></section>
      <section id="socials"><Links /></section>
      <section id="sponsors"><Sponsors /></section>
      <section id="contact"><Contact /></section>
      <StickerCarousel />
      <Footer />
      <PrivacyBanner onOpenPolicy={() => setPolicyOpen(true)} />
      {policyOpen && <PrivacyPolicy onClose={() => setPolicyOpen(false)} />}

      {/* Floating menu button to reopen the arcade entry page */}
      {!showEntry && (
        <button
          onClick={openMenu}
          className="fixed top-4 right-4 z-40 px-4 py-2 font-press-start text-white hover:text-pink-400"
          style={{
            fontSize: '8px',
            letterSpacing: '0.05em',
            border: '2px solid rgba(45, 212, 191, 0.45)',
            background: 'rgba(0, 0, 0, 0.75)',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.8)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(236, 72, 153, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(45, 212, 191, 0.45)';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          MENU
        </button>
      )}
    </div>
  );
}
