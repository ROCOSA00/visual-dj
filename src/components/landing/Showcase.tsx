"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplatePreviewModal } from "@/components/templates/TemplatePreviewModal";
import { ButtonLink } from "@/components/ui/Button";
import { brand } from "@/config/brand";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import { TEMPLATE_MAP, TEMPLATES } from "@/data/templates";
import { buildShowSet, type TemplateDefinition } from "@/domain/templates";
import { cn } from "@/lib/utils";
import { Reveal, SectionHeading } from "./shared";

const EXAMPLES: Array<{ template: string; artist: string; event: string; scene: number; span?: string }> = [
  { template: "main-stage", artist: "KAIROS", event: "Festival main stage · Drop", scene: 2, span: "md:col-span-2 md:row-span-2" },
  { template: "deep-velvet", artist: "Selene Vega", event: "Late-night house · Intro", scene: 0 },
  { template: "ghost-protocol", artist: "MØRK", event: "Warehouse techno · Build", scene: 1 },
  { template: "vhs-memories", artist: "LUNA b2b SOL", event: "Twitch stream · Break", scene: 3 },
  { template: "third-eye", artist: "AURA X", event: "Psytrance stage · Drop", scene: 2 },
  { template: "gold-rush", artist: "Dexter Hale", event: "VIP club night · Outro", scene: 4 },
];

export function Examples() {
  const items = useMemo(
    () =>
      EXAMPLES.map((e) => {
        const t = TEMPLATE_MAP[e.template]!;
        return { ...e, bpm: t.bpm, scene: buildShowSet(t)[e.scene]! };
      }),
    [],
  );
  return (
    <section className="px-5 py-28 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow={`Made with ${brand.name}`}
          title="Visuals that look like you hired a VJ"
          description="Every one of these was made from a template in a few minutes. Same engine, different artists, completely different shows."
        />
        <div className="mt-16 grid auto-rows-[220px] gap-4 sm:grid-cols-2 md:grid-cols-3 md:auto-rows-[200px] lg:auto-rows-[230px]">
          {items.map((item, i) => (
            <Reveal key={item.artist} delay={(i % 3) * 0.06} className={cn("group relative overflow-hidden rounded-3xl border border-line bg-black", item.span)}>
              <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]">
                <VisualCanvas scene={item.scene} artistName={item.artist} bpm={item.bpm} maxWidth={item.span ? 1280 : 640} timeOffset={i * 1.7} />
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/85 to-transparent p-4">
                <div>
                  <p className="text-sm font-semibold text-white">{item.artist}</p>
                  <p className="text-xs text-white/60">{item.event}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PopularTemplates() {
  const router = useRouter();
  const [preview, setPreview] = useState<TemplateDefinition | null>(null);
  const popular = useMemo(() => [...TEMPLATES].sort((a, b) => b.popularity - a.popularity).slice(0, 6), []);
  return (
    <section id="templates" className="scroll-mt-20 px-5 py-28 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            align="left"
            eyebrow="Popular templates"
            title="Start from a look the crowd already loves"
            description="Each template is a full show set: Intro, Build Up, Drop, Break and Outro, ready to customise."
          />
          <ButtonLink href="/templates" variant="secondary" iconRight={<ArrowRight className="h-4 w-4" />}>
            Browse all {TEMPLATES.length}
          </ButtonLink>
        </div>
        <div className="mt-12 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 0.06}>
              <TemplateCard
                template={t}
                index={i}
                artistName="YOUR NAME"
                onPreview={() => setPreview(t)}
                onUse={() => router.push(`/new?template=${t.id}`)}
              />
            </Reveal>
          ))}
        </div>
      </div>
      <TemplatePreviewModal
        template={preview}
        artistName="YOUR NAME"
        onClose={() => setPreview(null)}
        onUse={(t) => router.push(`/new?template=${t.id}`)}
      />
    </section>
  );
}
