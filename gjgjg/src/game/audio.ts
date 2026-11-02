export type Sfx =
  | 'step' | 'blip' | 'chime' | 'swipe' | 'gem' | 'select' | 'confirm' | 'error' | 'caught' | 'unlock'
  | 'kiss' | 'anger' | 'door' | 'masterpiece' | 'coin' | 'pause';
export type Mood = 'day' | 'night' | 'club' | 'penthouse' | 'off';

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// chord roots (midi) per bar, 4 bars loop
const PROG: Record<Exclude<Mood, 'off'>, { roots: number[]; scale: number[]; bpm: number; mel: number[]; wave: OscillatorType }> = {
  day: { roots: [48, 53, 55, 45], scale: [0, 2, 4, 7, 9], bpm: 118, wave: 'square',
    mel: [4, -1, 2, 3, 4, -1, 7, -1, 9, -1, 7, 4, 2, -1, 3, 4, 3, -1, 1, 2, 3, -1, 5, -1, 7, 5, 3, -1, 2, 1, 0, -1] },
  night: { roots: [45, 41, 48, 43], scale: [0, 3, 5, 7, 10], bpm: 88, wave: 'triangle',
    mel: [7, -1, -1, 5, 3, -1, -1, 2, 0, -1, 2, -1, 3, -1, -1, -1, 5, -1, -1, 3, 2, -1, -1, 0, 2, -1, 3, -1, 5, -1, -1, -1] },
  club: { roots: [45, 45, 41, 43], scale: [0, 3, 5, 7, 10], bpm: 124, wave: 'sawtooth',
    mel: [7, -1, 7, 5, -1, 7, -1, 10, 9, -1, 7, -1, 5, -1, 3, -1, 7, -1, 7, 5, -1, 7, -1, 12, 10, -1, 9, 7, 5, -1, 3, 2] },
  penthouse: { roots: [50, 55, 52, 47], scale: [0, 2, 4, 7, 9], bpm: 96, wave: 'sine',
    mel: [9, -1, -1, 7, 4, -1, 7, -1, 9, -1, 12, -1, 9, -1, -1, -1, 7, -1, -1, 4, 2, -1, 4, -1, 7, -1, 9, -1, 7, -1, -1, -1] },
};

export class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  musicGain!: GainNode;
  sfxGain!: GainNode;
  noiseBuf!: AudioBuffer;
  muted = false;
  mood: Mood = 'off';
  step = 0;
  nextT = 0;
  timer: number | null = null;

  constructor() {
    try { this.muted = localStorage.getItem('bk_muted') === '1'; } catch { /* ignore */ }
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.master);
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.nextT = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 30);
  }

  setMuted(m: boolean) {
    this.muted = m;
    try { localStorage.setItem('bk_muted', m ? '1' : '0'); } catch { /* ignore */ }
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  setMood(m: Mood) {
    if (m === this.mood) return;
    this.mood = m;
    this.step = 0;
    if (this.ctx) this.nextT = Math.max(this.nextT, this.ctx.currentTime + 0.05);
  }

  private tone(freq: number, t: number, dur: number, type: OscillatorType, vol: number, dest: AudioNode, slideTo?: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.02);
  }

  private noise(t: number, dur: number, vol: number, dest: AudioNode, f0: number, f1: number, type: BiquadFilterType = 'bandpass') {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || this.mood === 'off') return;
    const p = PROG[this.mood];
    const stepDur = 60 / p.bpm / 4;
    while (this.nextT < ctx.currentTime + 0.15) {
      const st = this.step % 32;
      const bar = Math.floor(st / 8) % 4;
      const root = p.roots[bar];
      const t = this.nextT;
      // bass
      if (st % 2 === 0) {
        const bn = root - 12 + (st % 8 === 4 ? 7 : 0);
        this.tone(mtof(bn), t, stepDur * 1.8, this.mood === 'club' ? 'sawtooth' : 'triangle', this.mood === 'club' ? 0.5 : 0.7, this.musicGain);
      }
      // arp
      if (this.mood === 'club' || this.mood === 'day') {
        const arp = [0, 4, 7, 12][st % 4];
        this.tone(mtof(root + 12 + arp), t, stepDur * 0.7, 'square', 0.12, this.musicGain);
      }
      // melody
      const m = p.mel[st];
      if (m >= 0) {
        const deg = m % 5;
        const oct = Math.floor(m / 5);
        this.tone(mtof(root + 24 + p.scale[deg] + oct * 12 - 12), t, stepDur * 1.6, p.wave, 0.45, this.musicGain);
      }
      // drums
      if (this.mood === 'club') {
        if (st % 4 === 0) this.tone(130, t, 0.12, 'sine', 0.9, this.musicGain, 40);
        if (st % 4 === 2) this.noise(t, 0.04, 0.35, this.musicGain, 9000, 9000, 'highpass');
        if (st % 8 === 4) this.noise(t, 0.1, 0.4, this.musicGain, 3000, 1800);
      } else if (this.mood === 'day') {
        if (st % 8 === 0) this.tone(120, t, 0.1, 'sine', 0.7, this.musicGain, 45);
        if (st % 4 === 2) this.noise(t, 0.03, 0.25, this.musicGain, 8000, 8000, 'highpass');
      } else if (st % 8 === 0) {
        this.tone(100, t, 0.14, 'sine', 0.45, this.musicGain, 45);
      }
      this.nextT += stepDur;
      this.step++;
    }
  }

  play(name: Sfx, v = 0) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const t = ctx.currentTime;
    const d = this.sfxGain;
    switch (name) {
      case 'step': this.noise(t, 0.05, 0.25 + Math.random() * 0.1, d, 700 + Math.random() * 300, 250, 'lowpass'); break;
      case 'blip': this.tone(v || 520, t, 0.045, 'square', 0.22, d); break;
      case 'select': this.tone(660, t, 0.05, 'square', 0.2, d); break;
      case 'confirm': this.tone(660, t, 0.06, 'square', 0.22, d); this.tone(990, t + 0.06, 0.1, 'square', 0.22, d); break;
      case 'pause': this.tone(440, t, 0.07, 'triangle', 0.3, d); this.tone(330, t + 0.07, 0.1, 'triangle', 0.3, d); break;
      case 'chime': [1318, 1568, 2093, 2637].forEach((f, i) => this.tone(f, t + i * 0.07, 0.25, 'sine', 0.3, d)); break;
      case 'swipe': this.noise(t, 0.28, 0.5, d, 500, 4200); this.tone(900, t, 0.12, 'triangle', 0.1, d, 1800); break;
      case 'gem': this.tone(1568, t, 0.07, 'square', 0.18, d); this.tone(2349, t + 0.06, 0.16, 'square', 0.18, d); break;
      case 'coin': this.tone(988, t, 0.06, 'square', 0.18, d); this.tone(1319, t + 0.06, 0.2, 'square', 0.18, d); break;
      case 'error': this.tone(180, t, 0.2, 'sawtooth', 0.25, d, 90); break;
      case 'caught': [880, 660, 880, 660, 440].forEach((f, i) => this.tone(f, t + i * 0.12, 0.14, 'sawtooth', 0.28, d)); break;
      case 'unlock': [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, t + i * 0.08, 0.22, 'square', 0.2, d)); break;
      case 'masterpiece': [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => { this.tone(f, t + i * 0.05, 0.3, 'triangle', 0.3, d); }); break;
      case 'kiss': this.tone(700, t, 0.12, 'sine', 0.35, d, 1500); this.noise(t + 0.12, 0.05, 0.3, d, 2500, 1500); this.tone(1318, t + 0.22, 0.25, 'sine', 0.25, d); break;
      case 'anger': this.noise(t, 0.25, 0.4, d, 600, 100, 'lowpass'); this.tone(220, t, 0.3, 'sawtooth', 0.22, d, 70); break;
      case 'door': this.noise(t, 0.12, 0.4, d, 400, 120, 'lowpass'); this.tone(90, t, 0.15, 'sine', 0.5, d, 50); break;
    }
  }
}

export const audio = new AudioEngine();
