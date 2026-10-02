import type { AudioLayer } from "@/domain/types";
import { bandValue, type RenderEnv } from "../env";
import { STAGE_H, STAGE_W, TAU, glowSprite, hash, paletteAt, pick, rgba } from "../utils";

const CX = STAGE_W / 2;
const CY = STAGE_H / 2;

export interface StageModifiers {
  scale: number;
  dx: number;
  dy: number;
  rotation: number;
}

/** Bass pulse and camera shake move the whole stage instead of drawing. */
export function collectModifiers(env: RenderEnv, layers: AudioLayer[]): StageModifiers {
  const mod: StageModifiers = { scale: 1, dx: 0, dy: 0, rotation: 0 };
  for (const l of layers) {
    const v = Math.max(0, bandValue(env, l.band) - 0.2) / 0.8;
    if (l.effect === "bassPulse") {
      mod.scale *= 1 + v * (0.02 + l.sensitivity * 0.07) * (0.4 + l.intensity);
    } else if (l.effect === "cameraShake") {
      const amount = Math.pow(env.audio.kick, 1.5) * (6 + l.sensitivity * 30) * (0.3 + l.intensity);
      const n = env.audio.kickIndex * 13.37 + Math.floor(env.t * 40);
      mod.dx += (hash(n) - 0.5) * 2 * amount;
      mod.dy += (hash(n + 1.7) - 0.5) * 2 * amount;
      mod.rotation += (hash(n + 3.1) - 0.5) * 0.012 * amount * 0.1;
    }
  }
  return mod;
}

export function drawAudio(env: RenderEnv, l: AudioLayer): void {
  const { ctx } = env;
  const colors = l.colors.length ? l.colors : ["#ffffff"];
  ctx.save();
  switch (l.effect) {
    case "beatFlash": {
      const k = Math.pow(env.audio.kick, 2.2) * (0.25 + l.sensitivity * 0.75);
      const cap = env.reduceFlashing ? 0.18 : 0.75;
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = rgba(colors[0]!, Math.min(cap, k * l.intensity));
      ctx.fillRect(-200, -200, STAGE_W + 400, STAGE_H + 400);
      break;
    }
    case "strobe": {
      // Hard white flashes on the beat. Throttled in "reduce flashing" mode.
      const on = env.audio.sinceKick < 0.045 + l.intensity * 0.03;
      const every = env.reduceFlashing ? 4 : l.sensitivity > 0.7 ? 1 : 2;
      if (on && env.audio.kickIndex % every === 0) {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = rgba(colors[0]!, env.reduceFlashing ? 0.22 : 0.4 + 0.6 * l.intensity);
        ctx.fillRect(-200, -200, STAGE_W + 400, STAGE_H + 400);
      }
      break;
    }
    case "waveform":
      drawWaveform(env, l, colors);
      break;
    case "frequencyBars":
      drawBars(env, l, colors);
      break;
    case "particleBurst":
      drawBurst(env, l, colors);
      break;
    case "bassPulse":
    case "cameraShake":
      break;
  }
  ctx.restore();
}

function baselineY(placement: AudioLayer["placement"]): number {
  return placement === "top" ? STAGE_H * 0.18 : placement === "bottom" ? STAGE_H * 0.82 : CY;
}

function drawWaveform(env: RenderEnv, l: AudioLayer, colors: string[]) {
  const { ctx } = env;
  const wave = env.audio.waveform;
  const gain = (90 + l.sensitivity * 260) * (0.5 + l.intensity * 0.8);
  if (ctx.globalCompositeOperation === "source-over") ctx.globalCompositeOperation = "lighter";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  if (l.placement === "circle") {
    const r = 260;
    for (let i = 0; i <= wave.length; i++) {
      const v = wave[i % wave.length]!;
      const a = (i / wave.length) * TAU - Math.PI / 2;
      const rr = r + v * gain * 0.6;
      const x = CX + Math.cos(a) * rr;
      const y = CY + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else {
    const y0 = baselineY(l.placement);
    for (let i = 0; i < wave.length; i++) {
      const x = (i / (wave.length - 1)) * (STAGE_W + 40) - 20;
      const y = y0 + wave[i]! * gain;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  const color = colors[0]!;
  const g = ctx.createLinearGradient(0, 0, STAGE_W, 0);
  g.addColorStop(0, color);
  g.addColorStop(1, colors[1] ?? color);
  ctx.strokeStyle = rgba(color, 0.25);
  ctx.lineWidth = 16;
  ctx.stroke();
  ctx.strokeStyle = g;
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawBars(env: RenderEnv, l: AudioLayer, colors: string[]) {
  const { ctx } = env;
  const spec = env.audio.spectrum;
  const bins = spec.length;
  const gain = (0.5 + l.sensitivity * 0.9) * (0.5 + l.intensity * 0.6);
  if (l.placement === "circle") {
    const r = 230;
    ctx.lineCap = "round";
    for (let i = 0; i < bins * 2; i++) {
      const idx = i < bins ? i : bins * 2 - 1 - i;
      const v = spec[idx]! * gain;
      const a = (i / (bins * 2)) * TAU - Math.PI / 2;
      const len = 12 + v * 260;
      ctx.strokeStyle = paletteAt(colors, idx / bins);
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(a) * r, CY + Math.sin(a) * r);
      ctx.lineTo(CX + Math.cos(a) * (r + len), CY + Math.sin(a) * (r + len));
      ctx.stroke();
    }
    return;
  }
  const margin = 120;
  const width = STAGE_W - margin * 2;
  const step = width / bins;
  const barW = step * 0.62;
  const maxH = STAGE_H * (l.placement === "center" ? 0.32 : 0.42);
  for (let i = 0; i < bins; i++) {
    const v = spec[i]! * gain;
    const h = Math.max(6, v * maxH);
    const x = margin + i * step + (step - barW) / 2;
    ctx.fillStyle = paletteAt(colors, i / bins);
    if (l.placement === "center") {
      roundBar(ctx, x, CY - h, barW, h * 2);
    } else if (l.placement === "top") {
      roundBar(ctx, x, 40, barW, h);
    } else {
      roundBar(ctx, x, STAGE_H - 40 - h, barW, h);
    }
  }
}

function roundBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = Math.min(w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function drawBurst(env: RenderEnv, l: AudioLayer, colors: string[]) {
  const { ctx } = env;
  if (ctx.globalCompositeOperation === "source-over") ctx.globalCompositeOperation = "lighter";
  const count = Math.round((30 + l.intensity * 70) * (0.4 + 0.6 * env.quality));
  const life = 0.9;
  const t = env.audio.sinceKick;
  if (t > life) return;
  const progress = t / life;
  const speed = 600 + l.sensitivity * 900;
  const baseAlpha = ctx.globalAlpha;
  const sprites = colors.map((c) => glowSprite(c, 0.2));
  const origin = l.placement === "bottom" ? { x: CX, y: STAGE_H * 0.85 } : { x: CX, y: CY };
  for (let i = 0; i < count; i++) {
    const seed = env.audio.kickIndex * 97.13 + i * 3.7;
    const a = hash(seed) * TAU;
    const v = speed * (0.3 + hash(seed + 1) * 0.9);
    const d = v * (1 - Math.pow(1 - progress, 2.2)) * 0.9;
    const x = origin.x + Math.cos(a) * d;
    const y = origin.y + Math.sin(a) * d + progress * progress * 120;
    const s = (10 + hash(seed + 2) * 26) * (1 - progress * 0.6);
    ctx.globalAlpha = baseAlpha * (1 - progress);
    ctx.drawImage(pick(sprites, i), x - s, y - s, s * 2, s * 2);
  }
}
