"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { MediaRef } from "@/domain/types";
import { getMediaUrl, subscribeMedia } from "@/engine/assets";
import { MAX_UPLOAD_BYTES, mediaStore, type StoredAsset } from "@/services/media/mediaStore";
import { toast } from "@/store/toasts";

let version = 0;
const listeners = new Set<() => void>();
const bump = () => {
  version++;
  listeners.forEach((l) => l());
};

export async function uploadMedia(file: File, expected: "image" | "video"): Promise<MediaRef | null> {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if ((expected === "video" && !isVideo) || (expected === "image" && !isImage)) {
    toast({
      title: expected === "video" ? "That file isn't a video" : "That file isn't an image",
      description: expected === "video" ? "Use an MP4 or WebM loop." : "Use PNG, JPG, WebP, GIF or SVG.",
      tone: "error",
    });
    return null;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    toast({ title: "File too large", description: "Keep uploads under 200 MB.", tone: "error" });
    return null;
  }
  try {
    const ref = await mediaStore.put(file);
    bump();
    return ref;
  } catch {
    toast({ title: "Upload failed", description: "Your browser storage may be full.", tone: "error" });
    return null;
  }
}

export function useMediaLibrary(type: "image" | "video") {
  const v = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
    () => 0,
  );
  const [assets, setAssets] = useState<StoredAsset[] | null>(null);
  useEffect(() => {
    let alive = true;
    mediaStore
      .list()
      .then((list) => alive && setAssets(list.filter((a) => a.ref.type === type)))
      .catch(() => alive && setAssets([]));
    return () => {
      alive = false;
    };
  }, [type, v]);
  const remove = useCallback(async (assetId: string) => {
    await mediaStore.remove(assetId);
    bump();
  }, []);
  return { assets, remove };
}

/** Object URL for a stored asset, once loaded. */
export function useMediaUrl(ref: MediaRef | null): string | null {
  return useSyncExternalStore(
    subscribeMedia,
    () => getMediaUrl(ref),
    () => null,
  );
}
