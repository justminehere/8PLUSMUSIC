// Shared arcade sound engine using Web Audio API
// Handles suspended AudioContext state (browser autoplay policy)

let audioCtx: AudioContext | null = null;
let ambientNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let ambientPlaying = false;

async function getCtx(): Promise<AudioContext | null> {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// Short blip for clicks/hovers
export async function playBlip(freq: number, duration: number, volume = 0.08) {
  const ctx = await getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // ignore
  }
}

// Iconic Atari-style two-tone coin/pickup chirp
export async function playArcadeCoin() {
  const ctx = await getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(988, ctx.currentTime);
    osc.frequency.setValueAtTime(1319, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // ignore
  }
}

// Classic arcade "game start" ascending fanfare — plays when SOUND turns ON
export async function playAtariStart() {
  const ctx = await getCtx();
  if (!ctx) return;
  try {
    const notes = [
      { freq: 392, time: 0,    dur: 0.09 },
      { freq: 523, time: 0.11, dur: 0.09 },
      { freq: 659, time: 0.22, dur: 0.09 },
      { freq: 784, time: 0.33, dur: 0.14 },
    ];
    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = n.freq;
      gain.gain.setValueAtTime(0.07, ctx.currentTime + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.dur);
      osc.start(ctx.currentTime + n.time);
      osc.stop(ctx.currentTime + n.time + n.dur);
    });
  } catch {
    // ignore
  }
}

// Subtle Atari ambient drone — very low volume so clicks stay audible over it
export async function startAmbient() {
  const ctx = await getCtx();
  if (!ctx || ambientPlaying) return;
  try {
    ambientPlaying = true;

    // Low bass pulse
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.type = 'square';
    bassOsc.frequency.value = 55;
    bassGain.gain.setValueAtTime(0, ctx.currentTime);
    bassGain.gain.linearRampToValueAtTime(0.006, ctx.currentTime + 1.5);
    bassOsc.start();

    // Slow LFO wobble on the bass
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.connect(lfoGain);
    lfoGain.connect(bassGain.gain);
    lfo.type = 'sine';
    lfo.frequency.value = 0.25;
    lfoGain.gain.value = 0.002;
    lfo.start();

    // Faint high shimmer
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmerOsc.type = 'triangle';
    shimmerOsc.frequency.value = 1760;
    shimmerGain.gain.setValueAtTime(0, ctx.currentTime);
    shimmerGain.gain.linearRampToValueAtTime(0.002, ctx.currentTime + 2.5);
    shimmerOsc.start();

    ambientNodes = [
      { osc: bassOsc, gain: bassGain },
      { osc: lfo,     gain: lfoGain },
      { osc: shimmerOsc, gain: shimmerGain },
    ];
  } catch {
    ambientPlaying = false;
  }
}

export function stopAmbient() {
  ambientPlaying = false;
  if (!audioCtx) return;
  const ctx = audioCtx;
  ambientNodes.forEach(({ osc, gain }) => {
    try {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // ignore
    }
  });
  ambientNodes = [];
}
