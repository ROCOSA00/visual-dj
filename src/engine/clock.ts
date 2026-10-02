/**
 * Playback clock shared by everything that renders the same timeline.
 * Time is kept outside React state: canvases read it every frame and UI that
 * needs it (timeline playhead) subscribes or polls through the ticker.
 */
export class PlaybackClock {
  private base = 0;
  private startedAt: number | null;
  private listeners = new Set<() => void>();

  constructor(playing = true) {
    this.startedAt = playing ? nowMs() : null;
  }

  get playing(): boolean {
    return this.startedAt !== null;
  }

  /** Seconds since the clock started, excluding paused time. */
  time(): number {
    if (this.startedAt === null) return this.base;
    return this.base + (nowMs() - this.startedAt) / 1000;
  }

  play(): void {
    if (this.startedAt !== null) return;
    this.startedAt = nowMs();
    this.emit();
  }

  pause(): void {
    if (this.startedAt === null) return;
    this.base = this.time();
    this.startedAt = null;
    this.emit();
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  seek(seconds: number): void {
    this.base = Math.max(0, seconds);
    if (this.startedAt !== null) this.startedAt = nowMs();
    this.emit();
  }

  restart(): void {
    this.seek(0);
  }

  /** Shifts the clock so that a beat lands exactly now (tap tempo sync). */
  alignBeat(bpm: number): void {
    const beatLen = 60 / bpm;
    const t = this.time();
    const offset = t % beatLen;
    this.seek(offset > beatLen / 2 ? t + (beatLen - offset) : t - offset);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }
}

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/** Free-running clock for decorative previews (landing, thumbnails). */
export const ambientClock = new PlaybackClock(true);
