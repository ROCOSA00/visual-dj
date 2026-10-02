"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { brand } from "@/config/brand";
import { updateRenderSettings } from "@/engine/renderSettings";
import { ticker } from "@/engine/ticker";

export type RenderQuality = "high" | "balanced" | "performance";
export type Resolution = "1280x720" | "1920x1080" | "2560x1440" | "3840x2160";
export type ShowTransition = "cut" | "fade" | "flash";

export interface Settings {
  /** Pre-fills the artist name for new projects. Not an account. */
  defaultArtistName: string;
  showTooltips: boolean;
  reduceUiMotion: boolean;
  renderQuality: RenderQuality;
  maxFps: 30 | 60;
  animateThumbnails: boolean;
  defaultResolution: Resolution;
  showAutoHideDelay: number;
  showTransition: ShowTransition;
  showTransitionDuration: number;
  showSceneLabel: boolean;
  reduceFlashing: boolean;
  tutorialCompleted: boolean;
}

interface SettingsState extends Settings {
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultArtistName: "",
  showTooltips: true,
  reduceUiMotion: false,
  renderQuality: "high",
  maxFps: 60,
  animateThumbnails: true,
  defaultResolution: "1920x1080",
  showAutoHideDelay: 3,
  showTransition: "fade",
  showTransitionDuration: 0.6,
  showSceneLabel: true,
  reduceFlashing: false,
  tutorialCompleted: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: `${brand.storageNamespace}:settings`,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: ({ update: _u, reset: _r, ...rest }) => {
        void _u;
        void _r;
        return rest;
      },
    },
  ),
);

const QUALITY: Record<RenderQuality, { resolutionScale: number; quality: number }> = {
  high: { resolutionScale: 1, quality: 1 },
  balanced: { resolutionScale: 0.75, quality: 0.75 },
  performance: { resolutionScale: 0.5, quality: 0.45 },
};

/** Pushes render-related settings into the engine. */
export function syncEngineSettings(s: Settings): void {
  updateRenderSettings({
    ...QUALITY[s.renderQuality],
    reduceFlashing: s.reduceFlashing,
    animateThumbnails: s.animateThumbnails,
  });
  ticker.setMaxFps(s.maxFps);
}

export function resolutionSize(r: Resolution): { width: number; height: number } {
  const [w, h] = r.split("x").map(Number) as [number, number];
  return { width: w, height: h };
}
