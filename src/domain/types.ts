/**
 * Domain model for Visual DJ.
 *
 * Everything that gets persisted (projects, scenes, layers) is plain JSON so
 * it can move from localStorage to a cloud backend without changes. Media
 * files are never inlined: layers point at a `MediaRef`, and the bytes live
 * in a separate media store (IndexedDB today, object storage later).
 */

export type ID = string;

/** Bump when the persisted shape changes, and add a migration. */
export const PROJECT_SCHEMA_VERSION = 1;

/* -------------------------------------------------------------------------- */
/* Shared primitives                                                           */
/* -------------------------------------------------------------------------- */

export type BlendMode =
  | "normal"
  | "screen"
  | "lighter"
  | "overlay"
  | "multiply"
  | "color-dodge"
  | "soft-light"
  | "difference";

/** Position is normalised to the stage (0..1, centre anchored). */
export interface Transform {
  x: number;
  y: number;
  scale: number;
  /** Degrees. */
  rotation: number;
}

export interface MediaRef {
  assetId: ID;
  name: string;
  type: "image" | "video";
  width?: number;
  height?: number;
}

export type FontId =
  | "unbounded"
  | "syne"
  | "space-grotesk"
  | "inter"
  | "orbitron"
  | "monoton"
  | "bebas"
  | "anton"
  | "archivo-black"
  | "michroma"
  | "audiowide"
  | "syncopate"
  | "major-mono"
  | "rubik-mono"
  | "big-shoulders"
  | "chakra";

export type LayerKind =
  | "background"
  | "text"
  | "logo"
  | "image"
  | "video"
  | "shape"
  | "effect"
  | "overlay"
  | "particles"
  | "audio";

interface LayerBase<K extends LayerKind> {
  id: ID;
  kind: K;
  name: string;
  visible: boolean;
  locked: boolean;
  /** 0..1 */
  opacity: number;
  blendMode: BlendMode;
}

/* -------------------------------------------------------------------------- */
/* Background                                                                  */
/* -------------------------------------------------------------------------- */

export type BackgroundMode = "solid" | "gradient" | "image" | "video";
export type GradientType = "linear" | "radial" | "conic" | "mesh";
export type PatternType = "none" | "grid" | "dots" | "lines" | "diagonal" | "hex";

export interface BackgroundLayer extends LayerBase<"background"> {
  mode: BackgroundMode;
  color: string;
  gradient: {
    type: GradientType;
    colors: string[];
    angle: number;
    animate: boolean;
  };
  media: MediaRef | null;
  mediaFit: "cover" | "contain";
  /** Darkens image/video backgrounds so text stays readable. 0..1 */
  dim: number;
  pattern: PatternType;
  patternColor: string;
  patternOpacity: number;
  patternScale: number;
  animationSpeed: number;
}

/* -------------------------------------------------------------------------- */
/* Text                                                                        */
/* -------------------------------------------------------------------------- */

export type TextAnimation =
  | "none"
  | "punch"
  | "swing"
  | "spin3d"
  | "pulse"
  | "float"
  | "breathe"
  | "flicker"
  | "glitch"
  | "typewriter"
  | "zoom"
  | "wave"
  | "slide";

/** Surface finish of the letters, from flat colour to glossy 3D looks. */
export type TextMaterial = "solid" | "ice" | "chrome" | "gold" | "neon" | "fire";

export interface TextLayer extends LayerBase<"text"> {
  /** "artist" layers always render the project's artist name. */
  role: "text" | "artist";
  content: string;
  font: FontId;
  /** Pixels at 1080p. */
  size: number;
  weight: number;
  color: string;
  gradient: { enabled: boolean; from: string; to: string };
  align: "left" | "center" | "right";
  /** Pixels at 1080p. */
  letterSpacing: number;
  uppercase: boolean;
  outline: boolean;
  /** Letter finish. "solid" uses colour / gradient. */
  material: TextMaterial;
  /** 3D extrusion depth, 0 = flat. 0..1 */
  depth: number;
  transform: Transform;
  animation: TextAnimation;
  animationSpeed: number;
  /** How much the layer pumps with the bass. 0..1 */
  audioReact: number;
  /** 0..1 */
  glow: number;
  glowColor: string;
  /** Pixels at 1080p. */
  blur: number;
  /** 0..1 */
  chromatic: number;
}

/* -------------------------------------------------------------------------- */
/* Logo / image / video                                                        */
/* -------------------------------------------------------------------------- */

export type MotionAnimation = "none" | "pulse" | "float" | "spin" | "zoom" | "glitch" | "breathe";

export type MonogramStyle = "circle" | "hexagon" | "square" | "diamond" | "plain";

export interface LogoLayer extends LayerBase<"logo"> {
  source: "monogram" | "mark" | "upload";
  monogramStyle: MonogramStyle;
  monogramFont: FontId;
  /** Built-in mark id, see engine/marks.ts */
  mark: string;
  media: MediaRef | null;
  /** Repaints uploaded logos in a single colour. */
  tint: boolean;
  color: string;
  /** Width in pixels at 1080p. */
  size: number;
  transform: Transform;
  animation: MotionAnimation;
  animationSpeed: number;
  audioReact: number;
  glow: number;
  glowColor: string;
}

export interface ImageLayer extends LayerBase<"image"> {
  media: MediaRef | null;
  /** Copies side by side (1, 3 or 5), like a tour-visual photo echo. */
  echo: number;
  /** Distance between copies, as a fraction of the image width. */
  echoSpacing: number;
  /** Flip every other copy. */
  mirror: boolean;
  /** Width in pixels at 1080p. */
  size: number;
  radius: number;
  transform: Transform;
  animation: MotionAnimation;
  animationSpeed: number;
  audioReact: number;
  glow: number;
  glowColor: string;
  blur: number;
  grayscale: boolean;
}

export interface VideoLayer extends LayerBase<"video"> {
  media: MediaRef | null;
  fit: "cover" | "contain" | "free";
  /** Width in pixels at 1080p, used when fit = free. */
  size: number;
  transform: Transform;
  playbackRate: number;
  blur: number;
  dim: number;
}

/* -------------------------------------------------------------------------- */
/* Shapes                                                                      */
/* -------------------------------------------------------------------------- */

export type ShapeType =
  | "circle"
  | "ring"
  | "square"
  | "triangle"
  | "hexagon"
  | "diamond"
  | "star"
  | "cross"
  | "line";

export interface ShapeLayer extends LayerBase<"shape"> {
  shape: ShapeType;
  /** Diameter in pixels at 1080p. */
  size: number;
  filled: boolean;
  strokeWidth: number;
  color: string;
  transform: Transform;
  animation: MotionAnimation;
  animationSpeed: number;
  /** Copies of the shape drawn around it. */
  repeat: number;
  repeatMode: "concentric" | "radial";
  audioReact: number;
  glow: number;
}

/* -------------------------------------------------------------------------- */
/* Effects and overlays                                                        */
/* -------------------------------------------------------------------------- */

export type EffectType =
  | "tunnel"
  | "waves"
  | "radialGlow"
  | "grid"
  | "lasers"
  | "rotatingShapes"
  | "starfield"
  | "pulseRings"
  | "kaleidoscope"
  | "aurora"
  | "sun"
  | "spiral"
  | "dataRain"
  | "marquee"
  | "rays"
  | "shards"
  | "smoke";

export interface EffectLayer extends LayerBase<"effect"> {
  effect: EffectType;
  /** 0..1 */
  intensity: number;
  /** 0.1..4 */
  speed: number;
  /** Degrees, for effects that travel in a direction. */
  angle: number;
  /** Inward/outward, clockwise/counter-clockwise. */
  reverse: boolean;
  colors: string[];
  /** Size multiplier. */
  scale: number;
  audioReact: number;
  /** Marquee only: text to repeat; empty uses the artist name. */
  text?: string;
  /** Marquee only. */
  font?: FontId;
}

export type OverlayType =
  | "scanlines"
  | "grain"
  | "vignette"
  | "chromatic"
  | "ledGrid"
  | "vhs"
  | "crt"
  | "lightLeak"
  | "hud"
  | "glitch"
  | "grade"
  | "flare";

export interface OverlayLayer extends LayerBase<"overlay"> {
  overlay: OverlayType;
  intensity: number;
  speed: number;
  angle: number;
  reverse: boolean;
  color: string;
}

/* -------------------------------------------------------------------------- */
/* Particles                                                                   */
/* -------------------------------------------------------------------------- */

export type ParticleDirection = "up" | "down" | "left" | "right" | "outward" | "float";
export type ParticleShape = "dot" | "spark" | "square" | "ring" | "line" | "cross";

export interface ParticlesLayer extends LayerBase<"particles"> {
  count: number;
  /** Pixels at 1080p. */
  size: number;
  speed: number;
  direction: ParticleDirection;
  shape: ParticleShape;
  colors: string[];
  glow: number;
  twinkle: number;
  audioReact: number;
}

/* -------------------------------------------------------------------------- */
/* Audio reactive                                                              */
/* -------------------------------------------------------------------------- */

export type AudioEffectType =
  | "bassPulse"
  | "beatFlash"
  | "waveform"
  | "frequencyBars"
  | "particleBurst"
  | "strobe"
  | "cameraShake";

export type AudioBand = "bass" | "mid" | "high" | "full";

export interface AudioLayer extends LayerBase<"audio"> {
  effect: AudioEffectType;
  band: AudioBand;
  /** 0..1 how strongly it reacts. */
  sensitivity: number;
  /** 0..1 visual strength. */
  intensity: number;
  colors: string[];
  placement: "bottom" | "center" | "top" | "circle";
}

/* -------------------------------------------------------------------------- */
/* Aggregates                                                                  */
/* -------------------------------------------------------------------------- */

export type Layer =
  | BackgroundLayer
  | TextLayer
  | LogoLayer
  | ImageLayer
  | VideoLayer
  | ShapeLayer
  | EffectLayer
  | OverlayLayer
  | ParticlesLayer
  | AudioLayer;

export type LayerOf<K extends LayerKind> = Extract<Layer, { kind: K }>;

/** Layers that have a position on the stage and can be dragged. */
export type PositionedLayer = TextLayer | LogoLayer | ImageLayer | ShapeLayer | VideoLayer;

export interface Scene {
  id: ID;
  name: string;
  /** Bottom to top. */
  layers: Layer[];
  /** Length of the seamless loop, in 4/4 bars. */
  loopBars: number;
}

export interface Project {
  id: ID;
  schemaVersion: number;
  name: string;
  artistName: string;
  bpm: number;
  /** Colour roles used by templates; swapping it recolours the whole set. */
  palette: string[];
  scenes: Scene[];
  templateId: string | null;
  createdAt: number;
  updatedAt: number;
  /** Reserved for cloud sync / collaboration. */
  ownerId?: string | null;
}

export interface ProjectSummary {
  id: ID;
  name: string;
  artistName: string;
  sceneCount: number;
  templateId: string | null;
  updatedAt: number;
  createdAt: number;
}
