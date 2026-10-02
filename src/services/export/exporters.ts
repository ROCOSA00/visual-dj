import type { Project, Scene } from "@/domain/types";
import { ScratchPool } from "@/engine/render/env";
import { loopLength, renderScene } from "@/engine/render/renderScene";
import { renderSettings } from "@/engine/renderSettings";
import { createCanvas } from "@/engine/render/utils";

/**
 * Client-side exporters. Everything renders through the same engine as the
 * preview, so exports match what the DJ sees. Server-side rendering (MP4,
 * GIF, 4K batch exports) can be added behind the same interface later.
 */

export type ExportFormat = "png" | "webm" | "mp4" | "gif" | "show";

export interface ExportFormatInfo {
  id: ExportFormat;
  label: string;
  description: string;
  available: boolean;
}

export function exportFormats(): ExportFormatInfo[] {
  return [
    { id: "show", label: "Show Mode", description: "Play your set fullscreen, live, with keyboard control", available: true },
    { id: "webm", label: "Export WebM", description: "Seamless video loop of the current scene", available: supportsWebM() },
    { id: "png", label: "Export Image", description: "High-resolution still of the current frame", available: true },
    { id: "mp4", label: "Export MP4", description: "For Resolume, VDMX and LED servers", available: false },
    { id: "gif", label: "Export GIF", description: "Animated preview for socials and flyers", available: false },
  ];
}

export function supportsWebM(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function" &&
    ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].some((t) => MediaRecorder.isTypeSupported(t))
  );
}

interface RenderTarget {
  project: Project;
  scene: Scene;
  width: number;
  height: number;
}

export async function exportImage({ project, scene, width, height, time }: RenderTarget & { time: number }): Promise<Blob> {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d", { alpha: false })!;
  await document.fonts?.ready;
  renderScene(ctx, scene, {
    time,
    bpm: project.bpm,
    artistName: project.artistName,
    scratch: new ScratchPool(),
    quality: 1,
    reduceFlashing: renderSettings.reduceFlashing,
  });
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}

/**
 * Records exactly one loop of the scene in real time. Because every
 * animation is loop-quantised, the resulting file loops seamlessly.
 */
export async function exportWebM({
  project,
  scene,
  width,
  height,
  onProgress,
  signal,
}: RenderTarget & { onProgress: (progress: number, seconds: number, total: number) => void; signal?: AbortSignal }): Promise<Blob> {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d", { alpha: false })!;
  const scratch = new ScratchPool();
  const duration = loopLength(scene, project.bpm);
  await document.fonts?.ready;

  const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t))!;
  const stream = canvas.captureStream(60);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: width >= 1920 ? 16_000_000 : 8_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const draw = (time: number) =>
    renderScene(ctx, scene, {
      time,
      bpm: project.bpm,
      artistName: project.artistName,
      scratch,
      quality: 1,
      reduceFlashing: renderSettings.reduceFlashing,
    });

  draw(0);
  return new Promise<Blob>((resolve, reject) => {
    let raf = 0;
    const start = performance.now();
    recorder.onstop = () => {
      cancelAnimationFrame(raf);
      if (signal?.aborted) reject(new DOMException("Export cancelled", "AbortError"));
      else resolve(new Blob(chunks, { type: "video/webm" }));
    };
    recorder.onerror = () => reject(new Error("Recording failed"));
    signal?.addEventListener("abort", () => recorder.state !== "inactive" && recorder.stop());
    recorder.start(250);
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      if (t >= duration) {
        draw(duration);
        onProgress(1, duration, duration);
        setTimeout(() => recorder.state !== "inactive" && recorder.stop(), 120);
        return;
      }
      draw(t);
      onProgress(t / duration, t, duration);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  });
}
