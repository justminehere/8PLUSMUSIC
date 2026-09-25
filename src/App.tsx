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
import Chat from './components/Chat';
import AdminDashboard from './components/AdminDashboard';
import PrivacyBanner from './components/PrivacyBanner';
import PrivacyPolicy from './components/PrivacyPolicy';
import MusicUpload from './components/MusicUpload';
import MusicPlayer from './components/MusicPlayer';
import EntryPage from './components/EntryPage';

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

export default function App() {
  const [policyOpen, setPolicyOpen] = useState(false);
  const [showEntry, setShowEntry] = useState(true);

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

  const [dachshundEp1, dachshundEp2, bunny] = EPS;

  return (
    <div className="min-h-screen bg-black">
      {showEntry && <EntryPage onNavigate={handleNavigate} />}

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
      <Chat />
      <PrivacyBanner onOpenPolicy={() => setPolicyOpen(true)} />
      {policyOpen && <PrivacyPolicy onClose={() => setPolicyOpen(false)} />}
    </div>
  );
}
