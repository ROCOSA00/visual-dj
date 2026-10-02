/**
 * One requestAnimationFrame loop for the whole app. Every animated canvas
 * (main stage, scene thumbnails, template previews) subscribes here with
 * its own frame-rate cap, so dozens of previews never spawn dozens of
 * independent loops.
 */

type TickFn = (now: number) => void;

interface Subscription {
  fn: TickFn;
  fps: number;
  last: number;
}

class Ticker {
  private subs = new Set<Subscription>();
  private rafId = 0;
  private maxFps = 60;

  add(fn: TickFn, fps = 60): () => void {
    const sub: Subscription = { fn, fps, last: 0 };
    this.subs.add(sub);
    this.ensureRunning();
    return () => {
      this.subs.delete(sub);
      if (this.subs.size === 0 && this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
    };
  }

  /** Global cap coming from Settings → Performance. */
  setMaxFps(fps: number): void {
    this.maxFps = fps;
  }

  private ensureRunning(): void {
    if (this.rafId || typeof window === "undefined") return;
    this.rafId = requestAnimationFrame(this.loop);
  }

  private loop = (now: number): void => {
    this.rafId = requestAnimationFrame(this.loop);
    for (const sub of this.subs) {
      const fps = Math.min(sub.fps, this.maxFps);
      const interval = 1000 / fps;
      // Small tolerance so a 60 fps cap does not drop frames on 60 Hz screens.
      if (now - sub.last >= interval - 2) {
        sub.last = now;
        try {
          sub.fn(now);
        } catch (error) {
          console.error("[ticker]", error);
        }
      }
    }
  };
}

export const ticker = new Ticker();
