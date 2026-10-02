"use client";

import { LayoutTemplate, MonitorPlay, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import { TEMPLATE_MAP } from "@/data/templates";
import { templatePreviewScene } from "@/domain/templates";
import { Reveal, SectionHeading } from "./shared";

const NAMES = ["NOVA KAI", "SELENE VEGA", "MØRK", "AURA X"];

export function Marquee() {
  const items = ["Club nights", "Festival main stages", "Warehouse raves", "Twitch & YouTube streams", "Rooftop sessions", "Live AV shows", "Boiler-room style sets", "Private events"];
  return (
    <div className="relative mt-24 overflow-hidden border-y border-line bg-surface-1/40 py-5 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <div className="flex w-max animate-marquee gap-12 pr-12">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-12 whitespace-nowrap text-sm font-medium text-subtle">
            {item}
            <span className="h-1 w-1 rounded-full bg-accent-soft/60" />
          </span>
        ))}
      </div>
    </div>
  );
}

export function HowItWorks() {
  const [nameIdx, setNameIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNameIdx((i) => (i + 1) % NAMES.length), 2200);
    return () => clearInterval(id);
  }, []);
  const scenes = useMemo(
    () => ({
      pick: ["outrun-86", "third-eye", "aurora", "steel-foundry"].map((id) => templatePreviewScene(TEMPLATE_MAP[id]!)),
      custom: templatePreviewScene(TEMPLATE_MAP["signature"]!),
      show: templatePreviewScene(TEMPLATE_MAP["bass-cathedral"]!),
    }),
    [],
  );

  const steps = [
    {
      icon: <LayoutTemplate className="h-5 w-5" />,
      title: "Pick a template",
      body: "Start from 30 looks built for real stages, from dark techno tunnels to golden-hour house gradients.",
      visual: (
        <div className="grid h-full grid-cols-2 gap-1.5 p-1.5">
          {scenes.pick.map((s, i) => (
            <div key={s.id} className="overflow-hidden rounded-md bg-black">
              <VisualCanvas scene={s} artistName="YOUR NAME" bpm={124} fps={24} maxWidth={320} thumbnail quality={0.5} timeOffset={i} />
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <SlidersHorizontal className="h-5 w-5" />,
      title: "Make it yours",
      body: "Type your artist name, drop in your logo, swap colours, fonts and motion. Every change is instant.",
      visual: <VisualCanvas scene={scenes.custom} artistName={NAMES[nameIdx]!} bpm={124} maxWidth={640} />,
    },
    {
      icon: <MonitorPlay className="h-5 w-5" />,
      title: "Hit the stage",
      body: "Build your set as scenes, then go fullscreen in Show Mode and switch looks live from the keyboard.",
      visual: <VisualCanvas scene={scenes.show} artistName="NOVA KAI" bpm={134} maxWidth={640} />,
    },
  ];

  return (
    <section id="how" className="scroll-mt-20 px-5 py-28 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From idea to stage in <span className="text-gradient">three steps</span>
            </>
          }
          description="No timelines, keyframes or render queues. If you can make a flyer, you can make your visuals."
        />
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.08}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-line bg-surface-1/70 p-2 transition-all duration-300 hover:-translate-y-1 hover:border-white/15">
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">{step.visual}</div>
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-soft">{step.icon}</span>
                    <span className="font-mono text-xs text-subtle">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
