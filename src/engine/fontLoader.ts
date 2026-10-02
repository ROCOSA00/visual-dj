import { FONTS } from "@/domain/fonts";
import type { FontId } from "@/domain/types";
import { fontFamilies } from "@/styles/fonts";

/**
 * Canvas text does not trigger web-font downloads by itself, so the renderer
 * asks for each font/weight the first time it draws it. Until the font is
 * ready the fallback is used; the continuous render loop swaps it in.
 */
const requested = new Set<string>();

/** Bumps whenever a font finishes loading, so text measurements can be re-cached. */
export let fontGeneration = 0;

if (typeof document !== "undefined" && document.fonts) {
  document.fonts.addEventListener("loadingdone", () => {
    fontGeneration++;
  });
}

export function fontFamily(id: FontId): string {
  return fontFamilies[id] ?? fontFamilies.inter;
}

export function ensureFont(id: FontId, weight: number): void {
  const key = `${id}:${weight}`;
  if (requested.has(key) || typeof document === "undefined" || !document.fonts) return;
  requested.add(key);
  void document.fonts
    .load(`${weight} 48px ${fontFamily(id)}`)
    .then(() => {
      fontGeneration++;
    })
    .catch(() => undefined);
}

export function canvasFont(id: FontId, weight: number, size: number): string {
  ensureFont(id, weight);
  return `${weight} ${Math.max(1, size)}px ${fontFamily(id)}`;
}

/** Warms up every visual font in idle time so previews never flash a fallback. */
export function preloadVisualFonts(): void {
  if (typeof window === "undefined") return;
  const run = () => FONTS.forEach((f) => f.weights.forEach((w) => ensureFont(f.id, w)));
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
  if (idle) idle(run);
  else setTimeout(run, 300);
}
