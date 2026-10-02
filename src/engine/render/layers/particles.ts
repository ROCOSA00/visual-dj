import type { ParticlesLayer } from "@/domain/types";
import { phase, type RenderEnv } from "../env";
import { STAGE_H, STAGE_W, TAU, fract, glowSprite, hashString, pick, seededRandom } from "../utils";

interface Particle {
  x: number;
  y: number;
  /** Whole-number speed multiplier keeps every particle loop-seamless. */
  k: number;
  size: number;
  color: number;
  o1: number;
  o2: number;
}

const systems = new Map<string, Particle[]>();

function getSystem(id: string, count: number, colors: number): Particle[] {
  const key = `${id}:${count}:${colors}`;
  const cached = systems.get(key);
  if (cached) return cached;
  const rand = seededRandom(hashString(id));
  const list: Particle[] = [];
  for (let i = 0; i < count; i++) {
    list.push({
      x: rand(),
      y: rand(),
      k: 1 + Math.floor(rand() * 3),
      size: 0.35 + rand() * rand() * 1.65,
      color: Math.floor(rand() * colors),
      o1: rand(),
      o2: rand(),
    });
  }
  if (systems.size > 64) systems.clear();
  systems.set(key, list);
  return list;
}

export function drawParticles(env: RenderEnv, l: ParticlesLayer): void {
  const { ctx } = env;
  const count = Math.max(1, Math.round(l.count * (0.35 + 0.65 * env.quality)));
  const colors = l.colors.length ? l.colors : ["#ffffff"];
  const ps = getSystem(l.id, count, colors.length);
  const base = phase(env, 16, l.speed);
  const twinkleBase = phase(env, 2, 1);
  const bass = Math.max(0, env.audio.bass - 0.2) / 0.8;
  const react = 1 + l.audioReact * bass * 0.9;
  const sprites = colors.map((c) => glowSprite(c, 0.18));
  const cx = STAGE_W / 2;
  const cy = STAGE_H / 2;
  const maxR = Math.hypot(cx, cy);

  ctx.save();
  if (l.glow > 0) ctx.globalCompositeOperation = ctx.globalCompositeOperation === "source-over" ? "lighter" : ctx.globalCompositeOperation;
  const baseAlpha = ctx.globalAlpha;

  for (let i = 0; i < ps.length; i++) {
    const p = ps[i]!;
    const ph = base * p.k;
    let x: number;
    let y: number;
    let sizeMul = 1;
    let alpha = 1;
    let angle = 0;

    switch (l.direction) {
      case "up":
      case "down": {
        const dir = l.direction === "up" ? -1 : 1;
        y = (fract(p.y + dir * ph) * 1.1 - 0.05) * STAGE_H;
        x = p.x * STAGE_W + Math.sin((ph + p.o1) * TAU) * 24;
        angle = Math.PI / 2;
        break;
      }
      case "left":
      case "right": {
        const dir = l.direction === "left" ? -1 : 1;
        x = (fract(p.x + dir * ph) * 1.1 - 0.05) * STAGE_W;
        y = p.y * STAGE_H + Math.sin((ph + p.o1) * TAU) * 18;
        angle = 0;
        break;
      }
      case "outward": {
        const r = fract(p.y + ph);
        angle = p.x * TAU;
        const dist = Math.pow(r, 1.7) * maxR;
        x = cx + Math.cos(angle) * dist;
        y = cy + Math.sin(angle) * dist;
        sizeMul = 0.25 + r * 1.8;
        alpha = Math.min(1, r * 5);
        break;
      }
      case "float":
      default: {
        x = p.x * STAGE_W + Math.sin((p.k * base + p.o1) * TAU) * 70;
        y = p.y * STAGE_H + Math.cos((p.k * base + p.o2) * TAU) * 45;
        break;
      }
    }

    if (l.twinkle > 0) {
      const tw = 0.5 + 0.5 * Math.sin((twinkleBase * p.k + p.o2) * TAU);
      alpha *= 1 - l.twinkle * tw * 0.85;
    }
    const size = l.size * p.size * sizeMul * react;
    if (size < 0.3 || alpha <= 0.01) continue;
    ctx.globalAlpha = baseAlpha * alpha;
    const color = pick(colors, p.color);

    switch (l.shape) {
      case "dot": {
        if (l.glow > 0) {
          const g = size * (3 + l.glow * 5);
          ctx.drawImage(sprites[p.color % sprites.length]!, x - g / 2, y - g / 2, g, g);
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, TAU);
        ctx.fill();
        break;
      }
      case "spark":
      case "line": {
        const len = size * (l.shape === "spark" ? 6 : 10) * (l.direction === "outward" ? sizeMul : 1);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, size * 0.35);
        ctx.lineCap = "round";
        ctx.beginPath();
        const dx = Math.cos(angle) * len;
        const dy = Math.sin(angle) * len;
        ctx.moveTo(x - dx / 2, y - dy / 2);
        ctx.lineTo(x + dx / 2, y + dy / 2);
        ctx.stroke();
        if (l.glow > 0 && l.shape === "spark") {
          const g = size * (2 + l.glow * 4);
          ctx.drawImage(sprites[p.color % sprites.length]!, x - g / 2, y - g / 2, g, g);
        }
        break;
      }
      case "square": {
        ctx.fillStyle = color;
        const s = size;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((ph + p.o1) * TAU);
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
        break;
      }
      case "ring": {
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, size * 0.18);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, TAU);
        ctx.stroke();
        break;
      }
      case "cross": {
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, size * 0.22);
        const s = size;
        ctx.beginPath();
        ctx.moveTo(x - s, y);
        ctx.lineTo(x + s, y);
        ctx.moveTo(x, y - s);
        ctx.lineTo(x, y + s);
        ctx.stroke();
        break;
      }
    }
  }
  ctx.restore();
}
