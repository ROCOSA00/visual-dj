import type { AudioLayer, Layer, Scene } from "@/domain/types";
import { audioEngine } from "../audio";
import type { LayerBounds, RenderEnv, ScratchPool } from "./env";
import { collectModifiers, drawAudio } from "./layers/audio";
import { drawBackground } from "./layers/background";
import { drawEffect } from "./layers/effects";
import { drawImageLayer, drawLogo, drawVideoLayer } from "./layers/media";
import { drawOverlay } from "./layers/overlays";
import { drawParticles } from "./layers/particles";
import { drawShape } from "./layers/shape";
import { drawText } from "./layers/text";
import { STAGE_H, STAGE_W, toComposite } from "./utils";

export interface RenderOptions {
  /** Absolute clock time in seconds; wrapped to the scene loop here. */
  time: number;
  bpm: number;
  artistName: string;
  scratch: ScratchPool;
  quality?: number;
  bounds?: Map<string, LayerBounds> | null;
  reduceFlashing?: boolean;
  editing?: boolean;
  /** Skip clearing, used when compositing transitions. */
  background?: string;
}

export function loopLength(scene: Scene, bpm: number): number {
  return (Math.max(1, scene.loopBars) * 4 * 60) / Math.max(20, bpm);
}

export function drawLayer(env: RenderEnv, layer: Layer): void {
  switch (layer.kind) {
    case "background":
      return drawBackground(env, layer);
    case "text":
      return drawText(env, layer);
    case "logo":
      return drawLogo(env, layer);
    case "image":
      return drawImageLayer(env, layer);
    case "video":
      return drawVideoLayer(env, layer);
    case "shape":
      return drawShape(env, layer);
    case "effect":
      return drawEffect(env, layer);
    case "overlay":
      return drawOverlay(env, layer);
    case "particles":
      return drawParticles(env, layer);
    case "audio":
      return drawAudio(env, layer);
  }
}

/**
 * Renders one frame of a scene into `ctx`. The canvas can be any size; the
 * scene is laid out on a 1920x1080 stage and scaled to fit.
 */
export function renderScene(ctx: CanvasRenderingContext2D, scene: Scene, opts: RenderOptions): void {
  const canvas = ctx.canvas;
  const pixelRatio = canvas.width / STAGE_W;
  const loopLen = loopLength(scene, opts.bpm);
  const t = ((opts.time % loopLen) + loopLen) % loopLen;
  // Audio uses absolute time so beats stay aligned across scene changes.
  const audio = audioEngine.frame(opts.time, opts.bpm);

  const env: RenderEnv = {
    ctx,
    t,
    loopLen,
    bpm: opts.bpm,
    beat: (t * opts.bpm) / 60,
    audio,
    artistName: opts.artistName,
    quality: opts.quality ?? 1,
    pixelRatio,
    bounds: opts.bounds ?? null,
    scratch: opts.scratch,
    reduceFlashing: opts.reduceFlashing ?? false,
    editing: opts.editing ?? false,
  };

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.fillStyle = opts.background ?? "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const audioLayers = scene.layers.filter((l): l is AudioLayer => l.kind === "audio" && l.visible);
  const mod = collectModifiers(env, audioLayers);
  const base = new DOMMatrix([pixelRatio, 0, 0, pixelRatio, 0, 0]);
  const moved = base
    .translate(STAGE_W / 2 + mod.dx, STAGE_H / 2 + mod.dy)
    .rotate((mod.rotation * 180) / Math.PI)
    .scale(mod.scale)
    .translate(-STAGE_W / 2, -STAGE_H / 2);

  for (const layer of scene.layers) {
    if (!layer.visible || layer.opacity <= 0) continue;
    ctx.save();
    ctx.setTransform(layer.kind === "overlay" ? base : moved);
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = toComposite(layer.blendMode);
    try {
      drawLayer(env, layer);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.warn(`[render] ${layer.kind}`, error);
    }
    ctx.restore();
  }
}
