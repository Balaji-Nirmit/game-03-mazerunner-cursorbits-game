// Procedural sound engine using Web Audio API
let audioCtx: AudioContext | null = null;
let globalMuted = false;
let masterGain: GainNode | null = null;

export function isMuted() { return globalMuted; }

export function toggleMute(): boolean {
  globalMuted = !globalMuted;
  if (masterGain) {
    masterGain.gain.setValueAtTime(globalMuted ? 0 : 1, getCtx().currentTime);
  }
  return globalMuted;
}

function getMasterGain(): GainNode {
  const ctx = getCtx();
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(globalMuted ? 0 : 1, ctx.currentTime);
  }
  return masterGain;
}

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// ─── Heartbeat (proximity danger) ───
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let heartbeatPlaying = false;

function playBeat() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(55, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(gain).connect(getMasterGain());
  osc.start(now);
  osc.stop(now + 0.2);
}

export function startHeartbeat(bpm = 120) {
  if (heartbeatPlaying) return;
  heartbeatPlaying = true;
  const ms = (60 / bpm) * 1000;
  // Double-beat pattern
  playBeat();
  setTimeout(playBeat, ms * 0.2);
  heartbeatInterval = setInterval(() => {
    playBeat();
    setTimeout(playBeat, ms * 0.2);
  }, ms);
}

export function stopHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = null;
  heartbeatPlaying = false;
}

// ─── Grinding metal (moving walls) ───
let grindNodes: { osc: OscillatorNode; gain: GainNode } | null = null;

export function startGrinding() {
  if (grindNodes) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(400, ctx.currentTime);
  filter.Q.setValueAtTime(3, ctx.currentTime);
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  osc.connect(filter).connect(gain).connect(getMasterGain());
  osc.start();
  grindNodes = { osc, gain };
}

export function stopGrinding() {
  if (!grindNodes) return;
  grindNodes.gain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 0.1);
  grindNodes.osc.stop(getCtx().currentTime + 0.15);
  grindNodes = null;
}

// ─── Blade whoosh (spinning blades) ───
export function playWhoosh() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const noise = ctx.createBufferSource();
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(500, now + 0.12);
  filter.Q.setValueAtTime(1, now);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  noise.connect(filter).connect(gain).connect(getMasterGain());
  noise.start(now);
}

// ─── Pillar slam ───
export function playSlam() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Low impact thud
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(100, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc.connect(gain).connect(getMasterGain());
  osc.start(now);
  osc.stop(now + 0.4);

  // Crunch noise
  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
  noise.buffer = buf;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.15, now);
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  const nf = ctx.createBiquadFilter();
  nf.type = "lowpass";
  nf.frequency.setValueAtTime(800, now);
  noise.connect(nf).connect(ng).connect(getMasterGain());
  noise.start(now);
}

// ─── Griever screech ───
export function playGrieverSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.4);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(300, now);
  osc.connect(filter).connect(gain).connect(getMasterGain());
  osc.start(now);
  osc.stop(now + 0.5);
}

// ─── Death sound ───
export function playDeathSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Low descending tone
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 1);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(600, now);
  filter.frequency.exponentialRampToValueAtTime(100, now + 1);
  osc.connect(filter).connect(gain).connect(getMasterGain());
  osc.start(now);
  osc.stop(now + 1.3);

  // Distortion burst
  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
  noise.buffer = buf;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.2, now);
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  noise.connect(ng).connect(getMasterGain());
  noise.start(now);
}

// ─── Maze shift rumble ───
export function playMazeShift() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(35, now);
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(8, now);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(10, now);
  lfo.connect(lfoGain).connect(osc.frequency);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
  gain.gain.linearRampToValueAtTime(0.15, now + 1.2);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
  osc.connect(gain).connect(getMasterGain());
  osc.start(now);
  osc.stop(now + 2);
  lfo.start(now);
  lfo.stop(now + 2);
}

// ─── Win jingle ───
export function playWinSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + i * 0.15);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
    osc.connect(gain).connect(getMasterGain());
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.4);
  });
}
