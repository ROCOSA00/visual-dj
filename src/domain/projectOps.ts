import type { Layer, Project, Scene } from "./types";

/** Pure, immutable helpers for editing projects. */

export function mapScene(project: Project, sceneId: string, fn: (scene: Scene) => Scene): Project {
  return { ...project, scenes: project.scenes.map((s) => (s.id === sceneId ? fn(s) : s)) };
}

export function mapLayer(scene: Scene, layerId: string, fn: (layer: Layer) => Layer): Scene {
  return { ...scene, layers: scene.layers.map((l) => (l.id === layerId ? fn(l) : l)) };
}

export function findLayer(project: Project | undefined, sceneId: string | null, layerId: string | null): Layer | undefined {
  if (!project || !sceneId || !layerId) return undefined;
  return project.scenes.find((s) => s.id === sceneId)?.layers.find((l) => l.id === layerId);
}

const isForeground = (l: Layer) =>
  l.kind === "text" || l.kind === "logo" || l.kind === "image" || (l.kind === "video" && l.fit === "free");

/**
 * Where a new layer should go so the result looks right without the user
 * thinking about stacking: backgrounds at the bottom, overlays on top,
 * ambient effects behind text and logos.
 */
export function insertionIndex(layers: Layer[], layer: Layer): number {
  if (layer.kind === "background") return 0;
  let topStack = layers.length;
  while (topStack > 0 && layers[topStack - 1]!.kind === "overlay") topStack--;
  if (layer.kind === "overlay") return layers.length;
  // Photos and free videos sit behind names and logos, like tour visuals.
  if (layer.kind === "image" || layer.kind === "video") {
    const firstLabel = layers.findIndex((l) => l.kind === "text" || l.kind === "logo");
    if (firstLabel !== -1 && firstLabel < topStack) return firstLabel;
    return topStack;
  }
  if (isForeground(layer)) return topStack;
  if (layer.kind === "audio" && ["beatFlash", "strobe", "bassPulse", "cameraShake"].includes(layer.effect)) return topStack;
  const firstForeground = layers.findIndex(isForeground);
  if (firstForeground !== -1 && firstForeground < topStack) return firstForeground;
  return topStack;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Swaps the project palette, recolouring every layer colour that used it. */
export function applyPalette(project: Project, next: string[]): Project {
  const map = new Map<string, string>();
  project.palette.forEach((c, i) => {
    if (next[i]) map.set(c.toLowerCase(), next[i]!);
  });
  const recolor = (value: unknown): unknown => {
    if (typeof value === "string") return HEX.test(value) ? (map.get(value.toLowerCase()) ?? value) : value;
    if (Array.isArray(value)) return value.map(recolor);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === "id" ? v : recolor(v)]));
    }
    return value;
  };
  return {
    ...project,
    palette: [...next],
    scenes: project.scenes.map((s) => ({ ...s, layers: s.layers.map((l) => recolor(l) as Layer) })),
  };
}
