"use client";

import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { FieldLabel, Segmented, Slider } from "@/components/ui/controls";
import {
  AUDIO_EFFECTS,
  BLEND_MODES,
  EFFECTS,
  MOTION_ANIMATIONS,
  OVERLAYS,
  PARTICLE_DIRECTIONS,
  PARTICLE_SHAPES,
  SHAPES,
  TEXT_ANIMATIONS,
} from "@/domain/catalog";
import { FONT_MAP, nearestWeight } from "@/domain/fonts";
import type {
  AudioLayer,
  BackgroundLayer,
  EffectLayer,
  ImageLayer,
  Layer,
  LayerKind,
  LogoLayer,
  OverlayLayer,
  ParticlesLayer,
  ShapeLayer,
  TextLayer,
  VideoLayer,
} from "@/domain/types";
import { MARKS } from "@/engine/marks";
import { cn } from "@/lib/utils";
import type { Field, SectionDef } from "./schema";

/* ----------------------------- shared fields ------------------------------ */

const opacity = <L extends Layer>(): Field<L> => ({
  type: "slider",
  path: "opacity",
  label: "Opacity",
  min: 0,
  max: 1,
  step: 0.01,
  displayScale: 100,
  unit: "%",
  default: 1,
});

const blend = <L extends Layer>(): Field<L> => ({
  type: "select",
  path: "blendMode",
  label: "Blend mode",
  hint: "How this layer mixes with the layers below",
  options: BLEND_MODES,
});

const speed = <L extends Layer>(path = "animationSpeed", label = "Animation speed"): Field<L> => ({
  type: "slider",
  path,
  label,
  min: 0.1,
  max: 4,
  step: 0.05,
  unit: "×",
  decimals: 2,
  default: 1,
  hint: "Speeds snap so loops stay seamless",
});

const audioReact = <L extends Layer>(): Field<L> => ({
  type: "slider",
  path: "audioReact",
  label: "React to bass",
  min: 0,
  max: 1,
  step: 0.01,
  displayScale: 100,
  unit: "%",
  hint: "Pumps with the kick drum (demo beat, track or live input)",
});

const glow = <L extends Layer>(withColor = true): Field<L>[] => [
  { type: "slider", path: "glow", label: "Glow", min: 0, max: 1, step: 0.01, displayScale: 100, unit: "%" },
  ...(withColor ? [{ type: "color", path: "glowColor", label: "Glow colour", when: (l: L) => Number((l as { glow?: number }).glow) > 0 } as Field<L>] : []),
];

const position = <L extends Layer>(alignText = false): SectionDef<L> => ({
  id: "position",
  title: "Position",
  defaultOpen: false,
  fields: [{ type: "position", alignText }],
});

/* ---------------------------------- text ---------------------------------- */

function WeightField({ layer, update }: { layer: TextLayer; update: (p: Partial<TextLayer>) => void }) {
  const weights = FONT_MAP[layer.font]?.weights ?? [400];
  const current = nearestWeight(layer.font, layer.weight);
  if (weights.length === 1) return null;
  const names: Record<number, string> = { 300: "Light", 400: "Regular", 500: "Medium", 600: "Semi", 700: "Bold", 800: "Extra", 900: "Black" };
  return (
    <div className="space-y-1.5">
      <FieldLabel label="Weight" />
      <Segmented value={current} onChange={(w) => update({ weight: w })} options={weights.map((w) => ({ value: w, label: names[w] ?? String(w) }))} ariaLabel="Font weight" />
    </div>
  );
}

const textSchema: SectionDef<TextLayer>[] = [
  {
    id: "basic",
    title: "Basic",
    fields: [
      { type: "artistName", when: (l) => l.role === "artist" },
      { type: "text", path: "content", label: "Content", multiline: true, placeholder: "Type something", when: (l) => l.role !== "artist" },
      { type: "font", path: "font", label: "Font" },
      { type: "slider", path: "size", label: "Size", min: 16, max: 420, step: 1, unit: "px" },
      { type: "custom", render: (l, update) => <WeightField layer={l} update={update} /> },
      { type: "color", path: "color", label: "Colour", when: (l) => !l.gradient.enabled },
      {
        type: "segmented",
        path: "align",
        label: "Alignment",
        hint: "Anchors the text at its position",
        options: [
          { value: "left", icon: <AlignLeft className="h-3.5 w-3.5" />, tooltip: "Left" },
          { value: "center", icon: <AlignCenter className="h-3.5 w-3.5" />, tooltip: "Centre" },
          { value: "right", icon: <AlignRight className="h-3.5 w-3.5" />, tooltip: "Right" },
        ],
      },
    ],
  },
  position<TextLayer>(true),
  {
    id: "animation",
    title: "Animation",
    fields: [
      { type: "select", path: "animation", label: "Animation", options: TEXT_ANIMATIONS },
      { ...speed<TextLayer>(), when: (l) => l.animation !== "none" },
      audioReact<TextLayer>(),
    ],
  },
  {
    id: "effects",
    title: "Effects",
    fields: [
      opacity<TextLayer>(),
      ...glow<TextLayer>(),
      { type: "slider", path: "blur", label: "Blur", min: 0, max: 30, step: 0.5, unit: "px", default: 0 },
      { type: "slider", path: "chromatic", label: "RGB split", min: 0, max: 1, step: 0.01, displayScale: 100, unit: "%", hint: "Chromatic aberration" },
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    defaultOpen: false,
    fields: [
      { type: "toggle", path: "uppercase", label: "Uppercase" },
      { type: "slider", path: "letterSpacing", label: "Letter spacing", min: -10, max: 80, step: 1, unit: "px", default: 4 },
      { type: "toggle", path: "outline", label: "Outline only", description: "Hollow letters with a stroke" },
      { type: "toggle", path: "gradient.enabled", label: "Gradient fill" },
      { type: "color", path: "gradient.from", label: "Gradient start", when: (l) => l.gradient.enabled },
      { type: "color", path: "gradient.to", label: "Gradient end", when: (l) => l.gradient.enabled },
      blend<TextLayer>(),
    ],
  },
];

/* ------------------------------- background ------------------------------- */

const backgroundSchema: SectionDef<BackgroundLayer>[] = [
  {
    id: "basic",
    title: "Basic",
    fields: [
      {
        type: "segmented",
        path: "mode",
        label: "Type",
        options: [
          { value: "solid", label: "Colour" },
          { value: "gradient", label: "Gradient" },
          { value: "image", label: "Image" },
          { value: "video", label: "Video" },
        ],
      },
      { type: "color", path: "color", label: (l) => (l.mode === "solid" ? "Background colour" : "Base colour"), when: (l) => l.mode !== "gradient" },
      {
        type: "segmented",
        path: "gradient.type",
        label: "Gradient style",
        when: (l) => l.mode === "gradient",
        options: [
          { value: "mesh", label: "Mesh" },
          { value: "linear", label: "Linear" },
          { value: "radial", label: "Radial" },
          { value: "conic", label: "Conic" },
        ],
      },
      { type: "colors", path: "gradient.colors", label: "Colours", min: 2, max: 4, when: (l) => l.mode === "gradient" },
      { type: "slider", path: "gradient.angle", label: "Angle", min: 0, max: 360, unit: "°", when: (l) => l.mode === "gradient" && (l.gradient.type === "linear" || l.gradient.type === "conic") },
      { type: "media", path: "media", label: "Image", accept: "image", when: (l) => l.mode === "image" },
      { type: "media", path: "media", label: "Video loop", accept: "video", when: (l) => l.mode === "video" },
      {
        type: "segmented",
        path: "mediaFit",
        label: "Fit",
        when: (l) => l.mode === "image" || l.mode === "video",
        options: [
          { value: "cover", label: "Fill screen" },
          { value: "contain", label: "Fit inside" },
        ],
      },
      { type: "slider", path: "dim", label: "Darken", min: 0, max: 0.9, step: 0.01, displayScale: 100, unit: "%", hint: "Keeps text readable over busy media", when: (l) => l.mode === "image" || l.mode === "video" },
    ],
  },
  {
    id: "animation",
    title: "Animation",
    fields: [
      { type: "toggle", path: "gradient.animate", label: "Animate gradient", description: "Slowly drifts colours and angle", when: (l) => l.mode === "gradient" },
      speed<BackgroundLayer>(),
    ],
  },
  {
    id: "pattern",
    title: "Pattern",
    defaultOpen: false,
    fields: [
      {
        type: "select",
        path: "pattern",
        label: "Pattern",
        options: [
          { value: "none", label: "None" },
          { value: "grid", label: "Grid" },
          { value: "dots", label: "Dots" },
          { value: "lines", label: "Lines" },
          { value: "diagonal", label: "Diagonal" },
          { value: "hex", label: "Hexagons" },
        ],
      },
      { type: "color", path: "patternColor", label: "Pattern colour", when: (l) => l.pattern !== "none" },
      { type: "slider", path: "patternOpacity", label: "Pattern opacity", min: 0, max: 1, step: 0.01, displayScale: 100, unit: "%", when: (l) => l.pattern !== "none" },
      { type: "slider", path: "patternScale", label: "Pattern size", min: 0.3, max: 3, step: 0.05, unit: "×", decimals: 2, when: (l) => l.pattern !== "none" },
    ],
  },
  { id: "advanced", title: "Advanced", defaultOpen: false, fields: [opacity<BackgroundLayer>(), blend<BackgroundLayer>()] },
];

/* --------------------------------- effects -------------------------------- */

const effectSchema: SectionDef<EffectLayer>[] = [
  {
    id: "basic",
    title: "Basic",
    fields: [
      {
        type: "select",
        path: "effect",
        label: "Effect",
        options: Object.entries(EFFECTS).map(([value, m]) => ({ value, label: m.label, description: m.description })),
      },
      { type: "colors", path: "colors", label: "Colours", min: 1, max: 3 },
      { type: "slider", path: "intensity", label: "Intensity", min: 0, max: 1, step: 0.01, displayScale: 100, unit: "%" },
      speed<EffectLayer>("speed", "Speed"),
      {
        type: "custom",
        render: (l, update) => {
          const meta = EFFECTS[l.effect];
          return (
            <>
              {meta.reverse && (
                <div className="space-y-1.5">
                  <FieldLabel label={meta.reverse.label} />
                  <Segmented
                    value={l.reverse}
                    onChange={(v) => update({ reverse: v })}
                    options={[
                      { value: false, label: meta.reverse.off },
                      { value: true, label: meta.reverse.on },
                    ]}
                    ariaLabel={meta.reverse.label}
                  />
                </div>
              )}
              {meta.angle &&
                (meta.angle.options ? (
                  <div className="space-y-1.5">
                    <FieldLabel label={meta.angle.label} />
                    <Segmented value={l.angle} onChange={(v) => update({ angle: v })} options={meta.angle.options} size="sm" ariaLabel={meta.angle.label} />
                  </div>
                ) : (
                  <AngleSlider label={meta.angle.label} min={meta.angle.min} max={meta.angle.max} unit={meta.angle.unit} value={l.angle} onChange={(v) => update({ angle: v }, `${l.id}:angle`)} />
                ))}
            </>
          );
        },
      },
    ],
  },
  { id: "audio", title: "Audio reactive", fields: [audioReact<EffectLayer>()] },
  {
    id: "advanced",
    title: "Advanced",
    defaultOpen: false,
    fields: [
      { type: "slider", path: "scale", label: "Size", min: 0.3, max: 2.5, step: 0.01, displayScale: 100, unit: "%", default: 1 },
      opacity<EffectLayer>(),
      blend<EffectLayer>(),
    ],
  },
];

function AngleSlider(props: { label: string; min: number; max: number; unit?: string; value: number; onChange: (v: number) => void }) {
  return <Slider label={props.label} min={props.min} max={props.max} unit={props.unit} value={props.value} step={1} defaultValue={0} onChange={props.onChange} />;
}

/* --------------------------------- overlays ------------------------------- */

const overlaySchema: SectionDef<OverlayLayer>[] = [
  {
    id: "basic",
    title: "Basic",
    fields: [
      {
        type: "select",
        path: "overlay",
        label: "Overlay",
        options: Object.entries(OVERLAYS).map(([value, m]) => ({ value, label: m.label, description: m.description })),
      },
      { type: "slider", path: "intensity", label: "Intensity", min: 0, max: 1, step: 0.01, displayScale: 100, unit: "%" },
      { ...speed<OverlayLayer>("speed", "Speed"), when: (l) => OVERLAYS[l.overlay].animated },
      { type: "color", path: "color", label: (l) => OVERLAYS[l.overlay].colorLabel ?? "Colour", when: (l) => !!OVERLAYS[l.overlay].colorLabel },
      { type: "slider", path: "angle", label: "Angle", min: 0, max: 180, unit: "°", when: (l) => !!OVERLAYS[l.overlay].angle },
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    defaultOpen: false,
    fields: [
      { type: "toggle", path: "reverse", label: "Reverse direction", when: (l) => OVERLAYS[l.overlay].animated },
      opacity<OverlayLayer>(),
      blend<OverlayLayer>(),
    ],
  },
];

/* -------------------------------- particles ------------------------------- */

const particlesSchema: SectionDef<ParticlesLayer>[] = [
  {
    id: "basic",
    title: "Basic",
    fields: [
      { type: "select", path: "shape", label: "Particle shape", options: PARTICLE_SHAPES },
      { type: "select", path: "direction", label: "Movement", options: PARTICLE_DIRECTIONS },
      { type: "slider", path: "count", label: "Amount", min: 5, max: 300, step: 1 },
      { type: "slider", path: "size", label: "Size", min: 1, max: 40, step: 0.5, unit: "px" },
      { type: "colors", path: "colors", label: "Colours", min: 1, max: 4 },
    ],
  },
  {
    id: "animation",
    title: "Animation",
    fields: [
      speed<ParticlesLayer>("speed", "Speed"),
      { type: "slider", path: "twinkle", label: "Twinkle", min: 0, max: 1, step: 0.01, displayScale: 100, unit: "%" },
      audioReact<ParticlesLayer>(),
    ],
  },
  { id: "effects", title: "Effects", defaultOpen: false, fields: [...glow<ParticlesLayer>(false), opacity<ParticlesLayer>(), blend<ParticlesLayer>()] },
];

/* ------------------------------ audio reactive ---------------------------- */

const audioSchema: SectionDef<AudioLayer>[] = [
  {
    id: "basic",
    title: "Basic",
    fields: [
      {
        type: "select",
        path: "effect",
        label: "Reaction",
        options: Object.entries(AUDIO_EFFECTS).map(([value, m]) => ({ value, label: m.label, description: m.description })),
      },
      {
        type: "segmented",
        path: "band",
        label: "Listen to",
        when: (l) => l.effect === "bassPulse",
        options: [
          { value: "bass", label: "Bass" },
          { value: "mid", label: "Mids" },
          { value: "high", label: "Highs" },
          { value: "full", label: "All" },
        ],
      },
      { type: "slider", path: "sensitivity", label: "Sensitivity", min: 0, max: 1, step: 0.01, displayScale: 100, unit: "%" },
      { type: "slider", path: "intensity", label: "Intensity", min: 0, max: 1, step: 0.01, displayScale: 100, unit: "%" },
      { type: "colors", path: "colors", label: "Colours", min: 1, max: 3, when: (l) => AUDIO_EFFECTS[l.effect].drawsColor },
      {
        type: "segmented",
        path: "placement",
        label: "Placement",
        when: (l) => AUDIO_EFFECTS[l.effect].placements.length > 0,
        options: (l) =>
          AUDIO_EFFECTS[l.effect].placements.map((p) => ({ value: p, label: p === "center" ? "Centre" : p[0]!.toUpperCase() + p.slice(1) })),
      },
      {
        type: "note",
        tone: "warning",
        text: "Flashing effect. Can affect people with photosensitive epilepsy. Use “Reduce flashing” in Settings for public events.",
        when: (l) => !!AUDIO_EFFECTS[l.effect].flashing,
      },
    ],
  },
  { id: "advanced", title: "Advanced", defaultOpen: false, fields: [opacity<AudioLayer>(), blend<AudioLayer>()] },
];

/* --------------------------------- shapes --------------------------------- */

const shapeSchema: SectionDef<ShapeLayer>[] = [
  {
    id: "basic",
    title: "Basic",
    fields: [
      { type: "select", path: "shape", label: "Shape", options: Object.entries(SHAPES).map(([value, m]) => ({ value, label: m.label })) },
      { type: "slider", path: "size", label: "Size", min: 20, max: 1600, step: 1, unit: "px" },
      { type: "color", path: "color", label: "Colour" },
      { type: "toggle", path: "filled", label: "Filled", when: (l) => l.shape !== "ring" && l.shape !== "line" },
      { type: "slider", path: "strokeWidth", label: "Line width", min: 1, max: 40, step: 0.5, unit: "px", when: (l) => !l.filled || l.shape === "ring" || l.shape === "line" },
    ],
  },
  {
    id: "repeat",
    title: "Repeat",
    defaultOpen: false,
    fields: [
      { type: "slider", path: "repeat", label: "Copies", min: 1, max: 12, step: 1 },
      {
        type: "segmented",
        path: "repeatMode",
        label: "Arrangement",
        when: (l) => l.repeat > 1,
        options: [
          { value: "concentric", label: "Nested" },
          { value: "radial", label: "Orbit" },
        ],
      },
    ],
  },
  position<ShapeLayer>(),
  {
    id: "animation",
    title: "Animation",
    fields: [
      { type: "select", path: "animation", label: "Animation", options: MOTION_ANIMATIONS },
      { ...speed<ShapeLayer>(), when: (l) => l.animation !== "none" },
      audioReact<ShapeLayer>(),
    ],
  },
  { id: "effects", title: "Effects", defaultOpen: false, fields: [...glow<ShapeLayer>(false), opacity<ShapeLayer>(), blend<ShapeLayer>()] },
];

/* ---------------------------------- logo ---------------------------------- */

function MarkPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel label="Mark" />
      <div className="grid grid-cols-4 gap-1.5">
        {MARKS.map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.label}
            onClick={() => onChange(m.id)}
            className={cn(
              "flex aspect-square items-center justify-center rounded-lg border bg-black/30 transition-all hover:border-white/30",
              value === m.id ? "border-accent/70 shadow-glow-sm" : "border-line",
            )}
          >
            <MarkIcon id={m.id} />
          </button>
        ))}
      </div>
    </div>
  );
}

function MarkIcon({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    const mark = MARKS.find((m) => m.id === id);
    if (!c || !ctx || !mark) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.translate(c.width / 2, c.height / 2);
    ctx.fillStyle = "#e9e5ff";
    ctx.strokeStyle = "#e9e5ff";
    mark.draw(ctx, c.width * 0.72);
    ctx.restore();
  }, [id]);
  return <canvas ref={ref} width={56} height={56} className="h-7 w-7" aria-hidden />;
}

const logoSchema: SectionDef<LogoLayer>[] = [
  {
    id: "basic",
    title: "Basic",
    fields: [
      {
        type: "segmented",
        path: "source",
        label: "Logo type",
        options: [
          { value: "monogram", label: "Initials" },
          { value: "mark", label: "Mark" },
          { value: "upload", label: "Upload" },
        ],
      },
      {
        type: "select",
        path: "monogramStyle",
        label: "Frame",
        when: (l) => l.source === "monogram",
        options: [
          { value: "circle", label: "Circle" },
          { value: "hexagon", label: "Hexagon" },
          { value: "square", label: "Square" },
          { value: "diamond", label: "Diamond" },
          { value: "plain", label: "No frame" },
        ],
      },
      { type: "font", path: "monogramFont", label: "Font", when: (l) => l.source === "monogram" },
      { type: "custom", when: (l) => l.source === "mark", render: (l, update) => <MarkPicker value={l.mark} onChange={(mark) => update({ mark })} /> },
      { type: "media", path: "media", label: "Logo file", accept: "image", when: (l) => l.source === "upload" },
      { type: "toggle", path: "tint", label: "Recolour logo", description: "Paint the logo in a single colour", when: (l) => l.source === "upload" },
      { type: "color", path: "color", label: (l) => (l.source === "upload" ? "Logo colour" : "Colour"), when: (l) => l.source !== "upload" || l.tint },
      { type: "slider", path: "size", label: "Size", min: 40, max: 1200, step: 1, unit: "px" },
    ],
  },
  position<LogoLayer>(),
  {
    id: "animation",
    title: "Animation",
    fields: [
      { type: "select", path: "animation", label: "Animation", options: MOTION_ANIMATIONS },
      { ...speed<LogoLayer>(), when: (l) => l.animation !== "none" },
      audioReact<LogoLayer>(),
    ],
  },
  { id: "effects", title: "Effects", fields: [opacity<LogoLayer>(), ...glow<LogoLayer>()] },
  { id: "advanced", title: "Advanced", defaultOpen: false, fields: [blend<LogoLayer>()] },
];

/* ------------------------------- image/video ------------------------------ */

const imageSchema: SectionDef<ImageLayer>[] = [
  {
    id: "basic",
    title: "Basic",
    fields: [
      { type: "media", path: "media", label: "Image", accept: "image" },
      { type: "slider", path: "size", label: "Width", min: 40, max: 1920, step: 1, unit: "px" },
      { type: "slider", path: "radius", label: "Corner radius", min: 0, max: 400, step: 1, unit: "px" },
    ],
  },
  position<ImageLayer>(),
  {
    id: "animation",
    title: "Animation",
    fields: [
      { type: "select", path: "animation", label: "Animation", options: MOTION_ANIMATIONS },
      { ...speed<ImageLayer>(), when: (l) => l.animation !== "none" },
      audioReact<ImageLayer>(),
    ],
  },
  {
    id: "effects",
    title: "Effects",
    defaultOpen: false,
    fields: [
      opacity<ImageLayer>(),
      ...glow<ImageLayer>(),
      { type: "slider", path: "blur", label: "Blur", min: 0, max: 40, step: 0.5, unit: "px" },
      { type: "toggle", path: "grayscale", label: "Black & white" },
      blend<ImageLayer>(),
    ],
  },
];

const videoSchema: SectionDef<VideoLayer>[] = [
  {
    id: "basic",
    title: "Basic",
    fields: [
      { type: "media", path: "media", label: "Video loop", accept: "video" },
      {
        type: "segmented",
        path: "fit",
        label: "Fit",
        options: [
          { value: "cover", label: "Fill" },
          { value: "contain", label: "Fit" },
          { value: "free", label: "Free" },
        ],
      },
      { type: "slider", path: "size", label: "Width", min: 80, max: 1920, step: 1, unit: "px", when: (l) => l.fit === "free" },
      { type: "slider", path: "playbackRate", label: "Playback speed", min: 0.25, max: 2, step: 0.05, unit: "×", decimals: 2, default: 1 },
    ],
  },
  { ...position<VideoLayer>(), fields: [{ type: "position", when: (l) => l.fit === "free" }, { type: "note", text: "Switch Fit to “Free” to move and resize the video.", when: (l) => l.fit !== "free" }] },
  {
    id: "effects",
    title: "Effects",
    fields: [
      opacity<VideoLayer>(),
      { type: "slider", path: "dim", label: "Darken", min: 0, max: 0.9, step: 0.01, displayScale: 100, unit: "%" },
      { type: "slider", path: "blur", label: "Blur", min: 0, max: 40, step: 0.5, unit: "px" },
      blend<VideoLayer>(),
    ],
  },
];

export const SCHEMAS: Record<LayerKind, SectionDef[]> = {
  text: textSchema as SectionDef[],
  background: backgroundSchema as SectionDef[],
  effect: effectSchema as SectionDef[],
  overlay: overlaySchema as SectionDef[],
  particles: particlesSchema as SectionDef[],
  audio: audioSchema as SectionDef[],
  shape: shapeSchema as SectionDef[],
  logo: logoSchema as SectionDef[],
  image: imageSchema as SectionDef[],
  video: videoSchema as SectionDef[],
};

