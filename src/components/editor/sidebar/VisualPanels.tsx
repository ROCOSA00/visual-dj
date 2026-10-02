"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/Tooltip";
import { BACKGROUND_PRESETS, PARTICLE_PRESETS, SHAPE_PRESETS, backgroundFromPreset, particlesFromPreset } from "@/data/presets";
import { EFFECTS, OVERLAYS, SHAPES } from "@/domain/catalog";
import { createArtistName, createBackground, createEffect, createOverlay, createScene, createShape } from "@/domain/factories";
import type { EffectType, OverlayType, Scene, ShapeType } from "@/domain/types";
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_VIDEO_TYPES } from "@/services/media/mediaStore";
import { editorActions } from "@/store/editorActions";
import { useActiveProject, useActiveScene } from "../hooks";
import { PanelSection, PreviewTile, UploadDropzone } from "./common";
import { uploadMedia } from "./useMedia";

const dark = () => createBackground({ mode: "solid", color: "#05050a" });
const usePalette = () => {
  const project = useActiveProject();
  const p = project?.palette;
  return useMemo(() => (p && p.length >= 3 ? p : ["#8b5cf6", "#22d3ee", "#f472b6", "#07060d"]), [p]);
};

/* --------------------------------- shapes --------------------------------- */

function ShapeGlyph({ shape }: { shape: ShapeType }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinejoin: "round" as const };
  switch (shape) {
    case "circle":
      return <circle cx="12" cy="12" r="8" fill="currentColor" />;
    case "ring":
      return <circle cx="12" cy="12" r="8" {...common} />;
    case "square":
      return <rect x="5" y="5" width="14" height="14" {...common} />;
    case "triangle":
      return <path d="M12 4 L20 19 H4 Z" {...common} />;
    case "hexagon":
      return <path d="M12 3.5 L19.5 7.75 V16.25 L12 20.5 L4.5 16.25 V7.75 Z" {...common} />;
    case "diamond":
      return <path d="M12 3 L20 12 L12 21 L4 12 Z" {...common} />;
    case "star":
      return <path d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.8l6-.7z" {...common} />;
    case "cross":
      return <path d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z" {...common} />;
    case "line":
      return <path d="M4 12 H20" {...common} strokeWidth={2} strokeLinecap="round" />;
  }
}

export function ShapesPanel() {
  const palette = usePalette();
  const presetScenes = useMemo(
    () => SHAPE_PRESETS.map((p) => createScene(p.label, [dark(), { ...p.build(palette), size: 640, transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 } }])),
    [palette],
  );
  return (
    <div className="space-y-6">
      <PanelSection title="Basic shapes">
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(SHAPES) as ShapeType[]).map((shape) => (
            <Tooltip key={shape} content={`Add ${SHAPES[shape].label.toLowerCase()}`}>
              <button
                type="button"
                onClick={() =>
                  editorActions.addLayer(
                    createShape(shape, {
                      color: palette[1] ?? "#ffffff",
                      filled: shape === "circle",
                      animation: shape === "circle" ? "pulse" : "spin",
                      size: shape === "line" ? 900 : 420,
                    }),
                  )
                }
                className="flex aspect-square items-center justify-center rounded-xl border border-line bg-white/[0.03] text-muted transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.06] hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7">
                  <ShapeGlyph shape={shape} />
                </svg>
              </button>
            </Tooltip>
          ))}
        </div>
      </PanelSection>
      <PanelSection title="Animated sets">
        <div className="grid grid-cols-2 gap-1">
          {SHAPE_PRESETS.map((preset, i) => (
            <PreviewTile key={preset.id} scene={presetScenes[i]!} label={preset.label} onClick={() => editorActions.addLayer(preset.build(palette))} />
          ))}
        </div>
      </PanelSection>
    </div>
  );
}

/* ------------------------------- backgrounds ------------------------------ */

export function BackgroundsPanel() {
  const palette = usePalette();
  const [busy, setBusy] = useState(false);
  const scenes = useMemo(
    () => BACKGROUND_PRESETS.map((p) => createScene(p.label, [backgroundFromPreset(p, palette)])),
    [palette],
  );
  return (
    <div className="space-y-6">
      <PanelSection title="Presets">
        <p className="-mt-1 text-2xs text-subtle">Replaces the background of the current scene.</p>
        <div className="grid grid-cols-2 gap-1">
          {BACKGROUND_PRESETS.map((preset, i) => (
            <PreviewTile
              key={preset.id}
              scene={scenes[i]!}
              label={preset.label}
              onClick={() => {
                const layer = backgroundFromPreset(preset, palette);
                const { id: _id, name: _name, kind: _kind, ...patch } = layer;
                void _id;
                void _name;
                void _kind;
                editorActions.setBackground(patch, () => layer);
              }}
            />
          ))}
        </div>
      </PanelSection>
      <PanelSection title="Your own background">
        <UploadDropzone
          accept={`${ACCEPTED_IMAGE_TYPES},${ACCEPTED_VIDEO_TYPES}`}
          title="Image or video background"
          hint="Fills the whole screen"
          busy={busy}
          onFiles={async (files) => {
            const file = files[0]!;
            const type = file.type.startsWith("video/") ? "video" : "image";
            setBusy(true);
            const ref = await uploadMedia(file, type);
            setBusy(false);
            if (!ref) return;
            const layer = createBackground({ mode: type, media: ref, color: "#000000" });
            editorActions.setBackground({ mode: type, media: ref, color: "#000000", opacity: 1 }, () => layer);
          }}
        />
      </PanelSection>
    </div>
  );
}

/* --------------------------------- effects -------------------------------- */

export function EffectsPanel() {
  const palette = usePalette();
  const colors = palette.slice(0, 3);
  const scenes = useMemo(() => {
    const map = {} as Record<EffectType, Scene>;
    (Object.keys(EFFECTS) as EffectType[]).forEach((type) => {
      map[type] = createScene(EFFECTS[type].label, [dark(), createEffect(type, { colors, intensity: 0.7 })]);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors.join()]);
  return (
    <div className="space-y-3">
      <p className="text-2xs text-subtle">Click to add. Effects go behind your text automatically.</p>
      <div className="grid grid-cols-2 gap-1">
        {(Object.keys(EFFECTS) as EffectType[]).map((type) => (
          <Tooltip key={type} content={EFFECTS[type].description} side="right">
            <div>
              <PreviewTile scene={scenes[type]} label={EFFECTS[type].label} onClick={() => editorActions.addLayer(createEffect(type, { colors }))} />
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- overlays ------------------------------- */

export function OverlaysPanel() {
  const palette = usePalette();
  const scenes = useMemo(() => {
    const base = [
      createBackground({ gradient: { type: "mesh", colors: palette.slice(0, 3), angle: 0, animate: true }, opacity: 0.8 }),
      createArtistName({ size: 300, glow: 0.4, animation: "none", audioReact: 0 }),
    ];
    const map = {} as Record<OverlayType, Scene>;
    (Object.keys(OVERLAYS) as OverlayType[]).forEach((type) => {
      map[type] = createScene(OVERLAYS[type].label, [...base, createOverlay(type, { intensity: Math.min(1, (OVERLAYS[type].defaults.intensity ?? 0.5) * 1.5) })]);
    });
    return map;
  }, [palette]);
  return (
    <div className="space-y-3">
      <p className="text-2xs text-subtle">Finishing textures that sit on top of everything.</p>
      <div className="grid grid-cols-2 gap-1">
        {(Object.keys(OVERLAYS) as OverlayType[]).map((type) => (
          <Tooltip key={type} content={OVERLAYS[type].description} side="right">
            <div>
              <PreviewTile scene={scenes[type]} label={OVERLAYS[type].label} artistName="Aa" onClick={() => editorActions.addLayer(createOverlay(type))} />
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- particles ------------------------------- */

export function ParticlesPanel() {
  const palette = usePalette();
  const scene = useActiveScene();
  const scenes = useMemo(
    () => PARTICLE_PRESETS.map((p) => createScene(p.label, [dark(), particlesFromPreset(p, palette)])),
    [palette],
  );
  const count = scene?.layers.filter((l) => l.kind === "particles").length ?? 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-2xs text-subtle">Layer as many systems as you like.</p>
        {count > 0 && <Badge tone="accent">{count} in scene</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {PARTICLE_PRESETS.map((preset, i) => (
          <PreviewTile key={preset.id} scene={scenes[i]!} label={preset.label} onClick={() => editorActions.addLayer(particlesFromPreset(preset, palette))} />
        ))}
      </div>
    </div>
  );
}
