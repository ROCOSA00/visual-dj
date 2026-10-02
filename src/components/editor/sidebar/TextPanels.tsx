"use client";

import { Check, Mic2, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FitText } from "@/components/ui/FitText";
import { TextInput, Toggle } from "@/components/ui/controls";
import { ARTIST_STYLES, QUICK_TEXT, TEXT_PRESETS, type ArtistStyle, type TextPreset } from "@/data/presets";
import { createArtistName, createBackground, createScene, createText } from "@/domain/factories";
import type { Scene, TextLayer } from "@/domain/types";
import { fontFamilies } from "@/styles/fonts";
import { editorActions } from "@/store/editorActions";
import { useActiveProject, useActiveScene } from "../hooks";
import { PanelSection, PreviewTile } from "./common";
import { cn } from "@/lib/utils";

export function TextPanel() {
  const project = useActiveProject();
  const palette = project?.palette ?? [];
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {QUICK_TEXT.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => editorActions.addLayer(createText({ name: q.label.replace("Add ", "").replace(/^a /, ""), ...q.build() }))}
            className={cn(
              "group flex w-full items-center justify-between rounded-xl border border-line bg-white/[0.03] px-3.5 text-left text-ink transition-all hover:border-white/20 hover:bg-white/[0.06]",
              i === 0 ? "h-14 font-display text-lg font-bold" : i === 1 ? "h-12 text-[15px] font-semibold" : "h-10 text-xs font-medium tracking-wide text-muted",
            )}
          >
            {q.label}
            <Plus className="h-4 w-4 text-subtle transition-colors group-hover:text-ink" />
          </button>
        ))}
      </div>
      <PanelSection title="Text styles">
        <div className="grid grid-cols-2 gap-2">
          {TEXT_PRESETS.map((preset) => (
            <TextStyleTile
              key={preset.id}
              preset={preset}
              onClick={() => editorActions.addLayer(createText({ name: preset.label, ...preset.build(palette) }))}
            />
          ))}
        </div>
      </PanelSection>
    </div>
  );
}

function TextStyleTile({ preset, onClick }: { preset: TextPreset; onClick: () => void }) {
  const p = preset.preview;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/tile flex flex-col gap-1.5 rounded-xl p-1 text-left hover:bg-white/[0.04]"
    >
      <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-line bg-[radial-gradient(circle_at_50%_30%,#1d1530,#08080c)] px-2 transition-all group-hover/tile:border-white/25">
        <FitText
          max={p.size}
          className={cn(p.gradient && "text-gradient")}
          style={{
            fontFamily: fontFamilies[p.font],
            fontWeight: p.weight,
            letterSpacing: p.spacing,
            textTransform: p.upper ? "uppercase" : undefined,
            color: p.outline ? "transparent" : undefined,
            WebkitTextStroke: p.outline ? "1px white" : undefined,
            textShadow: p.glow ? "0 0 8px #22d3ee, 0 0 18px #22d3ee" : undefined,
          }}
        >
          {preset.sample}
        </FitText>
      </div>
      <span className="truncate px-0.5 text-[11px] font-medium text-muted group-hover/tile:text-ink">{preset.label}</span>
    </button>
  );
}

const styleSceneCache = new Map<string, Scene>();

/** Mini preview scene for an artist-name style, cached per palette. */
function styleScene(style: ArtistStyle, palette: string[]): Scene {
  const key = `${style.id}|${palette.join()}`;
  let scene = styleSceneCache.get(key);
  if (!scene) {
    scene = createScene(style.label, [
      createBackground({ mode: "solid", color: "#030306" }),
      createArtistName({ ...style.build(palette), transform: { x: 0.5, y: 0.47, scale: 1, rotation: 0 } }),
    ]);
    styleSceneCache.set(key, scene);
  }
  return scene;
}

export function ArtistPanel() {
  const project = useActiveProject();
  const scene = useActiveScene();
  const [everywhere, setEverywhere] = useState(true);
  if (!project) return null;
  const artistLayer = scene?.layers.find((l): l is TextLayer => l.kind === "text" && l.role === "artist");
  const palette = project.palette;
  const styleScenes = ARTIST_STYLES.map((style) => styleScene(style, palette));

  const applyStyle = (style: ArtistStyle) => {
    const patch = style.build(palette);
    if (everywhere) {
      editorActions.styleArtistEverywhere(patch);
      if (!artistLayer) editorActions.addLayer(createArtistName(patch));
    } else if (artistLayer) {
      editorActions.updateLayer(artistLayer.id, patch);
    } else {
      editorActions.addLayer(createArtistName(patch));
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-b from-accent/15 to-transparent p-4">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/30 blur-2xl" />
        <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-ink">
          <Mic2 className="h-3.5 w-3.5 text-accent-soft" /> Your artist name
        </div>
        <TextInput
          value={project.artistName}
          onChange={(v) => editorActions.setArtistName(v)}
          placeholder="e.g. NOVA KAI"
          maxLength={40}
          ariaLabel="Artist name"
          className="h-11 text-base font-semibold"
        />
        <p className="mt-2 flex items-center gap-1.5 text-2xs text-muted">
          <Sparkles className="h-3 w-3 text-accent-cyan" /> Updates live in every scene of this show.
        </p>
      </div>

      {!artistLayer && (
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => editorActions.addLayer(createArtistName({ glowColor: palette[0] ?? "#a78bfa" }))}
        >
          Add artist name to this scene
        </Button>
      )}

      <PanelSection title="Name styles">
        <div className="grid grid-cols-2 gap-1">
          {ARTIST_STYLES.map((style, i) => {
            const patch = style.build(palette);
            const active = artistLayer?.material === patch.material && artistLayer?.font === patch.font;
            return (
              <PreviewTile
                key={style.id}
                scene={styleScenes[i]!}
                label={style.label}
                artistName={project.artistName || "YOUR NAME"}
                active={active}
                badge={active ? <Check className="h-3.5 w-3.5 text-accent-soft" /> : undefined}
                onClick={() => applyStyle(style)}
              />
            );
          })}
        </div>
        <div className="rounded-xl border border-line bg-white/[0.02] p-3">
          <Toggle
            checked={everywhere}
            onChange={setEverywhere}
            label="Apply to every scene"
            description="Keep your name consistent across the whole show."
          />
        </div>
      </PanelSection>
    </div>
  );
}
