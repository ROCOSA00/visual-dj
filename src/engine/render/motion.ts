import type { MotionAnimation } from "@/domain/types";
import { phase, type RenderEnv } from "./env";
import { TAU, easeInOut, fract, hash } from "./utils";

export interface MotionState {
  s: number;
  dx: number;
  dy: number;
  /** Radians. */
  rot: number;
  alpha: number;
  /** Extra chromatic split in stage px (glitch). */
  split: number;
}

/** Shared animation presets for logos, images and shapes. */
export function motion(env: RenderEnv, anim: MotionAnimation, speed: number, seed: number, audioReact = 0): MotionState {
  const m: MotionState = { s: 1, dx: 0, dy: 0, rot: 0, alpha: 1, split: 0 };
  switch (anim) {
    case "pulse":
      m.s = 1 + 0.08 * Math.exp(-fract(phase(env, 1, speed)) * 5);
      break;
    case "float": {
      const p = phase(env, 8, speed) * TAU;
      m.dy = Math.sin(p) * 22;
      m.dx = Math.cos(p) * 8;
      m.rot = Math.sin(p + 0.6) * 0.03;
      break;
    }
    case "spin":
      m.rot = phase(env, 16, speed) * TAU;
      break;
    case "zoom": {
      const p = fract(phase(env, 4, speed));
      m.s = 0.9 + 0.14 * easeInOut(p < 0.5 ? p * 2 : 2 - p * 2);
      break;
    }
    case "breathe": {
      const v = 0.5 + 0.5 * Math.sin(phase(env, 8, speed) * TAU);
      m.alpha = 0.55 + 0.45 * v;
      m.s = 0.97 + 0.05 * v;
      break;
    }
    case "glitch": {
      const n = Math.floor(phase(env, 0.25, speed));
      if (hash(n + seed) > 0.72) {
        m.dx = (hash(n * 2.7 + seed) - 0.5) * 40;
        m.split = 10 + hash(n * 5.3) * 14;
      }
      break;
    }
    case "none":
      break;
  }
  if (audioReact > 0) {
    const bass = Math.max(0, env.audio.bass - 0.2) / 0.8;
    m.s *= 1 + audioReact * 0.25 * bass;
  }
  return m;
}
