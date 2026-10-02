/**
 * Audio analysis for audio-reactive layers.
 *
 * Three sources:
 *  - "simulated": a synthetic 4/4 groove driven by the project BPM. It is
 *    deterministic, so visuals still loop seamlessly and exports match the
 *    preview. This is the default and needs no permissions.
 *  - "file": a local track played through Web Audio.
 *  - "mic": live input (microphone or line-in from the mixer).
 *
 * Renderers call `audioEngine.frame(t, bpm)` and receive a shared frame
 * object that is overwritten on the next call; it must not be stored.
 */

export type AudioSourceKind = "simulated" | "file" | "mic";

export interface AudioFrame {
  bass: number;
  mid: number;
  high: number;
  level: number;
  /** Kick envelope: 1 on the hit, decays to 0. */
  kick: number;
  /** Seconds since the last kick. */
  sinceKick: number;
  /** Running kick counter, used to seed per-kick randomness. */
  kickIndex: number;
  /** 64 log-spaced bins, 0..1. */
  spectrum: Float32Array;
  /** 128 samples, -1..1. */
  waveform: Float32Array;
  live: boolean;
}

export interface AudioEngineState {
  source: AudioSourceKind;
  trackName: string | null;
  trackPlaying: boolean;
  error: string | null;
}

const SPECTRUM_BINS = 64;
const WAVEFORM_SAMPLES = 128;

function createFrame(): AudioFrame {
  return {
    bass: 0,
    mid: 0,
    high: 0,
    level: 0,
    kick: 0,
    sinceKick: 1,
    kickIndex: 0,
    spectrum: new Float32Array(SPECTRUM_BINS),
    waveform: new Float32Array(WAVEFORM_SAMPLES),
    live: false,
  };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

class AudioEngine {
  private state: AudioEngineState = {
    source: "simulated",
    trackName: null,
    trackPlaying: false,
    error: null,
  };
  private listeners = new Set<() => void>();
  private shared = createFrame();

  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private timeData: Uint8Array<ArrayBuffer> | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private trackNode: MediaElementAudioSourceNode | null = null;
  private micStream: MediaStream | null = null;
  private micNode: MediaStreamAudioSourceNode | null = null;
  private trackUrl: string | null = null;

  // Live analysis state.
  private liveFrame = createFrame();
  private lastAnalysis = -1;
  private peaks = { bass: 0.3, mid: 0.3, high: 0.3 };
  private bassHistory: number[] = [];
  private lastKickAt = -10;
  private kickCounter = 0;

  /* ------------------------------ subscription ----------------------------- */

  getState = (): AudioEngineState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private setState(patch: Partial<AudioEngineState>): void {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l();
  }

  /* -------------------------------- sources -------------------------------- */

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.72;
      this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      this.timeData = new Uint8Array(new ArrayBuffer(this.analyser.fftSize));
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private disconnectInputs(): void {
    this.trackNode?.disconnect();
    this.micNode?.disconnect();
    this.micNode = null;
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.micStream = null;
    if (this.audioEl) {
      this.audioEl.pause();
    }
  }

  useSimulated(): void {
    this.disconnectInputs();
    this.setState({ source: "simulated", trackPlaying: false, error: null });
  }

  async loadTrack(file: File): Promise<void> {
    try {
      const ctx = this.ensureContext();
      this.disconnectInputs();
      if (this.trackUrl) URL.revokeObjectURL(this.trackUrl);
      this.trackUrl = URL.createObjectURL(file);
      if (!this.audioEl) {
        this.audioEl = new Audio();
        this.audioEl.loop = true;
        this.audioEl.crossOrigin = "anonymous";
        this.audioEl.addEventListener("play", () => this.setState({ trackPlaying: true }));
        this.audioEl.addEventListener("pause", () => this.setState({ trackPlaying: false }));
        this.trackNode = ctx.createMediaElementSource(this.audioEl);
      }
      this.audioEl.src = this.trackUrl;
      this.trackNode!.connect(this.analyser!);
      this.analyser!.connect(ctx.destination);
      this.setState({ source: "file", trackName: file.name.replace(/\.[^.]+$/, ""), error: null });
      await this.audioEl.play();
    } catch (error) {
      console.error(error);
      this.setState({ error: "This file could not be played. Try an MP3, WAV or M4A track." });
    }
  }

  toggleTrack(): void {
    if (!this.audioEl) return;
    if (this.audioEl.paused) void this.audioEl.play();
    else this.audioEl.pause();
  }

  async useMic(): Promise<void> {
    try {
      const ctx = this.ensureContext();
      this.disconnectInputs();
      try {
        this.analyser?.disconnect();
      } catch {
        /* not connected */
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      this.micStream = stream;
      this.micNode = ctx.createMediaStreamSource(stream);
      // Never route live input to the speakers: it would feed back.
      this.micNode.connect(this.analyser!);
      this.setState({ source: "mic", trackPlaying: false, error: null });
    } catch (error) {
      console.error(error);
      this.setState({
        source: "simulated",
        error: "Microphone access was blocked. Allow it in your browser to react to live sound.",
      });
    }
  }

  /* -------------------------------- analysis ------------------------------- */

  frame(t: number, bpm: number): AudioFrame {
    if (this.state.source !== "simulated" && this.analyser) {
      return this.analyseLive();
    }
    return this.simulate(t, bpm);
  }

  /** Deterministic groove: kick on every beat, snare on 2 & 4, off-beat hats. */
  simulate(t: number, bpm: number): AudioFrame {
    const f = this.shared;
    const beat = (t * bpm) / 60;
    const beatIndex = Math.floor(beat);
    const bp = beat - beatIndex;
    const kick = Math.exp(-bp * 6.5);
    const hatPhase = (beat + 0.5) % 1;
    const hat = Math.exp(-hatPhase * 14);
    const snare = beatIndex % 2 === 1 ? Math.exp(-bp * 7) : 0;
    const swell = 0.5 + 0.5 * Math.sin((beat * Math.PI) / 8);

    f.kick = kick;
    f.sinceKick = (bp * 60) / bpm;
    f.kickIndex = beatIndex;
    f.bass = clamp01(0.22 + 0.78 * kick);
    f.mid = clamp01(0.22 + 0.55 * snare + 0.18 * swell);
    f.high = clamp01(0.12 + 0.68 * hat + 0.1 * swell);
    f.level = clamp01(f.bass * 0.5 + f.mid * 0.3 + f.high * 0.2);
    f.live = false;

    const s = f.spectrum;
    for (let i = 0; i < SPECTRUM_BINS; i++) {
      const x = i / (SPECTRUM_BINS - 1);
      const low = f.bass * Math.pow(1 - x, 2.4) * 1.05;
      const midBump = f.mid * Math.exp(-((x - 0.38) ** 2) / 0.025) * 0.75;
      const top = f.high * Math.pow(x, 1.3) * 0.62;
      const shimmer = 0.09 * Math.sin(i * 1.73 + beat * Math.PI) * (0.6 + 0.4 * f.level);
      s[i] = clamp01(low + midBump + top + shimmer + 0.06);
    }
    const w = f.waveform;
    const p = beat * Math.PI;
    for (let i = 0; i < WAVEFORM_SAMPLES; i++) {
      const x = i / (WAVEFORM_SAMPLES - 1);
      const window = Math.sin(x * Math.PI);
      w[i] =
        window *
        (Math.sin(x * Math.PI * 6 + p) * 0.55 * f.bass +
          Math.sin(x * Math.PI * 22 + p * 2) * 0.25 * f.mid +
          Math.sin(x * Math.PI * 58 - p * 4) * 0.14 * f.high);
    }
    return f;
  }

  private analyseLive(): AudioFrame {
    const now = performance.now();
    // Many canvases may ask in the same frame; analyse at most every 8 ms.
    if (now - this.lastAnalysis < 8) return this.liveFrame;
    this.lastAnalysis = now;

    const analyser = this.analyser!;
    const freq = this.freqData!;
    const time = this.timeData!;
    analyser.getByteFrequencyData(freq);
    analyser.getByteTimeDomainData(time);

    const sampleRate = this.ctx!.sampleRate;
    const binHz = sampleRate / 2 / freq.length;
    const avg = (from: number, to: number) => {
      const a = Math.max(1, Math.floor(from / binHz));
      const b = Math.min(freq.length - 1, Math.ceil(to / binHz));
      let sum = 0;
      for (let i = a; i <= b; i++) sum += freq[i]!;
      return sum / ((b - a + 1) * 255);
    };

    const raw = { bass: avg(30, 150), mid: avg(300, 2000), high: avg(4000, 12000) };
    const f = this.liveFrame;
    (Object.keys(raw) as Array<keyof typeof raw>).forEach((band) => {
      this.peaks[band] = Math.max(this.peaks[band] * 0.996, raw[band], 0.08);
      f[band] = clamp01(Math.pow(raw[band] / this.peaks[band], 1.4));
    });
    f.level = clamp01(f.bass * 0.5 + f.mid * 0.3 + f.high * 0.2);

    // Simple onset detection on the bass band.
    const history = this.bassHistory;
    const mean = history.length ? history.reduce((a, b) => a + b, 0) / history.length : 0;
    const seconds = now / 1000;
    if (raw.bass > mean * 1.22 && raw.bass > 0.25 && seconds - this.lastKickAt > 0.22) {
      this.lastKickAt = seconds;
      this.kickCounter++;
    }
    history.push(raw.bass);
    if (history.length > 43) history.shift();
    f.sinceKick = seconds - this.lastKickAt;
    f.kick = Math.exp(-f.sinceKick * 7);
    f.kickIndex = this.kickCounter;

    // Log-spaced spectrum.
    const minHz = 30;
    const maxHz = 16000;
    for (let i = 0; i < SPECTRUM_BINS; i++) {
      const lo = minHz * Math.pow(maxHz / minHz, i / SPECTRUM_BINS);
      const hi = minHz * Math.pow(maxHz / minHz, (i + 1) / SPECTRUM_BINS);
      f.spectrum[i] = clamp01(avg(lo, hi) * 1.25);
    }
    const step = time.length / WAVEFORM_SAMPLES;
    for (let i = 0; i < WAVEFORM_SAMPLES; i++) {
      f.waveform[i] = (time[Math.floor(i * step)]! - 128) / 128;
    }
    f.live = true;
    return f;
  }
}

export const audioEngine = new AudioEngine();
