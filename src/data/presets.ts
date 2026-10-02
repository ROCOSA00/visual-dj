import { createBackground, createParticles, createShape } from "@/domain/factories";
import type { BackgroundLayer, FontId, ParticlesLayer, ShapeLayer, TextLayer } from "@/domain/types";

/**
 * One-click presets for the element library. Each receives the project
 * palette so additions match the current look out of the box.
 */
type Pal = string[];
const c = (p: Pal, i: number, fallback: string) => p[i] ?? fallback;

export interface TextPreset {
  id: string;
  label: string;
  /** CSS preview hints for the library tile. */
  preview: { font: FontId; weight: number; size: number; spacing?: number; glow?: boolean; outline?: boolean; gradient?: boolean; upper?: boolean };
  sample: string;
  build: (p: Pal) => Partial<TextLayer>;
}

export const TEXT_PRESETS: TextPreset[] = [
  {
    id: "neon",
    label: "Neon sign",
    sample: "Neon",
    preview: { font: "monoton", weight: 400, size: 26, glow: true },
    build: (p) => ({ content: "TONIGHT", font: "monoton", weight: 400, size: 110, color: c(p, 1, "#00f0ff"), glow: 0.8, glowColor: c(p, 1, "#00f0ff"), animation: "flicker", letterSpacing: 6 }),
  },
  {
    id: "headline",
    label: "Big headline",
    sample: "LOUD",
    preview: { font: "anton", weight: 400, size: 30, upper: true },
    build: () => ({ content: "SOLD OUT", font: "anton", weight: 400, size: 180, letterSpacing: 6, animation: "pulse", audioReact: 0.4 }),
  },
  {
    id: "outline",
    label: "Outline",
    sample: "Outline",
    preview: { font: "unbounded", weight: 900, size: 22, outline: true, upper: true },
    build: (p) => ({ content: "AFTER DARK", font: "unbounded", weight: 900, size: 130, outline: true, color: "#ffffff", glow: 0.3, glowColor: c(p, 0, "#8b5cf6") }),
  },
  {
    id: "chrome",
    label: "Gradient",
    sample: "Chrome",
    preview: { font: "syne", weight: 800, size: 26, gradient: true },
    build: (p) => ({ content: "Euphoria", font: "syne", weight: 800, size: 150, uppercase: false, letterSpacing: 0, gradient: { enabled: true, from: c(p, 1, "#22d3ee"), to: c(p, 0, "#8b5cf6") }, glow: 0.3, glowColor: c(p, 0, "#8b5cf6") }),
  },
  {
    id: "glitch",
    label: "Glitch",
    sample: "GL1TCH",
    preview: { font: "major-mono", weight: 400, size: 22 },
    build: (p) => ({ content: "system online", font: "major-mono", weight: 400, size: 90, uppercase: false, animation: "glitch", chromatic: 0.4, color: c(p, 2, "#ffffff") }),
  },
  {
    id: "typewriter",
    label: "Typewriter",
    sample: "Type_",
    preview: { font: "chakra", weight: 500, size: 22, upper: true },
    build: () => ({ content: "NOW PLAYING", font: "chakra", weight: 500, size: 64, letterSpacing: 10, animation: "typewriter" }),
  },
  {
    id: "minimal",
    label: "Spaced caps",
    sample: "M I N I M A L",
    preview: { font: "michroma", weight: 400, size: 13, spacing: 6, upper: true },
    build: () => ({ content: "LIVE SET", font: "michroma", weight: 400, size: 42, letterSpacing: 36, animation: "breathe" }),
  },
  {
    id: "wave",
    label: "Wavy",
    sample: "Wavy",
    preview: { font: "rubik-mono", weight: 400, size: 22, upper: true },
    build: (p) => ({ content: "GOOD VIBES", font: "rubik-mono", weight: 400, size: 96, animation: "wave", color: c(p, 2, "#ffd166"), glow: 0.4, glowColor: c(p, 2, "#ffd166") }),
  },
];

export const QUICK_TEXT: Array<{ id: string; label: string; build: () => Partial<TextLayer> }> = [
  { id: "heading", label: "Add a heading", build: () => ({ content: "HEADLINE", font: "unbounded", weight: 700, size: 140, letterSpacing: 4 }) },
  { id: "subheading", label: "Add a subheading", build: () => ({ content: "Subheading", font: "space-grotesk", weight: 500, size: 64, uppercase: false, letterSpacing: 2, transform: { x: 0.5, y: 0.62, scale: 1, rotation: 0 } }) },
  { id: "small", label: "Add small text", build: () => ({ content: "LIVE AT THE WAREHOUSE", font: "space-grotesk", weight: 500, size: 30, letterSpacing: 16, transform: { x: 0.5, y: 0.86, scale: 1, rotation: 0 } }) },
];

export interface ArtistStyle {
  id: string;
  label: string;
  preview: { font: FontId; weight: number; spacing?: number; gradient?: boolean; outline?: boolean };
  build: (p: Pal) => Partial<TextLayer>;
}

export const ARTIST_STYLES: ArtistStyle[] = [
  { id: "festival", label: "Festival", preview: { font: "unbounded", weight: 900 }, build: (p) => ({ font: "unbounded", weight: 900, size: 180, letterSpacing: 6, outline: false, gradient: { enabled: false, from: "#fff", to: "#fff" }, color: "#ffffff", glow: 0.6, glowColor: c(p, 0, "#8b5cf6"), animation: "pulse", audioReact: 0.4, chromatic: 0 }) },
  { id: "techno", label: "Techno", preview: { font: "big-shoulders", weight: 900, spacing: 3 }, build: (p) => ({ font: "big-shoulders", weight: 900, size: 240, letterSpacing: 26, outline: false, gradient: { enabled: false, from: "#fff", to: "#fff" }, color: "#ffffff", glow: 0.25, glowColor: c(p, 0, "#ff1f3d"), animation: "none", audioReact: 0.5, chromatic: 0.15 }) },
  { id: "cyber", label: "Cyber", preview: { font: "orbitron", weight: 900, gradient: true }, build: (p) => ({ font: "orbitron", weight: 900, size: 150, letterSpacing: 8, outline: false, gradient: { enabled: true, from: c(p, 1, "#00f0ff"), to: c(p, 0, "#ff2bd6") }, glow: 0.6, glowColor: c(p, 0, "#ff2bd6"), animation: "flicker", chromatic: 0.25 }) },
  { id: "minimal", label: "Minimal", preview: { font: "michroma", weight: 400, spacing: 6 }, build: () => ({ font: "michroma", weight: 400, size: 96, letterSpacing: 44, outline: false, gradient: { enabled: false, from: "#fff", to: "#fff" }, color: "#ffffff", glow: 0.1, glowColor: "#ffffff", animation: "breathe", audioReact: 0.1, chromatic: 0 }) },
  { id: "retro", label: "Retro neon", preview: { font: "monoton", weight: 400 }, build: (p) => ({ font: "monoton", weight: 400, size: 140, letterSpacing: 8, outline: false, gradient: { enabled: false, from: "#fff", to: "#fff" }, color: c(p, 1, "#00e1ff"), glow: 0.85, glowColor: c(p, 1, "#00e1ff"), animation: "flicker", chromatic: 0 }) },
  { id: "editorial", label: "Editorial", preview: { font: "syne", weight: 800 }, build: (p) => ({ font: "syne", weight: 800, size: 180, letterSpacing: 0, uppercase: false, outline: false, gradient: { enabled: false, from: "#fff", to: "#fff" }, color: "#ffffff", glow: 0.3, glowColor: c(p, 2, "#f472b6"), animation: "float", chromatic: 0 }) },
  { id: "hollow", label: "Hollow", preview: { font: "anton", weight: 400, outline: true }, build: (p) => ({ font: "anton", weight: 400, size: 220, letterSpacing: 10, outline: true, gradient: { enabled: false, from: "#fff", to: "#fff" }, color: "#ffffff", glow: 0.4, glowColor: c(p, 0, "#8b5cf6"), animation: "zoom", chromatic: 0.1 }) },
  { id: "glitch", label: "Glitch", preview: { font: "chakra", weight: 700 }, build: (p) => ({ font: "chakra", weight: 700, size: 150, letterSpacing: 10, outline: false, gradient: { enabled: false, from: "#fff", to: "#fff" }, color: "#ffffff", glow: 0.4, glowColor: c(p, 1, "#22d3ee"), animation: "glitch", chromatic: 0.3 }) },
];

export interface BackgroundPreset {
  id: string;
  label: string;
  build: (p: Pal) => Partial<BackgroundLayer>;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: "mesh", label: "Velvet mesh", build: (p) => ({ mode: "gradient", opacity: 0.6, gradient: { type: "mesh", colors: [c(p, 0, "#8b5cf6"), c(p, 1, "#22d3ee"), c(p, 2, "#f472b6")], angle: 0, animate: true }, pattern: "none" }) },
  { id: "black", label: "Pure black", build: () => ({ mode: "solid", color: "#000000", opacity: 1, pattern: "none" }) },
  { id: "deep", label: "Deep radial", build: (p) => ({ mode: "gradient", opacity: 0.7, gradient: { type: "radial", colors: [c(p, 0, "#8b5cf6"), "#000000"], angle: 0, animate: true }, pattern: "none" }) },
  { id: "horizon", label: "Horizon", build: (p) => ({ mode: "gradient", opacity: 1, gradient: { type: "linear", colors: [c(p, 3, "#07060d"), c(p, 0, "#8b5cf6"), c(p, 2, "#f472b6")], angle: 90, animate: true }, pattern: "none" }) },
  { id: "prism", label: "Prism spin", build: (p) => ({ mode: "gradient", opacity: 0.4, gradient: { type: "conic", colors: [c(p, 0, "#8b5cf6"), c(p, 1, "#22d3ee"), c(p, 2, "#f472b6")], angle: 0, animate: true }, pattern: "none" }) },
  { id: "grid", label: "Blueprint grid", build: (p) => ({ mode: "solid", color: c(p, 3, "#07060d"), opacity: 1, pattern: "grid", patternColor: c(p, 1, "#22d3ee"), patternOpacity: 0.12, patternScale: 1 }) },
  { id: "dots", label: "Dot matrix", build: (p) => ({ mode: "solid", color: c(p, 3, "#07060d"), opacity: 1, pattern: "dots", patternColor: c(p, 0, "#8b5cf6"), patternOpacity: 0.3, patternScale: 0.6 }) },
  { id: "hex", label: "Hex steel", build: () => ({ mode: "solid", color: "#0b0b0c", opacity: 1, pattern: "hex", patternColor: "#9ca3af", patternOpacity: 0.12, patternScale: 1.2 }) },
];

export function backgroundFromPreset(preset: BackgroundPreset, palette: Pal): BackgroundLayer {
  const patch = preset.build(palette);
  const base = createBackground();
  return { ...base, ...patch, gradient: { ...base.gradient, ...(patch.gradient ?? {}) } };
}

export interface ParticlePreset {
  id: string;
  label: string;
  build: (p: Pal) => Partial<ParticlesLayer>;
}

export const PARTICLE_PRESETS: ParticlePreset[] = [
  { id: "dust", label: "Stardust", build: (p) => ({ name: "Stardust", direction: "up", shape: "dot", count: 110, size: 4, colors: ["#ffffff", c(p, 1, "#22d3ee")], glow: 0.6, twinkle: 0.5 }) },
  { id: "embers", label: "Embers", build: () => ({ name: "Embers", direction: "up", shape: "spark", count: 100, size: 4, speed: 1.5, colors: ["#ffb800", "#ff4d00"], glow: 0.8, twinkle: 0.3 }) },
  { id: "snow", label: "Snowfall", build: () => ({ name: "Snowfall", direction: "down", shape: "dot", count: 140, size: 4, speed: 0.6, colors: ["#ffffff"], glow: 0.3, twinkle: 0.2 }) },
  { id: "bokeh", label: "Bokeh", build: (p) => ({ name: "Bokeh", direction: "float", shape: "dot", count: 30, size: 22, speed: 0.6, colors: [c(p, 0, "#8b5cf6"), c(p, 2, "#f472b6"), c(p, 1, "#22d3ee")], glow: 1, twinkle: 0.4, opacity: 0.6 }) },
  { id: "warp", label: "Warp", build: (p) => ({ name: "Warp", direction: "outward", shape: "line", count: 160, size: 3, speed: 1.2, colors: ["#ffffff", c(p, 1, "#22d3ee")], glow: 0.4, twinkle: 0 }) },
  { id: "rain", label: "Rain", build: (p) => ({ name: "Rain", direction: "down", shape: "line", count: 140, size: 2.5, speed: 1.8, colors: [c(p, 1, "#22d3ee")], glow: 0.2, twinkle: 0.1 }) },
  { id: "fireflies", label: "Fireflies", build: () => ({ name: "Fireflies", direction: "float", shape: "dot", count: 50, size: 5, speed: 0.8, colors: ["#d9f99d", "#facc15"], glow: 1, twinkle: 0.9 }) },
  { id: "glitter", label: "Glitter", build: (p) => ({ name: "Glitter", direction: "down", shape: "cross", count: 70, size: 6, speed: 0.6, colors: [c(p, 2, "#f472b6"), "#ffffff"], glow: 0.6, twinkle: 0.9 }) },
];

export function particlesFromPreset(preset: ParticlePreset, palette: Pal): ParticlesLayer {
  return createParticles(preset.build(palette));
}

export interface ShapePreset {
  id: string;
  label: string;
  build: (p: Pal) => ShapeLayer;
}

export const SHAPE_PRESETS: ShapePreset[] = [
  { id: "halo", label: "Halo rings", build: (p) => createShape("ring", { name: "Halo rings", size: 520, strokeWidth: 3, repeat: 4, color: c(p, 0, "#8b5cf6"), animation: "spin", animationSpeed: 0.5, glow: 0.6 }) },
  { id: "orbit", label: "Orbit", build: (p) => createShape("circle", { name: "Orbit", repeat: 8, repeatMode: "radial", size: 560, strokeWidth: 3, color: c(p, 1, "#22d3ee"), animation: "spin", animationSpeed: 0.5, glow: 0.6 }) },
  { id: "hex-tunnel", label: "Hex stack", build: (p) => createShape("hexagon", { name: "Hex stack", repeat: 5, size: 300, strokeWidth: 4, color: c(p, 2, "#f472b6"), animation: "spin", glow: 0.7 }) },
  { id: "disc", label: "Solid disc", build: (p) => createShape("circle", { name: "Disc", filled: true, size: 360, color: c(p, 2, "#ff4d2e"), animation: "pulse", glow: 0.5 }) },
];
