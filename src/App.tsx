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
import FanPage from './components/FanPage';
import ArcadeNav from './components/ArcadeNav';
import ArcadeAtmosphere from './components/ArcadeAtmosphere';

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

  const handleNavigate = useCallback((target: string, external?: boolean) => {
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
    <div className="min-h-screen bg-black relative">
      <ArcadeAtmosphere />
      <ArcadeNav onNavigate={handleNavigate} />

      {/* Spacer for fixed nav */}
      <div className="h-10 md:h-12" />

      <div className="relative z-10">
        <Hero />

        <section id="releases">
          <EPSection
            title={dachshundEp1.label}
            coverColor={dachshundEp1.coverColor}
            coverAccent={dachshundEp1.coverAccent}
            tracks={dachshundEp1.tracks}
            imageUrl={dachshundEp1.imageUrl}
          />

          <div className="arcade-divider" />

          <EPSection
            title={dachshundEp2.label}
            coverColor={dachshundEp2.coverColor}
            coverAccent={dachshundEp2.coverAccent}
            tracks={dachshundEp2.tracks}
            imageUrl={dachshundEp2.imageUrl}
            reverse
          />

          <div className="arcade-divider" />

          <EPSection
            title={bunny.label}
            coverColor={bunny.coverColor}
            coverAccent={bunny.coverAccent}
            tracks={bunny.tracks}
            imageUrl={bunny.imageUrl}
          />
        </section>

        <div className="arcade-divider" />

        <section id="about"><About /></section>
        <div className="arcade-divider" />
        <section id="socials"><Links /></section>
        <div className="arcade-divider" />
        <section id="sponsors"><Sponsors /></section>
        <div className="arcade-divider" />
        <section id="contact"><Contact /></section>
        <div className="arcade-divider" />
        <StickerCarousel />
        <Footer />
        <PrivacyBanner onOpenPolicy={() => setPolicyOpen(true)} />
        {policyOpen && <PrivacyPolicy onClose={() => setPolicyOpen(false)} />}
      </div>
    </div>
  );
}
