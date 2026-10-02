/**
 * Global render preferences, kept outside React so every canvas can read
 * them each frame. The settings store pushes changes in here.
 */
export interface RenderSettings {
  /** Fraction of device pixels to render (performance). */
  resolutionScale: number;
  /** 0.25..1, scales particle counts and heavy passes. */
  quality: number;
  reduceFlashing: boolean;
  animateThumbnails: boolean;
}

export const renderSettings: RenderSettings = {
  resolutionScale: 1,
  quality: 1,
  reduceFlashing: false,
  animateThumbnails: true,
};

export function updateRenderSettings(patch: Partial<RenderSettings>): void {
  Object.assign(renderSettings, patch);
}
