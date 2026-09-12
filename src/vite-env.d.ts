/// <reference types="vite/client" />

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(volume: number): void;
  getPlayerState(): number;
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
    Player: new (element: HTMLElement, options: any) => YTPlayer;
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
