"use client";

import { Eye, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/misc";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import { GENRE_MAP } from "@/data/genres";
import { templatePreviewScene, type TemplateDefinition } from "@/domain/templates";
import { cn } from "@/lib/utils";

export function EnergyMeter({ energy }: { energy: TemplateDefinition["energy"] }) {
  const level = energy === "Chill" ? 1 : energy === "Groove" ? 2 : 3;
  return (
    <span className="flex items-end gap-[2px]" title={`${energy} energy`} aria-label={`${energy} energy`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-full", i <= level ? "bg-accent-soft" : "bg-white/15")}
          style={{ height: 4 + i * 3 }}
        />
      ))}
    </span>
  );
}

export function TemplateCard({
  template,
  artistName,
  onPreview,
  onUse,
  index = 0,
}: {
  template: TemplateDefinition;
  artistName: string;
  onPreview: () => void;
  onUse: () => void;
  index?: number;
}) {
  return (
    <article className="group/card relative">
      <div
        className={cn(
          "relative aspect-video overflow-hidden rounded-2xl border border-line bg-black transition-all duration-300",
          "group-hover/card:-translate-y-1 group-hover/card:border-white/20 group-hover/card:shadow-[0_24px_60px_-24px_rgb(139_92_246/0.65)]",
        )}
      >
        <VisualCanvas
          scene={templatePreviewScene(template)}
          artistName={artistName}
          bpm={template.bpm}
          fps={24}
          maxWidth={560}
          thumbnail
          quality={0.55}
          timeOffset={index * 1.37}
          aria-label={`${template.name} preview`}
        />
        <div className="absolute left-2.5 top-2.5 flex gap-1.5">
          {template.isNew && <Badge tone="new">New</Badge>}
          {template.featured && (
            <Badge tone="accent">
              <Sparkles className="h-2.5 w-2.5" /> Popular
            </Badge>
          )}
          {template.tier === "pro" && <Badge tone="pro">Pro</Badge>}
        </div>
        <div className="absolute inset-0 flex items-end justify-center gap-2 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 opacity-0 transition-all duration-300 group-hover/card:opacity-100 group-focus-within/card:opacity-100">
          <button
            type="button"
            onClick={onPreview}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-white/15 px-3.5 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/25"
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
          <button
            type="button"
            onClick={onUse}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-semibold text-black transition-transform hover:scale-[1.03]"
          >
            Use template
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-ink">{template.name}</h3>
          <p className="mt-0.5 truncate text-xs text-muted">
            {[...new Set([GENRE_MAP[template.category].label, template.style, template.motion])].join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 pt-0.5">
          <span className="flex -space-x-1">
            {template.palette.slice(0, 3).map((c) => (
              <span key={c} className="h-3 w-3 rounded-full ring-2 ring-bg" style={{ background: c }} />
            ))}
          </span>
          <EnergyMeter energy={template.energy} />
        </div>
      </div>
    </article>
  );
}
