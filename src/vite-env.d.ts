/// <reference types="vite/client" />

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(volume: number): void;
  unMute(): void;
  mute(): void;
  getPlayerState(): number;
  destroy(): void;
}

interface SoundCloudWidget {
  play(): void;
  pause(): void;
  seekTo(milliseconds: number): void;
  getDuration(): number;
  getPosition(): number;
  setVolume(volume: number): void;
  bind(eventName: string, callback: (data?: any) => void): void;
  unbind(eventName: string): void;
}

interface SoundCloudWidgetEvents {
  READY: string;
  PLAY: string;
  PAUSE: string;
  FINISH: string;
  PLAY_PROGRESS: string;
}

interface Window {
  YT?: {
    Player: new (element: HTMLElement, options: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (event: { target: YTPlayer }) => void;
        onStateChange?: (event: { data: number; target: YTPlayer }) => void;
        onError?: (event: { data: number; target: YTPlayer }) => void;
      };
    }) => YTPlayer;
    PlayerState: {
      UNSTARTED: number;
      ENDED: number;
      PLAYING: number;
      PAUSED: number;
      BUFFERING: number;
      CUED: number;
    };
  };
  SC?: {
    Widget: {
      new (iframe: HTMLIFrameElement): SoundCloudWidget;
      Events: SoundCloudWidgetEvents;
    };
  };
  onYouTubeIframeAPIReady?: () => void;
}
