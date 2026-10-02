import { nearestWeight } from "@/domain/fonts";
import type { TextLayer } from "@/domain/types";
import { canvasFont, fontGeneration } from "../../fontLoader";
import { phase, type RenderEnv } from "../env";
import { STAGE_H, STAGE_W, TAU, easeInOut, easeOutCubic, fract, hash, hashString } from "../utils";
import { getTextSprite, spriteScaleBucket, tintedSprite, type TextLayout } from "./textSprite";

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

type Spacing = CanvasRenderingContext2D & { letterSpacing: string };

export function drawText(env: RenderEnv, l: TextLayer): void {
  const { ctx } = env;
  const text = resolveText(l, env.artistName, env.editing);
  if (!text) return;
  const material = l.material ?? "solid";
  const depth = l.depth ?? 0;

  const lines = text.split("\n");
  const weight = nearestWeight(l.font, l.weight);
  const font = canvasFont(l.font, weight, l.size);
  ctx.font = font;
  const hasSpacing = "letterSpacing" in ctx;
  if (hasSpacing) (ctx as Spacing).letterSpacing = `${l.letterSpacing}px`;
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
  let yaw = 0;
  let chroma = l.chromatic;
  let flash = 0;
  let visibleChars = Infinity;
  let cursor = false;
  let waveAmp = 0;
  let wavePhase = 0;
  let glitchBands = false;
  let glitchSeed = 0;

  switch (l.animation) {
    case "punch": {
      const beat = phase(env, 1, sp);
      const e = Math.exp(-fract(beat) * 9);
      s = 1 + 0.13 * e;
      rot = (hash(Math.floor(beat) + seed) - 0.5) * 0.05 * e;
      flash = e;
      break;
    }
    case "swing":
      yaw = Math.sin(phase(env, 8, sp) * TAU) * 0.55;
      dy = Math.sin(phase(env, 8, sp) * TAU * 2) * 8;
      break;
    case "spin3d":
      yaw = phase(env, 16, sp) * TAU;
      break;
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

  ctx.save();
  ctx.translate(ax + dx, ay + dy);
  ctx.rotate(rotation + rot);
  ctx.globalAlpha *= alpha;
  const perChar = waveAmp > 0 || visibleChars !== Infinity;

  if (perChar) {
    ctx.scale(baseScale * s, baseScale * s);
    drawPerChar();
  } else {
    drawSprite();
  }
  ctx.restore();
  if (hasSpacing) (ctx as Spacing).letterSpacing = "0px";

  /* --------------------------- sprite (3D) path --------------------------- */
  function drawSprite() {
    const pr = env.pixelRatio * baseScale * s;
    const layout: TextLayout = { lines, widths, blockW, lineH, ox, oy, font };
    const sprite = getTextSprite(l, text, layout, spriteScaleBucket(env.pixelRatio * baseScale * 1.15), fontGeneration);

    // Fake 3D yaw: squash horizontally and shear for perspective.
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    // Two-sided sign: the name never reads mirrored when it turns its back.
    if (yaw !== 0) ctx.transform(Math.max(0.04, Math.abs(cosY)), sinY * 0.16, 0, 1, 0, 0);
    ctx.scale(baseScale * s, baseScale * s);
    if (l.blur > 0) ctx.filter = `blur(${l.blur * pr}px)`;
    const layerComposite = ctx.globalCompositeOperation;
    const blit = (img: CanvasImageSource, offX = 0, offY = 0) => ctx.drawImage(img, sprite.x + offX, sprite.y + offY, sprite.w, sprite.h);

    // Extruded sides, back to front.
    if (depth > 0) {
      const depthPx = depth * l.size * 0.34;
      const steps = Math.max(4, Math.round((8 + depth * 22) * (0.5 + 0.5 * env.quality)));
      const ex = (-sinY * Math.sign(cosY || 1) * 0.9 + 0.18) * depthPx;
      const ey = depthPx * 0.9;
      // Back outline first so the block reads as a solid with lit edges.
      blit(sprite.rim, ex, ey);
      for (let i = steps; i >= 1; i--) {
        const t = i / steps;
        blit(sprite.side, ex * t, ey * t);
      }
    }

    const chromaPx = chroma * 16 + (glitchBands ? 10 : 0);
    if (chromaPx > 0.5) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha *= 0.8;
      blit(tintedSprite(sprite, "#ff1f5a"), -chromaPx, 0);
      blit(tintedSprite(sprite, "#18e0ff"), chromaPx, 0);
      ctx.restore();
      ctx.globalCompositeOperation = layerComposite;
    }

    const front = () => {
      if (l.glow > 0) {
        ctx.shadowColor = l.glowColor;
        ctx.shadowBlur = l.glow * 70 * pr;
        blit(sprite.front);
        if (l.glow > 0.35) {
          ctx.shadowBlur = l.glow * 20 * pr;
          blit(sprite.front);
        }
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      } else {
        blit(sprite.front);
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
        front();
        ctx.restore();
      }
    } else {
      front();
    }

    // Beat flash: a quick white burn on the letters.
    if (flash > 0.05) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha *= flash * 0.45;
      blit(tintedSprite(sprite, "#ffffff"));
      ctx.restore();
    }
  }

  /* ------------------- per-character path (wave, typewriter) ------------------ */
  function drawPerChar() {
    const pr = env.pixelRatio * baseScale * s;
    if (l.blur > 0) ctx.filter = `blur(${l.blur * pr}px)`;
    const fill: string | CanvasGradient = l.gradient.enabled
      ? (() => {
          const g = ctx.createLinearGradient(ox, 0, ox + blockW, 0);
          g.addColorStop(0, l.gradient.from);
          g.addColorStop(1, l.gradient.to);
          return g;
        })()
      : l.color;
    const outline = l.outline || material === "neon";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, l.size * 0.035);
    if (outline) ctx.strokeStyle = fill;
    else ctx.fillStyle = fill;
    if (l.glow > 0) {
      ctx.shadowColor = l.glowColor;
      ctx.shadowBlur = l.glow * 50 * pr;
    }
    let budget = visibleChars;
    lines.forEach((line, i) => {
      const lw = widths[i]!;
      const lx = ox + (l.align === "left" ? 0 : l.align === "right" ? blockW - lw : (blockW - lw) / 2);
      const ly = oy + lineH * (i + 0.5);
      const chars = Array.from(line);
      const pw = prefixWidths(ctx, measureKey, line);
      const count = Math.max(0, Math.min(chars.length, budget));
      for (let c = 0; c < count; c++) {
        const yOff = waveAmp ? Math.sin(wavePhase - c * 0.55) * waveAmp : 0;
        if (outline) ctx.strokeText(chars[c]!, lx + pw[c]!, ly + yOff);
        else ctx.fillText(chars[c]!, lx + pw[c]!, ly + yOff);
      }
      if (cursor && budget >= 0 && budget <= chars.length) {
        ctx.fillStyle = typeof fill === "string" ? fill : l.gradient.to;
        ctx.fillRect(lx + pw[count]! + l.size * 0.04, ly - l.size * 0.42, l.size * 0.07, l.size * 0.84);
      }
      budget -= chars.length;
    });
  }
}
