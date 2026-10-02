import type { MediaRef } from "@/domain/types";
import { mediaStore } from "@/services/media/mediaStore";

/**
 * Turns media references into drawable elements. Lookups are synchronous for
 * the renderer: the first request starts loading and returns null; once the
 * element is ready the next frame picks it up.
 */

type Entry =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; el: HTMLImageElement | HTMLVideoElement; url: string };

const cache = new Map<string, Entry>();
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

async function load(ref: MediaRef): Promise<void> {
  cache.set(ref.assetId, { status: "loading" });
  try {
    const blob = await mediaStore.getBlob(ref.assetId);
    if (!blob) throw new Error("missing asset");
    const url = URL.createObjectURL(blob);
    if (ref.type === "video") {
      const video = document.createElement("video");
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      video.src = url;
      await new Promise<void>((resolve, reject) => {
        video.oncanplay = () => resolve();
        video.onerror = () => reject(new Error("video"));
      });
      void video.play().catch(() => undefined);
      cache.set(ref.assetId, { status: "ready", el: video, url });
    } else {
      const img = new Image();
      img.src = url;
      await img.decode();
      cache.set(ref.assetId, { status: "ready", el: img, url });
    }
  } catch {
    cache.set(ref.assetId, { status: "error" });
  }
  notify();
}

export function getMediaElement(ref: MediaRef | null): HTMLImageElement | HTMLVideoElement | null {
  if (!ref || typeof window === "undefined") return null;
  const entry = cache.get(ref.assetId);
  if (!entry) {
    void load(ref);
    return null;
  }
  return entry.status === "ready" ? entry.el : null;
}

export function getMediaUrl(ref: MediaRef | null): string | null {
  if (!ref) return null;
  const entry = cache.get(ref.assetId);
  if (!entry) {
    void load(ref);
    return null;
  }
  return entry.status === "ready" ? entry.url : null;
}

export function mediaStatus(ref: MediaRef | null): "none" | "loading" | "ready" | "error" {
  if (!ref) return "none";
  return cache.get(ref.assetId)?.status ?? "loading";
}

export function subscribeMedia(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Pauses or resumes every cached video together with the stage clock. */
export function setVideosPlaying(playing: boolean): void {
  for (const entry of cache.values()) {
    if (entry.status === "ready" && entry.el instanceof HTMLVideoElement) {
      if (playing) void entry.el.play().catch(() => undefined);
      else entry.el.pause();
    }
  }
}

export function mediaSize(el: HTMLImageElement | HTMLVideoElement): { w: number; h: number } {
  if (el instanceof HTMLVideoElement) return { w: el.videoWidth || 16, h: el.videoHeight || 9 };
  return { w: el.naturalWidth || 1, h: el.naturalHeight || 1 };
}
