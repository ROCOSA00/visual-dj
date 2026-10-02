import { nearestWeight } from "@/domain/fonts";
import type { EffectLayer, EffectType } from "@/domain/types";
import { canvasFont } from "../../fontLoader";
import { phase, type RenderEnv } from "../env";
import {
  STAGE_H,
  STAGE_W,
  TAU,
  fract,
  glowSprite,
  hash,
  hashString,
  mixHex,
  paletteAt,
  pick,
  polygonPath,
  rgba,
  seededRandom,
} from "../utils";

const CX = STAGE_W / 2;
const CY = STAGE_H / 2;
const MAX_R = Math.hypot(CX, CY);

type EffectRenderer = (env: RenderEnv, l: EffectLayer, colors: string[]) => void;

export function drawEffect(env: RenderEnv, l: EffectLayer): void {
  const colors = l.colors.length ? l.colors : ["#ffffff"];
  const renderer = RENDERERS[l.effect];
  if (!renderer) return;
  env.ctx.save();
  renderer(env, l, colors);
  env.ctx.restore();
}

/** Audio pump helper: 1 at rest, up to 1 + amount on the bass. */
function pump(env: RenderEnv, l: EffectLayer, amount: number): number {
  const bass = Math.max(0, env.audio.bass - 0.2) / 0.8;
  return 1 + l.audioReact * bass * amount;
}

/** Glowing stroke: a wide faint pass under a thin bright one. */
function glowStroke(ctx: CanvasRenderingContext2D, color: string, width: number, alpha: number) {
  ctx.strokeStyle = rgba(color, alpha * 0.22);
  ctx.lineWidth = width * 4;
  ctx.stroke();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.stroke();
}

const additive = (ctx: CanvasRenderingContext2D) => {
  if (ctx.globalCompositeOperation === "source-over") ctx.globalCompositeOperation = "lighter";
};

/* --------------------------------- tunnel --------------------------------- */

const tunnel: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  additive(ctx);
  const rings = Math.round(12 + l.intensity * 16);
  const dir = l.reverse ? -1 : 1;
  const ph = phase(env, 4, l.speed) * dir;
  const twist = (l.angle * Math.PI) / 180;
  const p = pump(env, l, 0.12);
  ctx.lineJoin = "round";
  for (let i = 0; i < rings; i++) {
    const z = fract(i / rings + ph);
    const r = MAX_R * (0.015 + Math.pow(z, 2.6) * 1.35) * l.scale * p;
    const fadeIn = Math.min(1, z * 4);
    const alpha = fadeIn * (0.35 + 0.65 * z) * (0.75 + 0.25 * env.audio.kick * l.audioReact);
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(z * twist);
    ctx.scale(1.55, 1);
    polygonPath(ctx, 0, 0, r, 4, Math.PI / 4);
    ctx.restore();
    glowStroke(ctx, pick(colors, i), 1.5 + z * 9 * (0.4 + l.intensity), alpha);
  }
};

/* ---------------------------------- waves --------------------------------- */

const waves: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  additive(ctx);
  const lines = Math.round(4 + l.intensity * 12);
  const dir = l.reverse ? -1 : 1;
  const ph = phase(env, 8, l.speed) * TAU * dir;
  const amp = (50 + l.intensity * 150) * pump(env, l, 0.6);
  const spacing = 24 * l.scale;
  ctx.translate(CX, CY);
  ctx.rotate((l.angle * Math.PI) / 180);
  const half = STAGE_W * 0.75;
  for (let k = 0; k < lines; k++) {
    const yBase = (k - (lines - 1) / 2) * spacing;
    const local = 0.65 + 0.35 * Math.sin(k * 0.8 + ph);
    ctx.beginPath();
    for (let x = -half; x <= half; x += 18) {
      const y =
        yBase +
        Math.sin((x * 0.0036) / l.scale + ph + k * 0.32) * amp * local +
        Math.sin((x * 0.0105) / l.scale - ph * 2 + k * 0.9) * amp * 0.22;
      if (x === -half) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    glowStroke(ctx, paletteAt(colors, k / lines), 2.2, 0.55 + 0.4 * (1 - Math.abs(k / lines - 0.5) * 2));
  }
};

/* ------------------------------- radial glow ------------------------------ */

const radialGlow: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  additive(ctx);
  const ph = phase(env, 16, l.speed) * TAU;
  const breathe = 1 + 0.06 * Math.sin(ph * 2);
  const kick = 1 + 0.18 * env.audio.kick * l.audioReact;
  const r = (0.28 + l.intensity * 0.32) * STAGE_W * l.scale * breathe * kick;
  const glow = (x: number, y: number, radius: number, color: string, alpha: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, rgba(color, alpha));
    g.addColorStop(0.35, rgba(color, alpha * 0.45));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };
  glow(CX, CY, r, colors[0]!, 0.85);
  if (colors.length > 1) {
    const ox = Math.cos(ph) * STAGE_W * 0.22;
    const oy = Math.sin(ph) * STAGE_H * 0.18;
    glow(CX + ox, CY + oy, r * 0.75, colors[1]!, 0.6);
    glow(CX - ox, CY - oy, r * 0.6, colors[2] ?? colors[1]!, 0.45);
  }
};

/* ------------------------------ retro grid -------------------------------- */

const grid: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  additive(ctx);
  const horizon = STAGE_H * 0.54;
  const dir = l.reverse ? -1 : 1;
  const ph = phase(env, 2, l.speed) * dir;
  const lineColor = colors[0]!;
  const glowColor = colors[1] ?? colors[0]!;
  const spacing = 150 * l.scale;
  const rows = Math.round(10 + l.intensity * 10);
  const mirror = l.intensity > 0.65;
  const kick = 0.75 + 0.25 * env.audio.kick * l.audioReact;

  // Horizon glow.
  const hg = ctx.createLinearGradient(0, horizon - 260, 0, horizon + 260);
  hg.addColorStop(0, rgba(glowColor, 0));
  hg.addColorStop(0.5, rgba(glowColor, 0.55 * kick));
  hg.addColorStop(1, rgba(glowColor, 0));
  ctx.fillStyle = hg;
  ctx.fillRect(-100, horizon - 260, STAGE_W + 200, 520);

  const drawPlane = (sign: 1 | -1, alpha: number) => {
    const depth = sign === 1 ? STAGE_H - horizon + 140 : horizon + 140;
    ctx.save();
    ctx.beginPath();
    if (sign === 1) ctx.rect(-200, horizon, STAGE_W + 400, depth);
    else ctx.rect(-200, horizon - depth, STAGE_W + 400, depth);
    ctx.clip();
    // Converging lines.
    const n = Math.ceil((STAGE_W * 1.8) / spacing);
    ctx.beginPath();
    for (let i = -n; i <= n; i++) {
      ctx.moveTo(CX + i * spacing * 0.05, horizon);
      ctx.lineTo(CX + i * spacing * 2.6, horizon + sign * depth * 1.4);
    }
    glowStroke(ctx, lineColor, 2, alpha * 0.8 * kick);
    // Rows rushing towards the viewer.
    for (let j = 0; j < rows; j++) {
      const z = fract(j / rows + ph);
      const y = horizon + sign * Math.pow(z, 2.4) * depth;
      ctx.beginPath();
      ctx.moveTo(-200, y);
      ctx.lineTo(STAGE_W + 200, y);
      glowStroke(ctx, lineColor, 1.2 + z * 2.6, alpha * Math.min(1, z * 3) * kick);
    }
    ctx.restore();
  };
  drawPlane(1, 1);
  if (mirror) drawPlane(-1, 0.45);
};

/* --------------------------------- lasers --------------------------------- */

const lasers: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  additive(ctx);
  const beams = Math.round(3 + l.intensity * 9);
  const ph = phase(env, 8, l.speed);
  const spread = (20 + l.intensity * 35) * (Math.PI / 180);
  const brightness = 0.5 + 0.5 * (0.4 + 0.6 * env.audio.kick * l.audioReact);
  const origins = [0.18, 0.5, 0.82];
  const length = 2600;
  const baseAngle = -Math.PI / 2 + (l.angle * Math.PI) / 180;
  origins.forEach((ox, oi) => {
    const x0 = ox * STAGE_W;
    const y0 = STAGE_H + 30;
    for (let b = 0; b < beams; b++) {
      const offset = (b / Math.max(1, beams - 1) - 0.5) * spread * 2;
      const dirSign = (oi + b) % 2 === 0 ? 1 : -1;
      const a = baseAngle + offset * 0.6 + Math.sin((ph * dirSign + b * 0.11 + oi * 0.3) * TAU) * spread * 0.55;
      const x1 = x0 + Math.cos(a) * length;
      const y1 = y0 + Math.sin(a) * length;
      const color = pick(colors, b + oi);
      const width = (10 + l.intensity * 26) * l.scale;
      const nx = -Math.sin(a) * width;
      const ny = Math.cos(a) * width;
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, rgba(color, 0.55 * brightness));
      g.addColorStop(0.6, rgba(color, 0.12 * brightness));
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1 + nx, y1 + ny);
      ctx.lineTo(x1 - nx, y1 - ny);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + Math.cos(a) * length * 0.75, y0 + Math.sin(a) * length * 0.75);
      ctx.strokeStyle = rgba(color, 0.9 * brightness);
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
    const sprite = glowSprite(pick(colors, oi), 0.15);
    ctx.globalAlpha *= 0.8;
    ctx.drawImage(sprite, x0 - 160, y0 - 160, 320, 320);
    ctx.globalAlpha /= 0.8;
  });
};

/* ---------------------------- rotating shapes ----------------------------- */

const rotatingShapes: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  additive(ctx);
  const count = Math.round(3 + l.intensity * 7);
  const ph = phase(env, 16, l.speed) * TAU * (l.reverse ? -1 : 1);
  const p = pump(env, l, 0.15);
  const sidesCycle = [3, 4, 6];
  ctx.translate(CX, CY);
  ctx.lineJoin = "round";
  for (let k = 0; k < count; k++) {
    const sides = sidesCycle[k % sidesCycle.length]!;
    const r = (80 + k * 62) * l.scale * p;
    const mult = (k % 3) + 1;
    const rot = ph * mult * (k % 2 === 0 ? 1 : -1) + (l.angle * Math.PI) / 180;
    polygonPath(ctx, 0, 0, r, sides, rot);
    glowStroke(ctx, paletteAt(colors, k / count), 2 + l.intensity * 2.5, 0.85 - (k / count) * 0.45);
  }
};

/* -------------------------------- starfield ------------------------------- */

const starCache = new Map<string, Float32Array>();

const starfield: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  additive(ctx);
  const count = Math.round((140 + l.intensity * 420) * (0.35 + 0.65 * env.quality));
  const key = `${l.id}:${count}`;
  let stars = starCache.get(key);
  if (!stars) {
    const rand = seededRandom(hashString(l.id));
    stars = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      stars[i * 4] = rand() * TAU;
      stars[i * 4 + 1] = rand();
      stars[i * 4 + 2] = 1 + Math.floor(rand() * 3);
      stars[i * 4 + 3] = rand();
    }
    if (starCache.size > 32) starCache.clear();
    starCache.set(key, stars);
  }
  const dir = l.reverse ? -1 : 1;
  const ph = phase(env, 8, l.speed) * dir;
  const warp = 0.02 + l.intensity * 0.1 * pump(env, l, 1.2);
  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const a = stars[i * 4]!;
    const z = fract(stars[i * 4 + 1]! + ph * stars[i * 4 + 2]!);
    const d = Math.pow(z, 2.2) * MAX_R * 1.1 * l.scale;
    const tail = Math.max(0, d - d * warp * (1 + z * 4));
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    ctx.strokeStyle = rgba(pick(colors, i), Math.min(1, z * 1.6));
    ctx.lineWidth = 0.6 + z * 3.2;
    ctx.beginPath();
    ctx.moveTo(CX + cos * tail, CY + sin * tail);
    ctx.lineTo(CX + cos * d, CY + sin * d);
    ctx.stroke();
  }
};

/* ------------------------------- pulse rings ------------------------------ */

const pulseRings: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  additive(ctx);
  const interval = l.speed >= 1.5 ? 0.5 : l.speed < 0.75 ? 2 : 1;
  const rings = 6;
  const span = rings * interval;
  const local = env.beat % interval;
  const index = Math.floor(env.beat / interval);
  for (let k = 0; k < rings; k++) {
    const age = local + k * interval;
    const life = age / span;
    const r = (40 + Math.pow(life, 0.8) * MAX_R * 1.05) * l.scale;
    const alpha = Math.pow(1 - life, 1.6) * (0.6 + 0.4 * l.intensity);
    ctx.beginPath();
    if (l.angle > 0) polygonPath(ctx, CX, CY, r, Math.max(3, Math.round(l.angle / 30)), 0);
    else ctx.arc(CX, CY, r, 0, TAU);
    glowStroke(ctx, pick(colors, index - k), (2 + l.intensity * 10) * (1 - life * 0.6), alpha);
  }
};

/* ------------------------------- kaleidoscope ----------------------------- */

const kaleidoscope: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  additive(ctx);
  const segments = 2 * Math.round(4 + l.intensity * 4);
  const wedge = TAU / segments;
  const ph = phase(env, 8, l.speed) * (l.reverse ? -1 : 1);
  const spin = phase(env, 32, l.speed) * TAU;
  const R = MAX_R * 1.05;
  const p = pump(env, l, 0.2);
  ctx.translate(CX, CY);
  for (let s = 0; s < segments; s++) {
    ctx.save();
    ctx.rotate(s * wedge + spin);
    if (s % 2 === 1) ctx.scale(1, -1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(R, 0);
    ctx.lineTo(Math.cos(wedge) * R, Math.sin(wedge) * R);
    ctx.closePath();
    ctx.clip();
    for (let j = 0; j < 7; j++) {
      const z = fract(j / 7 + ph);
      const d = Math.pow(z, 1.4) * R;
      const a = wedge * (0.25 + 0.5 * hash(j * 3.3));
      const size = (14 + z * 140) * l.scale * p;
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d;
      ctx.fillStyle = rgba(paletteAt(colors, j / 7 + z * 0.3), 0.35 + 0.4 * (1 - z));
      ctx.strokeStyle = rgba(paletteAt(colors, j / 7 + 0.5), 0.9);
      ctx.lineWidth = 2 + z * 4;
      if (j % 3 === 0) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, TAU);
        ctx.fill();
      } else {
        polygonPath(ctx, x, y, size * 0.6, j % 3 === 1 ? 3 : 4, z * TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
};

/* ---------------------------------- aurora -------------------------------- */

const aurora: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  const w = 192;
  const h = 108;
  const { canvas, ctx: g } = env.scratch.get(`aurora:${l.id}`, w, h);
  g.globalCompositeOperation = "source-over";
  g.clearRect(0, 0, w, h);
  g.globalCompositeOperation = "lighter";
  const ph = phase(env, 16, l.speed) * TAU * (l.reverse ? -1 : 1);
  const ribbons = Math.round(3 + l.intensity * 3);
  const p = pump(env, l, 0.35);
  g.lineCap = "round";
  for (let k = 0; k < ribbons; k++) {
    const color = paletteAt(colors, k / ribbons);
    const yBase = h * (0.28 + (k / ribbons) * 0.42);
    for (let pass = 0; pass < 2; pass++) {
      g.beginPath();
      for (let x = -10; x <= w + 10; x += 4) {
        const y =
          yBase +
          Math.sin(x * 0.035 * l.scale + ph + k * 1.3) * h * 0.1 * p +
          Math.sin(x * 0.012 - ph * 2 + k) * h * 0.06;
        if (x === -10) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokeStyle = rgba(color, pass === 0 ? 0.28 : 0.55);
      g.lineWidth = pass === 0 ? h * (0.16 + l.intensity * 0.1) : h * 0.035;
      g.stroke();
    }
  }
  additive(ctx);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, -40, -40, STAGE_W + 80, STAGE_H + 80);
};

/* ----------------------------------- sun ---------------------------------- */

const sun: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  const r = 300 * l.scale * pump(env, l, 0.06);
  const cx = CX;
  const cy = STAGE_H * 0.5 - r * 0.25 + (l.angle / 360) * STAGE_H * 0.3;
  const top = colors[0]!;
  const bottom = colors[1] ?? colors[0]!;
  // Halo.
  const halo = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 2.2);
  halo.addColorStop(0, rgba(bottom, 0.45 * l.intensity + 0.15));
  halo.addColorStop(1, rgba(bottom, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);

  const pr = env.pixelRatio;
  const size = r * 2 * pr;
  const { canvas, ctx: g } = env.scratch.get(`sun:${l.id}`, size, size);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "source-over";
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.scale(canvas.width / (r * 2), canvas.height / (r * 2));
  const grad = g.createLinearGradient(0, 0, 0, r * 2);
  grad.addColorStop(0.1, top);
  grad.addColorStop(0.9, bottom);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(r, r, r, 0, TAU);
  g.fill();
  g.globalCompositeOperation = "destination-out";
  const stripes = 7;
  const ph = fract(phase(env, 4, l.speed) * (l.reverse ? -1 : 1));
  for (let j = 0; j < stripes; j++) {
    const z = fract(j / stripes + ph);
    const y = r * (1 + z * 1.0);
    const hgt = 2 + z * r * 0.11;
    g.fillRect(0, y, r * 2, hgt);
  }
  ctx.drawImage(canvas, cx - r, cy - r, r * 2, r * 2);
};

/* --------------------------------- spiral --------------------------------- */

const spiral: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  additive(ctx);
  const arms = 2 + Math.round(l.intensity * 4);
  const dots = Math.round(48 * (0.5 + 0.5 * env.quality));
  const ph = phase(env, 16, l.speed) * TAU * (l.reverse ? -1 : 1);
  const p = pump(env, l, 0.25);
  const sprites = colors.map((c) => glowSprite(c, 0.2));
  const baseAlpha = ctx.globalAlpha;
  for (let a = 0; a < arms; a++) {
    for (let j = 1; j < dots; j++) {
      const theta = j * 0.21 + (a / arms) * TAU + ph;
      const r = j * 15 * l.scale * p;
      const x = CX + Math.cos(theta) * r;
      const y = CY + Math.sin(theta) * r;
      const s = (6 + j * 0.9) * (0.6 + l.intensity * 0.6);
      ctx.globalAlpha = baseAlpha * (0.25 + (j / dots) * 0.75);
      ctx.drawImage(sprites[(a + j) % sprites.length]!, x - s, y - s, s * 2, s * 2);
    }
  }
};

/* -------------------------------- data rain ------------------------------- */

const GLYPHS = "0123456789ABCDEF<>/\\#+=*:";

const dataRain: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  const cols = Math.round((22 + l.intensity * 38) * (0.5 + 0.5 * env.quality) / l.scale);
  const fs = STAGE_W / cols;
  const ph = phase(env, 8, l.speed);
  const flick = Math.floor(phase(env, 0.25, 1));
  ctx.font = `600 ${fs * 0.9}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const head = colors[1] ?? "#ffffff";
  const trailColor = colors[0]!;
  for (let c = 0; c < cols; c++) {
    const k = 1 + Math.floor(hash(c * 7.7) * 3);
    const trail = 8 + Math.floor(hash(c * 3.1) * 14);
    const travel = STAGE_H + trail * fs;
    const y0 = fract(hash(c * 1.9) + ph * k) * travel;
    const x = c * fs + fs / 2;
    for (let g = 0; g < trail; g++) {
      const y = y0 - g * fs;
      if (y < -fs || y > STAGE_H + fs) continue;
      const glyph = GLYPHS[Math.floor(hash(c * 31.3 + g * 7.1 + (g === 0 ? flick : Math.floor(flick / 3))) * GLYPHS.length)]!;
      ctx.fillStyle = g === 0 ? head : rgba(trailColor, (1 - g / trail) * 0.9);
      ctx.fillText(glyph, x, y);
    }
  }
};

/* --------------------------------- marquee -------------------------------- */

/** Rows of the artist name scrolling in alternating directions. */
const marquee: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  const text = (l.text?.trim() || env.artistName.trim() || "YOUR NAME").toUpperCase();
  const rows = Math.round(3 + l.intensity * 5);
  const rowH = STAGE_H / rows;
  const size = rowH * 0.8 * l.scale;
  const fontId = l.font ?? "anton";
  ctx.font = canvasFont(fontId, nearestWeight(fontId, 900), size);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.lineJoin = "round";
  const unit = `${text}   ·   `;
  const unitW = Math.max(40, ctx.measureText(unit).width);
  const reps = Math.ceil((STAGE_W * 1.6) / unitW) + 2;
  const line = unit.repeat(reps);
  const base = phase(env, 16, l.speed);
  const kick = 1 + env.audio.kick * l.audioReact * 0.5;
  ctx.translate(CX, CY);
  ctx.rotate((l.angle * Math.PI) / 180);
  ctx.translate(-CX, -CY);
  const extra = l.angle !== 0 ? 2 : 0;
  for (let r = -extra; r < rows + extra; r++) {
    const dir = (((r % 2) + 2) % 2 === 0 ? 1 : -1) * (l.reverse ? -1 : 1);
    const speedMul = 1 + (((r % 2) + 2) % 2);
    const offset = fract(base * speedMul * dir) * unitW;
    const x = -unitW * 2 + offset - STAGE_W * 0.3;
    const y = rowH * (r + 0.5);
    const color = pick(colors, r + extra);
    if ((((r % 2) + 2) % 2) === 0) {
      ctx.strokeStyle = rgba(color, Math.min(1, 0.85 * kick));
      ctx.lineWidth = Math.max(1.5, size * 0.028);
      ctx.strokeText(line, x, y);
    } else {
      ctx.fillStyle = rgba(color, Math.min(1, 0.75 * kick));
      ctx.fillText(line, x, y);
    }
  }
};

/* ---------------------------------- rays ---------------------------------- */

/** Stage light rays fanning out from a point, pulsing with the kick. */
const rays: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  additive(ctx);
  const n = Math.round(6 + l.intensity * 14);
  const ph = phase(env, 32, l.speed) * TAU * (l.reverse ? -1 : 1);
  const ox = CX;
  const oy = CY + (l.angle / 180) * CY * 1.25;
  const len = MAX_R * 1.7;
  const kick = env.audio.kick * l.audioReact;
  const pump = 0.7 + 0.5 * kick;
  const grads = colors.map((c) => {
    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, len);
    g.addColorStop(0, rgba(c, Math.min(1, 0.6 * pump)));
    g.addColorStop(0.2, rgba(c, 0.16 * pump));
    g.addColorStop(0.55, rgba(c, 0.04 * pump));
    g.addColorStop(1, rgba(c, 0));
    return g;
  });
  const beatIndex = Math.floor(env.beat);
  const baseAlpha = ctx.globalAlpha;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + ph + Math.sin(ph * 2 + i * 1.7) * 0.12;
    const w = (TAU / n) * (0.05 + 0.16 * hash(i * 3.7)) * l.scale;
    // Some beams strobe off and on with the beat for a live-light feel.
    if (hash(i * 9.1 + beatIndex * 0.37) < 0.18 * l.audioReact) continue;
    ctx.globalAlpha = baseAlpha * (0.55 + 0.45 * hash(i * 5.3 + beatIndex));
    ctx.fillStyle = grads[i % grads.length]!;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(a - w / 2) * len, oy + Math.sin(a - w / 2) * len);
    ctx.lineTo(ox + Math.cos(a + w / 2) * len, oy + Math.sin(a + w / 2) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = baseAlpha;
  const core = 200 * (0.6 + l.intensity) * pump;
  ctx.drawImage(glowSprite(colors[0]!, 0.12), ox - core, oy - core, core * 2, core * 2);
};

/* --------------------------------- shards --------------------------------- */

const shardCache = new Map<string, Float32Array>();

/** Crystal shards flying out of the screen. */
const shards: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  additive(ctx);
  const count = Math.round((14 + l.intensity * 40) * (0.5 + 0.5 * env.quality));
  const key = `${l.id}:${count}`;
  let data = shardCache.get(key);
  if (!data) {
    const rand = seededRandom(hashString(l.id) + 0.5);
    data = new Float32Array(count * 10);
    for (let i = 0; i < count; i++) {
      const o = i * 10;
      data[o] = rand() * TAU; // direction
      data[o + 1] = rand(); // depth offset
      data[o + 2] = 1 + Math.floor(rand() * 2); // speed multiplier
      data[o + 3] = (rand() - 0.5) * 2; // spin
      for (let v = 0; v < 3; v++) {
        // three extra vertices (plus a shared tip) for a jagged crystal
        data[o + 4 + v * 2] = 0.35 + rand() * 0.65;
        data[o + 5 + v * 2] = (v / 3) * TAU + (rand() - 0.5) * 0.9;
      }
    }
    if (shardCache.size > 32) shardCache.clear();
    shardCache.set(key, data);
  }
  const ph = phase(env, 8, l.speed) * (l.reverse ? -1 : 1);
  const kick = 1 + env.audio.kick * l.audioReact * 0.5;
  const light = mixHex(colors[0]!, "#ffffff", 0.7);
  for (let i = 0; i < count; i++) {
    const o = i * 10;
    const a = data[o]!;
    const z = fract(data[o + 1]! + ph * data[o + 2]!);
    const dist = Math.pow(z, 1.5) * MAX_R * 1.1;
    const x = CX + Math.cos(a) * dist;
    const y = CY + Math.sin(a) * dist;
    const size = (16 + z * 150) * l.scale * kick;
    const alpha = Math.min(1, z * 4) * (z > 0.88 ? 1 - (z - 0.88) / 0.12 : 1);
    const spin = data[o + 3]! * ph * TAU * data[o + 2]! + a;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.beginPath();
    ctx.moveTo(size, 0);
    for (let v = 0; v < 3; v++) {
      const r = data[o + 4 + v * 2]! * size * 0.55;
      const t = data[o + 5 + v * 2]! + 1.2;
      ctx.lineTo(Math.cos(t) * r, Math.sin(t) * r);
    }
    ctx.closePath();
    const color = pick(colors, i);
    const grad = ctx.createLinearGradient(-size * 0.5, -size * 0.5, size, size * 0.3);
    grad.addColorStop(0, rgba(light, 0.45 * alpha));
    grad.addColorStop(0.5, rgba(color, 0.12 * alpha));
    grad.addColorStop(1, rgba(color, 0.32 * alpha));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = rgba(light, 0.9 * alpha);
    ctx.lineWidth = 1.2 + z * 2.2;
    ctx.stroke();
    // Inner facet line.
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.2, 0);
    ctx.strokeStyle = rgba(color, 0.5 * alpha);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
};

/* ---------------------------------- smoke --------------------------------- */

/** Slow stage haze rolling across the floor. */
const smoke: EffectRenderer = (env, l, colors) => {
  const { ctx } = env;
  const w = 160;
  const h = 90;
  const { canvas, ctx: g } = env.scratch.get(`smoke:${l.id}`, w, h);
  g.globalCompositeOperation = "source-over";
  g.clearRect(0, 0, w, h);
  const ph = phase(env, 32, l.speed) * (l.reverse ? -1 : 1);
  const blobs = Math.round(6 + l.intensity * 8);
  const kick = 1 + env.audio.kick * l.audioReact * 0.25;
  for (let i = 0; i < blobs; i++) {
    const k = 1 + (i % 2);
    const x = fract(hash(i * 1.3) + ph * k * 0.5 * (i % 2 ? 1 : -1)) * (w + 60) - 30;
    const y = h * (0.45 + hash(i * 2.9) * 0.55) + Math.sin((ph * k + hash(i)) * TAU) * 6;
    const r = (22 + hash(i * 5.1) * 30) * l.scale * kick;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const c = pick(colors, i);
    grad.addColorStop(0, rgba(c, 0.32 * (0.5 + l.intensity)));
    grad.addColorStop(1, rgba(c, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }
  if (ctx.globalCompositeOperation === "source-over") ctx.globalCompositeOperation = "screen";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, -60, -60, STAGE_W + 120, STAGE_H + 120);
};

const RENDERERS: Record<EffectType, EffectRenderer> = {
  tunnel,
  waves,
  radialGlow,
  grid,
  lasers,
  rotatingShapes,
  starfield,
  pulseRings,
  kaleidoscope,
  aurora,
  sun,
  spiral,
  dataRain,
  marquee,
  rays,
  shards,
  smoke,
};
