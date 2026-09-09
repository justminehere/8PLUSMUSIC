import { useState } from 'react';
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

function isAdminRoute() {
  return (
    window.location.pathname === '/admin' ||
    window.location.hash === '#admin'
  );
}

export default function App() {
  const [policyOpen, setPolicyOpen] = useState(false);

  if (isAdminRoute()) {
    return <AdminDashboard />;
  }

  const [dachshundEp1, dachshundEp2, bunny] = EPS;

  return (
    <div className="min-h-screen bg-black">
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
      <Links />
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
