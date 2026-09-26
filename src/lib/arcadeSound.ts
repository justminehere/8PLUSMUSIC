// Shared arcade sound engine using Web Audio API
// Plays subtle Atari-style arcade sounds — clicks stay audible over the ambient tone

let audioCtx: AudioContext | null = null;
let ambientNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let ambientPlaying = false;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioCtx;
  } catch {
    return null;
  }
}

// Short blip for clicks/hovers — kept louder than ambient
export function playBlip(freq: number, duration: number, volume = 0.08) {
  const ctx = getCtx();
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

// The iconic Atari/arcade "coin" or "jump" style two-tone chirp
export function playArcadeCoin() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(988, ctx.currentTime);
    osc1.frequency.setValueAtTime(1319, ctx.currentTime + 0.05);
    gain1.gain.setValueAtTime(0.07, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.15);
  } catch {
    // ignore
  }
}

// Classic Atari "game start" fanfare — subtle, short version
export function playAtariStart() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const notes = [
      { freq: 392, time: 0,    dur: 0.08 },
      { freq: 523, time: 0.1,  dur: 0.08 },
      { freq: 659, time: 0.2,  dur: 0.08 },
      { freq: 784, time: 0.3,  dur: 0.12 },
    ];
    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = n.freq;
      gain.gain.setValueAtTime(0.04, ctx.currentTime + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.dur);
      osc.start(ctx.currentTime + n.time);
      osc.stop(ctx.currentTime + n.time + n.dur);
    });
  } catch {
    // ignore
  }
}

// Subtle ambient Atari drone — very low volume so clicks are still audible
export function startAmbient() {
  const ctx = getCtx();
  if (!ctx || ambientPlaying) return;
  try {
    ambientPlaying = true;

    // Low bass drone
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.type = 'square';
    bassOsc.frequency.value = 55;
    bassGain.gain.setValueAtTime(0, ctx.currentTime);
    bassGain.gain.linearRampToValueAtTime(0.008, ctx.currentTime + 1);
    bassOsc.start();

    // Slight LFO wobble on the bass
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.connect(lfoGain);
    lfoGain.connect(bassGain.gain);
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    lfoGain.gain.value = 0.003;
    lfo.start();

    // High shimmer — very faint
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmerOsc.type = 'triangle';
    shimmerOsc.frequency.value = 1760;
    shimmerGain.gain.setValueAtTime(0, ctx.currentTime);
    shimmerGain.gain.linearRampToValueAtTime(0.003, ctx.currentTime + 2);
    shimmerOsc.start();

    ambientNodes = [
      { osc: bassOsc, gain: bassGain },
      { osc: lfo, gain: lfoGain },
      { osc: shimmerOsc, gain: shimmerGain },
    ];
  } catch {
    // ignore
  }
}

export function stopAmbient() {
  const ctx = getCtx();
  if (!ctx) return;
  ambientPlaying = false;
  ambientNodes.forEach(({ osc, gain }) => {
    try {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // ignore
    }
  });
  ambientNodes = [];
}
