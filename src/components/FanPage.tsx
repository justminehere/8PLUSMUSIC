import { useState, useEffect, useMemo } from 'react';
import {
  Heart, Trophy, Zap, Crown, Star, Music, Gamepad2,
  Radio, Award, Lock, Play, Sparkles, Instagram, Facebook, Youtube, Music2,
  MessageCircle, ShoppingBag, Calendar, Search,
} from 'lucide-react';
import ArcadeBackButton from './ArcadeBackButton';
import FlickeringStars from './FlickeringStars';

interface LevelDef {
  num: number;
  name: string;
  badge: string;
  icon: typeof Heart;
  color: string;
  status: 'unlocked' | 'locked' | 'upcoming';
  price?: string;
  desc?: string;
}

const LEVELS: LevelDef[] = [
  { num: 1, name: 'LIVE FAN', badge: 'LIVE FAN', icon: Heart, color: '#ec4899', status: 'unlocked', desc: 'Welcome to 8PlusMusic — you are part of the fan community.' },
  { num: 2, name: 'VIP MEMBER BUNNY', badge: 'VIP MEMBER BUNNY', icon: Crown, color: '#fbbf24', status: 'locked', price: '$4 / MONTH', desc: 'VIP Members Listening Room — full songs + videos, selected EP content, special fan content.' },
  { num: 3, name: 'SOUND PICKER', badge: 'SOUND PICKER', icon: Zap, color: '#2dd4bf', status: 'locked', desc: 'Unlock when you vote for the first time — live or on the charts.' },
  { num: 4, name: 'HEART BEATER', badge: 'HEART BEATER', icon: Heart, color: '#f472b6', status: 'upcoming', desc: 'Make Bunny\'s heart go boom boom — upcoming livestream interaction.' },
  { num: 5, name: 'MUSIC BOOSTER', badge: 'MUSIC BOOSTER', icon: Sparkles, color: '#a78bfa', status: 'locked', desc: 'Unlock when you support a song with paid likes for the first time.' },
];

const FUTURE_LEVELS: { num: number; name: string; color: string }[] = [
  { num: 6, name: 'LIVE REGULAR', color: '#2dd4bf' },
  { num: 7, name: 'BUNNY CREW', color: '#ec4899' },
  { num: 8, name: 'NEON BUNNY', color: '#2dd4bf' },
  { num: 9, name: 'PUNK BUNNY', color: '#ec4899' },
  { num: 10, name: 'BUNNY.LAND INSIDER', color: '#fbbf24' },
  { num: 11, name: 'BACKSTAGE BUNNY', color: '#2dd4bf' },
  { num: 12, name: 'ELECTRIC BUNNY', color: '#ec4899' },
  { num: 13, name: 'CHAOS BUNNY', color: '#2dd4bf' },
  { num: 14, name: 'BUNNY REBEL', color: '#ec4899' },
  { num: 15, name: 'NEON REBEL', color: '#2dd4bf' },
];

const MILESTONES: { num: number; name: string; color: string }[] = [
  { num: 25, name: 'PUNK ROYALTY', color: '#fbbf24' },
  { num: 50, name: 'ELECTRIC ICON', color: '#ec4899' },
  { num: 100, name: 'BUNNY.LAND LEGEND', color: '#2dd4bf' },
  { num: 250, name: 'NEON IMMORTAL', color: '#a78bfa' },
];

const ALL_BADGES = [
  ...LEVELS.map(l => ({ name: l.badge, color: l.color, icon: l.icon, unlocked: l.status === 'unlocked' })),
  ...FUTURE_LEVELS.slice(0, 5).map(l => ({ name: l.name, color: l.color, icon: Star, unlocked: false })),
];

const SOCIALS = [
  { label: 'TIKTOK', href: 'https://www.tiktok.com/@8plusmusic?lang=en', color: '#ffffff', icon: Music2 },
  { label: 'INSTAGRAM', href: 'https://www.instagram.com/8plusmusic/', color: '#ec4899', icon: Instagram },
  { label: 'FACEBOOK', href: 'https://www.facebook.com/8plusmusic', color: '#60a5fa', icon: Facebook },
  { label: 'YOUTUBE', href: 'https://www.youtube.com/channel/UCkmp1KlrwUYSxiHc9wFguvw', color: '#ef4444', icon: Youtube },
  { label: 'SPOTIFY', href: 'https://open.spotify.com/artist/7tClU9LaGgN6jWYy5OuS2R', color: '#22c55e', icon: Music2 },
];

const TIMEZONES: { id: string; label: string; offset: number }[] = [
  { id: 'UTC', label: 'UTC (GMT+0)', offset: 0 },
  { id: 'EST', label: 'Eastern Time (GMT-5)', offset: -5 },
  { id: 'CST', label: 'Central Time (GMT-6)', offset: -6 },
  { id: 'MST', label: 'Mountain Time (GMT-7)', offset: -7 },
  { id: 'PST', label: 'Pacific Time (GMT-8)', offset: -8 },
  { id: 'AKST', label: 'Alaska Time (GMT-9)', offset: -9 },
  { id: 'HST', label: 'Hawaii Time (GMT-10)', offset: -10 },
  { id: 'BST', label: 'British Summer Time (GMT+1)', offset: 1 },
  { id: 'CET', label: 'Central European Time (GMT+1)', offset: 1 },
  { id: 'EET', label: 'Eastern European Time (GMT+2)', offset: 2 },
  { id: 'MSK', label: 'Moscow Time (GMT+3)', offset: 3 },
  { id: 'GST', label: 'Gulf Time (GMT+4)', offset: 4 },
  { id: 'IST', label: 'India Time (GMT+5:30)', offset: 5.5 },
  { id: 'BST_ASIA', label: 'Bangkok Time (GMT+7)', offset: 7 },
  { id: 'CST_ASIA', label: 'China Time (GMT+8)', offset: 8 },
  { id: 'JST', label: 'Japan Time (GMT+9)', offset: 9 },
  { id: 'AEST', label: 'Australian Eastern (GMT+10)', offset: 10 },
  { id: 'NZST', label: 'New Zealand (GMT+12)', offset: 12 },
  { id: 'BRT', label: 'Brazil Time (GMT-3)', offset: -3 },
  { id: 'ART', label: 'Argentina Time (GMT-3)', offset: -3 },
];

const CHATROOMS: { id: string; title: string; desc: string; utcDay: number; utcHour: number }[] = [
  { id: 'cr1', title: 'SONG TALK', desc: 'Discuss the latest 8PlusMusic releases', utcDay: 2, utcHour: 19 },
  { id: 'cr2', title: 'CHART CHAT', desc: 'Break down the weekly charts and vote', utcDay: 4, utcHour: 20 },
  { id: 'cr3', title: 'BUNNY CREW HANGOUT', desc: 'Casual fan chat and sticker sharing', utcDay: 6, utcHour: 18 },
  { id: 'cr4', title: 'PRODUCTION CORNER', desc: 'Behind the scenes of EP creation', utcDay: 0, utcHour: 21 },
];

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function convertTz(utcDay: number, utcHour: number, tzId: string): { day: string; time: string } {
  const tz = TIMEZONES.find(t => t.id === tzId);
  const offset = tz ? tz.offset : 0;
  let totalHours = utcHour + offset;
  let day = utcDay;

  while (totalHours < 0) { totalHours += 24; day = (day - 1 + 7) % 7; }
  while (totalHours >= 24) { totalHours -= 24; day = (day + 1) % 7; }

  const h = Math.floor(totalHours);
  const m = totalHours % 1 !== 0 ? '30' : '00';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return { day: DAYS[day], time: `${hour12}:${m} ${ampm}` };
}

function EqualizerBars({ color, bars = 5 }: { color: string; bars?: number }) {
  return (
    <div className="flex items-end gap-1 h-6">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="fan-eq-bar w-1.5 rounded-sm"
          style={{
            background: color,
            animationDelay: `${i * 0.12}s`,
            animationDuration: `${0.6 + (i % 3) * 0.2}s`,
            height: '40%',
          }}
        />
      ))}
    </div>
  );
}

function FloatingHearts() {
  const hearts = useMemo(
    () => Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      delay: `${Math.random() * 4}s`,
      duration: `${3 + Math.random() * 3}s`,
      size: 10 + Math.floor(Math.random() * 8),
    })),
    [],
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {hearts.map(h => (
        <div
          key={h.id}
          className="fan-heart-float absolute"
          style={{
            left: h.left,
            bottom: 0,
            animationDelay: h.delay,
            animationDuration: h.duration,
          }}
        >
          <Heart size={h.size} fill="#ec4899" className="text-pink-500" style={{ opacity: 0.15 }} />
        </div>
      ))}
    </div>
  );
}

function AchievementBurst({ show, text }: { show: boolean; text: string }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="fan-achievement text-center">
        <p className="font-press-start text-xs text-teal-400 mb-2">★ ACHIEVEMENT UNLOCKED ★</p>
        <p className="font-press-start text-lg" style={{ color: '#ec4899', textShadow: '0 0 20px rgba(236,72,153,0.6)' }}>
          {text}
        </p>
      </div>
    </div>
  );
}

export default function FanPage() {
  const [becomeFan, setBecomeFan] = useState(false);
  const [achievement, setAchievement] = useState<string | null>(null);
  const [showLevel1, setShowLevel1] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [qrUnavailable, setQrUnavailable] = useState(false);
  const [chatTz, setChatTz] = useState('UTC');
  const [chatDate, setChatDate] = useState('');
  const [chatArtist, setChatArtist] = useState('');
  const [showTz, setShowTz] = useState('UTC');

  // Check if user already became a fan (localStorage)
  useEffect(() => {
    if (localStorage.getItem('8pm_fan_member') === '1') {
      setBecomeFan(true);
    }
  }, []);

  const handleBecomeFan = () => {
    localStorage.setItem('8pm_fan_member', '1');
    setBecomeFan(true);
    setShowLevel1(true);
    setAchievement('LIVE FAN');
    setTimeout(() => setAchievement(null), 2000);
  };

  // Check live voting status (any song with play_started_at and no played_at)
  const [liveActive, setLiveActive] = useState(false);
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/music-queue`,
          { headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` } },
        );
        const data = await res.json();
        if (data.uploads) {
          setLiveActive(data.uploads.some((s: { play_started_at: string | null; played_at: string | null }) => s.play_started_at && !s.played_at));
        }
      } catch {
        // ignore
      }
    };
    check();
    const interval = setInterval(check, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full bg-pink-500 opacity-10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-400 opacity-10 blur-3xl pointer-events-none" />

      {/* Animated stars */}
      <div className="fixed inset-0 pointer-events-none">
        <FlickeringStars />
      </div>

      {/* Floating hearts */}
      <FloatingHearts />

      {/* Scanline */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="fan-scanline absolute inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(45,212,191,0.3), transparent)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Back button */}
        <div className="mb-8">
          <ArcadeBackButton href="/" label="BACK TO 8PLUSMUSIC" />
        </div>

        {/* ── TOP HEADING ── */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <EqualizerBars color="#ec4899" bars={4} />
            <h1
              className="font-press-start tracking-tighter leading-none"
              style={{ fontSize: 'clamp(1.2rem, 4vw, 2.5rem)' }}
            >
              <span className="text-white">8</span>
              <span className="text-pink-400">PLUS</span>
              <span className="text-teal-400">MUSIC</span>
            </h1>
            <EqualizerBars color="#2dd4bf" bars={4} />
          </div>
          <h2
            className="font-black tracking-tighter leading-none mb-6"
            style={{ fontSize: 'clamp(1.8rem, 6vw, 3.5rem)' }}
          >
            <span className="bg-gradient-to-r from-pink-400 via-teal-300 to-pink-400 bg-clip-text text-transparent">
              FAN ARCADE
            </span>
          </h2>

          <p className="font-press-start text-xs tracking-widest text-zinc-400 mb-2">
            BECOME A FAN. PLAY. VOTE. LISTEN. LEVEL UP.
          </p>

          <p className="font-press-start text-[10px] text-teal-400 mb-1">
            PLAYER 1 — READY?
          </p>
          <p className="fan-press-start font-press-start text-sm text-pink-400 mb-8">
            ► PRESS START
          </p>

          {!becomeFan ? (
            <button
              onClick={handleBecomeFan}
              className="fan-arcade-btn fan-pixel-border"
              style={{
                borderColor: '#ec4899',
                color: '#ec4899',
                background: 'rgba(236,72,153,0.08)',
              }}
            >
              <Gamepad2 size={16} />
              BECOME A FAN
            </button>
          ) : (
            <div className="fan-level-unlock inline-block">
              <div className="fan-pixel-border rounded-lg px-8 py-4" style={{ borderColor: '#2dd4bf', background: 'rgba(45,212,191,0.05)' }}>
                <p className="font-press-start text-xs text-teal-400 mb-1">★ LEVEL 1 UNLOCKED ★</p>
                <p className="font-press-start text-sm text-white">WELCOME TO 8PLUSMUSIC</p>
              </div>
            </div>
          )}
        </div>

        <div className="arcade-divider max-w-2xl mx-auto mb-12" />

        {/* ── CHOOSE YOUR ACTIVITY ── */}
        <div className="mb-12">
          <h3 className="font-press-start text-xs text-center text-zinc-400 tracking-widest mb-6">
            CHOOSE YOUR ACTIVITY
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* BOX 1 — VOTING (sound waves pulsing) */}
            <a
              href="/player"
              className="fan-activity-tile fan-pixel-border"
              style={{ borderColor: liveActive ? '#ec4899' : 'rgba(255,255,255,0.1)', background: liveActive ? 'rgba(236,72,153,0.06)' : 'rgba(0,0,0,0.4)' }}
            >
              <Radio size={24} style={{ color: liveActive ? '#ec4899' : '#52525b' }} className="fan-icon-pulse mx-auto mb-3" />
              <p className="text-[10px] text-white mb-1">VOTING</p>
              <p className="text-[8px] mb-3" style={{ color: liveActive ? '#ec4899' : '#52525b' }}>
                {liveActive ? 'LIVE VOTING ACTIVE' : 'LIVESTREAM OFFLINE'}
              </p>
              <span className="text-[9px] font-bold" style={{ color: liveActive ? '#ec4899' : '#52525b' }}>
                {liveActive ? '► PUT YOUR VOTES COUNT' : '► PUT YOUR VOTES COUNT'}
              </span>
            </a>

            {/* BOX 2 — 8PLUSMUSIC LIVE CHARTS (spinning trophy) */}
            <a
              href="/chart"
              className="fan-activity-tile fan-pixel-border"
              style={{ borderColor: 'rgba(45,212,191,0.3)', background: 'rgba(45,212,191,0.04)' }}
            >
              <Trophy size={24} className="fan-icon-spin text-teal-400 mx-auto mb-3" />
              <p className="text-[10px] text-white mb-1">8PLUSMUSIC LIVE CHARTS</p>
              <p className="text-[8px] text-zinc-500 mb-3">WEEK · MONTH · YEAR</p>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-teal-400">► VIEW LIVE CHARTS</span>
                <span className="text-[9px] font-bold text-teal-400">► 8PLUSMUSIC EP SONGS ONLY</span>
              </div>
            </a>

            {/* BOX 3 — VIP MEMBER ROOM (crown breathing) */}
            <a
              href="#vip"
              className="fan-activity-tile fan-pixel-border"
              style={{ borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.04)' }}
            >
              <Crown size={24} className="fan-icon-breathe text-amber-400 mx-auto mb-3" />
              <p className="text-[10px] text-white mb-1">VIP MEMBER ROOM</p>
              <p className="text-[8px] text-zinc-500 mb-3">FULL SONGS &amp; MORE</p>
              <span className="text-[9px] font-bold text-amber-400">► VIP ACCESS</span>
            </a>

            {/* BOX 4 — BADGES & LEVELS (badge heartbeat) */}
            <a
              href="#levels"
              className="fan-activity-tile fan-pixel-border"
              style={{ borderColor: 'rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.04)' }}
            >
              <Award size={24} className="fan-icon-heartbeat text-pink-400 mx-auto mb-3" />
              <p className="text-[10px] text-white mb-1">BADGES &amp; LEVELS</p>
              <p className="text-[8px] text-zinc-500 mb-3">EXPERIENCE OUR 8PLUS MUSICAL WORLDS</p>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-pink-400">► LEVEL BY LEVEL</span>
                <span className="text-[9px] font-bold text-pink-400">► GOT BADGES?</span>
              </div>
            </a>

            {/* BOX 5 — VIP MEMBER CHATROOMS (chat icon pulsing) */}
            <div
              className="fan-activity-tile fan-pixel-border"
              style={{ borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.04)' }}
            >
              <div className="flex items-center justify-center mb-3 gap-2">
                <Crown size={20} className="fan-icon-breathe text-amber-400" />
                <svg width="40" height="24" viewBox="0 0 40 24" className="fan-icon-pulse">
                  <path d="M0,12 Q5,4 10,12 T20,12" stroke="#22c55e" strokeWidth="2" fill="none" />
                  <path d="M20,12 Q25,20 30,12 T40,12" stroke="#22c55e" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <p className="text-[10px] text-white mb-1 text-center">VIP MEMBER CHATROOMS</p>
              <p className="text-[8px] text-zinc-500 mb-3 text-center">
                JOIN CONTINUOUS, DATED, HOSTED CHATROOMS
              </p>

              {/* Date/artist search input */}
              <div className="flex flex-col gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-amber-400 flex-shrink-0" />
                  <input
                    type="date"
                    value={chatDate}
                    onChange={e => setChatDate(e.target.value)}
                    className="fan-pixel-border rounded bg-black text-white text-[10px] px-2 py-1.5 outline-none flex-1"
                    style={{ borderColor: 'rgba(251,191,36,0.3)', colorScheme: 'dark' }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Search size={12} className="text-amber-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="WHICH ARTIST DO YOU WANT TO CHAT WITH?"
                    value={chatArtist}
                    onChange={e => setChatArtist(e.target.value)}
                    className="fan-pixel-border rounded bg-black text-white text-[9px] px-2 py-1.5 outline-none flex-1"
                    style={{ borderColor: 'rgba(251,191,36,0.3)' }}
                  />
                </div>
              </div>

              {/* Text links list */}
              <div className="text-left space-y-1.5 mb-3">
                <a href="#chat-8plus" className="block text-[9px] text-amber-400 hover:text-amber-300">► ENTER THE 8PLUSMUSIC EXCLUSIVE ROOM</a>
                <a href="#chat-livestream" className="block text-[9px] text-amber-400 hover:text-amber-300">► ENTER THE LIVESTREAM SONGS EXCLUSIVE ROOM</a>
                <a href="#chat-junior" className="block text-[9px] text-amber-400 hover:text-amber-300">► DATED JUNIOR CHAT MEETINGS — HOSTED BY FAN KID &amp; HOSTING PARENT (PARENTS ARE KYC-ED)</a>
              </div>

              <div className="text-center">
                <a
                  href="#chatrooms-list"
                  className="text-[9px] font-bold text-amber-400"
                >
                  ► FIND YOUR CHATROOM
                </a>
              </div>
            </div>

            {/* BOX 6 — UPLOAD YOUR MUSIC (spinning gold coin / yin-yang) */}
            <div
              className="fan-activity-tile fan-pixel-border"
              style={{ borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.04)' }}
            >
              <div className="flex justify-center mb-3" style={{ perspective: '100px' }}>
                <div className="fan-icon-coin" style={{ width: '28px', height: '28px' }}>
                  <svg viewBox="0 0 100 100" width="28" height="28">
                    <circle cx="50" cy="50" r="48" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
                    <path d="M50,2 A48,48 0 0,1 50,98 A24,24 0 0,1 50,50 A24,24 0 0,0 50,2 Z" fill="#1a1a1a" />
                    <circle cx="50" cy="26" r="6" fill="#1a1a1a" />
                    <circle cx="50" cy="74" r="6" fill="#fbbf24" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] text-white mb-1 text-center">UPLOAD YOUR MUSIC</p>
              <p className="text-[8px] text-zinc-500 mb-3 text-center">
                JOIN THE QUEUE FOR THE NEXT SHOW
              </p>

              {/* Show time + timezone dropdown */}
              <div className="flex flex-col gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-press-start text-[8px] text-amber-400 flex-shrink-0">NEXT SHOW:</span>
                  <span className="font-press-start text-[8px] text-white">{convertTz(5, 20, showTz).day} {convertTz(5, 20, showTz).time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-press-start text-[8px] text-amber-400 flex-shrink-0">AFTER:</span>
                  <span className="font-press-start text-[8px] text-white">{convertTz(6, 20, showTz).day} {convertTz(6, 20, showTz).time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-press-start text-[8px] text-amber-400 flex-shrink-0">TZ:</label>
                  <select
                    value={showTz}
                    onChange={e => setShowTz(e.target.value)}
                    className="fan-pixel-border rounded bg-black text-white text-[9px] px-2 py-1.5 outline-none flex-1"
                    style={{ borderColor: 'rgba(251,191,36,0.3)' }}
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.id} value={tz.id}>{tz.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live / manual link */}
              <div className="text-center">
                <a
                  href="/upload"
                  className={`text-[9px] font-bold ${liveActive ? 'fan-blink' : ''}`}
                  style={{ color: liveActive ? '#ec4899' : '#fbbf24' }}
                >
                  {liveActive ? '● SHOW IS LIVE — VOTE &amp; WATCH TIKTOK' : '► UPLOAD &amp; JOIN QUEUE'}
                </a>
              </div>
            </div>

          </div>
        </div>

        <div className="arcade-divider max-w-2xl mx-auto mb-12" />

        {/* ── LIVE VOTING SECTION ── */}
        <div className="mb-12">
          <div
            className="fan-pixel-border fan-flash-bg rounded-lg p-6 text-center"
            style={{ borderColor: liveActive ? 'rgba(236,72,153,0.4)' : 'rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <span
                className="inline-block w-2 h-2 rounded-full fan-blink"
                style={{ background: liveActive ? '#ec4899' : '#52525b' }}
              />
              <p className="font-press-start text-[10px] tracking-widest" style={{ color: liveActive ? '#ec4899' : '#52525b' }}>
                {liveActive ? 'LIVE VOTING ACTIVE' : 'LIVESTREAM OFFLINE'}
              </p>
            </div>
            {liveActive ? (
              <>
                <p className="text-sm text-zinc-300 mb-4">A song is playing right now — vote before time runs out!</p>
                <a
                  href="/player"
                  className="fan-arcade-btn inline-flex"
                  style={{ borderColor: '#ec4899', color: '#fff', background: 'rgba(236,72,153,0.15)' }}
                >
                  <Radio size={14} />
                  VOTE NOW
                </a>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-400 mb-4">No live stream right now — check the charts and vote there!</p>
                <a
                  href="/chart"
                  className="fan-arcade-btn inline-flex"
                  style={{ borderColor: '#2dd4bf', color: '#2dd4bf', background: 'rgba(45,212,191,0.08)' }}
                >
                  <Trophy size={14} />
                  GO TO CHARTS
                </a>
              </>
            )}
          </div>
        </div>

        {/* ── 8PLUSMUSIC CHARTS SECTION ── */}
        <div className="mb-12">
          <h3 className="font-press-start text-xs text-center text-zinc-400 tracking-widest mb-6">
            8PLUSMUSIC CHARTS
          </h3>
          <div className="flex items-center justify-center gap-2 mb-6">
            {(['week', 'month', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className={`fan-arcade-btn ${chartPeriod === p ? 'fan-pixel-border' : ''}`}
                style={{
                  borderColor: chartPeriod === p ? '#ec4899' : 'rgba(255,255,255,0.15)',
                  color: chartPeriod === p ? '#fff' : '#71717a',
                  background: chartPeriod === p ? 'rgba(236,72,153,0.12)' : 'transparent',
                  fontSize: '8px',
                  padding: '10px 18px',
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="text-center">
            <a
              href="/chart"
              className="fan-arcade-btn inline-flex"
              style={{ borderColor: '#2dd4bf', color: '#2dd4bf', background: 'rgba(45,212,191,0.06)' }}
            >
              <Play size={14} />
              LISTEN & VOTE
            </a>
            <p className="text-xs text-zinc-500 mt-3">
              Play a song, listen to the end, then vote to boost its chart position.
            </p>
          </div>
        </div>

        <div className="arcade-divider max-w-2xl mx-auto mb-12" />

        {/* ── LEVELS ── */}
        <div id="levels" className="mb-12">
          <h3 className="font-press-start text-xs text-center text-zinc-400 tracking-widest mb-6">
            FAN LEVELS
          </h3>
          <div className="space-y-4">
            {LEVELS.map(level => {
              const Icon = level.icon;
              const isUnlocked = level.status === 'unlocked' || (level.num === 1 && becomeFan);
              const isUpcoming = level.status === 'upcoming';
              return (
                <div
                  key={level.num}
                  className="fan-level-card fan-pixel-border rounded-lg"
                  style={{
                    borderColor: isUnlocked ? level.color : isUpcoming ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.08)',
                    background: isUnlocked ? `${level.color}08` : 'rgba(0,0,0,0.3)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Level number badge */}
                    <div
                      className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center fan-pixel-border"
                      style={{
                        borderColor: isUnlocked ? level.color : 'rgba(255,255,255,0.1)',
                        background: isUnlocked ? `${level.color}15` : 'rgba(0,0,0,0.4)',
                      }}
                    >
                      <Icon
                        size={22}
                        style={{ color: isUnlocked ? level.color : '#3f3f46' }}
                        className={isUnlocked ? 'fan-badge-pop' : ''}
                      />
                    </div>

                    {/* Level info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="fan-level-num" style={{ color: isUnlocked ? level.color : '#52525b' }}>
                          LV.{level.num}
                        </span>
                        {level.price && (
                          <span
                            className="font-press-start text-[8px] px-2 py-1 rounded"
                            style={{ background: `${level.color}15`, color: level.color }}
                          >
                            {level.price}
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="font-press-start text-[7px] px-2 py-1 rounded bg-purple-500/10 text-purple-400">
                            UPCOMING
                          </span>
                        )}
                      </div>
                      <p className="font-press-start text-[10px] text-white mb-2">{level.name}</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">{level.desc}</p>

                      {/* Level 2 — VIP button */}
                      {level.num === 2 && !isUnlocked && (
                        <button
                          className="fan-arcade-btn mt-4"
                          style={{ borderColor: level.color, color: level.color, background: `${level.color}08`, fontSize: '8px', padding: '10px 20px' }}
                          onClick={() => {
                            setAchievement('VIP MEMBER BUNNY');
                            setTimeout(() => setAchievement(null), 2000);
                          }}
                        >
                          <Crown size={12} />
                          BECOME A VIP MEMBER
                        </button>
                      )}

                      {/* Level 1 — unlock animation */}
                      {level.num === 1 && showLevel1 && (
                        <div className="fan-level-unlock mt-3">
                          <p className="font-press-start text-[9px] text-pink-400">★ LEVEL 1 UNLOCKED ★</p>
                        </div>
                      )}

                      {/* Level 3 — vote link */}
                      {level.num === 3 && (
                        <a href="/chart" className="fan-arcade-btn mt-4 inline-flex" style={{ borderColor: level.color, color: level.color, background: `${level.color}08`, fontSize: '8px', padding: '10px 20px' }}>
                          <Zap size={12} />
                          GO VOTE
                        </a>
                      )}

                      {/* Level 4 — bunny heart upcoming */}
                      {level.num === 4 && (
                        <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(244,114,182,0.05)', border: '1px dashed rgba(244,114,182,0.2)' }}>
                          <p className="font-press-start text-[10px] text-pink-300 mb-2">♥ BUNNY HEART</p>
                          <p className="text-xs text-zinc-400">MAKE BUNNY'S HEART GO BOOM BOOM</p>
                          <p className="text-[10px] text-zinc-600 mt-2">Coming soon — interactive livestream fan feature.</p>
                        </div>
                      )}

                      {/* Level 5 — music booster */}
                      {level.num === 5 && (
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                          <span className="font-press-start text-[8px] px-3 py-1.5 rounded" style={{ background: 'rgba(45,212,191,0.1)', color: '#2dd4bf' }}>1 LIKE — FREE</span>
                          <span className="font-press-start text-[8px] px-3 py-1.5 rounded" style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}>50 LIKES — $2</span>
                          <span className="font-press-start text-[8px] px-3 py-1.5 rounded" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>100 LIKES — $5</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── LEVEL MAP ── */}
        <div className="mb-12">
          <h3 className="font-press-start text-xs text-center text-zinc-400 tracking-widest mb-6">
            LEVEL MAP
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FUTURE_LEVELS.map(l => (
              <div
                key={l.num}
                className="fan-pixel-border rounded-lg p-3 text-center"
                style={{ borderColor: `${l.color}20`, background: 'rgba(0,0,0,0.3)' }}
              >
                <p className="font-press-start text-[9px] mb-1" style={{ color: l.color }}>LV.{l.num}</p>
                <p className="font-press-start text-[7px] text-zinc-500">{l.name}</p>
              </div>
            ))}
          </div>

          {/* Milestones */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MILESTONES.map(m => (
              <div
                key={m.num}
                className="fan-pixel-border rounded-lg p-4 text-center fan-flash-bg"
                style={{ borderColor: `${m.color}30`, background: `${m.color}05` }}
              >
                <p className="font-press-start text-[10px] mb-1" style={{ color: m.color }}>LV.{m.num}</p>
                <p className="font-press-start text-[7px] text-white">{m.name}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-zinc-600 mt-4 font-press-start">
            NO FINAL LEVEL — KEEP PLAYING
          </p>
        </div>

        <div className="arcade-divider max-w-2xl mx-auto mb-12" />

        {/* ── VIP MEMBER ROOM ── */}
        <div id="vip" className="mb-12">
          <div
            className="fan-pixel-border rounded-lg p-6"
            style={{ borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.03)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Crown size={20} className="text-amber-400" />
              <h3 className="font-press-start text-xs text-amber-400 tracking-widest">VIP MEMBER ROOM</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              Full selected songs from the 8PlusMusic EP collection. Available to VIP Member Bunnies only.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                'VIP MEMBER BUNNY badge',
                'VIP Members Listening Room',
                'Full songs (admin selected)',
                'Selected EP collection content',
                'Special fan content',
                'Additional member activities',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="text-amber-400">►</span>
                  {item}
                </li>
              ))}
            </ul>
            <button
              className="fan-arcade-btn"
              style={{ borderColor: '#fbbf24', color: '#fbbf24', background: 'rgba(251,191,36,0.08)', fontSize: '9px' }}
              onClick={() => {
                setAchievement('VIP MEMBER BUNNY');
                setTimeout(() => setAchievement(null), 2000);
              }}
            >
              <Crown size={14} />
              BECOME A VIP MEMBER — $4/MONTH
            </button>
            <p className="text-[10px] text-zinc-600 mt-3">
              Payment setup coming soon. Free fans can still vote and use the charts.
            </p>
          </div>
        </div>

        <div className="arcade-divider max-w-2xl mx-auto mb-12" />

        {/* ── BADGE WALL ── */}
        <div className="mb-12">
          <h3 className="font-press-start text-xs text-center text-zinc-400 tracking-widest mb-6">
            YOUR BADGES
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {ALL_BADGES.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <div
                  key={i}
                  className={`fan-badge-tile fan-pixel-border rounded-lg ${badge.unlocked ? 'fan-badge-unlocked' : 'fan-badge-locked'}`}
                  style={{
                    borderColor: badge.unlocked ? badge.color : 'rgba(255,255,255,0.08)',
                    background: badge.unlocked ? `${badge.color}08` : 'rgba(0,0,0,0.3)',
                  }}
                >
                  <Icon
                    size={20}
                    style={{ color: badge.unlocked ? badge.color : '#3f3f46' }}
                    className="mx-auto mb-2"
                  />
                  <p className="text-[7px] leading-tight" style={{ color: badge.unlocked ? '#fff' : '#52525b' }}>
                    {badge.name}
                  </p>
                  {!badge.unlocked && (
                    <Lock size={8} className="text-zinc-700 mx-auto mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="arcade-divider max-w-2xl mx-auto mb-12" />

        {/* ── YOUR STATUS (logged-in user level & badges) ── */}
        <div id="badges" className="mb-12">
          <h3 className="font-press-start text-xs text-center text-zinc-400 tracking-widest mb-6">
            YOUR STATUS
          </h3>
          <div
            className="fan-pixel-border rounded-lg p-6 text-center"
            style={{ borderColor: 'rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.04)' }}
          >
            {becomeFan ? (
              <>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Heart size={28} className="text-pink-400 fan-badge-pop" />
                  <div>
                    <p className="font-press-start text-[10px] text-pink-400">CURRENT LEVEL</p>
                    <p className="font-press-start text-sm text-white">LV.1 — LIVE FAN</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {LEVELS.filter(l => l.status === 'unlocked' || (l.num === 1 && becomeFan)).map(l => {
                    const Icon = l.icon;
                    return (
                      <div
                        key={l.num}
                        className="fan-pixel-border rounded-lg px-3 py-2 flex items-center gap-2"
                        style={{ borderColor: l.color, background: `${l.color}10` }}
                      >
                        <Icon size={16} style={{ color: l.color }} />
                        <span className="font-press-start text-[8px] text-white">{l.badge}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-zinc-500 mt-4">
                  Keep voting and participating to unlock more levels and badges!
                </p>
              </>
            ) : (
              <p className="text-sm text-zinc-400">
                Press BECOME A FAN to start your journey and earn your first badge.
              </p>
            )}
          </div>
        </div>

        <div className="arcade-divider max-w-2xl mx-auto mb-12" />

        {/* ── BADGE GUIDE ── */}
        <div className="mb-12">
          <h3 className="font-press-start text-xs text-center text-zinc-400 tracking-widest mb-6">
            BADGE GUIDE
          </h3>
          <div className="space-y-3">
            {LEVELS.map(level => {
              const Icon = level.icon;
              const isUnlocked = level.status === 'unlocked' || (level.num === 1 && becomeFan);
              return (
                <div
                  key={level.num}
                  className="fan-pixel-border rounded-lg p-4 flex items-center gap-4"
                  style={{
                    borderColor: isUnlocked ? level.color : 'rgba(255,255,255,0.08)',
                    background: isUnlocked ? `${level.color}08` : 'rgba(0,0,0,0.3)',
                  }}
                >
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center fan-pixel-border"
                    style={{
                      borderColor: isUnlocked ? level.color : 'rgba(255,255,255,0.1)',
                      background: isUnlocked ? `${level.color}15` : 'rgba(0,0,0,0.4)',
                    }}
                  >
                    <Icon size={20} style={{ color: isUnlocked ? level.color : '#3f3f46' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-press-start text-[10px] mb-1" style={{ color: isUnlocked ? level.color : '#52525b' }}>
                      {level.badge}
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{level.desc}</p>
                    {level.price && (
                      <span className="font-press-start text-[7px] mt-1 inline-block px-2 py-0.5 rounded" style={{ background: `${level.color}15`, color: level.color }}>
                        {level.price}
                      </span>
                    )}
                  </div>
                  {isUnlocked ? (
                    <span className="font-press-start text-[8px] text-teal-400 flex-shrink-0">UNLOCKED</span>
                  ) : (
                    <Lock size={14} className="text-zinc-700 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="arcade-divider max-w-2xl mx-auto mb-12" />

        {/* ── CHAT ROOMS ── */}
        <div className="mb-12">
          <h3 className="font-press-start text-xs text-center text-zinc-400 tracking-widest mb-6">
            HOSTED CHATROOMS — ALL ABOUT MUSIC
          </h3>
          <div
            className="fan-pixel-border rounded-lg p-6"
            style={{ borderColor: 'rgba(45,212,191,0.3)', background: 'rgba(45,212,191,0.03)' }}
          >
            <p className="text-sm text-zinc-400 mb-4">
              Join scheduled chatrooms hosted by the 8PlusMusic crew. All times shown in your selected timezone.
            </p>

            {/* Timezone dropdown */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <label className="font-press-start text-[9px] text-teal-400 flex-shrink-0">YOUR TIMEZONE:</label>
              <select
                value={chatTz}
                onChange={e => setChatTz(e.target.value)}
                className="fan-pixel-border rounded bg-black text-white text-xs px-3 py-2 outline-none focus:border-teal-400"
                style={{ borderColor: 'rgba(45,212,191,0.3)', minWidth: '200px' }}
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.id} value={tz.id}>{tz.label}</option>
                ))}
              </select>
            </div>

            {/* Chatroom list */}
            <div className="space-y-3">
              {CHATROOMS.map(room => {
                const localTime = convertTz(room.utcDay, room.utcHour, chatTz);
                return (
                  <div
                    key={room.id}
                    className="fan-pixel-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                    style={{ borderColor: 'rgba(45,212,191,0.2)', background: 'rgba(0,0,0,0.3)' }}
                  >
                    <div className="flex-1">
                      <p className="font-press-start text-[10px] text-white mb-1">{room.title}</p>
                      <p className="text-[10px] text-zinc-500">{room.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-press-start text-[9px] text-teal-400">{localTime.day}</p>
                      <p className="font-press-start text-[10px] text-white">{localTime.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-6">
              <a
                href="#chatrooms-list"
                className="fan-arcade-btn inline-flex"
                style={{ borderColor: '#2dd4bf', color: '#2dd4bf', background: 'rgba(45,212,191,0.06)', fontSize: '9px' }}
              >
                <MessageCircle size={14} />
                CHATROOMS LIST
              </a>
            </div>
          </div>
        </div>

        <div className="arcade-divider max-w-2xl mx-auto mb-12" />

        {/* ── FUN STUFF / MINI STORE ── */}
        <div className="mb-12">
          <h3 className="font-press-start text-xs text-center text-zinc-400 tracking-widest mb-6">
            FUN STUFF YOU MAY WANT TO PURCHASE
          </h3>
          <div
            className="fan-pixel-border rounded-lg p-6 text-center"
            style={{ borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.03)' }}
          >
            <ShoppingBag size={28} className="text-amber-400 mx-auto mb-4" />
            <p className="text-sm text-zinc-400 mb-4">
              Stickers, merch, and fun extras from the 8PlusMusic universe.
            </p>
            <a
              href="#mini-store"
              className="fan-arcade-btn inline-flex"
              style={{ borderColor: '#fbbf24', color: '#fbbf24', background: 'rgba(251,191,36,0.08)', fontSize: '9px' }}
            >
              <ShoppingBag size={14} />
              JOIN THE MINI STORE
            </a>
          </div>
        </div>

        <div className="arcade-divider max-w-2xl mx-auto mb-12" />
        <section className="fan-socials-section mb-12" aria-labelledby="fan-socials-heading">
          <div className="arcade-divider max-w-2xl mx-auto mb-12" />
          <div className="text-center">
            <p className="arcade-section-label mb-4" style={{ color: '#2dd4bf' }}>Connect with the crew</p>
            <h3 id="fan-socials-heading" className="font-press-start text-sm text-white tracking-widest mb-8">
              OUR SOCIALS
            </h3>

            <div className="fan-social-orbit mx-auto mb-8" aria-label="8PlusMusic social networks">
              <div className="fan-social-orbit-ring" />
              <div className="fan-social-core">
                <span className="font-press-start text-xl text-white">8+</span>
                <span className="font-press-start text-[7px] text-teal-300">CONNECT</span>
              </div>
              {SOCIALS.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fan-social-orbit-item"
                    style={{
                      '--social-color': social.color,
                      '--social-angle': `${index * 72}deg`,
                    } as React.CSSProperties}
                    aria-label={`Open 8PlusMusic on ${social.label}`}
                  >
                    <Icon size={22} />
                    <span>{social.label}</span>
                  </a>
                );
              })}
            </div>

            <p className="text-xs text-zinc-400 mb-4">FOLLOW THE SIGNAL. FIND THE MUSIC.</p>
            <div className="fan-qr-frame mx-auto" style={{ width: 250, height: 250 }}>
              {!qrUnavailable ? (
                <img
                  src="/8plusMusic_Socials-1024.jpeg"
                  alt="Scan to connect with 8PlusMusic on social media"
                  width={250}
                  height={250}
                  className="fan-qr-image"
                  onError={() => setQrUnavailable(true)}
                />
              ) : (
                <div className="fan-qr-missing">
                  <span className="font-press-start text-2xl text-pink-400">QR</span>
                  <span className="font-press-start text-[8px] text-zinc-400">SOCIAL SIGNAL</span>
                </div>
              )}
            </div>
            <p className="font-press-start text-[8px] text-teal-300 mt-4">SCAN TO CONNECT</p>
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <EqualizerBars color="#ec4899" bars={6} />
            <Music size={20} className="text-pink-400" />
            <EqualizerBars color="#2dd4bf" bars={6} />
          </div>
          <p className="font-press-start text-[10px] text-zinc-500 mb-4">
            KEEP PLAYING. KEEP VOTING. KEEP LEVELING UP.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="/player" className="fan-arcade-btn" style={{ borderColor: '#ec4899', color: '#ec4899', background: 'rgba(236,72,153,0.06)', fontSize: '8px' }}>
              <Radio size={12} /> LIVE VOTING
            </a>
            <a href="/chart" className="fan-arcade-btn" style={{ borderColor: '#2dd4bf', color: '#2dd4bf', background: 'rgba(45,212,191,0.06)', fontSize: '8px' }}>
              <Trophy size={12} /> CHARTS
            </a>
            <a href="/upload" className="fan-arcade-btn" style={{ borderColor: '#fbbf24', color: '#fbbf24', background: 'rgba(251,191,36,0.06)', fontSize: '8px' }}>
              <Music size={12} /> UPLOAD
            </a>
          </div>
        </div>
      </div>

      {/* Achievement burst overlay */}
      <AchievementBurst show={!!achievement} text={achievement || ''} />
    </div>
  );
}
