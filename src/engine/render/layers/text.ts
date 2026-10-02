import { nearestWeight } from "@/domain/fonts";
import type { TextLayer } from "@/domain/types";
import { canvasFont, fontGeneration } from "../../fontLoader";
import { phase, type RenderEnv } from "../env";
import { STAGE_H, STAGE_W, TAU, easeInOut, easeOutCubic, fract, hash, hashString } from "../utils";

const prefixCache = new Map<string, number[]>();

function prefixWidths(ctx: CanvasRenderingContext2D, key: string, line: string): number[] {
  const cacheKey = `${key}|${line}`;
  const cached = prefixCache.get(cacheKey);
  if (cached) return cached;
  const chars = Array.from(line);
  const widths = [0];
  let acc = "";
  for (const ch of chars) {
    acc += ch;
    widths.push(ctx.measureText(acc).width);
  }
  if (prefixCache.size > 400) prefixCache.clear();
  prefixCache.set(cacheKey, widths);
  return widths;
}

export function resolveText(l: TextLayer, artistName: string, editing: boolean): string {
  const raw = l.role === "artist" ? artistName.trim() || "YOUR NAME" : l.content;
  const text = l.uppercase ? raw.toUpperCase() : raw;
  if (!text.trim()) return editing ? "Your text" : "";
  return text;
}

export function drawText(env: RenderEnv, l: TextLayer): void {
  const { ctx } = env;
  const text = resolveText(l, env.artistName, env.editing);
  if (!text) return;

  const lines = text.split("\n");
  const weight = nearestWeight(l.font, l.weight);
  const font = canvasFont(l.font, weight, l.size);
  ctx.font = font;
  const hasSpacing = "letterSpacing" in ctx;
  if (hasSpacing) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${l.letterSpacing}px`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  const lineH = l.size * 1.08;
  const measureKey = `${font}|${l.letterSpacing}|${fontGeneration}`;
  const widths = lines.map((line) => ctx.measureText(line).width);
  const blockW = Math.max(1, ...widths);
  const blockH = lines.length * lineH;
  const ax = l.transform.x * STAGE_W;
  const ay = l.transform.y * STAGE_H;
  const ox = l.align === "left" ? 0 : l.align === "right" ? -blockW : -blockW / 2;
  const oy = -blockH / 2;
  const rotation = (l.transform.rotation * Math.PI) / 180;

  // Long artist names never spill off the screen: shrink to fit the stage.
  const fit = Math.min(1, (STAGE_W * 0.92) / (blockW * l.transform.scale));
  const baseScale = l.transform.scale * fit;

  env.bounds?.set(l.id, { x: ax, y: ay, ox, oy, w: blockW, h: blockH, scale: baseScale, rotation });

  /* ------------------------------- animation ------------------------------ */
  const sp = l.animationSpeed;
  const seed = hashString(l.id) * 1000;
  let s = 1;
  let dx = 0;
  let dy = 0;
  let alpha = 1;
  let rot = 0;
  let chroma = l.chromatic;
  let visibleChars = Infinity;
  let cursor = false;
  let waveAmp = 0;
  let wavePhase = 0;
  let glitchBands = false;
  let glitchSeed = 0;

  switch (l.animation) {
    case "pulse": {
      const e = Math.exp(-fract(phase(env, 1, sp)) * 5);
      s = 1 + 0.06 * e;
      break;
    }
    case "float": {
      const p = phase(env, 8, sp) * TAU;
      dy = Math.sin(p) * 18;
      rot = Math.sin(p + 1) * 0.012;
      break;
    }
    case "breathe": {
      const v = 0.5 + 0.5 * Math.sin(phase(env, 8, sp) * TAU);
      alpha = 0.5 + 0.5 * v;
      s = 0.985 + 0.03 * v;
      break;
    }
    case "flicker": {
      const r = hash(Math.floor(phase(env, 1 / 16, sp)) + seed);
      alpha = r < 0.06 ? 0.12 : r < 0.11 ? 0.55 : 1;
      break;
    }
    case "glitch": {
      const n = Math.floor(phase(env, 0.25, sp));
      const r = hash(n + seed);
      if (r > 0.7) {
        glitchBands = true;
        glitchSeed = n + seed;
        dx = (hash(n * 3.1 + seed) - 0.5) * 36;
        chroma = Math.max(chroma, 0.55);
      }
      break;
    }
    case "typewriter": {
      const p = fract(phase(env, 8, sp));
      const total = Array.from(text.replace(/\n/g, "")).length;
      if (p < 0.55) visibleChars = Math.floor((p / 0.55) * (total + 1));
      else if (p > 0.92) alpha = 1 - (p - 0.92) / 0.08;
      cursor = Math.floor(p * 32) % 2 === 0;
      break;
    }
    case "zoom": {
      const p = fract(phase(env, 4, sp));
      s = 0.93 + 0.1 * easeInOut(p < 0.5 ? p * 2 : 2 - p * 2);
      break;
    }
    case "wave":
      waveAmp = l.size * 0.11;
      wavePhase = phase(env, 4, sp) * TAU;
      break;
    case "slide": {
      const p = fract(phase(env, 8, sp));
      if (p < 0.18) {
        const k = easeOutCubic(p / 0.18);
        dx = (1 - k) * -STAGE_W * 0.55;
        alpha = k;
      } else if (p > 0.86) {
        const k = (p - 0.86) / 0.14;
        dx = k * k * STAGE_W * 0.55;
        alpha = 1 - k;
      }
      break;
    }
    case "none":
      break;
  }

  const bass = Math.max(0, env.audio.bass - 0.2) / 0.8;
  if (l.audioReact > 0) {
    s *= 1 + l.audioReact * 0.2 * bass;
    chroma += l.audioReact * 0.25 * env.audio.kick;
  }

  /* -------------------------------- drawing ------------------------------- */
  ctx.save();
  ctx.translate(ax + dx, ay + dy);
  ctx.rotate(rotation + rot);
  ctx.scale(baseScale * s, baseScale * s);
  ctx.globalAlpha *= alpha;
  const pr = env.pixelRatio * baseScale * s;
  if (l.blur > 0) ctx.filter = `blur(${l.blur * pr}px)`;

  const layerComposite = ctx.globalCompositeOperation;
  let fill: string | CanvasGradient = l.color;
  if (l.gradient.enabled) {
    const g = ctx.createLinearGradient(ox, 0, ox + blockW, 0);
    g.addColorStop(0, l.gradient.from);
    g.addColorStop(1, l.gradient.to);
    fill = g;
  }
  const outlineWidth = Math.max(2, l.size * 0.035);

  const drawLines = (style: string | CanvasGradient, offX = 0, offY = 0) => {
    if (l.outline) {
      ctx.strokeStyle = style;
      ctx.lineWidth = outlineWidth;
      ctx.lineJoin = "round";
    } else {
      ctx.fillStyle = style;
    }
    let charBudget = visibleChars;
    lines.forEach((line, i) => {
      const lw = widths[i]!;
      const lx = ox + (l.align === "left" ? 0 : l.align === "right" ? blockW - lw : (blockW - lw) / 2) + offX;
      const ly = oy + lineH * (i + 0.5) + offY;
      const chars = Array.from(line);
      const needsPerChar = waveAmp > 0 || charBudget < chars.length;
      if (!needsPerChar) {
        if (l.outline) ctx.strokeText(line, lx, ly);
        else ctx.fillText(line, lx, ly);
        charBudget -= chars.length;
        if (cursor && charBudget <= 0 && i === lines.length - 1) drawCursor(lx + lw, ly);
        return;
      }
      const pw = prefixWidths(ctx, measureKey, line);
      const count = Math.max(0, Math.min(chars.length, charBudget));
      for (let c = 0; c < count; c++) {
        const yOff = waveAmp ? Math.sin(wavePhase - c * 0.55) * waveAmp : 0;
        if (l.outline) ctx.strokeText(chars[c]!, lx + pw[c]!, ly + yOff);
        else ctx.fillText(chars[c]!, lx + pw[c]!, ly + yOff);
      }
      if (cursor && charBudget >= 0 && charBudget <= chars.length) drawCursor(lx + pw[count]! + l.size * 0.04, ly);
      charBudget -= chars.length;
    });
  };

  const drawCursor = (x: number, y: number) => {
    const prev = ctx.fillStyle;
    ctx.fillStyle = typeof fill === "string" ? fill : l.gradient.to;
    ctx.fillRect(x, y - l.size * 0.42, l.size * 0.07, l.size * 0.84);
    ctx.fillStyle = prev;
  };

  // Chromatic aberration: red and cyan ghosts underneath the main pass.
  const chromaPx = chroma * 16 + (glitchBands ? 10 : 0);
  if (chromaPx > 0.5) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha *= 0.85;
    drawLines("#ff1f5a", -chromaPx, 0);
    drawLines("#18e0ff", chromaPx, 0);
    ctx.restore();
    ctx.globalCompositeOperation = layerComposite;
  }

  const mainPass = () => {
    if (l.glow > 0) {
      ctx.shadowColor = l.glowColor;
      ctx.shadowBlur = l.glow * 70 * pr;
      drawLines(fill);
      if (l.glow > 0.35) {
        ctx.shadowBlur = l.glow * 22 * pr;
        drawLines(fill);
      }
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    } else {
      drawLines(fill);
    }
  };

  if (glitchBands) {
    const bands = 4;
    for (let b = 0; b < bands; b++) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(ox - 200, oy + (blockH / bands) * b, blockW + 400, blockH / bands + 1);
      ctx.clip();
      ctx.translate((hash(glitchSeed * 7.3 + b) - 0.5) * 70, 0);
      mainPass();
      ctx.restore();
    }
  } else {
    mainPass();
  }

  ctx.restore();
  if (hasSpacing) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
}
