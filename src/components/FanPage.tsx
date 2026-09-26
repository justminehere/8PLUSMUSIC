import { useState, useEffect, useMemo } from 'react';
import {
  Heart, Trophy, Zap, Crown, Star, Music, Gamepad2,
  Radio, Award, Lock, Play, Sparkles, Volume2,
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
          <div className="grid grid-cols-2 gap-4">
            {/* Live Voting */}
            <a
              href="/player"
              className="fan-activity-tile fan-pixel-border"
              style={{ borderColor: liveActive ? '#ec4899' : 'rgba(255,255,255,0.1)', background: liveActive ? 'rgba(236,72,153,0.06)' : 'rgba(0,0,0,0.4)' }}
            >
              <Radio size={24} style={{ color: liveActive ? '#ec4899' : '#52525b' }} className="mx-auto mb-3" />
              <p className="text-[10px] text-white mb-1">LIVE VOTING</p>
              <p className="text-[8px] mb-3" style={{ color: liveActive ? '#ec4899' : '#52525b' }}>
                {liveActive ? 'LIVE VOTING ACTIVE' : 'LIVESTREAM OFFLINE'}
              </p>
              <span className="text-[9px] font-bold" style={{ color: liveActive ? '#ec4899' : '#52525b' }}>
                {liveActive ? '► VOTE NOW' : '► CHECK CHARTS'}
              </span>
            </a>

            {/* Charts */}
            <a
              href="/chart"
              className="fan-activity-tile fan-pixel-border"
              style={{ borderColor: 'rgba(45,212,191,0.3)', background: 'rgba(45,212,191,0.04)' }}
            >
              <Trophy size={24} className="text-teal-400 mx-auto mb-3" />
              <p className="text-[10px] text-white mb-1">8PLUSMUSIC CHARTS</p>
              <p className="text-[8px] text-zinc-500 mb-3">WEEK · MONTH · YEAR</p>
              <span className="text-[9px] font-bold text-teal-400">► VIEW CHARTS</span>
            </a>

            {/* VIP Room */}
            <a
              href="#vip"
              className="fan-activity-tile fan-pixel-border"
              style={{ borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.04)' }}
            >
              <Crown size={24} className="text-amber-400 mx-auto mb-3" />
              <p className="text-[10px] text-white mb-1">VIP MEMBER ROOM</p>
              <p className="text-[8px] text-zinc-500 mb-3">FULL SONGS + VIDEOS</p>
              <span className="text-[9px] font-bold text-amber-400">► VIP ACCESS</span>
            </a>

            {/* Badges & Levels */}
            <a
              href="#levels"
              className="fan-activity-tile fan-pixel-border"
              style={{ borderColor: 'rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.04)' }}
            >
              <Award size={24} className="text-pink-400 mx-auto mb-3" />
              <p className="text-[10px] text-white mb-1">BADGES & LEVELS</p>
              <p className="text-[8px] text-zinc-500 mb-3">SEE YOUR FAN JOURNEY</p>
              <span className="text-[9px] font-bold text-pink-400">► VIEW LEVELS</span>
            </a>
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
              Full selected songs + videos from the 8PlusMusic EP collection. Available to VIP Member Bunnies only.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                'VIP MEMBER BUNNY badge',
                'VIP Members Listening Room',
                'Full songs + videos (admin selected)',
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
