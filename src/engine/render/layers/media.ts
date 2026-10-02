import type { ImageLayer, LogoLayer, VideoLayer } from "@/domain/types";
import { getMediaElement, mediaSize } from "../../assets";
import { canvasFont } from "../../fontLoader";
import { MARK_MAP, initialsOf } from "../../marks";
import type { RenderEnv } from "../env";
import { motion } from "../motion";
import { STAGE_H, STAGE_W, TAU, hashString, polygonPath, roundRectPath, supportsCanvasFilter } from "../utils";
import { drawMediaPlaceholder } from "./background";

/* ---------------------------------- logo ---------------------------------- */

export function drawLogo(env: RenderEnv, l: LogoLayer): void {
  const { ctx } = env;
  const ax = l.transform.x * STAGE_W;
  const ay = l.transform.y * STAGE_H;
  const rotation = (l.transform.rotation * Math.PI) / 180;
  const w = l.size;
  let h = l.size;

  const el = l.source === "upload" ? getMediaElement(l.media) : null;
  if (el) {
    const dims = mediaSize(el);
    h = (l.size * dims.h) / dims.w;
  }
  env.bounds?.set(l.id, { x: ax, y: ay, ox: -w / 2, oy: -h / 2, w, h, scale: l.transform.scale, rotation });

  const m = motion(env, l.animation, l.animationSpeed, hashString(l.id) * 100, l.audioReact);
  const scale = l.transform.scale * m.s;
  ctx.save();
  ctx.translate(ax + m.dx, ay + m.dy);
  ctx.rotate(rotation + m.rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha *= m.alpha;
  const pr = env.pixelRatio * scale;

  const paint = (color: string, offset = 0) => {
    ctx.save();
    ctx.translate(offset, 0);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    if (l.source === "upload") {
      if (!el) {
        if (env.editing) drawMediaPlaceholder(env, "Upload logo", { x: -w / 2, y: -h / 2, w, h });
      } else if (l.tint || offset !== 0) {
        const tinted = tint(env, `logo:${l.id}`, el, w * pr, h * pr, color);
        ctx.drawImage(tinted, -w / 2, -h / 2, w, h);
      } else {
        ctx.drawImage(el, -w / 2, -h / 2, w, h);
      }
    } else if (l.source === "mark") {
      (MARK_MAP[l.mark] ?? MARK_MAP.orbit!).draw(ctx, l.size);
    } else {
      drawMonogram(ctx, l, env.artistName);
    }
    ctx.restore();
  };

  if (m.split > 0) {
    const comp = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "lighter";
    paint("#ff1f5a", -m.split);
    paint("#18e0ff", m.split);
    ctx.globalCompositeOperation = comp;
  }
  if (l.glow > 0) {
    ctx.shadowColor = l.glowColor;
    ctx.shadowBlur = l.glow * 60 * pr;
  }
  paint(l.color);
  ctx.restore();
}

function drawMonogram(ctx: CanvasRenderingContext2D, l: LogoLayer, artistName: string) {
  const s = l.size;
  const r = s / 2;
  ctx.lineWidth = Math.max(2, s * 0.035);
  switch (l.monogramStyle) {
    case "circle":
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.94, 0, TAU);
      ctx.stroke();
      break;
    case "hexagon":
      polygonPath(ctx, 0, 0, r * 0.96, 6, Math.PI / 6);
      ctx.stroke();
      break;
    case "square":
      ctx.strokeRect(-r * 0.86, -r * 0.86, r * 1.72, r * 1.72);
      break;
    case "diamond":
      polygonPath(ctx, 0, 0, r * 0.98, 4);
      ctx.stroke();
      break;
    case "plain":
      break;
  }
  const letters = initialsOf(artistName);
  const fontSize = s * (letters.length > 1 ? 0.36 : 0.46);
  ctx.font = canvasFont(l.monogramFont, 700, fontSize);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letters, 0, fontSize * 0.04);
}

function tint(env: RenderEnv, key: string, el: CanvasImageSource, w: number, h: number, color: string): HTMLCanvasElement {
  const { canvas, ctx } = env.scratch.get(`${key}:${color}`, Math.min(1600, w), Math.min(1600, h));
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
  return canvas;
}

/* ---------------------------------- image --------------------------------- */

export function drawImageLayer(env: RenderEnv, l: ImageLayer): void {
  const { ctx } = env;
  const el = getMediaElement(l.media);
  const ax = l.transform.x * STAGE_W;
  const ay = l.transform.y * STAGE_H;
  const rotation = (l.transform.rotation * Math.PI) / 180;
  const w = l.size;
  let h = l.size * 0.6;
  if (el) {
    const dims = mediaSize(el);
    h = (l.size * dims.h) / dims.w;
  } else if (l.media?.width && l.media.height) {
    h = (l.size * l.media.height) / l.media.width;
  }
  env.bounds?.set(l.id, { x: ax, y: ay, ox: -w / 2, oy: -h / 2, w, h, scale: l.transform.scale, rotation });

  const m = motion(env, l.animation, l.animationSpeed, hashString(l.id) * 100, l.audioReact);
  const scale = l.transform.scale * m.s;
  ctx.save();
  ctx.translate(ax + m.dx, ay + m.dy);
  ctx.rotate(rotation + m.rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha *= m.alpha;

  if (!el) {
    if (env.editing) drawMediaPlaceholder(env, l.media ? "Loading…" : "Upload an image", { x: -w / 2, y: -h / 2, w, h });
    ctx.restore();
    return;
  }

  const pr = env.pixelRatio * scale;
  const filters: string[] = [];
  if (l.grayscale) filters.push("grayscale(1)");
  if (l.blur > 0) filters.push(`blur(${l.blur * pr}px)`);
  if (filters.length && supportsCanvasFilter) ctx.filter = filters.join(" ");

  if (l.glow > 0) {
    ctx.shadowColor = l.glowColor;
    ctx.shadowBlur = l.glow * 70 * pr;
  }
  if (m.split > 0) {
    const comp = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha *= 0.5;
    ctx.drawImage(el, -w / 2 - m.split, -h / 2, w, h);
    ctx.drawImage(el, -w / 2 + m.split, -h / 2, w, h);
    ctx.globalAlpha /= 0.5;
    ctx.globalCompositeOperation = comp;
  }
  if (l.radius > 0) {
    // Draw the glow from the rounded silhouette, then the clipped image.
    roundRectPath(ctx, -w / 2, -h / 2, w, h, l.radius);
    if (l.glow > 0) {
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.clip();
  }
  ctx.drawImage(el, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/* ---------------------------------- video --------------------------------- */

export function drawVideoLayer(env: RenderEnv, l: VideoLayer): void {
  const { ctx } = env;
  const el = getMediaElement(l.media);
  if (el instanceof HTMLVideoElement && el.playbackRate !== l.playbackRate) el.playbackRate = l.playbackRate;

  const ax = l.transform.x * STAGE_W;
  const ay = l.transform.y * STAGE_H;
  const rotation = (l.transform.rotation * Math.PI) / 180;
  let w = l.size;
  let h = (l.size * 9) / 16;
  if (el) {
    const dims = mediaSize(el);
    h = (l.size * dims.h) / dims.w;
  }

  if (l.fit !== "free") {
    env.bounds?.delete(l.id);
    if (!el) {
      if (env.editing) drawMediaPlaceholder(env, l.media ? "Loading video…" : "Upload a video loop");
      return;
    }
    const dims = mediaSize(el);
    const ratio = dims.w / dims.h;
    const stageRatio = STAGE_W / STAGE_H;
    const cover = l.fit === "cover";
    w = STAGE_W;
    h = STAGE_H;
    if (cover ? ratio > stageRatio : ratio < stageRatio) w = h * ratio;
    else h = w / ratio;
    ctx.save();
    if (l.blur > 0 && supportsCanvasFilter) ctx.filter = `blur(${l.blur * env.pixelRatio}px)`;
    ctx.drawImage(el, (STAGE_W - w) / 2, (STAGE_H - h) / 2, w, h);
    ctx.restore();
    if (l.dim > 0) {
      ctx.fillStyle = `rgba(0,0,0,${l.dim})`;
      ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    }
    return;
  }

  env.bounds?.set(l.id, { x: ax, y: ay, ox: -w / 2, oy: -h / 2, w, h, scale: l.transform.scale, rotation });
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(rotation);
  ctx.scale(l.transform.scale, l.transform.scale);
  if (!el) {
    if (env.editing) drawMediaPlaceholder(env, l.media ? "Loading video…" : "Upload a video loop", { x: -w / 2, y: -h / 2, w, h });
    ctx.restore();
    return;
  }
  if (l.blur > 0 && supportsCanvasFilter) ctx.filter = `blur(${l.blur * env.pixelRatio * l.transform.scale}px)`;
  ctx.drawImage(el, -w / 2, -h / 2, w, h);
  if (l.dim > 0) {
    ctx.filter = "none";
    ctx.fillStyle = `rgba(0,0,0,${l.dim})`;
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }
  ctx.restore();
}
