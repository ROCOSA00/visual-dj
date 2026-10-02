"use client";

import { Clapperboard, Keyboard, MousePointerClick, Move, Palette as PaletteIcon, Type } from "lucide-react";
import { ColorSwatchButton } from "@/components/ui/ColorField";
import { FieldLabel, InlineEdit, Segmented, TextInput } from "@/components/ui/controls";
import { Section } from "@/components/ui/misc";
import { PALETTES } from "@/data/palettes";
import { useEditorStore } from "@/store/editor";
import { editorActions } from "@/store/editorActions";
import { useActiveProject, useActiveScene } from "../hooks";
import { cn } from "@/lib/utils";

export function ScenePanel() {
  const project = useActiveProject();
  const scene = useActiveScene();
  const setModal = useEditorStore((s) => s.setModal);
  if (!project || !scene) return null;
  const sceneIndex = project.scenes.findIndex((s) => s.id === scene.id);
  const palette = project.palette.length >= 4 ? project.palette : ["#8b5cf6", "#22d3ee", "#f472b6", "#07060d"];
  const matches = (colors: string[]) => colors.every((c, i) => c.toLowerCase() === palette[i]?.toLowerCase());

  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface-3 text-muted">
          <Clapperboard className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <InlineEdit
            value={scene.name}
            onCommit={(name) => editorActions.renameScene(scene.id, name)}
            className="block w-full text-[13px] font-semibold text-ink"
            inputClassName="h-6 w-full text-[13px]"
            ariaLabel="Scene name"
          />
          <p className="text-2xs text-subtle">
            Scene {sceneIndex + 1} of {project.scenes.length} · {scene.layers.length} layers
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-4 mt-4 rounded-xl border border-line bg-gradient-to-br from-white/[0.04] to-transparent p-3.5">
          <p className="text-xs font-semibold text-ink">Nothing selected</p>
          <ul className="mt-2 space-y-1.5 text-2xs text-muted">
            <li className="flex items-center gap-2">
              <MousePointerClick className="h-3 w-3 text-accent-soft" /> Click an element on the canvas, or a layer, to edit it
            </li>
            <li className="flex items-center gap-2">
              <Move className="h-3 w-3 text-accent-soft" /> Drag to move · corners to resize · top dot to rotate
            </li>
            <li className="flex items-center gap-2">
              <Type className="h-3 w-3 text-accent-soft" /> Double-click text to change what it says
            </li>
          </ul>
        </div>

        <Section title="Show">
          <div className="space-y-1.5">
            <FieldLabel label="Artist name" hint="Used by every scene and the monogram logo" />
            <TextInput value={project.artistName} onChange={(v) => editorActions.setArtistName(v)} placeholder="Your artist name" maxLength={40} ariaLabel="Artist name" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel label="Loop length" hint="Every animation in the scene repeats seamlessly over this many bars" />
            <Segmented
              value={scene.loopBars}
              onChange={(v) => editorActions.setLoopBars(v)}
              options={[2, 4, 8, 16, 32].map((b) => ({ value: b, label: `${b}` }))}
              ariaLabel="Loop length in bars"
            />
            <p className="text-2xs text-subtle">
              Bars at {project.bpm} BPM · {((scene.loopBars * 4 * 60) / project.bpm).toFixed(1)} s loop
            </p>
          </div>
        </Section>

        <Section title="Colour palette" badge={<PaletteIcon className="h-3 w-3 text-subtle" />}>
          <div className="space-y-1.5">
            <FieldLabel label="Project colours" hint="Changing a colour recolours every layer that uses it, in all scenes" />
            <div className="flex items-center gap-2">
              {palette.slice(0, 4).map((color, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <ColorSwatchButton
                    color={color}
                    onChange={(next) => editorActions.applyPalette(palette.map((c, j) => (j === i ? next : c)), `palette:${i}`)}
                    ariaLabel={["Primary", "Secondary", "Accent", "Base"][i]}
                  />
                  <span className="text-[9px] uppercase tracking-wider text-subtle">{["Main", "Second", "Accent", "Base"][i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel label="Try a palette" />
            <div className="grid grid-cols-2 gap-1.5">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => editorActions.applyPalette(p.colors)}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg border p-1.5 text-left transition-all hover:border-white/25 hover:bg-white/[0.04]",
                    matches(p.colors) ? "border-accent/60 bg-accent/10" : "border-line",
                  )}
                >
                  <span className="flex overflow-hidden rounded-md">
                    {p.colors.map((c) => (
                      <span key={c} className="h-5 w-3" style={{ background: c }} />
                    ))}
                  </span>
                  <span className="truncate text-2xs font-medium text-muted group-hover:text-ink">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        <div className="p-4">
          <button
            type="button"
            onClick={() => setModal("shortcuts")}
            className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-2xs text-muted transition-colors hover:border-white/20 hover:text-ink"
          >
            <Keyboard className="h-3.5 w-3.5" /> Keyboard shortcuts
            <span className="kbd ml-auto">?</span>
          </button>
        </div>
      </div>
    </>
  );
}
