"use client";

import { AlertTriangle, FlaskConical } from "lucide-react";
import { AudioSourceControl } from "@/components/audio/AudioSourceControl";
import { Toggle } from "@/components/ui/controls";
import { Badge } from "@/components/ui/misc";
import { AUDIO_EFFECTS } from "@/domain/catalog";
import { createAudioLayer } from "@/domain/factories";
import type { AudioEffectType, AudioLayer } from "@/domain/types";
import { editorClock, useEditorStore } from "@/store/editor";
import { editorActions } from "@/store/editorActions";
import { useActiveProject, useActiveScene } from "../hooks";
import { PanelSection } from "./common";

const ORDER: AudioEffectType[] = ["bassPulse", "beatFlash", "waveform", "frequencyBars", "particleBurst", "strobe", "cameraShake"];

export function AudioPanel() {
  const project = useActiveProject();
  const scene = useActiveScene();
  const select = useEditorStore((s) => s.select);
  if (!project || !scene) return null;
  const palette = project.palette;

  const layerFor = (effect: AudioEffectType) =>
    scene.layers.find((l): l is AudioLayer => l.kind === "audio" && l.effect === effect);

  const toggle = (effect: AudioEffectType, on: boolean) => {
    const existing = layerFor(effect);
    if (on && !existing) {
      const meta = AUDIO_EFFECTS[effect];
      editorActions.addLayer(
        createAudioLayer(effect, meta.drawsColor && !meta.flashing ? { colors: [palette[1] ?? "#22d3ee", palette[0] ?? "#8b5cf6"] } : {}),
        { select: false },
      );
    } else if (!on && existing) {
      editorActions.removeLayer(existing.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2.5 rounded-xl border border-accent-cyan/20 bg-accent-cyan/[0.06] p-3">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-accent-cyan" />
        <p className="text-2xs leading-relaxed text-muted">
          <span className="font-semibold text-ink">Experimental.</span> Visuals react to a demo beat by default. Load a
          track or use live input to react to real sound.
        </p>
      </div>
      <AudioSourceControl clock={editorClock} bpm={project.bpm} />
      <PanelSection title="Reactive effects" aside={<span className="text-2xs text-subtle">This scene</span>}>
        <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
          {ORDER.map((effect) => {
            const meta = AUDIO_EFFECTS[effect];
            const layer = layerFor(effect);
            return (
              <div key={effect} className="flex items-center gap-3 bg-white/[0.015] px-3 py-2.5 transition-colors hover:bg-white/[0.035]">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => layer && select(layer.id)} disabled={!layer}>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-ink">
                    {meta.label}
                    {meta.flashing && <Badge tone="soon">Flash</Badge>}
                  </p>
                  <p className="mt-0.5 truncate text-2xs text-subtle">{meta.description}</p>
                </button>
                <Toggle checked={!!layer} onChange={(on) => toggle(effect, on)} />
              </div>
            );
          })}
        </div>
        <p className="flex gap-1.5 text-2xs leading-relaxed text-subtle">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
          Strobe and flash effects can affect people with photosensitive epilepsy. You can tone them down in Settings.
        </p>
      </PanelSection>
    </div>
  );
}
