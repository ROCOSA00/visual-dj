import { brand } from "@/config/brand";
import type { MediaRef } from "@/domain/types";
import { createId } from "@/lib/id";

/**
 * Binary media (logos, images, video loops) live in IndexedDB, not in
 * localStorage, which is capped at ~5 MB. The interface is async and keyed by
 * asset id, so it can be swapped for cloud object storage later.
 */
export interface MediaStore {
  put(file: File): Promise<MediaRef>;
  getBlob(assetId: string): Promise<Blob | null>;
  list(): Promise<StoredAsset[]>;
  remove(assetId: string): Promise<void>;
}

export interface StoredAsset {
  ref: MediaRef;
  createdAt: number;
  size: number;
}

interface AssetRecord extends StoredAsset {
  id: string;
  blob: Blob;
}

const DB_NAME = `${brand.storageNamespace}-media`;
const STORE = "assets";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

async function readDimensions(file: File, type: "image" | "video"): Promise<{ width?: number; height?: number }> {
  const url = URL.createObjectURL(file);
  try {
    if (type === "image") {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { width: img.naturalWidth, height: img.naturalHeight };
    }
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("video metadata"));
    });
    return { width: video.videoWidth, height: video.videoHeight };
  } catch {
    return {};
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const indexedDbMediaStore: MediaStore = {
  async put(file) {
    const type = file.type.startsWith("video/") ? "video" : "image";
    const dims = await readDimensions(file, type);
    const ref: MediaRef = { assetId: createId("asset_"), name: file.name, type, ...dims };
    const record: AssetRecord = { id: ref.assetId, ref, blob: file, createdAt: Date.now(), size: file.size };
    await tx("readwrite", (store) => store.put(record));
    return ref;
  },
  async getBlob(assetId) {
    const record = await tx<AssetRecord | undefined>("readonly", (store) => store.get(assetId));
    return record?.blob ?? null;
  },
  async list() {
    const records = await tx<AssetRecord[]>("readonly", (store) => store.getAll());
    return records
      .map(({ ref, createdAt, size }) => ({ ref, createdAt, size }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
  async remove(assetId) {
    await tx("readwrite", (store) => store.delete(assetId));
  },
};

export const mediaStore: MediaStore = indexedDbMediaStore;

export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";
export const ACCEPTED_VIDEO_TYPES = "video/mp4,video/webm,video/quicktime";
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
