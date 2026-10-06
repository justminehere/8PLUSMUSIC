import { useState, useCallback, useEffect } from 'react';
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
import ChartPage from './components/ChartPage';
import FanPage from './components/FanPage';
import ArcadeNav from './components/ArcadeNav';
import ArcadeAtmosphere from './components/ArcadeAtmosphere';
import ArcadeBackButton from './components/ArcadeBackButton';

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

function isChartRoute() {
  const p = window.location.pathname.toLowerCase();
  return p === '/chart' || p === '/charts';
}

function isFanRoute() {
  const p = window.location.pathname.toLowerCase();
  return p === '/fan' || p === '/fans';
}

function isProfilesRoute() {
  const p = window.location.pathname.toLowerCase();
  return p === '/profiles';
}

function isLiveCreationsRoute() {
  const p = window.location.pathname.toLowerCase();
  return p === '/live-creations';
}

export default function App() {
  const [policyOpen, setPolicyOpen] = useState(false);

  const handleNavigate = useCallback((target: string, external?: boolean) => {
    if (external) {
      window.location.href = '/' + target;
      return;
    }
    // If we're not on the homepage, navigate home with section hash
    const path = window.location.pathname;
    if (path !== '/' && path !== '') {
      window.location.href = '/#' + target;
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

  // Scroll to section when homepage loads with a hash (e.g. /#about)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth' }));
    }
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

  if (isChartRoute()) {
    return <ChartPage />;
  }

  if (isFanRoute()) {
    return <FanPage />;
  }

  if (isProfilesRoute()) {
    return <ComingSoonPage title="8+ PROFILES" />;
  }

  if (isLiveCreationsRoute()) {
    return <ComingSoonPage title="LIVE CREATIONS" />;
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
            epId={dachshundEp1.id}
            coverColor={dachshundEp1.coverColor}
            coverAccent={dachshundEp1.coverAccent}
            tracks={dachshundEp1.tracks}
            imageUrl={dachshundEp1.imageUrl}
          />

          <div className="arcade-divider" />

          <EPSection
            title={dachshundEp2.label}
            epId={dachshundEp2.id}
            coverColor={dachshundEp2.coverColor}
            coverAccent={dachshundEp2.coverAccent}
            tracks={dachshundEp2.tracks}
            imageUrl={dachshundEp2.imageUrl}
            reverse
          />

          <div className="arcade-divider" />

          <EPSection
            title={bunny.label}
            epId={bunny.id}
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

function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-black relative flex flex-col items-center justify-center px-6">
      <ArcadeAtmosphere />
      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        <ArcadeBackButton />
        <h1
          className="font-press-start text-white arcade-title-main"
          style={{ fontSize: 'clamp(20px, 5vw, 40px)', letterSpacing: '0.04em' }}
        >
          {title}
        </h1>
        <p
          className="font-press-start text-zinc-400"
          style={{ fontSize: '10px', letterSpacing: '0.06em', lineHeight: 1.8 }}
        >
          COMING SOON
        </p>
        <div className="flex gap-1.5 mt-4">
          <span className="arcade-status-dot" style={{ background: '#2dd4bf', width: 8, height: 8, animation: 'dotBlink 1.2s ease-in-out infinite' }} />
          <span className="arcade-status-dot" style={{ background: '#ec4899', width: 8, height: 8, animation: 'dotBlink 1.8s ease-in-out infinite', animationDelay: '0.3s' }} />
          <span className="arcade-status-dot" style={{ background: '#2dd4bf', width: 8, height: 8, animation: 'dotBlink 1.5s ease-in-out infinite', animationDelay: '0.6s' }} />
        </div>
      </div>
    </div>
  );
}
