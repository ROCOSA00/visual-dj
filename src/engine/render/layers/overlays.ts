import type { OverlayLayer, OverlayType } from "@/domain/types";
import { phase, type RenderEnv } from "../env";
import { STAGE_H, STAGE_W, createCanvas, fract, hash, rgba } from "../utils";

/**
 * Overlays are post-processing passes drawn on top of everything below
 * them. Several work directly in canvas pixels so lines stay crisp at any
 * output resolution.
 */
type OverlayRenderer = (env: RenderEnv, l: OverlayLayer) => void;

export function drawOverlay(env: RenderEnv, l: OverlayLayer): void {
  const renderer = RENDERERS[l.overlay];
  if (!renderer) return;
  env.ctx.save();
  renderer(env, l);
  env.ctx.restore();
}

/** Run `fn` in raw canvas-pixel space. */
function inDeviceSpace(ctx: CanvasRenderingContext2D, fn: (w: number, h: number) => void) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  fn(ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

function snapshot(env: RenderEnv): HTMLCanvasElement {
  const { canvas, ctx } = env.scratch.get("frame", env.ctx.canvas.width, env.ctx.canvas.height);
  ctx.globalCompositeOperation = "copy";
  ctx.drawImage(env.ctx.canvas, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  return canvas;
}

/* --------------------------------- tiles ---------------------------------- */

const tileCache = new Map<string, HTMLCanvasElement>();

function scanTile(period: number, color: string): HTMLCanvasElement {
  const key = `scan:${period}:${color}`;
  let tile = tileCache.get(key);
  if (!tile) {
    tile = createCanvas(4, period);
    const g = tile.getContext("2d")!;
    g.fillStyle = color;
    g.fillRect(0, Math.ceil(period / 2), 4, Math.floor(period / 2));
    tileCache.set(key, tile);
  }
  return tile;
}

function ledTile(pitch: number): HTMLCanvasElement {
  const key = `led:${pitch}`;
  let tile = tileCache.get(key);
  if (!tile) {
    tile = createCanvas(pitch, pitch);
    const g = tile.getContext("2d")!;
    g.fillStyle = "rgba(0,0,0,1)";
    const gap = Math.max(1, Math.round(pitch * 0.28));
    g.fillRect(pitch - gap, 0, gap, pitch);
    g.fillRect(0, pitch - gap, pitch, gap);
    g.fillStyle = "rgba(0,0,0,0.35)";
    g.fillRect(0, 0, 1, 1);
    tileCache.set(key, tile);
  }
  return tile;
}

let noiseTiles: HTMLCanvasElement[] | null = null;
function getNoiseTiles(): HTMLCanvasElement[] {
  if (noiseTiles) return noiseTiles;
  noiseTiles = [0, 1, 2].map(() => {
    const size = 160;
    const c = createCanvas(size, size);
    const g = c.getContext("2d")!;
    const img = g.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  });
  return noiseTiles;
}

/* -------------------------------- renderers ------------------------------- */

const scanlines: OverlayRenderer = (env, l) => {
  inDeviceSpace(env.ctx, (w, h) => {
    const period = Math.max(2, Math.round(4 * env.pixelRatio * 1.5));
    const pattern = env.ctx.createPattern(scanTile(period, rgba(l.color, 1)), "repeat");
    if (!pattern) return;
    const offset = fract(phase(env, 4, l.speed) * (l.reverse ? -1 : 1)) * period * 8;
    env.ctx.globalAlpha *= l.intensity * 0.65;
    env.ctx.translate(0, offset);
    env.ctx.fillStyle = pattern;
    env.ctx.fillRect(0, -period * 8, w, h + period * 16);
  });
};

const grain: OverlayRenderer = (env, l) => {
  const tiles = getNoiseTiles();
  const frame = Math.floor(env.t * 24);
  inDeviceSpace(env.ctx, (w, h) => {
    const ctx = env.ctx;
    const tile = tiles[frame % tiles.length]!;
    const pattern = ctx.createPattern(tile, "repeat");
    if (!pattern) return;
    const ox = hash(frame) * 160;
    const oy = hash(frame + 7) * 160;
    ctx.translate(-ox, -oy);
    ctx.fillStyle = pattern;
    const base = ctx.globalAlpha;
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = base * l.intensity * 0.55;
    ctx.fillRect(0, 0, w + 160, h + 160);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = base * l.intensity * 0.07;
    ctx.fillRect(0, 0, w + 160, h + 160);
  });
};

const vignette: OverlayRenderer = (env, l) => {
  const { ctx } = env;
  const g = ctx.createRadialGradient(STAGE_W / 2, STAGE_H / 2, STAGE_H * 0.35, STAGE_W / 2, STAGE_H / 2, STAGE_W * 0.72);
  g.addColorStop(0, rgba(l.color, 0));
  g.addColorStop(1, rgba(l.color, Math.min(1, l.intensity * 1.1)));
  ctx.fillStyle = g;
  ctx.fillRect(-20, -20, STAGE_W + 40, STAGE_H + 40);
};

const chromatic: OverlayRenderer = (env, l) => {
  if (env.quality < 0.4) return;
  const w = env.ctx.canvas.width;
  const h = env.ctx.canvas.height;
  const kick = 1 + env.audio.kick * 0.8;
  const shift = Math.max(1, Math.round(l.intensity * 14 * env.pixelRatio * kick));
  const frame = snapshot(env);
  const red = env.scratch.get("chroma-r", w, h);
  const cyan = env.scratch.get("chroma-c", w, h);
  for (const [layer, color] of [
    [red, "#ff0000"],
    [cyan, "#00ffff"],
  ] as const) {
    layer.ctx.globalCompositeOperation = "copy";
    layer.ctx.drawImage(frame, 0, 0);
    layer.ctx.globalCompositeOperation = "multiply";
    layer.ctx.fillStyle = color;
    layer.ctx.fillRect(0, 0, w, h);
  }
  const angle = (l.angle * Math.PI) / 180;
  const dx = Math.cos(angle) * shift;
  const dy = Math.sin(angle) * shift;
  inDeviceSpace(env.ctx, () => {
    const ctx = env.ctx;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "copy";
    ctx.drawImage(cyan.canvas, -dx, -dy);
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(red.canvas, dx, dy);
  });
};

const ledGrid: OverlayRenderer = (env, l) => {
  inDeviceSpace(env.ctx, (w, h) => {
    const pitch = Math.max(3, Math.round(7 * env.pixelRatio));
    const pattern = env.ctx.createPattern(ledTile(pitch), "repeat");
    if (!pattern) return;
    env.ctx.globalAlpha *= l.intensity;
    env.ctx.fillStyle = pattern;
    env.ctx.fillRect(0, 0, w, h);
  });
};

const vhs: OverlayRenderer = (env, l) => {
  const { ctx } = env;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const frame = snapshot(env);
  const p = fract(phase(env, 8, l.speed) * (l.reverse ? -1 : 1));
  const bandH = h * (0.06 + l.intensity * 0.06);
  const y = p * (h + bandH) - bandH;
  const jitter = Math.floor(env.t * 30);
  inDeviceSpace(ctx, () => {
    // Tracking band.
    const dx = (hash(jitter) - 0.5) * 30 * env.pixelRatio * l.intensity + 12 * env.pixelRatio * l.intensity;
    ctx.drawImage(frame, 0, y, w, bandH, dx, y, w, bandH);
    ctx.fillStyle = `rgba(255,255,255,${0.06 * l.intensity})`;
    ctx.fillRect(0, y, w, bandH);
    // Colour bleed.
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.18 * l.intensity;
    ctx.drawImage(frame, 3 * env.pixelRatio, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    // Noise lines.
    for (let i = 0; i < 6; i++) {
      if (hash(jitter * 3 + i) > 0.55) continue;
      const ly = hash(jitter + i * 13) * h;
      ctx.fillStyle = `rgba(255,255,255,${0.1 + 0.25 * hash(i + jitter)})`;
      ctx.fillRect(0, ly, w, Math.max(1, env.pixelRatio * 1.5));
    }
    // Head-switching noise at the bottom.
    const tiles = getNoiseTiles();
    ctx.globalAlpha = 0.35 * l.intensity;
    ctx.drawImage(tiles[jitter % 3]!, 0, 0, 160, 8, 0, h * 0.965, w, h * 0.035);
  });
};

const crt: OverlayRenderer = (env, l) => {
  scanlines(env, { ...l, intensity: l.intensity * 0.8, color: "#000000" });
  const { ctx } = env;
  // Rolling bar.
  const p = fract(phase(env, 4, l.speed));
  const y = p * (STAGE_H + 300) - 150;
  const g = ctx.createLinearGradient(0, y - 150, 0, y + 150);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.5, `rgba(255,255,255,${0.05 * l.intensity})`);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, y - 150, STAGE_W, 300);
  // Tube curvature: dark rounded edges.
  const v = ctx.createRadialGradient(STAGE_W / 2, STAGE_H / 2, STAGE_H * 0.45, STAGE_W / 2, STAGE_H / 2, STAGE_W * 0.62);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, `rgba(0,0,0,${0.85 * l.intensity})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
};

const lightLeak: OverlayRenderer = (env, l) => {
  const w = 64;
  const h = 36;
  const { canvas, ctx: g } = env.scratch.get(`leak:${l.id}`, w, h);
  g.globalCompositeOperation = "source-over";
  g.clearRect(0, 0, w, h);
  const ph = phase(env, 16, l.speed) * Math.PI * 2;
  const blobs: Array<[number, number, number, string]> = [
    [0.05 + 0.08 * Math.sin(ph), 0.2 + 0.25 * Math.cos(ph), 0.55, l.color],
    [0.95 - 0.06 * Math.cos(ph * 2), 0.75 + 0.15 * Math.sin(ph), 0.5, "#ff7a2f"],
    [0.6 + 0.2 * Math.sin(ph + 2), -0.05, 0.4, "#ffd36b"],
  ];
  for (const [x, y, r, color] of blobs) {
    const grad = g.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * w);
    grad.addColorStop(0, rgba(color, 0.9));
    grad.addColorStop(1, rgba(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }
  const ctx = env.ctx;
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha *= l.intensity;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(canvas, 0, 0, STAGE_W, STAGE_H);
};

const hud: OverlayRenderer = (env, l) => {
  const { ctx } = env;
  const m = 56;
  const len = 90;
  ctx.strokeStyle = rgba(l.color, 0.85 * l.intensity + 0.15);
  ctx.fillStyle = rgba(l.color, 0.85 * l.intensity + 0.15);
  ctx.lineWidth = 3;
  ctx.beginPath();
  // Corner brackets.
  for (const [x, y, sx, sy] of [
    [m, m, 1, 1],
    [STAGE_W - m, m, -1, 1],
    [m, STAGE_H - m, 1, -1],
    [STAGE_W - m, STAGE_H - m, -1, -1],
  ] as const) {
    ctx.moveTo(x, y + sy * len);
    ctx.lineTo(x, y);
    ctx.lineTo(x + sx * len, y);
  }
  ctx.stroke();
  // Edge ticks.
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 1; i < 12; i++) {
    const x = (STAGE_W / 12) * i;
    ctx.moveTo(x, m - 18);
    ctx.lineTo(x, m - (i % 3 === 0 ? 34 : 26));
  }
  ctx.globalAlpha *= 0.6;
  ctx.stroke();
  ctx.globalAlpha /= 0.6;
  ctx.font = "600 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textBaseline = "middle";
  const total = Math.floor(env.t * 30);
  const frames = String(total % 30).padStart(2, "0");
  const secs = String(Math.floor(env.t) % 60).padStart(2, "0");
  const mins = String(Math.floor(env.t / 60)).padStart(2, "0");
  ctx.textAlign = "left";
  if (Math.floor(env.beat) % 2 === 0) {
    ctx.beginPath();
    ctx.arc(m + 40, m + 48, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#ff3355";
    ctx.fill();
    ctx.fillStyle = rgba(l.color, 0.9);
  }
  ctx.fillText("LIVE", m + 60, m + 49);
  ctx.textAlign = "right";
  ctx.fillText(`${mins}:${secs}:${frames}`, STAGE_W - m - 30, m + 49);
  ctx.fillText(`${Math.round(env.bpm)} BPM`, STAGE_W - m - 30, STAGE_H - m - 40);
  ctx.textAlign = "left";
  const bars = 16;
  for (let i = 0; i < bars; i++) {
    const v = env.audio.spectrum[i * 3] ?? 0;
    ctx.fillRect(m + 30 + i * 12, STAGE_H - m - 40 - v * 40, 7, Math.max(3, v * 40));
  }
};

const glitch: OverlayRenderer = (env, l) => {
  const step = Math.floor(phase(env, 0.25, l.speed));
  const r = hash(step + 3.7);
  const threshold = 1 - l.intensity * 0.55 - env.audio.kick * 0.15;
  if (r < threshold) return;
  const { ctx } = env;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const frame = snapshot(env);
  inDeviceSpace(ctx, () => {
    const slices = 4 + Math.floor(hash(step) * 6);
    for (let i = 0; i < slices; i++) {
      const sy = hash(step * 3 + i) * h;
      const sh = (0.01 + hash(step * 5 + i) * 0.08) * h;
      const dx = (hash(step * 7 + i) - 0.5) * 0.12 * w * l.intensity;
      ctx.drawImage(frame, 0, sy, w, sh, dx, sy, w, sh);
    }
    if (hash(step * 11) > 0.5) {
      ctx.globalCompositeOperation = "difference";
      ctx.fillStyle = rgba(l.color, 0.85);
      const bx = hash(step * 13) * w;
      const by = hash(step * 17) * h;
      ctx.fillRect(bx, by, w * 0.18 * hash(step * 19), h * 0.04);
    }
  });
};

/**
 * Monochrome colour grade: keeps the brightness of everything below and
 * repaints it in one hue, like the single-colour looks of tour visuals.
 */
const grade: OverlayRenderer = (env, l) => {
  inDeviceSpace(env.ctx, (w, h) => {
    const ctx = env.ctx;
    const base = ctx.globalAlpha;
    ctx.globalCompositeOperation = "color";
    ctx.globalAlpha = base * Math.min(1, l.intensity * 1.1);
    ctx.fillStyle = l.color;
    ctx.fillRect(0, 0, w, h);
    // Push the tint into the highlights and keep blacks deep.
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = base * l.intensity * 0.18;
    ctx.fillRect(0, 0, w, h);
  });
};

/** Anamorphic lens flare: a horizontal streak that flares on the kick. */
const flare: OverlayRenderer = (env, l) => {
  const { ctx } = env;
  const y = STAGE_H / 2 + (l.angle / 180) * STAGE_H * 0.5;
  const k = 0.55 + 0.45 * env.audio.kick;
  const i = l.intensity * k;
  const ph = phase(env, 16, l.speed);
  ctx.globalCompositeOperation = "lighter";
  const streak = (height: number, alpha: number) => {
    const g = ctx.createLinearGradient(0, 0, STAGE_W, 0);
    g.addColorStop(0, rgba(l.color, 0));
    g.addColorStop(0.5, rgba(l.color, alpha));
    g.addColorStop(1, rgba(l.color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, y - height / 2, STAGE_W, height);
  };
  streak(60 + 80 * i, 0.08 * i);
  streak(14 + 10 * i, 0.3 * i);
  streak(3 + 3 * i, 0.95 * i);
  const core = ctx.createRadialGradient(STAGE_W / 2, y, 0, STAGE_W / 2, y, 280 * (0.5 + i));
  core.addColorStop(0, `rgba(255,255,255,${0.7 * i})`);
  core.addColorStop(0.2, rgba(l.color, 0.4 * i));
  core.addColorStop(1, rgba(l.color, 0));
  ctx.fillStyle = core;
  ctx.fillRect(0, y - 600, STAGE_W, 1200);
  // Ghost orbs drifting along the lens axis.
  for (let o = 0; o < 4; o++) {
    const t = Math.sin((ph + o * 0.23) * Math.PI * 2) * (0.25 + o * 0.12);
    const ox = STAGE_W / 2 + t * STAGE_W * 0.6;
    const oy = y + t * 120;
    const r = 30 + o * 26;
    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
    g.addColorStop(0, rgba(l.color, 0));
    g.addColorStop(0.7, rgba(l.color, 0.12 * i));
    g.addColorStop(1, rgba(l.color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(ox - r, oy - r, r * 2, r * 2);
  }
};

const RENDERERS: Record<OverlayType, OverlayRenderer> = {
  scanlines,
  grain,
  vignette,
  chromatic,
  ledGrid,
  vhs,
  crt,
  lightLeak,
  hud,
  glitch,
  grade,
  flare,
};
