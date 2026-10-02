import { deepClone } from "@/lib/clone";
import { createId } from "@/lib/id";
import type {
  AudioEffectType,
  AudioLayer,
  BackgroundLayer,
  EffectLayer,
  EffectType,
  ImageLayer,
  Layer,
  LogoLayer,
  OverlayLayer,
  OverlayType,
  ParticlesLayer,
  Project,
  Scene,
  ShapeLayer,
  ShapeType,
  TextLayer,
  Transform,
  VideoLayer,
} from "./types";
import { PROJECT_SCHEMA_VERSION } from "./types";
import { AUDIO_EFFECTS, EFFECTS, OVERLAYS, SHAPES } from "./catalog";

const base = { visible: true, locked: false, opacity: 1, blendMode: "normal" as const };
const centre = (p?: Partial<Transform>): Transform => ({ x: 0.5, y: 0.5, scale: 1, rotation: 0, ...p });

export function createBackground(p: Partial<BackgroundLayer> = {}): BackgroundLayer {
  return {
    ...base,
    id: createId("l_"),
    kind: "background",
    name: "Background",
    mode: "gradient",
    color: "#07060d",
    gradient: { type: "mesh", colors: ["#2a0b5e", "#0b1a4a", "#4b0f4f"], angle: 135, animate: true },
    media: null,
    mediaFit: "cover",
    dim: 0.25,
    pattern: "none",
    patternColor: "#ffffff",
    patternOpacity: 0.08,
    patternScale: 1,
    animationSpeed: 1,
    ...p,
  };
}

export function createText(p: Partial<TextLayer> = {}): TextLayer {
  return {
    ...base,
    id: createId("l_"),
    kind: "text",
    name: "Text",
    role: "text",
    content: "Tonight",
    font: "space-grotesk",
    size: 72,
    weight: 500,
    color: "#ffffff",
    gradient: { enabled: false, from: "#ffffff", to: "#a78bfa" },
    align: "center",
    letterSpacing: 4,
    uppercase: true,
    outline: false,
    material: "solid",
    depth: 0,
    transform: centre(),
    animation: "none",
    animationSpeed: 1,
    audioReact: 0,
    glow: 0,
    glowColor: "#a78bfa",
    blur: 0,
    chromatic: 0,
    ...p,
  };
}

export function createArtistName(p: Partial<TextLayer> = {}): TextLayer {
  return createText({
    name: "Artist Name",
    role: "artist",
    content: "",
    font: "unbounded",
    size: 170,
    weight: 700,
    letterSpacing: 6,
    animation: "pulse",
    audioReact: 0.35,
    glow: 0.55,
    glowColor: "#b46cff",
    ...p,
  });
}

export function createLogo(p: Partial<LogoLayer> = {}): LogoLayer {
  return {
    ...base,
    id: createId("l_"),
    kind: "logo",
    name: "Logo",
    source: "monogram",
    monogramStyle: "circle",
    monogramFont: "unbounded",
    mark: "orbit",
    media: null,
    tint: false,
    color: "#ffffff",
    size: 220,
    transform: centre({ y: 0.3 }),
    animation: "none",
    animationSpeed: 1,
    audioReact: 0.2,
    glow: 0.4,
    glowColor: "#a78bfa",
    ...p,
  };
}

export function createImage(p: Partial<ImageLayer> = {}): ImageLayer {
  return {
    ...base,
    id: createId("l_"),
    kind: "image",
    name: "Image",
    media: null,
    echo: 1,
    echoSpacing: 0.85,
    mirror: false,
    size: 640,
    radius: 0,
    transform: centre(),
    animation: "none",
    animationSpeed: 1,
    audioReact: 0,
    glow: 0,
    glowColor: "#ffffff",
    blur: 0,
    grayscale: false,
    ...p,
  };
}

export function createVideo(p: Partial<VideoLayer> = {}): VideoLayer {
  return {
    ...base,
    id: createId("l_"),
    kind: "video",
    name: "Video",
    media: null,
    fit: "cover",
    size: 960,
    transform: centre(),
    playbackRate: 1,
    blur: 0,
    dim: 0,
    ...p,
  };
}

export function createShape(shape: ShapeType = "ring", p: Partial<ShapeLayer> = {}): ShapeLayer {
  return {
    ...base,
    id: createId("l_"),
    kind: "shape",
    name: SHAPES[shape].label,
    shape,
    size: 420,
    filled: false,
    strokeWidth: 6,
    color: "#ffffff",
    transform: centre(),
    animation: "spin",
    animationSpeed: 1,
    repeat: 1,
    repeatMode: "concentric",
    audioReact: 0.2,
    glow: 0.5,
    ...p,
  };
}

export function createEffect(effect: EffectType, p: Partial<EffectLayer> = {}): EffectLayer {
  const meta = EFFECTS[effect];
  return {
    ...base,
    id: createId("l_"),
    kind: "effect",
    name: meta.label,
    effect,
    intensity: 0.6,
    speed: 1,
    angle: 0,
    reverse: false,
    colors: ["#8b5cf6", "#22d3ee", "#f472b6"],
    scale: 1,
    audioReact: 0.4,
    ...meta.defaults,
    ...p,
  };
}

export function createOverlay(overlay: OverlayType, p: Partial<OverlayLayer> = {}): OverlayLayer {
  const meta = OVERLAYS[overlay];
  return {
    ...base,
    id: createId("l_"),
    kind: "overlay",
    name: meta.label,
    overlay,
    intensity: 0.5,
    speed: 1,
    angle: 0,
    reverse: false,
    color: "#000000",
    ...meta.defaults,
    ...p,
  };
}

export function createParticles(p: Partial<ParticlesLayer> = {}): ParticlesLayer {
  return {
    ...base,
    id: createId("l_"),
    kind: "particles",
    name: "Particles",
    count: 90,
    size: 5,
    speed: 1,
    direction: "up",
    shape: "dot",
    colors: ["#ffffff", "#c4b5fd"],
    glow: 0.6,
    twinkle: 0.5,
    audioReact: 0.4,
    ...p,
  };
}

export function createAudioLayer(effect: AudioEffectType, p: Partial<AudioLayer> = {}): AudioLayer {
  const meta = AUDIO_EFFECTS[effect];
  return {
    ...base,
    id: createId("l_"),
    kind: "audio",
    name: meta.label,
    effect,
    band: "bass",
    sensitivity: 0.6,
    intensity: 0.6,
    colors: ["#ffffff", "#a78bfa"],
    placement: "bottom",
    ...meta.defaults,
    ...p,
  };
}

/** Deep copy with fresh ids, used for duplication and template instancing. */
export function cloneLayer<L extends Layer>(layer: L): L {
  return { ...deepClone(layer), id: createId("l_") };
}

export function cloneScene(scene: Scene, name?: string): Scene {
  return {
    ...scene,
    id: createId("s_"),
    name: name ?? scene.name,
    layers: scene.layers.map((l) => cloneLayer(l)),
  };
}

export function createScene(name: string, layers: Layer[], loopBars = 8): Scene {
  return { id: createId("s_"), name, layers, loopBars };
}

export function createProject(p: Partial<Project> & Pick<Project, "name" | "scenes">): Project {
  const now = Date.now();
  return {
    id: createId("p_"),
    schemaVersion: PROJECT_SCHEMA_VERSION,
    artistName: "Your Name",
    bpm: 124,
    palette: ["#8b5cf6", "#22d3ee", "#f472b6", "#07060d"],
    templateId: null,
    createdAt: now,
    updatedAt: now,
    ownerId: null,
    ...p,
  };
}
