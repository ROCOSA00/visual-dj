"use client";

import {
  AudioLines,
  BadgeCheck,
  Bot,
  Cable,
  Clapperboard,
  Cloud,
  Download,
  Infinity as InfinityIcon,
  Keyboard,
  MonitorPlay,
  Music2,
  Radio,
  SlidersHorizontal,
  Store,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import { TEMPLATE_MAP } from "@/data/templates";
import { buildShowSet } from "@/domain/templates";
import { cn } from "@/lib/utils";
import { Reveal, SectionHeading } from "./shared";

const FEATURES = [
  { icon: SlidersHorizontal, title: "Live visual editor", body: "Text, logos, images, video loops, shapes, effects and particles, all editable in real time." },
  { icon: Clapperboard, title: "Scenes & show sets", body: "Organise your show as scenes: Intro, Build Up, Drop, Break, Outro. Duplicate, rename, reorder." },
  { icon: AudioLines, title: "Audio reactive", body: "Bass pulse, beat flashes, EQ bars, waveforms and particle bursts that follow the music." },
  { icon: MonitorPlay, title: "Show Mode", body: "Fullscreen output with a hideable controller, crossfades, blackout, strobe and tap tempo." },
  { icon: BadgeCheck, title: "Your identity", body: "Your name in 3D ice, chrome, gold, neon or fire, your logo, your photo echoed tour-style and one-click colour grades." },
  { icon: InfinityIcon, title: "Seamless loops", body: "Every animation is locked to your BPM and loops perfectly, bar after bar." },
  { icon: Download, title: "Export", body: "Grab stills or seamless WebM loops for Resolume, OBS or socials. MP4 and GIF coming soon." },
  { icon: Keyboard, title: "Keyboard-first", body: "Switch scenes with 1–9, play with Space, save with ⌘S. Built for dark booths." },
];

export function Features() {
  const audioScene = useMemo(() => buildShowSet(TEMPLATE_MAP["dembow-fuego"]!)[2]!, []);
  return (
    <section id="features" className="scroll-mt-20 px-5 py-28 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Features"
          title={
            <>
              Everything you need to <span className="text-gradient">own the screen</span>
            </>
          }
          description="Pro-level visuals without pro-level software. Built around how DJs actually prepare and play."
        />

        <Reveal className="mt-16">
          <div className="relative grid overflow-hidden rounded-3xl border border-line bg-surface-1/70 lg:grid-cols-2">
            <div className="flex flex-col justify-center p-8 sm:p-12">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-live/15 text-live">
                <Radio className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-ink sm:text-3xl">Visuals that hear the drop</h3>
              <p className="mt-3 max-w-md text-muted">
                Use the built-in demo beat, load a track, or plug in the room mic or your mixer&apos;s line-in. Visuals pump with
                the kick, flash on the beat and explode on the drop.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Bass Pulse", "Beat Flash", "Waveform", "Frequency Bars", "Particle Burst", "Strobe", "Camera Shake"].map((t) => (
                  <span key={t} className="rounded-full border border-line-strong px-3 py-1 text-xs text-muted">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative min-h-[260px] bg-black">
              <VisualCanvas scene={audioScene} artistName="KAIROS" bpm={128} maxWidth={1100} className="absolute inset-0" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-2xs font-semibold text-white backdrop-blur">
                <Music2 className="h-3 w-3 text-accent-cyan" /> Reacting at 128 BPM
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={(i % 4) * 0.05}>
              <div className="group h-full rounded-2xl border border-line bg-surface-1/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-surface-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-soft transition-all group-hover:bg-brand-strong group-hover:text-white group-hover:shadow-[0_0_24px_rgb(139_92_246/0.6)]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-[15px] font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const USE_CASES = [
  {
    title: "Club DJs",
    body: "Put your name on the LED wall behind the booth and match the room's energy scene by scene.",
    template: "red-room",
    artist: "MØRK",
    tag: "Weekly residencies",
  },
  {
    title: "Festival stages",
    body: "Main-stage lasers, crowd-pumping drops and a branded intro for your slot, ready in an afternoon.",
    template: "main-stage",
    artist: "KAIROS",
    tag: "Big screens",
  },
  {
    title: "Live streamers",
    body: "Give your Twitch or YouTube sets a signature look. Capture the browser window in OBS and go.",
    template: "neon-barrio",
    artist: "LUNA",
    tag: "OBS friendly",
  },
  {
    title: "Producers & live acts",
    body: "Turn your release artwork and logo into reactive visuals for showcases and album launches.",
    template: "purple-haze",
    artist: "Selene Vega",
    tag: "Launch parties",
  },
];

export function UseCases() {
  const scenes = useMemo(() => USE_CASES.map((u) => buildShowSet(TEMPLATE_MAP[u.template]!)[1]!), []);
  return (
    <section id="use-cases" className="scroll-mt-20 px-5 py-28 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Use cases" title="Built for every kind of booth" description="From a Thursday residency to a sunset festival slot." />
        <div className="mt-16 grid gap-5 md:grid-cols-2">
          {USE_CASES.map((u, i) => (
            <Reveal key={u.title} delay={(i % 2) * 0.08}>
              <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface-1/60 transition-all duration-300 hover:border-white/15 sm:flex-row">
                <div className="relative aspect-video shrink-0 overflow-hidden bg-black sm:aspect-auto sm:w-[46%]">
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                    <VisualCanvas scene={scenes[i]!} artistName={u.artist} bpm={TEMPLATE_MAP[u.template]!.bpm} maxWidth={640} />
                  </div>
                </div>
                <div className="flex flex-col p-6">
                  <span className="w-fit rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-soft">{u.tag}</span>
                  <h3 className="mt-4 font-display text-xl font-semibold text-ink">{u.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{u.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const ROADMAP = [
  { icon: Cloud, label: "Cloud sync & DJ profiles" },
  { icon: Cable, label: "MIDI controller mapping" },
  { icon: Music2, label: "Ableton Link & Rekordbox sync" },
  { icon: MonitorPlay, label: "Resolume & NDI output" },
  { icon: Bot, label: "AI-generated visuals" },
  { icon: Store, label: "Template marketplace" },
  { icon: Users, label: "Collaboration with your crew" },
];

export function Roadmap() {
  return (
    <section className="px-5 py-20 sm:px-8">
      <Reveal className="mx-auto max-w-5xl rounded-3xl border border-line bg-gradient-to-b from-surface-1 to-transparent p-8 text-center sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-cyan">On the roadmap</p>
        <h3 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl">Plugging into the rest of your setup</h3>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {ROADMAP.map(({ icon: Icon, label }, i) => (
            <span
              key={label}
              className={cn(
                "flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] px-4 py-2 text-sm text-muted",
                i === 0 && "border-accent/40 text-ink",
              )}
            >
              <Icon className="h-4 w-4 text-accent-soft" /> {label}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
