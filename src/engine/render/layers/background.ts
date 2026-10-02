import type { BackgroundLayer, PatternType } from "@/domain/types";
import { getMediaElement, mediaSize } from "../../assets";
import { phase, type RenderEnv } from "../env";
import { STAGE_H, STAGE_W, TAU, createCanvas, fract, mixHex, rgba } from "../utils";

/** Overscan so bass pulse / camera shake never reveal the stage edge. */
const M = 140;

export function drawBackground(env: RenderEnv, l: BackgroundLayer): void {
  const { ctx } = env;
  const colors = l.gradient.colors.length ? l.gradient.colors : [l.color];

  switch (l.mode) {
    case "solid":
      ctx.fillStyle = l.color;
      ctx.fillRect(-M, -M, STAGE_W + M * 2, STAGE_H + M * 2);
      break;
    case "gradient":
      drawGradient(env, l, colors);
      break;
    case "image":
    case "video":
      drawMedia(env, l);
      break;
  }

  if (l.pattern !== "none" && l.patternOpacity > 0) drawPattern(env, l);
}

function drawGradient(env: RenderEnv, l: BackgroundLayer, colors: string[]): void {
  const { ctx } = env;
  const cx = STAGE_W / 2;
  const cy = STAGE_H / 2;
  const p = l.gradient.animate ? phase(env, 32, l.animationSpeed) : 0;
  const stops = (g: CanvasGradient, list: string[]) =>
    list.forEach((c, i) => g.addColorStop(list.length === 1 ? 0 : i / (list.length - 1), c));

  switch (l.gradient.type) {
    case "linear": {
      const angle = ((l.gradient.angle + (l.gradient.animate ? Math.sin(p * TAU) * 35 : 0)) * Math.PI) / 180;
      const len = (Math.abs(Math.cos(angle)) * STAGE_W + Math.abs(Math.sin(angle)) * STAGE_H) / 2 + M;
      const g = ctx.createLinearGradient(
        cx - Math.cos(angle) * len,
        cy - Math.sin(angle) * len,
        cx + Math.cos(angle) * len,
        cy + Math.sin(angle) * len,
      );
      stops(g, colors);
      ctx.fillStyle = g;
      break;
    }
    case "radial": {
      const ox = l.gradient.animate ? Math.cos(p * TAU) * 120 : 0;
      const oy = l.gradient.animate ? Math.sin(p * TAU) * 70 : 0;
      const g = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx, cy, STAGE_W * 0.72);
      stops(g, colors);
      ctx.fillStyle = g;
      break;
    }
    case "conic": {
      if (typeof ctx.createConicGradient !== "function") {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, STAGE_W * 0.7);
        stops(g, colors);
        ctx.fillStyle = g;
        break;
      }
      const start = ((l.gradient.angle * Math.PI) / 180) + (l.gradient.animate ? p * TAU : 0);
      const g = ctx.createConicGradient(start, cx, cy);
      stops(g, [...colors, colors[0]!]);
      ctx.fillStyle = g;
      break;
    }
    case "mesh":
      drawMesh(env, l, colors, p);
      return;
  }
  ctx.fillRect(-M, -M, STAGE_W + M * 2, STAGE_H + M * 2);
}

/**
 * Soft moving colour blobs. Rendered at very low resolution and upscaled,
 * which gives a free, silky blur at almost no cost.
 */
function drawMesh(env: RenderEnv, l: BackgroundLayer, colors: string[], p: number): void {
  const { ctx } = env;
  const w = 80;
  const h = 45;
  const { canvas, ctx: g } = env.scratch.get(`mesh:${l.id}`, w, h);
  const base = mixHex(colors[0]!, "#000000", 0.55);
  g.globalCompositeOperation = "source-over";
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  const blobs = Math.max(3, colors.length + 2);
  for (let i = 0; i < blobs; i++) {
    const color = colors[i % colors.length]!;
    const a = p * TAU * (i % 2 === 0 ? 1 : -1) + i * 1.7;
    const x = w * (0.5 + 0.38 * Math.cos(a + i) * Math.sin(a * 0.5 + i * 0.7 + 1));
    const y = h * (0.5 + 0.36 * Math.sin(a * (i % 3 === 0 ? 1 : 2) + i * 2.1));
    const r = w * (0.42 + 0.12 * Math.sin(a + i * 3));
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, rgba(color, 0.95));
    grad.addColorStop(0.55, rgba(color, 0.35));
    grad.addColorStop(1, rgba(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, -M, -M, STAGE_W + M * 2, STAGE_H + M * 2);
  ctx.restore();
}

function drawMedia(env: RenderEnv, l: BackgroundLayer): void {
  const { ctx } = env;
  ctx.fillStyle = l.color;
  ctx.fillRect(-M, -M, STAGE_W + M * 2, STAGE_H + M * 2);
  const el = getMediaElement(l.media);
  if (!el) {
    if (env.editing && !l.media) drawMediaPlaceholder(env, l.mode === "video" ? "Upload a video loop" : "Upload a background image");
    return;
  }
  const { w, h } = mediaSize(el);
  const stageRatio = STAGE_W / STAGE_H;
  const ratio = w / h;
  const cover = l.mediaFit === "cover";
  let dw = STAGE_W + M * 2;
  let dh = STAGE_H + M * 2;
  if (cover ? ratio > stageRatio : ratio < stageRatio) dw = dh * ratio;
  else dh = dw / ratio;
  ctx.drawImage(el, (STAGE_W - dw) / 2, (STAGE_H - dh) / 2, dw, dh);
  if (l.dim > 0) {
    ctx.fillStyle = `rgba(0,0,0,${l.dim})`;
    ctx.fillRect(-M, -M, STAGE_W + M * 2, STAGE_H + M * 2);
  }
}

export function drawMediaPlaceholder(env: RenderEnv, label: string, box?: { x: number; y: number; w: number; h: number }): void {
  const { ctx } = env;
  const b = box ?? { x: STAGE_W * 0.3, y: STAGE_H * 0.36, w: STAGE_W * 0.4, h: STAGE_H * 0.28 };
  ctx.save();
  ctx.setLineDash([18, 14]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.beginPath();
  ctx.rect(b.x, b.y, b.w, b.h);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `500 ${Math.min(42, b.h * 0.16)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2);
  ctx.restore();
}

/* --------------------------------- patterns -------------------------------- */

const patternTiles = new Map<string, HTMLCanvasElement>();

function patternTile(type: PatternType, color: string, scale: number): HTMLCanvasElement {
  const key = `${type}|${color}|${scale.toFixed(2)}`;
  const cached = patternTiles.get(key);
  if (cached) return cached;
  const s = Math.round(72 * scale);
  let w = s;
  let h = s;
  if (type === "hex") {
    const r = s / 2;
    w = Math.round(r * 3);
    h = Math.round(r * Math.sqrt(3));
  }
  const c = createCanvas(w, h);
  const g = c.getContext("2d")!;
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = Math.max(1, 1.5 * scale);
  switch (type) {
    case "grid":
      g.strokeRect(0, 0, w, h);
      break;
    case "dots":
      g.beginPath();
      g.arc(w / 2, h / 2, Math.max(1.5, 2.6 * scale), 0, TAU);
      g.fill();
      break;
    case "lines":
      g.fillRect(0, h / 2, w, Math.max(1, 1.5 * scale));
      break;
    case "diagonal":
      g.beginPath();
      g.moveTo(0, h);
      g.lineTo(w, 0);
      g.moveTo(-w / 2, h / 2);
      g.lineTo(w / 2, -h / 2);
      g.moveTo(w / 2, h * 1.5);
      g.lineTo(w * 1.5, h / 2);
      g.stroke();
      break;
    case "hex": {
      const r = s / 2;
      const hexAt = (cx: number, cy: number) => {
        g.beginPath();
        for (let i = 0; i <= 6; i++) {
          const a = (i / 6) * TAU;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.stroke();
      };
      hexAt(0, 0);
      hexAt(w, 0);
      hexAt(0, h);
      hexAt(w, h);
      hexAt(r * 1.5, h / 2);
      break;
    }
    case "none":
      break;
  }
  patternTiles.set(key, c);
  return c;
}

function drawPattern(env: RenderEnv, l: BackgroundLayer): void {
  const { ctx } = env;
  const tile = patternTile(l.pattern, l.patternColor, l.patternScale);
  const pattern = ctx.createPattern(tile, "repeat");
  if (!pattern) return;
  const p = fract(phase(env, 8, l.animationSpeed));
  const dx = l.pattern === "lines" ? 0 : p * tile.width;
  const dy = p * tile.height;
  ctx.save();
  ctx.globalAlpha *= l.patternOpacity;
  ctx.translate(dx, dy);
  ctx.fillStyle = pattern;
  ctx.fillRect(-M - tile.width, -M - tile.height, STAGE_W + M * 2 + tile.width, STAGE_H + M * 2 + tile.height);
  ctx.restore();
}
