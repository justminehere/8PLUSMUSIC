import { X, Shield, Mail, MessageCircle, Database, Cookie } from 'lucide-react';

export default function PrivacyPolicy({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl"
        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-5"
          style={{ background: '#0d0d0d', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-teal-400" />
            <h2 className="font-black text-white text-xl tracking-tight">Privacy Policy</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close privacy policy"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-8 py-8 space-y-8 text-zinc-400 text-sm leading-relaxed">
          <p className="text-zinc-300">
            8PlusMusic is a playful independent music label. This page explains what information
            we collect, why we collect it, and how we handle it.
          </p>
          <p className="text-zinc-500 text-xs">Last updated: June 2026</p>

          {/* Contact form */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Mail size={15} className="text-pink-400" />
              <h3 className="font-bold tracking-tight">Contact Form</h3>
            </div>
            <p>
              When you use the contact form we collect your <strong className="text-zinc-200">name</strong>,{' '}
              <strong className="text-zinc-200">email address</strong>, country, subject, and message.
              This information is stored securely and used solely to respond to your enquiry.
              We do not share it with third parties or use it for marketing without your explicit consent.
            </p>
            <p>
              You can request deletion of your contact submission at any time by emailing us.
            </p>
          </div>

          {/* Chat */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <MessageCircle size={15} className="text-teal-400" />
              <h3 className="font-bold tracking-tight">Community Chat</h3>
            </div>
            <p>
              The community chat assigns you a randomly generated nickname (for example{' '}
              <span className="text-pink-400 font-mono">FluffyBunny423</span>) — no account,
              real name, or email is required. This nickname is saved in your browser's
              local storage so you keep the same identity across visits.
            </p>
            <p>
              Chat messages are stored on our server. Because nicknames are randomly generated
              and not linked to any personal identity, chat messages are not considered
              personally identifiable information. Do not include personal details in chat messages.
            </p>
          </div>

          {/* Cookies & local storage */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Cookie size={15} className="text-pink-400" />
              <h3 className="font-bold tracking-tight">Cookies and Local Storage</h3>
            </div>
            <p>
              This website does <strong className="text-zinc-200">not</strong> use tracking cookies,
              advertising cookies, or analytics software. The only browser storage we use is:
            </p>
            <ul className="space-y-2 ml-4 list-disc text-zinc-500">
              <li>
                <span className="font-mono text-xs text-zinc-300">8plusmusic_username</span> —
                your randomly generated chat nickname (local storage, functional)
              </li>
              <li>
                <span className="font-mono text-xs text-zinc-300">8plusmusic_privacy_ack</span> —
                records that you dismissed the privacy notice (local storage, functional)
              </li>
            </ul>
            <p>
              Both are strictly functional and required for the chat and notice to work correctly.
              No consent is required for these under GDPR.
            </p>
          </div>

          {/* Data hosting */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Database size={15} className="text-teal-400" />
              <h3 className="font-bold tracking-tight">Data Hosting</h3>
            </div>
            <p>
              Contact form submissions and chat messages are stored using{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
              >
                Supabase
              </a>
              , a secure cloud database provider. Data is stored on servers within the EU/US in
              accordance with Supabase's own privacy and security policies.
            </p>
          </div>

          {/* Your rights */}
          <div className="space-y-3">
            <h3 className="font-bold text-white tracking-tight">Your Rights</h3>
            <p>
              Under GDPR (and equivalent laws), you have the right to access, correct, or request
              deletion of any personal data we hold about you. To exercise these rights, use the
              contact form on this website and select the appropriate subject.
            </p>
          </div>

          {/* Changes */}
          <div className="space-y-3">
            <h3 className="font-bold text-white tracking-tight">Changes to This Policy</h3>
            <p>
              If we add new features that collect data (such as analytics), this policy will be
              updated and the date above will reflect the change.
            </p>
          </div>

          <div
            className="rounded-xl p-4 text-xs text-zinc-500"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            8PlusMusic &mdash; produced by Fue Noir &mdash; www.fuenoir.com
          </div>
        </div>
      </div>
    </div>
  );
}
