"use client";

import { useEffect, useRef } from "react";
import type { Project } from "@/domain/types";
import type { PlaybackClock } from "@/engine/clock";
import { ScratchPool } from "@/engine/render/env";
import { renderScene } from "@/engine/render/renderScene";
import { createCanvas } from "@/engine/render/utils";
import { renderSettings } from "@/engine/renderSettings";
import { ticker } from "@/engine/ticker";
import type { ShowTransition } from "@/store/settings";

export interface ShowRuntime {
  sceneIndex: number;
  previousIndex: number;
  transitionStart: number;
  transition: ShowTransition;
  transitionDuration: number;
  blackout: boolean;
  blackoutLevel: number;
  strobe: boolean;
}

/**
 * Renders the live show into a full-viewport canvas: current scene,
 * transitions between scenes, blackout fades and the hold-to-strobe effect.
 * Everything per-frame lives in refs; React only re-renders the controls.
 */
export function useShowRenderer({
  canvasRef,
  project,
  clock,
  runtime,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  project: Project;
  clock: PlaybackClock;
  runtime: React.MutableRefObject<ShowRuntime>;
}) {
  const projectRef = useRef(project);
  projectRef.current = project;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const scratchA = new ScratchPool();
    const scratchB = new ScratchPool();
    let offscreen: HTMLCanvasElement | null = null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * renderSettings.resolutionScale;
      const width = Math.max(320, Math.min(3840, Math.round(rect.width * dpr)));
      const height = Math.round((width * 9) / 16);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const p = projectRef.current;
      const rt = runtime.current;
      const scenes = p.scenes;
      const current = scenes[Math.min(rt.sceneIndex, scenes.length - 1)];
      if (!current) return;
      const time = clock.time();
      const opts = {
        time,
        bpm: p.bpm,
        artistName: p.artistName,
        quality: renderSettings.quality,
        reduceFlashing: renderSettings.reduceFlashing,
      };

      const elapsed = (now - rt.transitionStart) / 1000;
      const inTransition = rt.transition !== "cut" && rt.previousIndex !== rt.sceneIndex && elapsed < rt.transitionDuration;
      const previous = scenes[rt.previousIndex];

      if (inTransition && previous) {
        const t = elapsed / rt.transitionDuration;
        if (rt.transition === "fade") {
          if (!offscreen || offscreen.width !== canvas.width || offscreen.height !== canvas.height) {
            offscreen = createCanvas(canvas.width, canvas.height);
          }
          const octx = offscreen.getContext("2d", { alpha: false })!;
          renderScene(octx, previous, { ...opts, scratch: scratchB });
          renderScene(ctx, current, { ...opts, scratch: scratchA });
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = 1 - t * t * (3 - 2 * t);
          ctx.drawImage(offscreen, 0, 0);
          ctx.globalAlpha = 1;
        } else {
          renderScene(ctx, t < 0.5 ? previous : current, { ...opts, scratch: t < 0.5 ? scratchB : scratchA });
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          const flash = 1 - Math.abs(t * 2 - 1);
          ctx.fillStyle = `rgba(255,255,255,${(renderSettings.reduceFlashing ? 0.35 : 0.95) * flash})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else {
        renderScene(ctx, current, { ...opts, scratch: scratchA });
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const target = rt.blackout ? 1 : 0;
      rt.blackoutLevel += (target - rt.blackoutLevel) * Math.min(1, dt * 9);
      if (Math.abs(target - rt.blackoutLevel) < 0.002) rt.blackoutLevel = target;
      if (rt.blackoutLevel > 0) {
        ctx.fillStyle = `rgba(0,0,0,${rt.blackoutLevel})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      if (rt.strobe && Math.floor(now / (renderSettings.reduceFlashing ? 250 : 45)) % 2 === 0) {
        ctx.fillStyle = renderSettings.reduceFlashing ? "rgba(255,255,255,0.3)" : "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    const unsubscribe = ticker.add(draw, 60);
    return () => {
      unsubscribe();
      ro.disconnect();
    };
  }, [canvasRef, clock, runtime]);
}
