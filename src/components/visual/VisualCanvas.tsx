"use client";

import { useEffect, useRef } from "react";
import type { Scene } from "@/domain/types";
import { ambientClock, type PlaybackClock } from "@/engine/clock";
import { ScratchPool, type LayerBounds } from "@/engine/render/env";
import { renderScene } from "@/engine/render/renderScene";
import { renderSettings } from "@/engine/renderSettings";
import { ticker } from "@/engine/ticker";
import { cn } from "@/lib/utils";

export interface VisualCanvasProps {
  scene: Scene;
  artistName: string;
  bpm: number;
  clock?: PlaybackClock;
  /** Frame-rate cap for this canvas. */
  fps?: number;
  /** Multiplier on the global quality setting. */
  quality?: number;
  /** Upper bound for the internal canvas width, in pixels. */
  maxWidth?: number;
  /** Thumbnail mode: obeys the "animate thumbnails" setting. */
  thumbnail?: boolean;
  editing?: boolean;
  bounds?: Map<string, LayerBounds>;
  /** Seconds added to the clock, so neighbouring previews do not sync up. */
  timeOffset?: number;
  className?: string;
  onFrame?: (canvas: HTMLCanvasElement) => void;
  canvasRef?: React.MutableRefObject<HTMLCanvasElement | null>;
  "aria-label"?: string;
}

/**
 * Live preview of a scene. Sizes itself to its CSS box, renders through the
 * shared ticker and stops drawing while scrolled out of view.
 */
export function VisualCanvas({
  scene,
  artistName,
  bpm,
  clock = ambientClock,
  fps = 60,
  quality = 1,
  maxWidth = 3840,
  thumbnail = false,
  editing = false,
  bounds,
  timeOffset = 0,
  className,
  onFrame,
  canvasRef,
  "aria-label": ariaLabel,
}: VisualCanvasProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const props = useRef({ scene, artistName, bpm, clock, quality, editing, bounds, timeOffset, onFrame, maxWidth, thumbnail });
  props.current = { scene, artistName, bpm, clock, quality, editing, bounds, timeOffset, onFrame, maxWidth, thumbnail };
  const dirty = useRef(true);

  // Any prop change should trigger at least one redraw, even when paused.
  useEffect(() => {
    dirty.current = true;
  }, [scene, artistName, bpm, quality, editing]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (canvasRef) canvasRef.current = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const scratch = new ScratchPool();
    let visible = true;
    let lastTime = -1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale = props.current.thumbnail ? 1 : renderSettings.resolutionScale;
      const width = Math.max(16, Math.min(props.current.maxWidth, Math.round(rect.width * dpr * scale)));
      const height = Math.round((width * 9) / 16);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        dirty.current = true;
      }
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) dirty.current = true;
      },
      { rootMargin: "120px" },
    );
    io.observe(canvas);

    const draw = () => {
      if (!visible || canvas.width < 2) return;
      const p = props.current;
      const animate = !p.thumbnail || renderSettings.animateThumbnails;
      const time = animate ? p.clock.time() + p.timeOffset : 2.4 + p.timeOffset;
      if (!dirty.current && time === lastTime) return;
      dirty.current = false;
      lastTime = time;
      renderScene(ctx, p.scene, {
        time,
        bpm: p.bpm,
        artistName: p.artistName,
        scratch,
        quality: Math.max(0.25, renderSettings.quality * p.quality),
        bounds: p.bounds ?? null,
        reduceFlashing: renderSettings.reduceFlashing,
        editing: p.editing,
      });
      p.onFrame?.(canvas);
    };

    const unsubscribe = ticker.add(draw, fps);
    return () => {
      unsubscribe();
      ro.disconnect();
      io.disconnect();
    };
  }, [fps, canvasRef]);

  return <canvas ref={ref} aria-label={ariaLabel} role="img" className={cn("block h-full w-full", className)} />;
}
