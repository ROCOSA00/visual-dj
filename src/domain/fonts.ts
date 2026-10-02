import type { FontId } from "./types";

export interface FontMeta {
  id: FontId;
  label: string;
  /** Short description shown in the font picker. */
  vibe: string;
  weights: number[];
}

export const FONTS: FontMeta[] = [
  { id: "unbounded", label: "Unbounded", vibe: "Wide, festival", weights: [300, 500, 700, 900] },
  { id: "syne", label: "Syne", vibe: "Arty, editorial", weights: [400, 600, 800] },
  { id: "space-grotesk", label: "Space Grotesk", vibe: "Clean, techy", weights: [300, 500, 700] },
  { id: "inter", label: "Inter", vibe: "Neutral, crisp", weights: [300, 500, 700, 900] },
  { id: "orbitron", label: "Orbitron", vibe: "Sci-fi, cyber", weights: [400, 700, 900] },
  { id: "monoton", label: "Monoton", vibe: "Retro neon", weights: [400] },
  { id: "bebas", label: "Bebas Neue", vibe: "Tall, poster", weights: [400] },
  { id: "anton", label: "Anton", vibe: "Heavy, loud", weights: [400] },
  { id: "archivo-black", label: "Archivo Black", vibe: "Bold, industrial", weights: [400] },
  { id: "michroma", label: "Michroma", vibe: "Wide, minimal", weights: [400] },
  { id: "audiowide", label: "Audiowide", vibe: "Rave, 90s", weights: [400] },
  { id: "syncopate", label: "Syncopate", vibe: "Spaced, luxury", weights: [400, 700] },
  { id: "major-mono", label: "Major Mono", vibe: "Code, glitch", weights: [400] },
  { id: "rubik-mono", label: "Rubik Mono", vibe: "Chunky, playful", weights: [400] },
  { id: "big-shoulders", label: "Big Shoulders", vibe: "Condensed, techno", weights: [300, 500, 700, 900] },
  { id: "chakra", label: "Chakra Petch", vibe: "Angular, HUD", weights: [300, 500, 700] },
];

export const FONT_MAP: Record<FontId, FontMeta> = Object.fromEntries(
  FONTS.map((f) => [f.id, f]),
) as Record<FontId, FontMeta>;

/** Closest weight a font actually supports. */
export function nearestWeight(font: FontId, weight: number): number {
  const weights = FONT_MAP[font]?.weights ?? [400];
  return weights.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best), weights[0]!);
}
