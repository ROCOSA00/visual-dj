import {
  createArtistName,
  createAudioLayer,
  createBackground,
  createEffect,
  createLogo,
  createOverlay,
  createParticles,
  createShape,
  createText,
} from "@/domain/factories";
import { brand } from "@/config/brand";
import type { TemplateDefinition } from "@/domain/templates";

const STUDIO = `${brand.name} Studio`;

/*
 * The template library. Each template builds its layers from the factories
 * using its palette, so swapping the palette later recolours the whole set.
 * Layer order is bottom → top.
 */

const subtitle = (content: string, color: string, extra: Parameters<typeof createText>[0] = {}) =>
  createText({
    name: "Subtitle",
    content,
    font: "space-grotesk",
    size: 32,
    weight: 500,
    letterSpacing: 18,
    color,
    transform: { x: 0.5, y: 0.66, scale: 1, rotation: 0 },
    ...extra,
  });

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "signature",
    name: "Signature Glow",
    description: "Our signature look: velvet gradients, floating dust and a glowing name. Works for any set.",
    category: "abstract",
    style: "Neon",
    energy: "Groove",
    color: "Neon",
    motion: "Gradient",
    palette: ["#8b5cf6", "#22d3ee", "#f472b6", "#07060d"],
    bpm: 124,
    popularity: 98,
    featured: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2] = this.palette;
      return [
        createBackground({ gradient: { type: "mesh", colors: [p0, p1, p2], angle: 0, animate: true }, opacity: 0.55 }),
        createEffect("radialGlow", { colors: [p0, p2], intensity: 0.45, opacity: 0.55, blendMode: "screen" }),
        createParticles({ name: "Dust", colors: ["#ffffff", p1], count: 110, size: 4, glow: 0.6 }),
        createArtistName({ glowColor: p0, transform: { x: 0.5, y: 0.48, scale: 1, rotation: 0 } }),
        subtitle("LIVE SET", "#d9d6ff", { transform: { x: 0.5, y: 0.64, scale: 1, rotation: 0 } }),
        createOverlay("grain", { intensity: 0.28 }),
        createOverlay("vignette", { intensity: 0.7 }),
      ];
    },
  },
  {
    id: "warehouse-pulse",
    name: "Warehouse Pulse",
    description: "Red tunnel, heavy type and scanlines. Built for 4AM peak time in a dark room.",
    category: "techno",
    style: "Minimal",
    energy: "Peak",
    color: "Red",
    motion: "Tunnel",
    palette: ["#ff1f3d", "#ffffff", "#ff6b6b", "#050505"],
    bpm: 132,
    popularity: 95,
    featured: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, , p3] = this.palette;
      return [
        createBackground({ mode: "solid", color: p3 }),
        createEffect("tunnel", { colors: [p0, p0, p1], intensity: 0.5, angle: 0, opacity: 0.9, audioReact: 0.6 }),
        createArtistName({
          font: "big-shoulders",
          weight: 900,
          size: 250,
          letterSpacing: 28,
          color: p1,
          glow: 0.3,
          glowColor: p0,
          animation: "none",
          audioReact: 0.5,
          chromatic: 0.15,
        }),
        subtitle("WAREHOUSE · 04:00", p0, { font: "chakra", size: 30, letterSpacing: 22, transform: { x: 0.5, y: 0.7, scale: 1, rotation: 0 } }),
        createAudioLayer("bassPulse", { intensity: 0.5 }),
        createOverlay("scanlines", { intensity: 0.3 }),
        createOverlay("grain", { intensity: 0.25 }),
        createOverlay("vignette", { intensity: 0.85 }),
      ];
    },
  },
  {
    id: "berlin-4am",
    name: "Berlin 4AM",
    description: "Monochrome geometry and grain. Restrained, hypnotic, serious.",
    category: "techno",
    style: "Geometric",
    energy: "Groove",
    color: "Mono",
    motion: "Geometry",
    palette: ["#e5e5e5", "#8a8a8a", "#ffffff", "#0a0a0a"],
    bpm: 128,
    popularity: 88,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ mode: "solid", color: p3, pattern: "grid", patternColor: p1, patternOpacity: 0.06, animationSpeed: 0.5 }),
        createEffect("rotatingShapes", { colors: [p0, p1], intensity: 0.45, speed: 0.5, audioReact: 0.3 }),
        createArtistName({
          font: "michroma",
          weight: 400,
          size: 104,
          letterSpacing: 40,
          color: p2,
          glow: 0.12,
          glowColor: p2,
          animation: "breathe",
          audioReact: 0.15,
        }),
        createAudioLayer("cameraShake", { intensity: 0.25, sensitivity: 0.3 }),
        createOverlay("grain", { intensity: 0.45 }),
        createOverlay("vignette", { intensity: 0.65 }),
      ];
    },
  },
  {
    id: "acid-rain",
    name: "Acid Rain",
    description: "Toxic green waves, falling streaks and a wobbling name. 303 not included.",
    category: "techno",
    style: "Neon",
    energy: "Peak",
    color: "Acid",
    motion: "Waves",
    palette: ["#b6ff00", "#00ff9c", "#f0ff4f", "#030a02"],
    bpm: 136,
    popularity: 84,
    isNew: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ mode: "solid", color: p3, pattern: "diagonal", patternColor: p0, patternOpacity: 0.05 }),
        createEffect("waves", { colors: [p0, p1, p2], intensity: 0.7, angle: -12, audioReact: 0.5 }),
        createParticles({ name: "Rain", direction: "down", shape: "line", colors: [p0], count: 120, size: 2.5, speed: 1.6, glow: 0.3, twinkle: 0.2 }),
        createArtistName({ font: "rubik-mono", weight: 400, size: 130, letterSpacing: 4, color: p0, glow: 0.7, glowColor: p0, animation: "wave" }),
        createAudioLayer("frequencyBars", { colors: [p0, p1], opacity: 0.55, intensity: 0.5 }),
        createOverlay("chromatic", { intensity: 0.22 }),
        createOverlay("grain", { intensity: 0.2 }),
      ];
    },
  },
  {
    id: "sunset-boulevard",
    name: "Sunset Boulevard",
    description: "Golden-hour gradient, bokeh and soft light leaks for rooftop and beach sets.",
    category: "house",
    style: "Organic",
    energy: "Groove",
    color: "Warm",
    motion: "Gradient",
    palette: ["#ff7a3d", "#ff3d81", "#ffd166", "#1a0610"],
    bpm: 122,
    popularity: 93,
    featured: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "linear", colors: [p3, p1, p0], angle: 90, animate: true }, animationSpeed: 0.6 }),
        createEffect("radialGlow", { colors: [p2, p0], intensity: 0.4, opacity: 0.7, blendMode: "screen" }),
        createParticles({ name: "Bokeh", direction: "float", colors: [p2, "#ffffff"], count: 36, size: 12, glow: 0.8, twinkle: 0.7, opacity: 0.7 }),
        createArtistName({ font: "syne", weight: 800, size: 180, letterSpacing: 2, uppercase: false, glow: 0.35, glowColor: p1, animation: "float", audioReact: 0.2 }),
        subtitle("SUNSET SESSIONS", p2),
        createOverlay("lightLeak", { intensity: 0.5, color: p1 }),
        createOverlay("grain", { intensity: 0.25 }),
      ];
    },
  },
  {
    id: "deep-velvet",
    name: "Deep Velvet",
    description: "Slow aurora ribbons over deep purple. Elegant and late-night.",
    category: "house",
    style: "Cinematic",
    energy: "Chill",
    color: "Cool",
    motion: "Waves",
    palette: ["#9d4dff", "#ff4ecd", "#5b2cff", "#0b0414"],
    bpm: 120,
    popularity: 81,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2] = this.palette;
      return [
        createBackground({ gradient: { type: "mesh", colors: [p2, p0, p1], angle: 0, animate: true }, opacity: 0.45, animationSpeed: 0.6 }),
        createEffect("aurora", { colors: [p0, p1], intensity: 0.5, opacity: 0.8, speed: 0.5 }),
        createArtistName({ font: "syncopate", weight: 700, size: 112, letterSpacing: 24, color: "#f5e9ff", glow: 0.4, glowColor: p0, animation: "breathe", audioReact: 0.2 }),
        subtitle("ALL NIGHT LONG", "#e9d5ff", { letterSpacing: 24, size: 28 }),
        createOverlay("grain", { intensity: 0.3 }),
        createOverlay("vignette", { intensity: 0.7 }),
      ];
    },
  },
  {
    id: "main-stage",
    name: "Main Stage",
    description: "Lasers, EQ bars and a gradient headline. Pure festival main-stage energy.",
    category: "edm",
    style: "Neon",
    energy: "Peak",
    color: "Neon",
    motion: "Lasers",
    palette: ["#00e5ff", "#ff2bd6", "#ffe600", "#05010d"],
    bpm: 128,
    popularity: 97,
    featured: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2] = this.palette;
      return [
        createBackground({ gradient: { type: "mesh", colors: [p1, p0, "#1a0436"], angle: 0, animate: true }, opacity: 0.32 }),
        createEffect("lasers", { colors: [p0, p1, p2], intensity: 0.7, audioReact: 0.7 }),
        createAudioLayer("frequencyBars", { colors: [p0, p1], intensity: 0.55, opacity: 0.75 }),
        createArtistName({
          font: "unbounded",
          weight: 900,
          size: 190,
          gradient: { enabled: true, from: p0, to: p1 },
          glow: 0.55,
          glowColor: p1,
          animation: "pulse",
          audioReact: 0.5,
          transform: { x: 0.5, y: 0.45, scale: 1, rotation: 0 },
        }),
        createAudioLayer("beatFlash", { colors: ["#ffffff"], intensity: 0.25 }),
        createOverlay("vignette", { intensity: 0.6 }),
      ];
    },
  },
  {
    id: "hyperdrive",
    name: "Hyperdrive",
    description: "Warp-speed starfield with a chrome-cyan title. Feels like the drop never ends.",
    category: "edm",
    style: "Cinematic",
    energy: "Peak",
    color: "Cool",
    motion: "Particles",
    palette: ["#7df9ff", "#ff4fd8", "#ffffff", "#020212"],
    bpm: 130,
    popularity: 90,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "radial", colors: ["#0b1240", p3], angle: 0, animate: true } }),
        createEffect("starfield", { colors: [p0, p1, p2], intensity: 0.75, speed: 1.2, audioReact: 0.6 }),
        createEffect("radialGlow", { colors: [p1], intensity: 0.3, opacity: 0.5, blendMode: "screen" }),
        createArtistName({ font: "orbitron", weight: 900, size: 160, letterSpacing: 10, glow: 0.7, glowColor: p0, animation: "zoom", chromatic: 0.2 }),
        createOverlay("vignette", { intensity: 0.65 }),
      ];
    },
  },
  {
    id: "mono-line",
    name: "Mono Line",
    description: "Thin concentric rings and widely spaced type. Quiet confidence.",
    category: "minimal",
    style: "Minimal",
    energy: "Chill",
    color: "Mono",
    motion: "Geometry",
    palette: ["#ffffff", "#9ca3af", "#e5e7eb", "#000000"],
    bpm: 124,
    popularity: 79,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, , p3] = this.palette;
      return [
        createBackground({ mode: "solid", color: p3 }),
        createShape("ring", { size: 560, strokeWidth: 2, repeat: 4, color: p1, animation: "spin", animationSpeed: 0.4, glow: 0.15, audioReact: 0.15 }),
        createArtistName({ font: "inter", weight: 300, size: 84, letterSpacing: 56, color: p0, glow: 0, animation: "none", audioReact: 0.1 }),
        createOverlay("grain", { intensity: 0.3 }),
      ];
    },
  },
  {
    id: "negative-space",
    name: "Negative Space",
    description: "A single pulsing disc and inverted type. Swiss design for the club.",
    category: "minimal",
    style: "Geometric",
    energy: "Groove",
    color: "Mono",
    motion: "Geometry",
    palette: ["#f5f5f4", "#a8a29e", "#ff4d2e", "#0c0a09"],
    bpm: 126,
    popularity: 76,
    isNew: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ mode: "solid", color: p3 }),
        createEffect("pulseRings", { colors: [p1], intensity: 0.2, opacity: 0.35 }),
        createShape("circle", { filled: true, color: p2, size: 380, animation: "pulse", glow: 0.5, audioReact: 0.3 }),
        createArtistName({ font: "space-grotesk", weight: 700, size: 120, letterSpacing: 6, color: p0, glow: 0, animation: "none", audioReact: 0.1, blendMode: "difference" }),
        createOverlay("grain", { intensity: 0.35 }),
      ];
    },
  },
  {
    id: "third-eye",
    name: "Third Eye",
    description: "Kaleidoscopic colour and an all-seeing mark. Open your mind on the dancefloor.",
    category: "psychedelic",
    style: "Geometric",
    energy: "Peak",
    color: "Neon",
    motion: "Geometry",
    palette: ["#ff00c8", "#00ffd5", "#ffe600", "#12001f"],
    bpm: 140,
    popularity: 86,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2] = this.palette;
      return [
        createBackground({ gradient: { type: "conic", colors: [p0, p1, p2], angle: 0, animate: true }, opacity: 0.3 }),
        createEffect("kaleidoscope", { colors: [p0, p1, p2], intensity: 0.65, audioReact: 0.4 }),
        createLogo({ source: "mark", mark: "eye", color: "#ffffff", size: 230, glow: 0.7, glowColor: p0, animation: "pulse", transform: { x: 0.5, y: 0.42, scale: 1, rotation: 0 } }),
        createArtistName({ font: "audiowide", weight: 400, size: 96, letterSpacing: 10, glow: 0.6, glowColor: p1, animation: "none", transform: { x: 0.5, y: 0.74, scale: 1, rotation: 0 } }),
        createOverlay("chromatic", { intensity: 0.3 }),
        createOverlay("vignette", { intensity: 0.6 }),
      ];
    },
  },
  {
    id: "liquid-dreams",
    name: "Liquid Dreams",
    description: "Melting pastel blobs and a rippling title with RGB fringes.",
    category: "psychedelic",
    style: "Organic",
    energy: "Groove",
    color: "Pastel",
    motion: "Gradient",
    palette: ["#ff6ad5", "#c774e8", "#8795e8", "#1b0a2e"],
    bpm: 122,
    popularity: 83,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2] = this.palette;
      return [
        createBackground({ gradient: { type: "mesh", colors: [p0, p1, p2], angle: 0, animate: true }, opacity: 0.85, animationSpeed: 1.2 }),
        createEffect("waves", { colors: ["#ffffff"], intensity: 0.3, opacity: 0.35 }),
        createArtistName({ font: "syne", weight: 800, size: 190, letterSpacing: 0, uppercase: false, glow: 0.3, glowColor: p0, animation: "wave", chromatic: 0.35 }),
        createOverlay("grain", { intensity: 0.35 }),
      ];
    },
  },
  {
    id: "neon-district",
    name: "Neon District",
    description: "Synthwave grid, flickering neon and a sci-fi HUD. Night city vibes.",
    category: "cyberpunk",
    style: "Neon",
    energy: "Peak",
    color: "Neon",
    motion: "Grid",
    palette: ["#ff2bd6", "#00f0ff", "#fffb00", "#08001a"],
    bpm: 128,
    popularity: 96,
    featured: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, , p3] = this.palette;
      return [
        createBackground({ gradient: { type: "linear", colors: [p3, "#2a0046", p3], angle: 90, animate: false } }),
        createEffect("grid", { colors: [p0, p1], intensity: 0.8, audioReact: 0.5 }),
        createArtistName({
          font: "orbitron",
          weight: 900,
          size: 150,
          letterSpacing: 8,
          gradient: { enabled: true, from: p1, to: p0 },
          glow: 0.6,
          glowColor: p0,
          animation: "flicker",
          chromatic: 0.25,
          transform: { x: 0.5, y: 0.42, scale: 1, rotation: 0 },
        }),
        subtitle("LIVE FROM SECTOR 7", p1, { font: "chakra", size: 30, transform: { x: 0.5, y: 0.56, scale: 1, rotation: 0 } }),
        createOverlay("scanlines", { intensity: 0.35 }),
        createOverlay("hud", { intensity: 0.5, color: p1 }),
        createOverlay("vignette", { intensity: 0.6 }),
      ];
    },
  },
  {
    id: "ghost-protocol",
    name: "Ghost Protocol",
    description: "Cascading code, glitch tears and a terminal font. Enter the system.",
    category: "cyberpunk",
    style: "Glitch",
    energy: "Peak",
    color: "Acid",
    motion: "Glitch",
    palette: ["#22ff88", "#eafff2", "#00b3ff", "#000a05"],
    bpm: 138,
    popularity: 87,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, , p3] = this.palette;
      return [
        createBackground({ mode: "solid", color: p3 }),
        createEffect("dataRain", { colors: [p0, p1], intensity: 0.55, opacity: 0.7 }),
        createArtistName({ font: "major-mono", weight: 400, size: 128, letterSpacing: 6, color: p1, glow: 0.6, glowColor: p0, animation: "glitch", uppercase: false }),
        createOverlay("glitch", { intensity: 0.5, color: p0 }),
        createOverlay("scanlines", { intensity: 0.3 }),
        createOverlay("vignette", { intensity: 0.8 }),
      ];
    },
  },
  {
    id: "prism",
    name: "Prism",
    description: "Refracted light through spinning geometry. Clean, colourful, timeless.",
    category: "abstract",
    style: "Geometric",
    energy: "Groove",
    color: "Cool",
    motion: "Geometry",
    palette: ["#7c3aed", "#06b6d4", "#f43f5e", "#0a0612"],
    bpm: 124,
    popularity: 82,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "radial", colors: [p0, p3], angle: 0, animate: true }, opacity: 0.55 }),
        createEffect("rotatingShapes", { colors: [p0, p1, p2], intensity: 0.7, audioReact: 0.4 }),
        createLogo({ source: "mark", mark: "prism", size: 190, glow: 0.6, glowColor: p1, animation: "none", transform: { x: 0.5, y: 0.47, scale: 1, rotation: 0 } }),
        createArtistName({ font: "space-grotesk", weight: 700, size: 76, letterSpacing: 22, glow: 0.3, glowColor: p1, animation: "none", transform: { x: 0.5, y: 0.84, scale: 1, rotation: 0 } }),
        createOverlay("grain", { intensity: 0.25 }),
        createOverlay("vignette", { intensity: 0.6 }),
      ];
    },
  },
  {
    id: "orbit",
    name: "Orbit",
    description: "Satellites circling a glowing core. Your name at the centre of the universe.",
    category: "abstract",
    style: "Geometric",
    energy: "Chill",
    color: "Cool",
    motion: "Geometry",
    palette: ["#38bdf8", "#a78bfa", "#f0abfc", "#030712"],
    bpm: 122,
    popularity: 74,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ mode: "solid", color: p3, pattern: "dots", patternColor: p0, patternOpacity: 0.07, animationSpeed: 0.4 }),
        createShape("circle", { repeat: 8, repeatMode: "radial", size: 600, strokeWidth: 3, color: p0, animation: "spin", animationSpeed: 0.5, glow: 0.6 }),
        createShape("ring", { size: 340, strokeWidth: 4, color: p1, animation: "pulse", glow: 0.8, audioReact: 0.3 }),
        createParticles({ direction: "float", colors: [p2, p0], count: 60, size: 4 }),
        createArtistName({ font: "chakra", weight: 700, size: 92, letterSpacing: 16, glow: 0.4, glowColor: p1, animation: "none", audioReact: 0.15 }),
        createOverlay("vignette", { intensity: 0.65 }),
      ];
    },
  },
  {
    id: "outrun-86",
    name: "Outrun 86",
    description: "Striped sunset, neon grid and chrome-era type. Press play on the cassette.",
    category: "retro",
    style: "Retro",
    energy: "Groove",
    color: "Warm",
    motion: "Grid",
    palette: ["#ff2e88", "#ffd23f", "#00e1ff", "#14002b"],
    bpm: 118,
    popularity: 94,
    featured: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "linear", colors: [p3, "#3d0a5c", "#7a1257"], angle: 90, animate: false } }),
        createEffect("sun", { colors: [p1, p0], intensity: 0.6, scale: 1, angle: 0 }),
        createEffect("grid", { colors: [p0, p0], intensity: 0.55, audioReact: 0.3 }),
        createArtistName({ font: "monoton", weight: 400, size: 132, letterSpacing: 8, color: p2, glow: 0.8, glowColor: p2, animation: "flicker", transform: { x: 0.5, y: 0.2, scale: 1, rotation: 0 } }),
        createOverlay("scanlines", { intensity: 0.25 }),
        createOverlay("vignette", { intensity: 0.55 }),
      ];
    },
  },
  {
    id: "vhs-memories",
    name: "VHS Memories",
    description: "Warm tape colours, tracking bands and a typewriter title. Nostalgia on loop.",
    category: "retro",
    style: "Retro",
    energy: "Chill",
    color: "Warm",
    motion: "Glitch",
    palette: ["#ffb37a", "#ff6f91", "#7af0ff", "#140b0b"],
    bpm: 112,
    popularity: 80,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, , p3] = this.palette;
      return [
        createBackground({ gradient: { type: "mesh", colors: [p0, p1, p3], angle: 0, animate: true }, opacity: 0.5 }),
        createParticles({ name: "Dust", direction: "float", colors: ["#ffffff"], count: 50, size: 3, glow: 0.3 }),
        createArtistName({ font: "audiowide", weight: 400, size: 128, letterSpacing: 6, glow: 0.2, glowColor: p0, animation: "typewriter", chromatic: 0.4, audioReact: 0.1 }),
        createText({ name: "Tape label", content: "PLAY ▶", font: "chakra", size: 40, weight: 600, letterSpacing: 6, align: "left", transform: { x: 0.06, y: 0.1, scale: 1, rotation: 0 } }),
        createOverlay("vhs", { intensity: 0.6 }),
        createOverlay("grain", { intensity: 0.4 }),
        createOverlay("vignette", { intensity: 0.6 }),
      ];
    },
  },
  {
    id: "steel-foundry",
    name: "Steel Foundry",
    description: "Hex steel, rising sparks and heavy hits that shake the room.",
    category: "industrial",
    style: "Cinematic",
    energy: "Peak",
    color: "Warm",
    motion: "Particles",
    palette: ["#ff7a00", "#9ca3af", "#ffd2a6", "#0b0b0c"],
    bpm: 140,
    popularity: 85,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ mode: "solid", color: p3, pattern: "hex", patternColor: p1, patternOpacity: 0.1, patternScale: 1.2, animationSpeed: 0.4 }),
        createEffect("radialGlow", { colors: [p0], intensity: 0.25, opacity: 0.4, blendMode: "screen" }),
        createParticles({ name: "Sparks", direction: "up", shape: "spark", colors: [p0, p2], count: 80, size: 4, speed: 1.4, glow: 0.7, twinkle: 0.3 }),
        createArtistName({ font: "archivo-black", weight: 400, size: 170, letterSpacing: 4, color: "#e5e7eb", glow: 0.25, glowColor: p0, animation: "none", audioReact: 0.4 }),
        subtitle("HEAVY MACHINERY", p0, { font: "bebas", size: 44, letterSpacing: 20 }),
        createAudioLayer("cameraShake", { intensity: 0.5 }),
        createAudioLayer("bassPulse", { intensity: 0.4 }),
        createOverlay("grain", { intensity: 0.4 }),
        createOverlay("vignette", { intensity: 0.8 }),
      ];
    },
  },
  {
    id: "concrete",
    name: "Concrete",
    description: "Brutalist type, square shockwaves and a controlled strobe.",
    category: "industrial",
    style: "Minimal",
    energy: "Peak",
    color: "Mono",
    motion: "Glitch",
    palette: ["#d4d4d4", "#737373", "#ef4444", "#0a0a0a"],
    bpm: 135,
    popularity: 72,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, , p3] = this.palette;
      return [
        createBackground({ mode: "solid", color: p3, pattern: "lines", patternColor: p1, patternOpacity: 0.08 }),
        createEffect("pulseRings", { colors: [p0, p1], intensity: 0.4, angle: 120 }),
        createArtistName({ font: "big-shoulders", weight: 900, size: 260, letterSpacing: 0, color: p0, glow: 0, animation: "glitch", audioReact: 0.3 }),
        createAudioLayer("strobe", { intensity: 0.35, sensitivity: 0.3 }),
        createOverlay("grain", { intensity: 0.5 }),
        createOverlay("scanlines", { intensity: 0.2 }),
      ];
    },
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Northern lights and twinkling stars for sunrise and ambient sets.",
    category: "ambient",
    style: "Organic",
    energy: "Chill",
    color: "Cool",
    motion: "Waves",
    palette: ["#4ade80", "#22d3ee", "#a78bfa", "#020617"],
    bpm: 110,
    popularity: 89,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "linear", colors: [p3, "#06152b"], angle: 90, animate: false } }),
        createEffect("aurora", { colors: [p0, p1, p2], intensity: 0.7, speed: 0.5 }),
        createParticles({ name: "Stars", direction: "float", colors: ["#ffffff"], count: 120, size: 2, glow: 0.3, twinkle: 0.9, audioReact: 0.1 }),
        createArtistName({ font: "syncopate", weight: 400, size: 88, letterSpacing: 30, color: "#e0f2fe", glow: 0.3, glowColor: p1, animation: "breathe", audioReact: 0.1 }),
        createOverlay("grain", { intensity: 0.25 }),
      ];
    },
  },
  {
    id: "deep-field",
    name: "Deep Field",
    description: "Drifting through a quiet galaxy. Space for long, deep journeys.",
    category: "ambient",
    style: "Cinematic",
    energy: "Chill",
    color: "Cool",
    motion: "Particles",
    palette: ["#93c5fd", "#c4b5fd", "#fde68a", "#000005"],
    bpm: 100,
    popularity: 71,
    isNew: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "radial", colors: ["#0b1030", p3], angle: 0, animate: true }, animationSpeed: 0.4 }),
        createEffect("starfield", { colors: [p0, p1, p2], intensity: 0.35, speed: 0.3, audioReact: 0.2 }),
        createEffect("radialGlow", { colors: [p1, p0], intensity: 0.22, opacity: 0.5, blendMode: "screen" }),
        createArtistName({ font: "michroma", weight: 400, size: 76, letterSpacing: 50, color: "#ffffff", glow: 0.25, glowColor: p0, animation: "breathe", audioReact: 0 }),
        createOverlay("vignette", { intensity: 0.7 }),
      ];
    },
  },
  {
    id: "bass-cathedral",
    name: "Bass Cathedral",
    description: "Crimson beams and shockwaves. Worship at the altar of the sub.",
    category: "techno",
    style: "Cinematic",
    energy: "Peak",
    color: "Red",
    motion: "Lasers",
    palette: ["#ff3b3b", "#ff9e3b", "#ffffff", "#070000"],
    bpm: 134,
    popularity: 91,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, , p3] = this.palette;
      return [
        createBackground({ gradient: { type: "radial", colors: ["#2a0000", p3], angle: 0, animate: true } }),
        createEffect("lasers", { colors: [p0, p1], intensity: 0.6 }),
        createEffect("pulseRings", { colors: [p0], intensity: 0.5 }),
        createArtistName({ font: "unbounded", weight: 900, size: 150, letterSpacing: 8, glow: 0.5, glowColor: p0, animation: "pulse", audioReact: 0.5 }),
        createAudioLayer("bassPulse", { intensity: 0.5 }),
        createAudioLayer("beatFlash", { colors: [p0], intensity: 0.22 }),
        createOverlay("grain", { intensity: 0.25 }),
        createOverlay("vignette", { intensity: 0.8 }),
      ];
    },
  },
  {
    id: "afterglow",
    name: "Afterglow",
    description: "Dreamy bokeh, peach light and an easy float. Made for golden-hour house.",
    category: "house",
    style: "Organic",
    energy: "Chill",
    color: "Pastel",
    motion: "Particles",
    palette: ["#ffb86b", "#ff6b9a", "#c084fc", "#120714"],
    bpm: 118,
    popularity: 78,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2] = this.palette;
      return [
        createBackground({ gradient: { type: "mesh", colors: [p2, p1, "#2a0a2e"], angle: 0, animate: true }, opacity: 0.5 }),
        createParticles({ name: "Bokeh", direction: "float", colors: [p0, p1, p2], count: 28, size: 24, glow: 1, twinkle: 0.4, opacity: 0.55, speed: 0.6 }),
        createEffect("radialGlow", { colors: [p0], intensity: 0.3, opacity: 0.6, blendMode: "screen" }),
        createArtistName({ font: "syne", weight: 700, size: 150, letterSpacing: 4, color: "#fff7ed", glow: 0.4, glowColor: p0, animation: "float", audioReact: 0.15 }),
        createOverlay("lightLeak", { intensity: 0.4, color: p1 }),
        createOverlay("grain", { intensity: 0.3 }),
      ];
    },
  },
  {
    id: "festival-fire",
    name: "Festival Fire",
    description: "Molten waves, embers and spark bursts on every kick. Hands in the air.",
    category: "edm",
    style: "Cinematic",
    energy: "Peak",
    color: "Warm",
    motion: "Waves",
    palette: ["#ff4d00", "#ffb800", "#ff0055", "#0f0200"],
    bpm: 128,
    popularity: 92,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "linear", colors: [p3, "#3a0a00"], angle: 90, animate: false } }),
        createEffect("waves", { colors: [p0, p1, p2], intensity: 0.8, audioReact: 0.6 }),
        createParticles({ name: "Embers", direction: "up", shape: "spark", colors: [p1, p0], count: 110, size: 4, speed: 1.6, glow: 0.8 }),
        createAudioLayer("particleBurst", { colors: [p1, p0], intensity: 0.6 }),
        createArtistName({ font: "anton", weight: 400, size: 220, letterSpacing: 10, gradient: { enabled: true, from: p1, to: p0 }, glow: 0.5, glowColor: p0, animation: "pulse", audioReact: 0.5 }),
        createAudioLayer("beatFlash", { colors: [p1], intensity: 0.22 }),
        createOverlay("vignette", { intensity: 0.65 }),
      ];
    },
  },
  {
    id: "circuit",
    name: "Circuit",
    description: "Twisting green tunnel, HUD frame and glitching type. Jack in.",
    category: "cyberpunk",
    style: "Glitch",
    energy: "Groove",
    color: "Acid",
    motion: "Tunnel",
    palette: ["#00ffa3", "#00b3ff", "#ff00a8", "#01060a"],
    bpm: 130,
    popularity: 77,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, , p3] = this.palette;
      return [
        createBackground({ mode: "solid", color: p3, pattern: "grid", patternColor: p0, patternOpacity: 0.07 }),
        createEffect("tunnel", { colors: [p0, p1], intensity: 0.5, angle: 90, speed: 0.8 }),
        createArtistName({ font: "chakra", weight: 700, size: 140, letterSpacing: 10, color: "#e6fff6", glow: 0.5, glowColor: p0, animation: "glitch" }),
        createOverlay("hud", { intensity: 0.6, color: p0 }),
        createOverlay("scanlines", { intensity: 0.25 }),
        createOverlay("vignette", { intensity: 0.7 }),
      ];
    },
  },
  {
    id: "vapor",
    name: "Vapor",
    description: "Pastel sunset grid and soft tape fuzz. Aesthetic, unapologetically.",
    category: "retro",
    style: "Retro",
    energy: "Chill",
    color: "Pastel",
    motion: "Grid",
    palette: ["#ff9de2", "#8be9fd", "#b19cd9", "#1a1033"],
    bpm: 110,
    popularity: 75,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "linear", colors: [p3, "#3b2a6b", p2], angle: 90, animate: false } }),
        createEffect("sun", { colors: ["#ffe3f1", p0], intensity: 0.5, scale: 0.9 }),
        createEffect("grid", { colors: [p1, p0], intensity: 0.5 }),
        createArtistName({ font: "syncopate", weight: 700, size: 104, letterSpacing: 28, glow: 0.4, glowColor: p0, animation: "none", transform: { x: 0.5, y: 0.2, scale: 1, rotation: 0 } }),
        createOverlay("vhs", { intensity: 0.25 }),
        createOverlay("grain", { intensity: 0.3 }),
      ];
    },
  },
  {
    id: "tidal",
    name: "Tidal",
    description: "Calm blue swells and floating light. Breathe in, breathe out.",
    category: "ambient",
    style: "Organic",
    energy: "Chill",
    color: "Cool",
    motion: "Waves",
    palette: ["#38bdf8", "#818cf8", "#e0f2fe", "#020617"],
    bpm: 105,
    popularity: 70,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "linear", colors: [p3, "#082f49"], angle: 90, animate: false } }),
        createEffect("waves", { colors: [p0, p1, p2], intensity: 0.55, speed: 0.5, audioReact: 0.3 }),
        createParticles({ direction: "float", colors: [p2], count: 70, size: 3, glow: 0.5 }),
        createArtistName({ font: "space-grotesk", weight: 300, size: 116, letterSpacing: 24, color: p2, glow: 0.3, glowColor: p0, animation: "breathe", audioReact: 0.1 }),
        createOverlay("grain", { intensity: 0.25 }),
        createOverlay("vignette", { intensity: 0.6 }),
      ];
    },
  },
  {
    id: "fractal-bloom",
    name: "Fractal Bloom",
    description: "A twisting tunnel blooming into geometry. Psy-trance approved.",
    category: "psychedelic",
    style: "Geometric",
    energy: "Peak",
    color: "Neon",
    motion: "Tunnel",
    palette: ["#f72585", "#7209b7", "#4cc9f0", "#0b0014"],
    bpm: 145,
    popularity: 80,
    isNew: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "radial", colors: [p1, p3], angle: 0, animate: true }, opacity: 0.6 }),
        createEffect("tunnel", { colors: [p0, p2], intensity: 0.6, angle: 120, audioReact: 0.5 }),
        createEffect("rotatingShapes", { colors: [p2, p0], intensity: 0.4, opacity: 0.6 }),
        createArtistName({ font: "rubik-mono", weight: 400, size: 108, letterSpacing: 4, glow: 0.5, glowColor: p0, animation: "zoom", chromatic: 0.3 }),
        createOverlay("chromatic", { intensity: 0.22 }),
      ];
    },
  },
  {
    id: "gold-rush",
    name: "Gold Rush",
    description: "Champagne glitter and golden type for luxury venues and VIP nights.",
    category: "house",
    style: "Cinematic",
    energy: "Groove",
    color: "Warm",
    motion: "Particles",
    palette: ["#f5c542", "#fff1c1", "#b8860b", "#0a0804"],
    bpm: 123,
    popularity: 73,
    tier: "pro",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "radial", colors: ["#2a1d05", p3], angle: 0, animate: true } }),
        createEffect("radialGlow", { colors: [p2, p0], intensity: 0.35, opacity: 0.5, blendMode: "screen" }),
        createParticles({ name: "Glitter", direction: "down", shape: "cross", colors: [p0, p1], count: 70, size: 6, speed: 0.6, glow: 0.6, twinkle: 0.9 }),
        createArtistName({ font: "syncopate", weight: 700, size: 116, letterSpacing: 26, gradient: { enabled: true, from: p1, to: p0 }, glow: 0.35, glowColor: p0, animation: "breathe", audioReact: 0.15 }),
        subtitle("PRIVATE SESSION", p0, { size: 26, letterSpacing: 30 }),
        createOverlay("vignette", { intensity: 0.75 }),
      ];
    },
  },
];

export const TEMPLATE_MAP: Record<string, TemplateDefinition> = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

export const DEFAULT_TEMPLATE_ID = "signature";

export function getTemplate(id: string | null | undefined): TemplateDefinition | undefined {
  return id ? TEMPLATE_MAP[id] : undefined;
}
