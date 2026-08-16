import { useState } from 'react';
import { EPS } from './lib/tracks';
import Hero from './components/Hero';
import EPSection from './components/EPSection';
import About from './components/About';
import Links from './components/Links';
import Sponsors from './components/Sponsors';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Chat from './components/Chat';
import Player from './components/Player';
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

  const [dachshund, bunny] = EPS;

  return (
    <div className="min-h-screen bg-black">
      <Hero />

      <section id="releases">
        <EPSection
          title={dachshund.label}
          coverColor={dachshund.coverColor}
          coverAccent={dachshund.coverAccent}
          tracks={dachshund.tracks}
          imageUrl={dachshund.imageUrl}
        />

        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <EPSection
          title={bunny.label}
          coverColor={bunny.coverColor}
          coverAccent={bunny.coverAccent}
          tracks={bunny.tracks}
          imageUrl={bunny.imageUrl}
          reverse
        />
      </section>

      <section id="about"><About /></section>
      <Links />
      <section id="sponsors"><Sponsors /></section>
      <section id="contact"><Contact /></section>
      <Footer />
      <Chat />
      <Player />
      <PrivacyBanner onOpenPolicy={() => setPolicyOpen(true)} />
      {policyOpen && <PrivacyPolicy onClose={() => setPolicyOpen(false)} />}
    </div>
  );
}
