"use client";

import { Music2, Sparkles, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/misc";
import { Modal } from "@/components/ui/Modal";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import { GENRE_MAP } from "@/data/genres";
import { buildShowSet, type TemplateDefinition } from "@/domain/templates";
import { cn } from "@/lib/utils";
import { EnergyMeter } from "./TemplateCard";

export function TemplatePreviewModal({
  template,
  artistName,
  onClose,
  onUse,
}: {
  template: TemplateDefinition | null;
  artistName: string;
  onClose: () => void;
  onUse: (template: TemplateDefinition) => void;
}) {
  const scenes = useMemo(() => (template ? buildShowSet(template) : []), [template]);
  const [active, setActive] = useState(0);
  const scene = scenes[active] ?? scenes[0];

  return (
    <Modal
      open={!!template}
      onClose={() => {
        setActive(0);
        onClose();
      }}
      size="xl"
      title={template?.name}
      description={template?.description}
    >
      {template && scene && (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl border border-line-strong bg-black shadow-pop">
              <div className="aspect-video">
                <VisualCanvas scene={scene} artistName={artistName} bpm={template.bpm} maxWidth={1600} aria-label={`${template.name}, ${scene.name}`} />
              </div>
              <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-2xs font-semibold text-white backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-live" /> {scene.name}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {scenes.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "overflow-hidden rounded-lg border text-left transition-all",
                    i === active ? "border-transparent shadow-[0_0_0_2px_rgb(167_139_250)]" : "border-line opacity-70 hover:opacity-100",
                  )}
                >
                  <div className="aspect-video bg-black">
                    <VisualCanvas scene={s} artistName={artistName} bpm={template.bpm} fps={20} maxWidth={240} thumbnail quality={0.4} />
                  </div>
                  <p className="truncate px-2 py-1 text-[10px] font-medium text-muted">
                    {i + 1} · {s.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="accent">{GENRE_MAP[template.category].label}</Badge>
              <Badge>{template.style}</Badge>
              <Badge>{template.motion}</Badge>
              {template.isNew && <Badge tone="new">New</Badge>}
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted">
                  <Zap className="h-3.5 w-3.5" /> Energy
                </dt>
                <dd className="flex items-center gap-2 text-ink">
                  {template.energy} <EnergyMeter energy={template.energy} />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted">
                  <Music2 className="h-3.5 w-3.5" /> Tempo
                </dt>
                <dd className="font-mono text-ink">{template.bpm} BPM</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Palette</dt>
                <dd className="flex gap-1">
                  {template.palette.map((c) => (
                    <span key={c} className="h-5 w-5 rounded-md border border-white/10" style={{ background: c }} />
                  ))}
                </dd>
              </div>
            </dl>
            <div className="rounded-xl border border-line bg-white/[0.02] p-3.5 text-xs leading-relaxed text-muted">
              <p className="mb-1 flex items-center gap-1.5 font-semibold text-ink">
                <Sparkles className="h-3.5 w-3.5 text-accent-soft" /> Includes a full show set
              </p>
              Intro, Build Up, Drop, Break and Outro scenes with matching energy, audio-reactive effects and seamless loops.
            </div>
            <Button variant="primary" size="lg" className="mt-auto w-full" onClick={() => onUse(template)}>
              Use this template
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
