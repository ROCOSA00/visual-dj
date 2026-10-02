import type { AudioFrame } from "../audio";
import { createCanvas } from "./utils";

/** Selection box of a positioned layer, in stage pixels (1920x1080). */
export interface LayerBounds {
  /** Anchor point (the layer's transform position). */
  x: number;
  y: number;
  /** Box offset from the anchor, before scale/rotation. */
  ox: number;
  oy: number;
  w: number;
  h: number;
  scale: number;
  /** Radians. */
  rotation: number;
}

/** Offscreen canvases reused across frames by a single render target. */
export class ScratchPool {
  private canvases = new Map<string, HTMLCanvasElement>();

  get(name: string, w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const width = Math.max(1, Math.round(w));
    const height = Math.max(1, Math.round(h));
    let canvas = this.canvases.get(name);
    if (!canvas) {
      canvas = createCanvas(width, height);
      this.canvases.set(name, canvas);
    } else if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    return { canvas, ctx: canvas.getContext("2d")! };
  }
}

export interface RenderEnv {
  ctx: CanvasRenderingContext2D;
  /** Seconds into the loop, 0..loopLen. */
  t: number;
  loopLen: number;
  bpm: number;
  /** Beats into the loop. */
  beat: number;
  audio: AudioFrame;
  artistName: string;
  /** 0.25..1, scales particle counts and expensive passes. */
  quality: number;
  /** Canvas pixels per stage pixel. */
  pixelRatio: number;
  /** When set, positioned layers write their selection boxes here. */
  bounds: Map<string, LayerBounds> | null;
  scratch: ScratchPool;
  /** Cap strobe/flash brightness (photosensitivity safety). */
  reduceFlashing: boolean;
  /** Editor previews draw placeholders for missing media. */
  editing: boolean;
}

/**
 * Seamless-loop phase. Returns how many cycles have elapsed at time t, where
 * the number of cycles per loop is always a whole number, so every animation
 * lands exactly where it started when the loop wraps.
 *
 * @param beatsPerCycle musical length of one cycle at speed 1
 */
export function phase(env: RenderEnv, beatsPerCycle: number, speed = 1): number {
  const loopBeats = (env.loopLen * env.bpm) / 60;
  const cycles = Math.max(1, Math.round((loopBeats / beatsPerCycle) * Math.max(0.01, speed)));
  return (env.t / env.loopLen) * cycles;
}

export function bandValue(env: RenderEnv, band: "bass" | "mid" | "high" | "full"): number {
  const a = env.audio;
  return band === "full" ? a.level : a[band];
}
