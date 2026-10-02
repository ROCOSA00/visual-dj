import type { GenreId } from "@/data/genres";
import { cloneLayer, createAudioLayer, createProject, createScene } from "./factories";
import type { Layer, Project, Scene } from "./types";

export type TemplateStyle = "Neon" | "Minimal" | "Glitch" | "Geometric" | "Organic" | "Retro" | "Cinematic";
export type TemplateEnergy = "Chill" | "Groove" | "Peak";
export type TemplateColor = "Neon" | "Warm" | "Cool" | "Mono" | "Acid" | "Pastel" | "Red";
export type TemplateMotion = "Particles" | "Tunnel" | "Waves" | "Grid" | "Geometry" | "Glitch" | "Gradient" | "Lasers";

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  category: GenreId;
  style: TemplateStyle;
  energy: TemplateEnergy;
  color: TemplateColor;
  motion: TemplateMotion;
  /** primary, secondary, accent, base */
  palette: [string, string, string, string];
  bpm: number;
  popularity: number;
  isNew?: boolean;
  featured?: boolean;
  /** Reserved for the future premium library / marketplace. */
  tier: "free" | "pro";
  author: string;
}

export type ScenePhase = "intro" | "build" | "drop" | "break" | "outro";

export interface TemplateDefinition extends TemplateMeta {
  build: () => Layer[];
  /** Optional per-scene adjustments on top of the default energy curve. */
  phases?: Partial<Record<ScenePhase, (layers: Layer[]) => Layer[]>>;
}

export const SHOW_PHASES: { id: ScenePhase; name: string }[] = [
  { id: "intro", name: "Intro" },
  { id: "build", name: "Build Up" },
  { id: "drop", name: "Drop" },
  { id: "break", name: "Break" },
  { id: "outro", name: "Outro" },
];

const FLASHY = new Set(["strobe", "beatFlash", "cameraShake", "particleBurst"]);

/**
 * Default energy curve: every template becomes a five-scene show set, so a
 * DJ gets a complete, playable set from a single click.
 */
function applyPhase(layers: Layer[], phase: ScenePhase): Layer[] {
  const speedMul = { intro: 0.6, build: 0.9, drop: 1.25, break: 0.45, outro: 0.5 }[phase];
  const intensityMul = { intro: 0.7, build: 0.9, drop: 1.15, break: 0.55, outro: 0.5 }[phase];
  const countMul = { intro: 0.6, build: 0.85, drop: 1.2, break: 0.5, outro: 0.4 }[phase];

  let out = layers
    .filter((l) => {
      if (l.kind !== "audio") return true;
      if (phase === "intro" || phase === "outro") return !FLASHY.has(l.effect);
      if (phase === "break") return l.effect === "waveform" || l.effect === "frequencyBars";
      return true;
    })
    .map((layer) => {
      const l = cloneLayer(layer);
      switch (l.kind) {
        case "effect":
          l.speed = round(l.speed * speedMul);
          l.intensity = clamp01(l.intensity * intensityMul);
          break;
        case "particles":
          l.speed = round(l.speed * speedMul);
          l.count = Math.max(8, Math.round(l.count * countMul));
          break;
        case "background":
          l.animationSpeed = round(l.animationSpeed * speedMul);
          break;
        case "text":
          l.animationSpeed = round(l.animationSpeed * Math.max(0.6, speedMul));
          if (phase === "drop") l.audioReact = clamp01(l.audioReact + 0.25);
          if (phase === "outro" && l.role === "artist") l.animation = "breathe";
          break;
        case "shape":
        case "logo":
          l.animationSpeed = round(l.animationSpeed * Math.max(0.5, speedMul));
          break;
        case "audio":
          if (phase === "drop") l.intensity = clamp01(l.intensity * 1.2);
          break;
        default:
          break;
      }
      return l;
    });

  if (phase === "build" && !out.some((l) => l.kind === "audio" && l.effect === "bassPulse")) {
    out = [...out, createAudioLayer("bassPulse", { intensity: 0.35 })];
  }
  if (phase === "drop") {
    if (!out.some((l) => l.kind === "audio" && l.effect === "bassPulse")) {
      out = [...out, createAudioLayer("bassPulse", { intensity: 0.6 })];
    }
    if (!out.some((l) => l.kind === "audio" && (l.effect === "beatFlash" || l.effect === "strobe"))) {
      out = [...out, createAudioLayer("beatFlash", { intensity: 0.28 })];
    }
  }
  return out;
}

const round = (v: number) => Math.round(v * 100) / 100;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function buildShowSet(template: TemplateDefinition): Scene[] {
  const baseLayers = template.build();
  return SHOW_PHASES.map(({ id, name }) => {
    let layers = applyPhase(baseLayers, id);
    const tweak = template.phases?.[id];
    if (tweak) layers = tweak(layers);
    return createScene(name, layers, id === "drop" ? 4 : 8);
  });
}

export function createProjectFromTemplate(
  template: TemplateDefinition,
  opts: { artistName: string; name?: string },
): Project {
  return createProject({
    name: opts.name?.trim() || `${template.name} Set`,
    artistName: opts.artistName.trim() || "Your Name",
    bpm: template.bpm,
    palette: [...template.palette],
    templateId: template.id,
    scenes: buildShowSet(template),
  });
}

const previewCache = new Map<string, Scene>();

/** Single scene used for thumbnails and previews (stable across renders). */
export function templatePreviewScene(template: TemplateDefinition): Scene {
  let scene = previewCache.get(template.id);
  if (!scene) {
    scene = createScene(template.name, template.build(), 8);
    previewCache.set(template.id, scene);
  }
  return scene;
}
