import type { ShapeLayer, ShapeType } from "@/domain/types";
import type { RenderEnv } from "../env";
import { motion } from "../motion";
import { phase } from "../env";
import { STAGE_H, STAGE_W, TAU, hashString, polygonPath, starPath } from "../utils";

export function shapePath(ctx: CanvasRenderingContext2D, shape: ShapeType, r: number): void {
  switch (shape) {
    case "circle":
    case "ring":
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      break;
    case "square":
      ctx.beginPath();
      ctx.rect(-r * 0.86, -r * 0.86, r * 1.72, r * 1.72);
      break;
    case "triangle":
      polygonPath(ctx, 0, r * 0.12, r, 3);
      break;
    case "hexagon":
      polygonPath(ctx, 0, 0, r, 6, Math.PI / 6);
      break;
    case "diamond":
      polygonPath(ctx, 0, 0, r, 4);
      break;
    case "star":
      starPath(ctx, 0, 0, r, 5, 0.45);
      break;
    case "cross": {
      const t = r * 0.28;
      ctx.beginPath();
      ctx.moveTo(-t, -r);
      ctx.lineTo(t, -r);
      ctx.lineTo(t, -t);
      ctx.lineTo(r, -t);
      ctx.lineTo(r, t);
      ctx.lineTo(t, t);
      ctx.lineTo(t, r);
      ctx.lineTo(-t, r);
      ctx.lineTo(-t, t);
      ctx.lineTo(-r, t);
      ctx.lineTo(-r, -t);
      ctx.lineTo(-t, -t);
      ctx.closePath();
      break;
    }
    case "line":
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      break;
  }
}

export function drawShape(env: RenderEnv, l: ShapeLayer): void {
  const { ctx } = env;
  const ax = l.transform.x * STAGE_W;
  const ay = l.transform.y * STAGE_H;
  const rotation = (l.transform.rotation * Math.PI) / 180;
  const r = l.size / 2;
  const repeat = Math.max(1, Math.round(l.repeat));
  const extent =
    repeat > 1 ? (l.repeatMode === "concentric" ? r * (1 + (repeat - 1) * 0.32) : r * 1.25) : r;
  env.bounds?.set(l.id, {
    x: ax,
    y: ay,
    ox: -extent,
    oy: l.shape === "line" ? -Math.max(20, l.strokeWidth) : -extent,
    w: extent * 2,
    h: l.shape === "line" ? Math.max(40, l.strokeWidth * 2) : extent * 2,
    scale: l.transform.scale,
    rotation,
  });

  const seed = hashString(l.id) * 100;
  const anim = l.animation === "spin" ? "none" : l.animation;
  const m = motion(env, anim, l.animationSpeed, seed, l.audioReact);
  const spin = l.animation === "spin" ? phase(env, 16, l.animationSpeed) * TAU : 0;
  const scale = l.transform.scale * m.s;
  const pr = env.pixelRatio * scale;
  const filled = l.filled && l.shape !== "ring" && l.shape !== "line";

  ctx.save();
  ctx.translate(ax + m.dx, ay + m.dy);
  ctx.rotate(rotation + m.rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha *= m.alpha;
  ctx.fillStyle = l.color;
  ctx.strokeStyle = l.color;
  ctx.lineWidth = l.strokeWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (l.glow > 0) {
    ctx.shadowColor = l.color;
    ctx.shadowBlur = l.glow * 50 * pr;
  }

  const paint = () => {
    if (filled) ctx.fill();
    else ctx.stroke();
  };

  if (repeat === 1) {
    ctx.rotate(spin);
    shapePath(ctx, l.shape, r);
    paint();
  } else if (l.repeatMode === "concentric") {
    for (let i = 0; i < repeat; i++) {
      ctx.save();
      const dir = i % 2 === 0 ? 1 : -1;
      ctx.rotate(spin * dir * (1 + i * 0.15));
      ctx.globalAlpha *= 1 - (i / repeat) * 0.6;
      shapePath(ctx, l.shape, r * (1 + i * 0.32));
      paint();
      ctx.restore();
    }
  } else {
    for (let i = 0; i < repeat; i++) {
      const a = (i / repeat) * TAU + spin;
      ctx.save();
      ctx.translate(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
      ctx.rotate(a);
      shapePath(ctx, l.shape, r * 0.34);
      paint();
      ctx.restore();
    }
  }
  ctx.restore();
}
