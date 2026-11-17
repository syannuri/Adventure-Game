/**
 * Procedural audio engine.
 *
 * All music and sound effects in this build are ORIGINAL and synthesized at runtime with the
 * Web Audio API (no external audio files). This keeps the download tiny and avoids licensing issues.
 * Replace with recorded assets later by swapping the implementations of `playMusic` / `sfx`.
 */

type SongName = 'menu' | 'forest' | 'victory';
export type SfxName =
  | 'star'
  | 'coin'
  | 'jump'
  | 'land'
  | 'step'
  | 'talk'
  | 'pop'
  | 'click'
  | 'achievement'
  | 'magic'
  | 'chest'
  | 'whoosh';

interface Song {
  bpm: number;
  root: number; // midi note of key root
  chords: number[][]; // per bar: scale degrees of the chord
  melody: (number | null)[]; // scale degrees per 8th note
  bells?: boolean;
  harp?: boolean;
  shaker?: boolean;
  melodyOctave: number;
  loop: boolean;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const degToSemi = (d: number) => MAJOR[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

const SONGS: Record<SongName, Song> = {
  forest: {
    bpm: 92,
    root: 65, // F4
    chords: [
      [0, 2, 4],
      [-2, 0, 2],
      [-4, -2, 0],
      [-3, -1, 1],
      [0, 2, 4],
      [-2, 0, 2],
      [-4, -2, 0],
      [-3, -1, 1],
    ],
    melody: [
      4, null, 2, 4, 5, null, 4, null, 2, null, 0, 2, 1, null, null, null,
      5, null, 3, 5, 7, null, 5, null, 4, null, 6, null, 4, null, null, null,
      7, null, 6, 4, 5, null, 4, null, 2, null, 4, 2, 0, null, null, null,
      3, null, 5, 3, 7, null, 5, 3, 4, null, 1, null, 4, null, null, null,
    ],
    harp: true,
    shaker: true,
    melodyOctave: 0,
    loop: true,
  },
  menu: {
    bpm: 80,
    root: 60, // C4
    chords: [
      [0, 2, 4],
      [-3, -1, 1],
      [-2, 0, 2],
      [-4, -2, 0],
    ],
    melody: [
      7, null, null, 9, 8, null, 7, null, 6, null, null, null, 4, null, null, null,
      5, null, null, 7, 6, null, 5, null, 4, null, null, null, 3, null, 4, null,
    ],
    bells: true,
    melodyOctave: 0,
    loop: true,
  },
  victory: {
    bpm: 118,
    root: 60,
    chords: [
      [0, 2, 4],
      [-4, -2, 0],
      [-3, -1, 1],
      [0, 2, 4],
    ],
    melody: [
      0, 2, 4, 7, null, 4, 7, null, 5, null, 7, 5, 4, null, null, null,
      6, null, 5, 4, 2, null, 4, null, 7, null, null, null, 7, null, null, null,
    ],
    bells: true,
    harp: true,
    melodyOctave: 0,
    loop: true,
  },
};

class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private ambBus!: GainNode;
  private reverb!: ConvolverNode;
  private reverbSend!: GainNode;
  private noiseBuf!: AudioBuffer;
  private musicVol = 0.6;
  private sfxVol = 0.8;
  private current: SongName | null = null;
  private wanted: SongName | null = null;
  private step = 0;
  private nextTime = 0;
  private timer: number | null = null;
  private songGain: GainNode | null = null;
  private ambience: Record<string, { gain: GainNode; target: number }> = {};
  private birdTimer: number | null = null;
  private birdsOn = false;

  /** Must be called from a user gesture (browser autoplay policy). Safe to call repeatedly. */
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.build();
      if (this.wanted) this.playMusic(this.wanted, true);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private build() {
    const ctx = this.ctx!;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.makeImpulse(2.6);
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.35;
    this.reverbSend.connect(this.reverb).connect(this.master);

    this.musicBus = ctx.createGain();
    this.sfxBus = ctx.createGain();
    this.ambBus = ctx.createGain();
    this.musicBus.connect(this.master);
    this.musicBus.connect(this.reverbSend);
    this.sfxBus.connect(this.master);
    this.sfxBus.connect(this.reverbSend);
    this.ambBus.connect(this.master);
    this.applyVolumes();

    const len = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      // light pinkening for softer noise
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    }
  }

  private makeImpulse(seconds: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return buf;
  }

  setVolumes(music: number, sfx: number) {
    this.musicVol = music;
    this.sfxVol = sfx;
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.setTargetAtTime(this.musicVol * 0.55, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.sfxVol * 0.8, t, 0.05);
    this.ambBus.gain.setTargetAtTime(this.sfxVol * 0.6, t, 0.05);
  }

  // ------------------------------------------------------------------ music

  playMusic(name: SongName, force = false) {
    this.wanted = name;
    if (!this.ctx) return;
    if (this.current === name && !force) return;
    const ctx = this.ctx;
    if (this.songGain) {
      const g = this.songGain;
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      setTimeout(() => g.disconnect(), 2500);
    }
    this.songGain = ctx.createGain();
    this.songGain.gain.value = 0;
    this.songGain.gain.setTargetAtTime(1, ctx.currentTime + 0.1, 0.5);
    this.songGain.connect(this.musicBus);
    this.current = name;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.15;
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), 40);
  }

  stopMusic() {
    this.wanted = null;
    if (this.songGain && this.ctx) this.songGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    this.current = null;
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.current || !this.songGain) return;
    const song = SONGS[this.current];
    const stepDur = 60 / song.bpm / 2;
    while (this.nextTime < ctx.currentTime + 0.25) {
      this.playStep(song, this.step, this.nextTime, stepDur, this.songGain);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  private playStep(song: Song, step: number, t: number, sd: number, out: GainNode) {
    const bar = Math.floor(step / 8) % song.chords.length;
    const inBar = step % 8;
    const chord = song.chords[bar];
    const root = song.root;
    if (inBar === 0) {
      // warm pad
      for (const deg of chord) this.padNote(mtof(root - 12 + degToSemi(deg)), t, sd * 8, out);
      this.bassNote(mtof(root - 24 + degToSemi(chord[0])), t, sd * 3, out);
    }
    if (inBar === 4) this.bassNote(mtof(root - 24 + degToSemi(chord[0] + 4)), t, sd * 3, out);
    const m = song.melody[step % song.melody.length];
    if (m !== null && m !== undefined) this.leadNote(mtof(root + 12 * song.melodyOctave + degToSemi(m)), t, sd * 1.8, out);
    if (song.harp) {
      const pattern = [0, 1, 2, 3, 2, 1, 2, 3];
      const deg = chord[pattern[inBar] % 3] + (pattern[inBar] === 3 ? 7 : 0);
      this.pluck(mtof(root + degToSemi(deg)), t, 0.06, out);
    }
    if (song.bells && inBar % 2 === 0) {
      const deg = chord[(inBar / 2) % 3] + 14;
      this.bell(mtof(root + degToSemi(deg)), t, 0.05, out);
    }
    if (song.shaker && inBar % 2 === 1) this.noiseHit(t, 0.05, 7000, 0.035, out);
  }

  private env(g: GainNode, t: number, a: number, peak: number, dur: number, rel: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * 0.7, t + a, dur * 0.4);
    g.gain.setTargetAtTime(0.0001, t + dur, rel);
  }

  private padNote(f: number, t: number, dur: number, out: AudioNode) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    for (const det of [-7, 7]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(lp);
      o.start(t);
      o.stop(t + dur + 1.5);
    }
    lp.connect(g).connect(out);
    this.env(g, t, 0.6, 0.035, dur, 0.4);
  }

  private bassNote(f: number, t: number, dur: number, out: AudioNode) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    const g = ctx.createGain();
    o.connect(g).connect(out);
    this.env(g, t, 0.02, 0.16, dur * 0.5, 0.15);
    o.start(t);
    o.stop(t + dur + 1);
  }

  private leadNote(f: number, t: number, dur: number, out: AudioNode) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = f * 2;
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.2;
    const vibG = ctx.createGain();
    vibG.gain.value = f * 0.006;
    vib.connect(vibG).connect(o.frequency);
    const g = ctx.createGain();
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(out);
    this.env(g, t, 0.04, 0.12, dur * 0.6, 0.18);
    for (const n of [o, o2, vib]) {
      n.start(t);
      n.stop(t + dur + 1);
    }
  }

  private pluck(f: number, t: number, vol: number, out: AudioNode) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.7);
  }

  private bell(f: number, t: number, vol: number, out: AudioNode) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    g.connect(out);
    for (const [mul, v] of [
      [1, 1],
      [2.76, 0.3],
      [5.4, 0.12],
    ]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * mul;
      const og = ctx.createGain();
      og.gain.value = v;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + 1.5);
    }
  }

  private noiseHit(t: number, dur: number, freq: number, vol: number, out: AudioNode, type: BiquadFilterType = 'highpass') {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  }

  private tone(type: OscillatorType, f0: number, f1: number, t: number, dur: number, vol: number, out: AudioNode) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // ------------------------------------------------------------------ sfx

  sfx(name: SfxName, opts: { pitch?: number; volume?: number } = {}) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + 0.005;
    const out = this.sfxBus;
    const p = opts.pitch ?? 1;
    const v = opts.volume ?? 1;
    switch (name) {
      case 'star': {
        [72, 76, 79, 84, 88].forEach((m, i) => this.bell(mtof(m) * p, t + i * 0.06, 0.12 * v, out));
        this.noiseHit(t, 0.5, 9000, 0.05 * v, out);
        break;
      }
      case 'coin':
        this.tone('square', mtof(83) * p, mtof(83) * p, t, 0.07, 0.04 * v, out);
        this.tone('square', mtof(88) * p, mtof(88) * p, t + 0.07, 0.22, 0.04 * v, out);
        break;
      case 'jump':
        this.tone('sine', 320 * p, 640 * p, t, 0.16, 0.12 * v, out);
        break;
      case 'land':
        this.noiseHit(t, 0.12, 380, 0.25 * v, out, 'lowpass');
        break;
      case 'step':
        this.noiseHit(t, 0.06, 900 + Math.random() * 600, 0.07 * v, out, 'bandpass');
        break;
      case 'talk':
        this.tone('sine', 500 * p, 560 * p, t, 0.05, 0.05 * v, out);
        break;
      case 'pop':
        this.tone('sine', 420 * p, 900 * p, t, 0.1, 0.14 * v, out);
        break;
      case 'click':
        this.tone('triangle', 660 * p, 880 * p, t, 0.08, 0.1 * v, out);
        break;
      case 'achievement':
        [67, 72, 76, 79, 84].forEach((m, i) => this.pluck(mtof(m), t + i * 0.09, 0.14 * v, out));
        [84, 88].forEach((m, i) => this.bell(mtof(m), t + 0.5 + i * 0.12, 0.09 * v, out));
        break;
      case 'magic':
        for (let i = 0; i < 18; i++) this.bell(mtof(72 + MAJOR[i % 7] + 12 * Math.floor(i / 7)), t + i * 0.07, 0.06 * v, out);
        this.noiseHit(t, 1.8, 6000, 0.05 * v, out);
        break;
      case 'chest':
        this.tone('sawtooth', 120, 70, t, 0.35, 0.05 * v, out);
        [76, 79, 84].forEach((m, i) => this.bell(mtof(m), t + 0.25 + i * 0.08, 0.1 * v, out));
        break;
      case 'whoosh':
        this.noiseHit(t, 0.6, 1200, 0.12 * v, out, 'bandpass');
        break;
    }
  }

  // ------------------------------------------------------------------ ambience

  /** Fade a looping ambience layer to `level` (0..1). Layers: 'waterfall', 'wind'. */
  setAmbience(name: 'waterfall' | 'wind', level: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    let a = this.ambience[name];
    if (!a) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = name === 'waterfall' ? 'lowpass' : 'lowpass';
      f.frequency.value = name === 'waterfall' ? 1400 : 380;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(f).connect(gain).connect(this.ambBus);
      src.start();
      a = this.ambience[name] = { gain, target: 0 };
    }
    if (Math.abs(a.target - level) > 0.01) {
      a.target = level;
      a.gain.gain.setTargetAtTime(level * (name === 'waterfall' ? 0.9 : 0.35), ctx.currentTime, 0.3);
    }
  }

  /** Random birdsong while in outdoor worlds. */
  setBirds(on: boolean) {
    this.birdsOn = on;
    if (on && this.birdTimer === null) {
      const tick = () => {
        if (!this.birdsOn) {
          this.birdTimer = null;
          return;
        }
        this.chirp();
        this.birdTimer = window.setTimeout(tick, 1500 + Math.random() * 4500);
      };
      this.birdTimer = window.setTimeout(tick, 1200);
    }
  }

  private chirp() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const base = 2200 + Math.random() * 1600;
    const n = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      this.tone('sine', base * (1 + Math.random() * 0.2), base * 1.35, t + i * 0.11, 0.08, 0.025, this.ambBus);
    }
  }

  stopAmbience() {
    for (const k of Object.keys(this.ambience)) this.setAmbience(k as 'waterfall', 0);
    this.setBirds(false);
  }
}

export const audio = new AudioEngine();
