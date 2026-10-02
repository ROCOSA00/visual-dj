"use client";

import { AnimatePresence, motion } from "framer-motion";
import { UploadCloud } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import { createImage, createVideo } from "@/domain/factories";
import type { LayerBounds } from "@/engine/render/env";
import { editorClock, useEditorStore } from "@/store/editor";
import { editorActions } from "@/store/editorActions";
import { useActiveProject, useActiveScene } from "../hooks";
import { uploadMedia } from "../sidebar/useMedia";
import { SelectionOverlay } from "./SelectionOverlay";
import { cn } from "@/lib/utils";

/** Fullscreen toggling is shared with the playback bar and the F shortcut. */
export const stageFullscreen = {
  el: null as HTMLElement | null,
  toggle() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void this.el?.requestFullscreen?.();
  },
};

export function CanvasStage() {
  const project = useActiveProject();
  const scene = useActiveScene();
  const zoom = useEditorStore((s) => s.zoom);
  const playing = useEditorStore((s) => s.playing);
  const container = useRef<HTMLDivElement>(null);
  const ambient = useRef<HTMLCanvasElement>(null);
  const frameCount = useRef(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const [dropping, setDropping] = useState(false);
  const boundsRef = useRef(new Map<string, LayerBounds>());

  useEffect(() => {
    boundsRef.current.clear();
  }, [scene?.id]);

  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    stageFullscreen.el = el;
    const measure = () => {
      const isFs = document.fullscreenElement === el;
      setFullscreen(isFs);
      const pad = isFs ? 0 : 56;
      const availW = el.clientWidth - pad * 2;
      const availH = el.clientHeight - pad * 2 - (isFs ? 0 : 24);
      if (zoom === "fit" || isFs) {
        const w = Math.max(160, Math.min(availW, (availH * 16) / 9));
        setSize({ w: Math.floor(w), h: Math.floor((w * 9) / 16) });
      } else {
        setSize({ w: 1920 * zoom, h: 1080 * zoom });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.addEventListener("fullscreenchange", measure);
    return () => {
      ro.disconnect();
      document.removeEventListener("fullscreenchange", measure);
    };
  }, [zoom]);

  const onFrame = useCallback((canvas: HTMLCanvasElement) => {
    frameCount.current++;
    if (frameCount.current % 4 !== 0) return;
    const a = ambient.current;
    const ctx = a?.getContext("2d");
    if (a && ctx) ctx.drawImage(canvas, 0, 0, a.width, a.height);
  }, []);

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDropping(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    for (const file of files) {
      const type = file.type.startsWith("video/") ? "video" : "image";
      const ref = await uploadMedia(file, type);
      if (!ref) continue;
      const name = file.name.replace(/\.[^.]+$/, "");
      editorActions.addLayer(type === "video" ? createVideo({ name, media: ref }) : createImage({ name, media: ref }));
    }
  };

  if (!project || !scene) return <div className="flex-1" />;

  return (
    <div
      ref={container}
      className={cn("relative min-h-0 flex-1 overflow-auto", fullscreen ? "bg-black" : "noise-bg")}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDropping(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDropping(false);
      }}
      onDrop={onDrop}
    >
      <div className={cn("flex min-h-full min-w-full items-center justify-center", fullscreen ? "p-0" : "p-14 pt-12")}>
        <div className="relative shrink-0" style={{ width: size.w, height: size.h }} data-tour="canvas">
          {!fullscreen && (
            <>
              <canvas
                ref={ambient}
                width={48}
                height={27}
                aria-hidden
                className="pointer-events-none absolute -inset-[8%] h-[116%] w-[116%] opacity-50 blur-[60px] saturate-150"
              />
              <div className="absolute -top-7 left-0 right-0 flex items-center justify-between text-2xs text-subtle">
                <span className="flex items-center gap-1.5 font-medium uppercase tracking-[0.16em]">
                  <span className={cn("h-1.5 w-1.5 rounded-full", playing ? "animate-pulse-dot bg-live" : "bg-subtle")} />
                  {playing ? "Live preview" : "Paused"} · {scene.name}
                </span>
                <span className="font-mono">1920 × 1080 · 16:9</span>
              </div>
            </>
          )}
          <div
            className={cn(
              "relative h-full w-full overflow-hidden bg-black",
              !fullscreen && "rounded-[6px] shadow-[0_0_0_1px_rgb(255_255_255/0.09),0_0_0_7px_#0b0b10,0_0_0_8px_rgb(255_255_255/0.06),0_40px_120px_-30px_rgb(0_0_0/0.9)]",
            )}
          >
            <VisualCanvas
              scene={scene}
              artistName={project.artistName}
              bpm={project.bpm}
              clock={editorClock}
              editing={!fullscreen}
              bounds={boundsRef.current}
              onFrame={onFrame}
              aria-label={`Preview of ${scene.name}`}
            />
            {!fullscreen && (
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/0.05)_0%,transparent_28%)]" />
            )}
            {!fullscreen && size.w > 0 && <SelectionOverlay width={size.w} bounds={boundsRef.current} scene={scene} />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {dropping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-3 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-accent bg-accent/10 backdrop-blur-sm"
          >
            <UploadCloud className="h-10 w-10 text-accent-soft" />
            <p className="font-display text-lg font-semibold text-ink">Drop to add to this scene</p>
            <p className="text-sm text-muted">Images and video loops</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
