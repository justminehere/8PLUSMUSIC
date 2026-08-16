import { useSyncExternalStore } from 'react';

export interface PlayerState {
  videoId: string | null;
  title: string;
  coverUrl?: string;
  coverColor: string;
}

const listeners = new Set<() => void>();
let state: PlayerState = {
  videoId: null,
  title: '',
  coverColor: '#ec4899',
};

export function playTrack(payload: Omit<PlayerState, 'videoId'> & { url: string }) {
  const videoId = extractYouTubeId(payload.url);
  if (!videoId) return;
  state = { ...state, videoId, title: payload.title, coverUrl: payload.coverUrl, coverColor: payload.coverColor };
  emit();
}

export function closePlayer() {
  state = { ...state, videoId: null };
  emit();
}

export function usePlayer() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function emit() {
  listeners.forEach(l => l());
}

export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1) || null;
    }
    if (u.hostname.includes('youtube.com') || u.hostname.includes('music.youtube.com')) {
      return u.searchParams.get('v');
    }
  } catch {
    return null;
  }
  return null;
}
