import { brand } from "@/config/brand";
import {
  createArtistName,
  createAudioLayer,
  createBackground,
  createEffect,
  createOverlay,
  createParticles,
  createShape,
  createText,
} from "@/domain/factories";
import type { TemplateDefinition } from "@/domain/templates";
import type { Layer, TextLayer } from "@/domain/types";

const STUDIO = `${brand.name} Studio`;

/*
 * The template library, built in the style of real DJ tour visuals: the
 * artist name is the hero (big, extruded 3D letters with a finish), the whole
 * frame is graded to one or two colours, and lights, shards, smoke and flashes
 * hit with the beat. Each template uses its palette so swapping the palette
 * later recolours the whole set. Layer order is bottom → top.
 */

/** The hero: the artist name in big 3D letters. */
const heroName = (p: Partial<TextLayer>) =>
  createArtistName({
    font: "archivo-black",
    weight: 400,
    size: 230,
    letterSpacing: 4,
    depth: 0.85,
    glow: 0.5,
    audioReact: 0.35,
    animation: "punch",
    ...p,
  });

/** Small spaced tag under the name ("TOUR 2025", "LIVE"...). */
const tag = (content: string, color: string, p: Partial<TextLayer> = {}) =>
  createText({
    name: "Tag",
    content,
    font: "michroma",
    size: 30,
    weight: 400,
    letterSpacing: 26,
    color,
    glow: 0.35,
    glowColor: color,
    transform: { x: 0.5, y: 0.72, scale: 1, rotation: 0 },
    ...p,
  });

/** Standard finishing stack: optional mono grade, flare, vignette and grain. */
const finish = (opts: { grade?: string; gradeAmount?: number; flare?: string; grain?: number; vignette?: number }): Layer[] => [
  ...(opts.flare ? [createOverlay("flare", { color: opts.flare, intensity: 0.5 })] : []),
  ...(opts.grade ? [createOverlay("grade", { color: opts.grade, intensity: opts.gradeAmount ?? 0.75 })] : []),
  createOverlay("vignette", { intensity: opts.vignette ?? 0.7 }),
  createOverlay("grain", { intensity: opts.grain ?? 0.22 }),
];

const black = (color = "#000000") => createBackground({ mode: "solid", color });

export const TEMPLATES: TemplateDefinition[] = [
  /* ---------------------------------- URBAN ---------------------------------- */
  {
    id: "ice-land",
    name: "Ice Land",
    description: "Glacial blue tour look: cracked-ice 3D name, crystal shards, cold light rays and a full blue grade.",
    category: "urban",
    style: "Cinematic",
    energy: "Peak",
    color: "Cool",
    motion: "Particles",
    palette: ["#2b8cff", "#bfe3ff", "#4dd2ff", "#00040d"],
    bpm: 100,
    popularity: 99,
    featured: true,
    isNew: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        black(p3),
        createEffect("marquee", { colors: [p0], opacity: 0.12, intensity: 0.45, font: "archivo-black" }),
        createEffect("smoke", { colors: [p0, p2], intensity: 0.3, opacity: 0.4 }),
        createEffect("rays", { colors: [p0, p2], intensity: 0.45, opacity: 0.6 }),
        createEffect("shards", { colors: [p0, p1], intensity: 0.45 }),
        heroName({ material: "ice", color: p0, glowColor: p0, animation: "swing", depth: 0.9 }),
        tag("TOUR 2025", p1),
        createAudioLayer("bassPulse", { intensity: 0.45 }),
        createAudioLayer("beatFlash", { colors: [p0], intensity: 0.18 }),
        ...finish({ flare: "#4da3ff", grade: "#1e6bff", gradeAmount: 0.6, vignette: 0.85 }),
      ];
    },
  },
  {
    id: "chrome-perreo",
    name: "Chrome Perreo",
    description: "Liquid-chrome name spinning in 3D over white beams and sparks. Peak-time reggaeton energy.",
    category: "urban",
    style: "Glitch",
    energy: "Peak",
    color: "Mono",
    motion: "Lasers",
    palette: ["#ffffff", "#9aa4b2", "#ff2bd6", "#050507"],
    bpm: 98,
    popularity: 97,
    featured: true,
    isNew: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        black(p3),
        createEffect("marquee", { colors: [p1], opacity: 0.14, intensity: 0.6, font: "anton" }),
        createEffect("rays", { colors: [p0], intensity: 0.4, opacity: 0.55 }),
        createParticles({ name: "Sparks", direction: "outward", shape: "spark", colors: [p0, p2], count: 90, size: 3.5, speed: 1.4, glow: 0.7 }),
        heroName({ material: "chrome", color: p0, glowColor: p0, glow: 0.3, animation: "spin3d", depth: 0.8 }),
        tag("EN VIVO", p2, { font: "chakra", weight: 700, letterSpacing: 30 }),
        createAudioLayer("bassPulse", { intensity: 0.5 }),
        createAudioLayer("strobe", { intensity: 0.3, sensitivity: 0.3 }),
        createOverlay("glitch", { intensity: 0.35, color: p2 }),
        ...finish({ grain: 0.3 }),
      ];
    },
  },
  {
    id: "dembow-fuego",
    name: "Dembow Fuego",
    description: "Burning 3D letters, embers and heat. For when the whole club is jumping.",
    category: "urban",
    style: "Cinematic",
    energy: "Peak",
    color: "Warm",
    motion: "Particles",
    palette: ["#ff5a00", "#ffc400", "#ff1f3d", "#0a0200"],
    bpm: 115,
    popularity: 94,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        black(p3),
        createEffect("smoke", { colors: [p2, p0], intensity: 0.5, opacity: 0.7 }),
        createEffect("rays", { colors: [p0, p1], intensity: 0.45, opacity: 0.6, angle: 160 }),
        createParticles({ name: "Embers", direction: "up", shape: "spark", colors: [p1, p0], count: 120, size: 4, speed: 1.6, glow: 0.8 }),
        heroName({ material: "fire", color: p0, glowColor: p0, glow: 0.6, font: "anton", size: 250, letterSpacing: 8 }),
        createAudioLayer("particleBurst", { colors: [p1, p0], intensity: 0.5 }),
        createAudioLayer("bassPulse", { intensity: 0.5 }),
        createAudioLayer("beatFlash", { colors: [p0], intensity: 0.2 }),
        ...finish({ flare: p0 }),
      ];
    },
  },
  {
    id: "neon-barrio",
    name: "Neon Barrio",
    description: "Pink and cyan neon, your name looping in rows and a grid floor racing to the horizon.",
    category: "urban",
    style: "Neon",
    energy: "Peak",
    color: "Neon",
    motion: "Grid",
    palette: ["#ff2bd6", "#00f0ff", "#fffb00", "#08000f"],
    bpm: 96,
    popularity: 93,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, , p3] = this.palette;
      return [
        black(p3),
        createEffect("marquee", { colors: [p0, p1], opacity: 0.3, intensity: 0.55, font: "rubik-mono", angle: -8 }),
        createEffect("grid", { colors: [p0, p1], intensity: 0.6, opacity: 0.85 }),
        heroName({ material: "neon", color: p1, glowColor: p1, glow: 0.8, depth: 0.4, font: "rubik-mono", size: 170 }),
        createAudioLayer("bassPulse", { intensity: 0.45 }),
        createOverlay("chromatic", { intensity: 0.3 }),
        createOverlay("scanlines", { intensity: 0.3 }),
        ...finish({ flare: p0 }),
      ];
    },
  },
  {
    id: "gold-vip",
    name: "Gold VIP",
    description: "Solid-gold 3D name, champagne glitter and warm beams. Made for VIP tables and big nights.",
    category: "urban",
    style: "Cinematic",
    energy: "Groove",
    color: "Warm",
    motion: "Particles",
    palette: ["#f5c542", "#fff1c1", "#b8860b", "#070502"],
    bpm: 102,
    popularity: 90,
    tier: "pro",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "radial", colors: ["#241803", p3], angle: 0, animate: true } }),
        createEffect("rays", { colors: [p0, p2], intensity: 0.4, opacity: 0.6 }),
        createParticles({ name: "Glitter", direction: "down", shape: "cross", colors: [p0, p1], count: 80, size: 6, speed: 0.6, glow: 0.6, twinkle: 0.9 }),
        heroName({ material: "gold", color: p0, glowColor: p0, glow: 0.4, animation: "swing", font: "syncopate", weight: 700, size: 150, letterSpacing: 18 }),
        tag("PRIVATE SESSION", p1),
        createAudioLayer("bassPulse", { intensity: 0.35 }),
        ...finish({ flare: p0, vignette: 0.8 }),
      ];
    },
  },
  {
    id: "purple-haze",
    name: "Purple Haze",
    description: "Violet smoke, soft beams and a chrome-violet name floating in 3D. Smooth afro and late-night vibes.",
    category: "urban",
    style: "Organic",
    energy: "Groove",
    color: "Cool",
    motion: "Gradient",
    palette: ["#b46cff", "#ff4ecd", "#e9d5ff", "#07020d"],
    bpm: 108,
    popularity: 88,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        black(p3),
        createEffect("smoke", { colors: [p0, p1], intensity: 0.75, opacity: 0.9 }),
        createEffect("rays", { colors: [p0], intensity: 0.35, opacity: 0.5, angle: -150 }),
        heroName({ material: "chrome", color: p0, glowColor: p0, glow: 0.45, animation: "swing", font: "unbounded", weight: 900, size: 190 }),
        tag("AFTER HOURS", p2),
        createAudioLayer("bassPulse", { intensity: 0.3 }),
        ...finish({ grade: p0, gradeAmount: 0.5 }),
      ];
    },
  },

  /* ---------------------------------- TECHNO --------------------------------- */
  {
    id: "red-room",
    name: "Red Room",
    description: "Blood-red tunnel, heavy white name punching on every kick, controlled strobe.",
    category: "techno",
    style: "Minimal",
    energy: "Peak",
    color: "Red",
    motion: "Tunnel",
    palette: ["#ff1f3d", "#ffffff", "#ff6b6b", "#050000"],
    bpm: 132,
    popularity: 95,
    featured: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, , p3] = this.palette;
      return [
        black(p3),
        createEffect("tunnel", { colors: [p0, p0, p1], intensity: 0.5, angle: 0, opacity: 0.9, audioReact: 0.6 }),
        heroName({ material: "solid", color: p1, glowColor: p0, glow: 0.35, font: "big-shoulders", weight: 900, size: 260, letterSpacing: 24, depth: 0.6 }),
        tag("WAREHOUSE · 04:00", p0, { font: "chakra", weight: 600 }),
        createAudioLayer("bassPulse", { intensity: 0.5 }),
        createAudioLayer("strobe", { intensity: 0.3, sensitivity: 0.3 }),
        createOverlay("scanlines", { intensity: 0.3 }),
        ...finish({ grade: p0, gradeAmount: 0.55, vignette: 0.85 }),
      ];
    },
  },
  {
    id: "blackout",
    name: "Blackout",
    description: "Pure black and white. Hard shards, strobe hits and heavy grain for dark rooms.",
    category: "techno",
    style: "Minimal",
    energy: "Peak",
    color: "Mono",
    motion: "Glitch",
    palette: ["#ffffff", "#8a8a8a", "#d4d4d4", "#000000"],
    bpm: 136,
    popularity: 87,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, , p3] = this.palette;
      return [
        black(p3),
        createEffect("shards", { colors: [p0, p1], intensity: 0.55 }),
        heroName({ material: "solid", color: p0, glowColor: p0, glow: 0.2, font: "anton", size: 260, letterSpacing: 10, depth: 0.7, animation: "glitch" }),
        createAudioLayer("strobe", { intensity: 0.4, sensitivity: 0.4 }),
        createAudioLayer("cameraShake", { intensity: 0.35 }),
        createOverlay("glitch", { intensity: 0.4, color: p0 }),
        ...finish({ grain: 0.5, vignette: 0.8 }),
      ];
    },
  },
  {
    id: "acid-test",
    name: "Acid Test",
    description: "Toxic green waves, a neon tube name spinning in 3D and digital tears.",
    category: "techno",
    style: "Neon",
    energy: "Peak",
    color: "Acid",
    motion: "Waves",
    palette: ["#b6ff00", "#00ff9c", "#f0ff4f", "#020600"],
    bpm: 138,
    popularity: 84,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        black(p3),
        createEffect("waves", { colors: [p0, p1, p2], intensity: 0.7, angle: -10, audioReact: 0.5 }),
        heroName({ material: "neon", color: p0, glowColor: p0, glow: 0.8, depth: 0.5, font: "rubik-mono", size: 170, animation: "spin3d" }),
        createAudioLayer("bassPulse", { intensity: 0.4 }),
        createOverlay("glitch", { intensity: 0.3, color: p0 }),
        ...finish({ grade: p0, gradeAmount: 0.45 }),
      ];
    },
  },

  /* ----------------------------------- EDM ----------------------------------- */
  {
    id: "main-stage",
    name: "Main Stage",
    description: "Festival lasers, EQ bars and a cyan-chrome name punching on the drop.",
    category: "edm",
    style: "Neon",
    energy: "Peak",
    color: "Neon",
    motion: "Lasers",
    palette: ["#00e5ff", "#ff2bd6", "#ffe600", "#03000a"],
    bpm: 128,
    popularity: 96,
    featured: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        black(p3),
        createEffect("lasers", { colors: [p0, p1, p2], intensity: 0.7, audioReact: 0.7 }),
        createAudioLayer("frequencyBars", { colors: [p0, p1], intensity: 0.5, opacity: 0.7 }),
        heroName({ material: "chrome", color: p0, glowColor: p1, glow: 0.5, font: "unbounded", weight: 900, size: 190, transform: { x: 0.5, y: 0.45, scale: 1, rotation: 0 } }),
        createAudioLayer("beatFlash", { colors: ["#ffffff"], intensity: 0.22 }),
        ...finish({ flare: p0 }),
      ];
    },
  },
  {
    id: "hyperdrive",
    name: "Hyperdrive",
    description: "Warp-speed stars, a spinning ice name and a cyan flare. The drop that never ends.",
    category: "edm",
    style: "Cinematic",
    energy: "Peak",
    color: "Cool",
    motion: "Particles",
    palette: ["#7df9ff", "#ff4fd8", "#ffffff", "#01010a"],
    bpm: 130,
    popularity: 89,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        black(p3),
        createEffect("starfield", { colors: [p0, p1, p2], intensity: 0.75, speed: 1.2, audioReact: 0.6 }),
        heroName({ material: "ice", color: p0, glowColor: p0, glow: 0.6, font: "orbitron", weight: 900, size: 170, animation: "spin3d" }),
        createAudioLayer("bassPulse", { intensity: 0.45 }),
        ...finish({ flare: p0, grade: "#00b8ff", gradeAmount: 0.35 }),
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
    popularity: 86,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        black(p3),
        createEffect("waves", { colors: [p0, p1, p2], intensity: 0.8, audioReact: 0.6, opacity: 0.85 }),
        createParticles({ name: "Embers", direction: "up", shape: "spark", colors: [p1, p0], count: 100, size: 4, speed: 1.6, glow: 0.8 }),
        heroName({ material: "fire", color: p0, glowColor: p0, glow: 0.55, font: "anton", size: 240, letterSpacing: 10 }),
        createAudioLayer("particleBurst", { colors: [p1, p0], intensity: 0.6 }),
        createAudioLayer("beatFlash", { colors: [p1], intensity: 0.2 }),
        ...finish({ flare: p1 }),
      ];
    },
  },

  /* ---------------------------------- HOUSE ---------------------------------- */
  {
    id: "sunset-chrome",
    name: "Sunset Chrome",
    description: "Golden-hour gradient, bokeh and a pink-chrome name swaying in 3D. Rooftops and beach clubs.",
    category: "house",
    style: "Organic",
    energy: "Groove",
    color: "Warm",
    motion: "Gradient",
    palette: ["#ff7a3d", "#ff3d81", "#ffd166", "#1a0610"],
    bpm: 122,
    popularity: 91,
    featured: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "linear", colors: [p3, p1, p0], angle: 90, animate: true }, animationSpeed: 0.6, opacity: 0.85 }),
        createParticles({ name: "Bokeh", direction: "float", colors: [p2, "#ffffff"], count: 30, size: 14, glow: 0.9, twinkle: 0.6, opacity: 0.6 }),
        heroName({ material: "chrome", color: p1, glowColor: p1, glow: 0.4, animation: "swing", font: "syne", weight: 800, size: 200, letterSpacing: 2 }),
        tag("SUNSET SESSIONS", p2),
        ...finish({ flare: p2, vignette: 0.55 }),
      ];
    },
  },
  {
    id: "velvet",
    name: "Velvet",
    description: "Deep purple haze and a slow golden name. Elegant, late-night house.",
    category: "house",
    style: "Cinematic",
    energy: "Chill",
    color: "Cool",
    motion: "Gradient",
    palette: ["#9d4dff", "#ff4ecd", "#f5c542", "#0b0414"],
    bpm: 120,
    popularity: 80,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2] = this.palette;
      return [
        createBackground({ gradient: { type: "mesh", colors: ["#2a0b5e", p0, p1], angle: 0, animate: true }, opacity: 0.45, animationSpeed: 0.6 }),
        createEffect("smoke", { colors: [p0, p1], intensity: 0.5, opacity: 0.8 }),
        heroName({ material: "gold", color: p2, glowColor: p2, glow: 0.35, animation: "swing", animationSpeed: 0.6, font: "syncopate", weight: 700, size: 130, letterSpacing: 20, depth: 0.6 }),
        tag("ALL NIGHT LONG", "#f5e9ff"),
        ...finish({ vignette: 0.75 }),
      ];
    },
  },

  /* -------------------------------- CYBERPUNK -------------------------------- */
  {
    id: "cyber-ice",
    name: "Cyber Ice",
    description: "Frozen cyan letters with magenta neon details, a HUD frame and glitch tears.",
    category: "cyberpunk",
    style: "Glitch",
    energy: "Peak",
    color: "Neon",
    motion: "Grid",
    palette: ["#4dd2ff", "#ff2bd6", "#e6faff", "#01030a"],
    bpm: 128,
    popularity: 92,
    featured: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        black(p3),
        createEffect("grid", { colors: [p1, p0], intensity: 0.75, opacity: 0.8 }),
        createEffect("shards", { colors: [p0, p2], intensity: 0.35 }),
        heroName({ material: "ice", color: p0, glowColor: p0, glow: 0.6, font: "orbitron", weight: 900, size: 170, animation: "glitch", chromatic: 0.15, transform: { x: 0.5, y: 0.42, scale: 1, rotation: 0 } }),
        tag("SYSTEM ONLINE", p1, { font: "chakra", weight: 600, transform: { x: 0.5, y: 0.6, scale: 1, rotation: 0 } }),
        createOverlay("hud", { intensity: 0.55, color: p0 }),
        createOverlay("glitch", { intensity: 0.3, color: p1 }),
        createOverlay("scanlines", { intensity: 0.25 }),
        ...finish({ flare: p0 }),
      ];
    },
  },
  {
    id: "hologram",
    name: "Hologram",
    description: "Cascading code and a flickering cyan neon name, like a transmission from the future.",
    category: "cyberpunk",
    style: "Glitch",
    energy: "Groove",
    color: "Cool",
    motion: "Glitch",
    palette: ["#22e6ff", "#eafcff", "#0077ff", "#00050a"],
    bpm: 124,
    popularity: 82,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, , p3] = this.palette;
      return [
        black(p3),
        createEffect("dataRain", { colors: [p0, p1], intensity: 0.5, opacity: 0.55 }),
        heroName({ material: "neon", color: p0, glowColor: p0, glow: 0.8, font: "major-mono", size: 150, depth: 0.3, animation: "flicker", uppercase: false }),
        createOverlay("scanlines", { intensity: 0.4 }),
        createOverlay("glitch", { intensity: 0.35, color: p0 }),
        ...finish({ grade: p0, gradeAmount: 0.4 }),
      ];
    },
  },

  /* ------------------------------- PSYCHEDELIC ------------------------------- */
  {
    id: "kaleido",
    name: "Kaleido",
    description: "Mirrored colour storms and a magenta-chrome name spinning through them.",
    category: "psychedelic",
    style: "Geometric",
    energy: "Peak",
    color: "Neon",
    motion: "Geometry",
    palette: ["#ff00c8", "#00ffd5", "#ffe600", "#12001f"],
    bpm: 140,
    popularity: 83,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2] = this.palette;
      return [
        black("#0a0012"),
        createEffect("kaleidoscope", { colors: [p0, p1, p2], intensity: 0.6, opacity: 0.8 }),
        heroName({ material: "chrome", color: p0, glowColor: p0, glow: 0.5, animation: "spin3d", font: "audiowide", size: 170 }),
        createOverlay("chromatic", { intensity: 0.3 }),
        ...finish({ vignette: 0.75 }),
      ];
    },
  },
  {
    id: "fractal-gold",
    name: "Fractal Gold",
    description: "A twisting tunnel blooming behind a golden name. Hypnotic and huge.",
    category: "psychedelic",
    style: "Geometric",
    energy: "Peak",
    color: "Warm",
    motion: "Tunnel",
    palette: ["#f72585", "#7209b7", "#ffd36b", "#0b0014"],
    bpm: 145,
    popularity: 78,
    isNew: true,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "radial", colors: [p1, p3], angle: 0, animate: true }, opacity: 0.6 }),
        createEffect("tunnel", { colors: [p0, p2], intensity: 0.6, angle: 120, audioReact: 0.5 }),
        heroName({ material: "gold", color: p2, glowColor: p2, glow: 0.45, animation: "punch", font: "rubik-mono", size: 150 }),
        ...finish({ flare: p0 }),
      ];
    },
  },

  /* ---------------------------------- RETRO ---------------------------------- */
  {
    id: "outrun-chrome",
    name: "Outrun Chrome",
    description: "Striped 80s sun, neon grid and a classic chrome name. Press play on the cassette.",
    category: "retro",
    style: "Retro",
    energy: "Groove",
    color: "Warm",
    motion: "Grid",
    palette: ["#ff2e88", "#ffd23f", "#00e1ff", "#14002b"],
    bpm: 118,
    popularity: 90,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "linear", colors: [p3, "#3d0a5c", "#7a1257"], angle: 90, animate: false } }),
        createEffect("sun", { colors: [p1, p0], intensity: 0.6 }),
        createEffect("grid", { colors: [p0, p0], intensity: 0.55, audioReact: 0.3 }),
        heroName({ material: "chrome", color: p2, glowColor: p2, glow: 0.5, animation: "swing", font: "monoton", size: 150, depth: 0.5, transform: { x: 0.5, y: 0.22, scale: 1, rotation: 0 } }),
        createOverlay("scanlines", { intensity: 0.25 }),
        ...finish({ vignette: 0.55 }),
      ];
    },
  },
  {
    id: "vhs-tape",
    name: "VHS Tape",
    description: "Warm tape colours, tracking bands and your name looping in rows. Nostalgia on loop.",
    category: "retro",
    style: "Retro",
    energy: "Chill",
    color: "Warm",
    motion: "Glitch",
    palette: ["#ffb37a", "#ff6f91", "#7af0ff", "#140b0b"],
    bpm: 108,
    popularity: 76,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, , p3] = this.palette;
      return [
        createBackground({ gradient: { type: "mesh", colors: [p0, p1, p3], angle: 0, animate: true }, opacity: 0.45 }),
        createEffect("marquee", { colors: [p0, p1], opacity: 0.3, intensity: 0.5, font: "audiowide" }),
        heroName({ material: "solid", color: "#ffffff", glowColor: p1, glow: 0.3, font: "audiowide", size: 150, depth: 0.5, animation: "punch", chromatic: 0.35 }),
        createText({ name: "Tape label", content: "PLAY ▶", font: "chakra", size: 40, weight: 600, letterSpacing: 6, align: "left", transform: { x: 0.06, y: 0.1, scale: 1, rotation: 0 } }),
        createOverlay("vhs", { intensity: 0.55 }),
        ...finish({ grain: 0.4, vignette: 0.6 }),
      ];
    },
  },

  /* -------------------------------- INDUSTRIAL ------------------------------- */
  {
    id: "steel-foundry",
    name: "Steel Foundry",
    description: "Steel-chrome block letters, hex plating and sparks. The room shakes on every hit.",
    category: "industrial",
    style: "Cinematic",
    energy: "Peak",
    color: "Mono",
    motion: "Particles",
    palette: ["#ff7a00", "#9aa4b2", "#ffd2a6", "#08080a"],
    bpm: 140,
    popularity: 81,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ mode: "solid", color: p3, pattern: "hex", patternColor: p1, patternOpacity: 0.1, patternScale: 1.2, animationSpeed: 0.4 }),
        createEffect("rays", { colors: [p0], intensity: 0.3, opacity: 0.45, angle: 170 }),
        createParticles({ name: "Sparks", direction: "up", shape: "spark", colors: [p0, p2], count: 90, size: 4, speed: 1.5, glow: 0.7 }),
        heroName({ material: "chrome", color: p1, glowColor: p0, glow: 0.25, font: "archivo-black", size: 200, depth: 1 }),
        createAudioLayer("cameraShake", { intensity: 0.45 }),
        createAudioLayer("bassPulse", { intensity: 0.4 }),
        ...finish({ grain: 0.4, vignette: 0.85 }),
      ];
    },
  },

  /* --------------------------------- MINIMAL --------------------------------- */
  {
    id: "mono-line",
    name: "Mono Line",
    description: "Thin white rings and a widely spaced neon name. Quiet confidence.",
    category: "minimal",
    style: "Minimal",
    energy: "Chill",
    color: "Mono",
    motion: "Geometry",
    palette: ["#ffffff", "#9ca3af", "#e5e7eb", "#000000"],
    bpm: 124,
    popularity: 74,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, , p3] = this.palette;
      return [
        black(p3),
        createShape("ring", { size: 560, strokeWidth: 2, repeat: 4, color: p1, animation: "spin", animationSpeed: 0.4, glow: 0.15, audioReact: 0.15 }),
        heroName({ material: "neon", color: p0, glowColor: p0, glow: 0.4, font: "michroma", size: 84, letterSpacing: 50, depth: 0, animation: "none", audioReact: 0.1 }),
        ...finish({ grain: 0.3 }),
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
    color: "Red",
    motion: "Geometry",
    palette: ["#f5f5f4", "#a8a29e", "#ff4d2e", "#0c0a09"],
    bpm: 126,
    popularity: 72,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        black(p3),
        createEffect("pulseRings", { colors: [p1], intensity: 0.2, opacity: 0.35 }),
        createShape("circle", { filled: true, color: p2, size: 380, animation: "pulse", glow: 0.5, audioReact: 0.3 }),
        heroName({ material: "solid", color: p0, glow: 0, font: "space-grotesk", weight: 700, size: 120, letterSpacing: 6, depth: 0, animation: "none", audioReact: 0.1, blendMode: "difference" }),
        ...finish({ grain: 0.35, vignette: 0.5 }),
      ];
    },
  },

  /* --------------------------------- AMBIENT --------------------------------- */
  {
    id: "arctic",
    name: "Arctic",
    description: "Northern lights over a slow, breathing ice name. Openings, sunrises and deep sets.",
    category: "ambient",
    style: "Organic",
    energy: "Chill",
    color: "Cool",
    motion: "Waves",
    palette: ["#4ade80", "#22d3ee", "#a78bfa", "#020617"],
    bpm: 110,
    popularity: 85,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "linear", colors: [p3, "#06152b"], angle: 90, animate: false } }),
        createEffect("aurora", { colors: [p0, p1, p2], intensity: 0.7, speed: 0.5 }),
        createParticles({ name: "Stars", direction: "float", colors: ["#ffffff"], count: 110, size: 2, glow: 0.3, twinkle: 0.9, audioReact: 0.1 }),
        heroName({ material: "ice", color: p1, glowColor: p1, glow: 0.4, font: "syncopate", weight: 700, size: 110, letterSpacing: 24, depth: 0.5, animation: "breathe", audioReact: 0.1 }),
        ...finish({ grain: 0.25, vignette: 0.6 }),
      ];
    },
  },
  {
    id: "deep-space",
    name: "Deep Space",
    description: "Drifting through a quiet galaxy with a slow-swinging chrome name.",
    category: "ambient",
    style: "Cinematic",
    energy: "Chill",
    color: "Cool",
    motion: "Particles",
    palette: ["#93c5fd", "#c4b5fd", "#fde68a", "#000005"],
    bpm: 100,
    popularity: 70,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "radial", colors: ["#0b1030", p3], angle: 0, animate: true }, animationSpeed: 0.4 }),
        createEffect("starfield", { colors: [p0, p1, p2], intensity: 0.35, speed: 0.3, audioReact: 0.2 }),
        heroName({ material: "chrome", color: p0, glowColor: p0, glow: 0.3, font: "michroma", size: 90, letterSpacing: 36, depth: 0.4, animation: "swing", animationSpeed: 0.5, audioReact: 0 }),
        ...finish({ flare: p1, vignette: 0.7 }),
      ];
    },
  },

  /* --------------------------------- ABSTRACT -------------------------------- */
  {
    id: "prism",
    name: "Prism",
    description: "Refracted light through spinning geometry around a crystal name.",
    category: "abstract",
    style: "Geometric",
    energy: "Groove",
    color: "Cool",
    motion: "Geometry",
    palette: ["#7c3aed", "#06b6d4", "#f43f5e", "#0a0612"],
    bpm: 124,
    popularity: 79,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2, p3] = this.palette;
      return [
        createBackground({ gradient: { type: "radial", colors: [p0, p3], angle: 0, animate: true }, opacity: 0.5 }),
        createEffect("rotatingShapes", { colors: [p0, p1, p2], intensity: 0.7, audioReact: 0.4 }),
        heroName({ material: "ice", color: p1, glowColor: p1, glow: 0.5, font: "unbounded", weight: 900, size: 170, animation: "swing" }),
        ...finish({ flare: p1 }),
      ];
    },
  },
  {
    id: "signature",
    name: "Signature Glow",
    description: "Velvet gradient, floating dust and a glowing 3D name. A safe bet for any set.",
    category: "abstract",
    style: "Neon",
    energy: "Groove",
    color: "Neon",
    motion: "Gradient",
    palette: ["#8b5cf6", "#22d3ee", "#f472b6", "#07060d"],
    bpm: 124,
    popularity: 77,
    tier: "free",
    author: STUDIO,
    build() {
      const [p0, p1, p2] = this.palette;
      return [
        createBackground({ gradient: { type: "mesh", colors: [p0, p1, p2], angle: 0, animate: true }, opacity: 0.5 }),
        createEffect("rays", { colors: [p0, p2], intensity: 0.35, opacity: 0.5 }),
        createParticles({ name: "Dust", colors: ["#ffffff", p1], count: 100, size: 4, glow: 0.6 }),
        heroName({ material: "chrome", color: p0, glowColor: p0, glow: 0.55, font: "unbounded", weight: 900, size: 180, animation: "swing" }),
        tag("LIVE SET", "#d9d6ff"),
        ...finish({ flare: p1 }),
      ];
    },
  },
];

export const TEMPLATE_MAP: Record<string, TemplateDefinition> = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

/** The look used by "Quick start" and new projects without a template. */
export const DEFAULT_TEMPLATE_ID = "ice-land";

export function getTemplate(id: string | null | undefined): TemplateDefinition | undefined {
  return id ? TEMPLATE_MAP[id] : undefined;
}
