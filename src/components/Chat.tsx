import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  username: string;
  message: string;
  created_at: string;
}

const ADJECTIVES = ['Cozy', 'Tiny', 'Fluffy', 'Sleepy', 'Happy', 'Bouncy', 'Sunny', 'Dreamy', 'Fuzzy', 'Gentle', 'Brave', 'Calm'];
const ANIMALS    = ['Dachshund', 'Bunny', 'Kitten', 'Panda', 'Hamster', 'Otter', 'Lamb', 'Puppy', 'Fox', 'Hedgehog', 'Seal', 'Deer'];

function makeUsername() {
  const adj    = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num    = Math.floor(Math.random() * 900) + 100;
  return `${adj}${animal}${num}`;
}

function getOrCreateUsername(): string {
  const stored = localStorage.getItem('8plusmusic_username');
  if (stored) return stored;
  const fresh = makeUsername();
  localStorage.setItem('8plusmusic_username', fresh);
  return fresh;
}

export default function Chat() {
  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [username]              = useState(getOrCreateUsername);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  const fetchMessages = () =>
    supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setMessages(data as Message[]);
      });

  useEffect(() => {
    if (!isOpen) return;

    fetchMessages();

    const channel = supabase
      .channel('public-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev =>
            prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 80);
  }, [isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput('');
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, message: trimmed }),
    });
    if (res.ok) fetchMessages();
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isOwn = (msg: Message) => msg.username === username;

  return (
    <>
      {/* Floating toggle */}
      <button
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Close chat' : 'Open community chat'}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-200 hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #ec4899 0%, #2dd4bf 100%)',
          boxShadow: '0 0 32px rgba(236,72,153,0.45)',
        }}
      >
        {isOpen ? <X size={22} color="black" /> : <MessageCircle size={22} color="black" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[350px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden flex flex-col chat-slide-up"
          style={{
            background: '#0c0c0c',
            border: '1px solid rgba(236,72,153,0.18)',
            boxShadow: '0 0 60px rgba(236,72,153,0.12), 0 24px 60px rgba(0,0,0,0.85)',
            height: '500px',
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center justify-between flex-shrink-0"
            style={{
              background: 'linear-gradient(90deg, rgba(236,72,153,0.12) 0%, rgba(45,212,191,0.12) 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div>
              <h3 className="font-black text-white tracking-tight text-base">Community Chat</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                You are{' '}
                <span className="text-pink-400 font-semibold">{username}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-teal-400 text-xs">
              <Users size={12} />
              <span>Live</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-zinc-600 text-sm mt-10 leading-relaxed">
                No messages yet.<br />Be the first to say hello!
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-0.5 ${isOwn(msg) ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: isOwn(msg) ? '#ec4899' : '#2dd4bf' }}
                  >
                    {isOwn(msg) ? 'You' : msg.username}
                  </span>
                  <span className="text-zinc-700 text-xs">{formatTime(msg.created_at)}</span>
                </div>
                <div
                  className="max-w-[85%] px-3 py-2 rounded-xl text-sm text-zinc-200 leading-relaxed break-words"
                  style={{
                    background: isOwn(msg) ? 'rgba(236,72,153,0.15)' : 'rgba(255,255,255,0.05)',
                    borderLeft:  !isOwn(msg) ? '2px solid rgba(45,212,191,0.35)'  : 'none',
                    borderRight:  isOwn(msg) ? '2px solid rgba(236,72,153,0.35)' : 'none',
                  }}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="px-4 py-3 flex gap-2 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Say something..."
              maxLength={300}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-pink-500/40 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #ec4899, #2dd4bf)' }}
            >
              <Send size={15} color="black" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
