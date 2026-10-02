import type { BlendMode } from "@/domain/types";

export const STAGE_W = 1920;
export const STAGE_H = 1080;
export const TAU = Math.PI * 2;

/* --------------------------------- colour --------------------------------- */

const rgbCache = new Map<string, [number, number, number]>();

export function hexToRgb(hex: string): [number, number, number] {
  const cached = rgbCache.get(hex);
  if (cached) return cached;
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  const rgb: [number, number, number] = Number.isNaN(n) ? [255, 255, 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  rgbCache.set(hex, rgb);
  return rgb;
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha < 0 ? 0 : alpha > 1 ? 1 : alpha})`;
}

export function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

/** Picks a colour from a list by continuous index, blending neighbours. */
export function paletteAt(colors: string[], t: number): string {
  if (colors.length === 0) return "#ffffff";
  if (colors.length === 1) return colors[0]!;
  const x = ((t % 1) + 1) % 1;
  const scaled = x * colors.length;
  const i = Math.floor(scaled);
  const a = colors[i % colors.length]!;
  const b = colors[(i + 1) % colors.length]!;
  return mixHex(a, b, scaled - i);
}

export function pick<T>(list: T[], index: number): T {
  return list[((index % list.length) + list.length) % list.length]!;
}

/* ---------------------------------- math ---------------------------------- */

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, min = 0, max = 1) => (v < min ? min : v > max ? max : v);
export const fract = (v: number) => v - Math.floor(v);
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Deterministic pseudo-random in [0, 1). */
export function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** Small seeded PRNG for stable layouts (particles, stars...). */
export function seededRandom(seed: number): () => number {
  let a = Math.floor(seed * 4294967296) >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------ canvas helpers ----------------------------- */

export function toComposite(mode: BlendMode): GlobalCompositeOperation {
  return mode === "normal" ? "source-over" : mode;
}

export function polygonPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, sides: number, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i <= sides; i++) {
    const a = rotation + (i / sides) * TAU - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, points = 5, inner = 0.45) {
  ctx.beginPath();
  for (let i = 0; i <= points * 2; i++) {
    const a = (i / (points * 2)) * TAU - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * inner;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Soft round sprite used for glows and particles, cached per colour. */
const spriteCache = new Map<string, HTMLCanvasElement>();
export function glowSprite(color: string, hardness = 0.25): HTMLCanvasElement {
  const key = `${color}|${hardness}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;
  const size = 64;
  const c = createCanvas(size, size);
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(hardness * 0.5, rgba(color, 1));
  grad.addColorStop(Math.min(0.95, hardness + 0.2), rgba(color, 0.35));
  grad.addColorStop(1, rgba(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  spriteCache.set(key, c);
  return c;
}

export const supportsCanvasFilter = (() => {
  if (typeof document === "undefined") return false;
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    return !!ctx && "filter" in ctx;
  } catch {
    return false;
  }
})();
