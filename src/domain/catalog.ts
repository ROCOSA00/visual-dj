import type {
  AudioEffectType,
  AudioLayer,
  BlendMode,
  EffectLayer,
  EffectType,
  LayerKind,
  MotionAnimation,
  OverlayLayer,
  OverlayType,
  ParticleDirection,
  ParticleShape,
  ShapeType,
  TextAnimation,
  TextMaterial,
} from "./types";

/**
 * Human-facing metadata for everything the editor can create. The property
 * panel reads these to label controls, so effect-specific wording lives here
 * rather than inside UI components.
 */

export interface Option<T extends string | number = string> {
  value: T;
  label: string;
}

export interface ParamCopy {
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  /** Show as a segmented control instead of a slider. */
  options?: Option<number>[];
}

export interface EffectMeta {
  label: string;
  description: string;
  angle: ParamCopy | null;
  reverse: { label: string; off: string; on: string } | null;
  defaults: Partial<EffectLayer>;
}

export const EFFECTS: Record<EffectType, EffectMeta> = {
  tunnel: {
    label: "Tunnel",
    description: "Endless rings rushing through the screen.",
    angle: { label: "Twist", min: 0, max: 180, unit: "°" },
    reverse: { label: "Direction", off: "Towards you", on: "Away" },
    defaults: { angle: 40 },
  },
  waves: {
    label: "Waves",
    description: "Flowing sine lines that ride the groove.",
    angle: { label: "Angle", min: -90, max: 90, unit: "°" },
    reverse: { label: "Flow", off: "Left → right", on: "Right → left" },
    defaults: {},
  },
  radialGlow: {
    label: "Radial Glow",
    description: "Soft light blooming from the centre.",
    angle: null,
    reverse: null,
    defaults: { blendMode: "screen" },
  },
  grid: {
    label: "Retro Grid",
    description: "Synthwave floor racing to the horizon.",
    angle: null,
    reverse: { label: "Direction", off: "Forward", on: "Backward" },
    defaults: {},
  },
  lasers: {
    label: "Lasers",
    description: "Festival beams sweeping from the stage.",
    angle: { label: "Tilt", min: -40, max: 40, unit: "°" },
    reverse: null,
    defaults: {},
  },
  rotatingShapes: {
    label: "Rotating Shapes",
    description: "Nested geometry spinning in opposite directions.",
    angle: { label: "Offset", min: 0, max: 120, unit: "°" },
    reverse: { label: "Spin", off: "Clockwise", on: "Counter" },
    defaults: {},
  },
  starfield: {
    label: "Hyperspace",
    description: "Warp-speed stars streaking past.",
    angle: null,
    reverse: { label: "Direction", off: "Forward", on: "Reverse" },
    defaults: {},
  },
  pulseRings: {
    label: "Pulse Rings",
    description: "Shockwaves fired on every beat.",
    angle: {
      label: "Ring shape",
      min: 0,
      max: 180,
      options: [
        { value: 0, label: "Circle" },
        { value: 90, label: "Triangle" },
        { value: 120, label: "Square" },
        { value: 180, label: "Hexagon" },
      ],
    },
    reverse: null,
    defaults: {},
  },
  kaleidoscope: {
    label: "Kaleidoscope",
    description: "Mirrored, ever-unfolding patterns.",
    angle: null,
    reverse: { label: "Flow", off: "Outward", on: "Inward" },
    defaults: {},
  },
  aurora: {
    label: "Aurora",
    description: "Slow, dreamy ribbons of light.",
    angle: null,
    reverse: { label: "Flow", off: "Left", on: "Right" },
    defaults: { speed: 0.6 },
  },
  sun: {
    label: "Retro Sun",
    description: "Striped 80s sun sinking into the horizon.",
    angle: { label: "Height", min: -180, max: 180 },
    reverse: { label: "Stripes", off: "Down", on: "Up" },
    defaults: { colors: ["#ffd23f", "#ff2e88"], audioReact: 0.15 },
  },
  spiral: {
    label: "Spiral",
    description: "Hypnotic arms of glowing dots.",
    angle: null,
    reverse: { label: "Spin", off: "Clockwise", on: "Counter" },
    defaults: {},
  },
  dataRain: {
    label: "Data Rain",
    description: "Cascading code in the dark.",
    angle: null,
    reverse: null,
    defaults: { colors: ["#22ff88", "#eafff2"], intensity: 0.5 },
  },
  marquee: {
    label: "Name Marquee",
    description: "Your name repeated in rows, scrolling across the screen.",
    angle: { label: "Tilt", min: -30, max: 30, unit: "°" },
    reverse: { label: "Direction", off: "Default", on: "Flipped" },
    defaults: { intensity: 0.4, opacity: 0.35, audioReact: 0.5, font: "anton", text: "" },
  },
  rays: {
    label: "Light Rays",
    description: "Stage beams fanning out and pulsing on the kick.",
    angle: { label: "Source height", min: -180, max: 180 },
    reverse: { label: "Spin", off: "Clockwise", on: "Counter" },
    defaults: { intensity: 0.55, audioReact: 0.7, speed: 0.6 },
  },
  shards: {
    label: "Ice Shards",
    description: "Crystal fragments flying towards the crowd.",
    angle: null,
    reverse: { label: "Direction", off: "Outward", on: "Inward" },
    defaults: { intensity: 0.5, audioReact: 0.6 },
  },
  smoke: {
    label: "Stage Smoke",
    description: "Slow haze rolling across the floor.",
    angle: null,
    reverse: { label: "Drift", off: "Left", on: "Right" },
    defaults: { intensity: 0.5, speed: 0.6, audioReact: 0.3 },
  },
};

export interface OverlayMeta {
  label: string;
  description: string;
  colorLabel: string | null;
  animated: boolean;
  angle: ParamCopy | null;
  defaults: Partial<OverlayLayer>;
}

export const OVERLAYS: Record<OverlayType, OverlayMeta> = {
  scanlines: {
    label: "Scanlines",
    description: "Fine horizontal lines like an old monitor.",
    colorLabel: "Line colour",
    animated: true,
    angle: null,
    defaults: { intensity: 0.35, speed: 0.5 },
  },
  grain: {
    label: "Film Grain",
    description: "Organic noise texture that adds depth.",
    colorLabel: null,
    animated: false,
    angle: null,
    defaults: { intensity: 0.35 },
  },
  vignette: {
    label: "Vignette",
    description: "Darkened edges that focus the eye.",
    colorLabel: "Tint",
    animated: false,
    angle: null,
    defaults: { intensity: 0.7, color: "#000000" },
  },
  chromatic: {
    label: "Chromatic Split",
    description: "RGB separation that kicks with the beat.",
    colorLabel: null,
    animated: false,
    angle: { label: "Angle", min: 0, max: 180, unit: "°" },
    defaults: { intensity: 0.35 },
  },
  ledGrid: {
    label: "LED Screen",
    description: "Pixel mesh of a real LED wall.",
    colorLabel: null,
    animated: false,
    angle: null,
    defaults: { intensity: 0.45 },
  },
  vhs: {
    label: "VHS",
    description: "Tracking bands, colour bleed and tape noise.",
    colorLabel: null,
    animated: true,
    angle: null,
    defaults: { intensity: 0.5 },
  },
  crt: {
    label: "CRT Tube",
    description: "Curved glass, rolling bar and scanlines.",
    colorLabel: null,
    animated: true,
    angle: null,
    defaults: { intensity: 0.6 },
  },
  lightLeak: {
    label: "Light Leak",
    description: "Warm film burns drifting at the edges.",
    colorLabel: "Leak colour",
    animated: true,
    angle: null,
    defaults: { intensity: 0.55, color: "#ff4fa3", speed: 0.6 },
  },
  hud: {
    label: "HUD Frame",
    description: "Sci-fi frame with timecode and BPM readout.",
    colorLabel: "HUD colour",
    animated: false,
    angle: null,
    defaults: { intensity: 0.6, color: "#7cf7ff" },
  },
  glitch: {
    label: "Glitch",
    description: "Digital tears and displaced slices.",
    colorLabel: "Block colour",
    animated: true,
    angle: null,
    defaults: { intensity: 0.5, color: "#ff2bd6" },
  },
  grade: {
    label: "Colour Grade",
    description: "Repaint the whole visual in a single colour.",
    colorLabel: "Grade colour",
    animated: false,
    angle: null,
    defaults: { intensity: 0.85, color: "#1e6bff" },
  },
  flare: {
    label: "Lens Flare",
    description: "Anamorphic light streak that flares on the beat.",
    colorLabel: "Flare colour",
    animated: true,
    angle: { label: "Height", min: -180, max: 180 },
    defaults: { intensity: 0.6, color: "#4da3ff" },
  },
};

export interface AudioEffectMeta {
  label: string;
  description: string;
  placements: AudioLayer["placement"][];
  drawsColor: boolean;
  defaults: Partial<AudioLayer>;
  /** Flashing content; we show a photosensitivity notice. */
  flashing?: boolean;
}

export const AUDIO_EFFECTS: Record<AudioEffectType, AudioEffectMeta> = {
  bassPulse: {
    label: "Bass Pulse",
    description: "The whole visual breathes with the kick drum.",
    placements: [],
    drawsColor: false,
    defaults: { intensity: 0.5 },
  },
  beatFlash: {
    label: "Beat Flash",
    description: "A burst of light on every beat.",
    placements: [],
    drawsColor: true,
    defaults: { colors: ["#ffffff"], intensity: 0.45 },
    flashing: true,
  },
  waveform: {
    label: "Waveform",
    description: "Live oscilloscope line of your sound.",
    placements: ["bottom", "center", "top", "circle"],
    drawsColor: true,
    defaults: { placement: "center", band: "full" },
  },
  frequencyBars: {
    label: "Frequency Bars",
    description: "Classic equaliser bars dancing to the mix.",
    placements: ["bottom", "center", "top", "circle"],
    drawsColor: true,
    defaults: { placement: "bottom", band: "full", opacity: 0.85 },
  },
  particleBurst: {
    label: "Particle Burst",
    description: "Sparks exploding on each kick.",
    placements: ["center", "bottom"],
    drawsColor: true,
    defaults: { placement: "center" },
  },
  strobe: {
    label: "Strobe",
    description: "Hard white flashes for peak-time drops.",
    placements: [],
    drawsColor: true,
    defaults: { colors: ["#ffffff"], intensity: 0.6, sensitivity: 0.4 },
    flashing: true,
  },
  cameraShake: {
    label: "Camera Shake",
    description: "The stage jolts with heavy hits.",
    placements: [],
    drawsColor: false,
    defaults: { intensity: 0.45 },
  },
};

export const SHAPES: Record<ShapeType, { label: string }> = {
  circle: { label: "Circle" },
  ring: { label: "Ring" },
  square: { label: "Square" },
  triangle: { label: "Triangle" },
  hexagon: { label: "Hexagon" },
  diamond: { label: "Diamond" },
  star: { label: "Star" },
  cross: { label: "Cross" },
  line: { label: "Line" },
};

export const LAYER_KIND_LABELS: Record<LayerKind, string> = {
  background: "Background",
  text: "Text",
  logo: "Logo",
  image: "Image",
  video: "Video",
  shape: "Shape",
  effect: "Effect",
  overlay: "Overlay",
  particles: "Particles",
  audio: "Audio Reactive",
};

export const TEXT_ANIMATIONS: Option<TextAnimation>[] = [
  { value: "none", label: "None" },
  { value: "punch", label: "Beat punch" },
  { value: "swing", label: "3D swing" },
  { value: "spin3d", label: "3D spin" },
  { value: "pulse", label: "Pulse" },
  { value: "float", label: "Float" },
  { value: "breathe", label: "Breathe" },
  { value: "flicker", label: "Neon flicker" },
  { value: "glitch", label: "Glitch" },
  { value: "typewriter", label: "Typewriter" },
  { value: "zoom", label: "Zoom" },
  { value: "wave", label: "Wave" },
  { value: "slide", label: "Slide in" },
];

export const TEXT_MATERIALS: Option<TextMaterial>[] = [
  { value: "solid", label: "Flat colour" },
  { value: "ice", label: "Ice crystal" },
  { value: "chrome", label: "Chrome" },
  { value: "gold", label: "Gold" },
  { value: "neon", label: "Neon tube" },
  { value: "fire", label: "Fire" },
];

export const MOTION_ANIMATIONS: Option<MotionAnimation>[] = [
  { value: "none", label: "None" },
  { value: "pulse", label: "Pulse" },
  { value: "float", label: "Float" },
  { value: "spin", label: "Spin" },
  { value: "zoom", label: "Zoom" },
  { value: "breathe", label: "Breathe" },
  { value: "glitch", label: "Glitch" },
];

export const PARTICLE_DIRECTIONS: Option<ParticleDirection>[] = [
  { value: "up", label: "Rise" },
  { value: "down", label: "Fall" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "outward", label: "Warp" },
  { value: "float", label: "Drift" },
];

export const PARTICLE_SHAPES: Option<ParticleShape>[] = [
  { value: "dot", label: "Dot" },
  { value: "spark", label: "Spark" },
  { value: "line", label: "Streak" },
  { value: "square", label: "Square" },
  { value: "ring", label: "Ring" },
  { value: "cross", label: "Cross" },
];

export const BLEND_MODES: Option<BlendMode>[] = [
  { value: "normal", label: "Normal" },
  { value: "screen", label: "Screen" },
  { value: "lighter", label: "Add (glow)" },
  { value: "overlay", label: "Overlay" },
  { value: "soft-light", label: "Soft light" },
  { value: "multiply", label: "Multiply" },
  { value: "color-dodge", label: "Color dodge" },
  { value: "difference", label: "Difference" },
];
