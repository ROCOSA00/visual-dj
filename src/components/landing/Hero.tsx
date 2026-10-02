"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, AudioLines, BadgeCheck, Blend, Film, Image as ImageIcon, LayoutTemplate, Mic2, PaintBucket, Play, Shapes, Sparkle, Type, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import { TEMPLATE_MAP } from "@/data/templates";
import { buildShowSet } from "@/domain/templates";

const HERO_TEMPLATES = ["neon-district", "main-stage", "warehouse-pulse", "sunset-boulevard", "hyperdrive"];
const RAIL = [Type, Mic2, BadgeCheck, ImageIcon, Film, Shapes, PaintBucket, Wand2, Blend, Sparkle, AudioLines, LayoutTemplate];

export function Hero() {
  const [index, setIndex] = useState(0);
  const sets = useMemo(
    () => HERO_TEMPLATES.map((id) => ({ template: TEMPLATE_MAP[id]!, scene: buildShowSet(TEMPLATE_MAP[id]!)[2]! })),
    [],
  );
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % sets.length), 5200);
    return () => clearInterval(id);
  }, [sets.length]);
  const current = sets[index]!;

  return (
    <section className="relative overflow-hidden pt-32 sm:pt-40">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[680px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_92_246/0.35),transparent)] blur-2xl" />
        <div className="absolute right-[-10%] top-[20%] h-[420px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(34_211_238/0.18),transparent)] blur-2xl" />
        <div className="absolute inset-0 noise-bg [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-5 text-center sm:px-8">
        <motion.a
          href="#features"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.04] py-1 pl-1 pr-3 text-xs text-muted backdrop-blur transition-colors hover:text-ink"
        >
          <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">New</span>
          Audio-reactive visuals, live in your browser
          <ArrowRight className="h-3 w-3" />
        </motion.a>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-5xl text-balance font-display text-[38px] font-semibold leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-[72px]"
        >
          Create visuals that <span className="text-gradient animate-gradient-pan">move with your sound</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.6 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
        >
          Design custom visuals for your DJ sets in minutes. Pick a template, add your name and logo, tweak colours and
          motion, and take it to the stage. No design or VJ skills needed.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.6 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <ButtonLink href="/dashboard" variant="primary" size="lg" iconRight={<ArrowRight className="h-4 w-4" />} className="w-full sm:w-auto">
            Create your visuals
          </ButtonLink>
          <ButtonLink href="/templates" variant="secondary" size="lg" className="w-full sm:w-auto">
            Explore templates
          </ButtonLink>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-5 text-xs text-subtle">
          Free during beta · Runs in your browser · Nothing to install
        </motion.p>
      </div>

      {/* Product preview */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mt-16 max-w-6xl px-4 [perspective:1600px] sm:mt-20 sm:px-8"
      >
        <div className="pointer-events-none absolute inset-x-10 -bottom-10 top-10 -z-10 rounded-[40px] bg-[radial-gradient(closest-side,rgb(139_92_246/0.45),transparent)] blur-3xl" />
        <div className="overflow-hidden rounded-2xl border border-line-strong bg-surface-1 shadow-[0_40px_140px_-30px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.04)] sm:rounded-[20px]">
          {/* Window chrome */}
          <div className="flex h-11 items-center justify-between border-b border-line px-4">
            <div className="flex items-center gap-3">
              <div className="hidden gap-1.5 sm:flex">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </div>
              <LogoMark className="h-6 w-6 rounded-md" />
              <span className="text-xs font-semibold text-ink">{current.template.name} Set</span>
              <span className="hidden text-[10px] text-success sm:inline">● Saved</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-md border border-line-strong px-2 py-1 text-[10px] text-muted sm:inline">Export</span>
              <span className="flex items-center gap-1 rounded-md bg-brand-strong px-2.5 py-1 text-[10px] font-semibold text-white">
                <Play className="h-2.5 w-2.5" fill="currentColor" /> Show Mode
              </span>
            </div>
          </div>
          <div className="flex">
            {/* Rail */}
            <div className="hidden w-12 shrink-0 flex-col items-center gap-3 border-r border-line py-4 md:flex">
              {RAIL.map((Icon, i) => (
                <Icon key={i} className={i === 7 ? "h-4 w-4 text-accent-soft" : "h-4 w-4 text-subtle"} />
              ))}
            </div>
            {/* Stage */}
            <div className="relative min-w-0 flex-1 bg-[#07070b] p-3 sm:p-6 md:p-8">
              <div className="relative overflow-hidden rounded-md bg-black shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_0_0_6px_#0b0b10]">
                <div className="aspect-video">
                  <AnimatePresence mode="sync">
                    <motion.div key={current.template.id} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
                      <VisualCanvas scene={current.scene} artistName="NOVA KAI" bpm={current.template.bpm} maxWidth={1400} aria-label={`${current.template.name} visual`} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              <div className="mt-3 hidden items-center gap-2 sm:flex">
                {sets.map((s, i) => (
                  <button
                    key={s.template.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={
                      i === index
                        ? "h-1.5 flex-1 rounded-full bg-gradient-to-r from-accent-soft to-accent-cyan"
                        : "h-1.5 flex-1 rounded-full bg-white/10 transition-colors hover:bg-white/20"
                    }
                    aria-label={`Show ${s.template.name}`}
                  />
                ))}
              </div>
            </div>
            {/* Inspector */}
            <div className="hidden w-56 shrink-0 space-y-4 border-l border-line p-4 lg:block">
              <p className="text-[11px] font-semibold text-ink">Artist Name</p>
              {[
                ["Size", 72],
                ["Glow", 60],
                ["React to bass", 45],
                ["Animation speed", 38],
              ].map(([label, v]) => (
                <div key={label as string} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>{label}</span>
                    <span className="font-mono">{v}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10">
                    <div className="h-1 rounded-full bg-gradient-to-r from-accent-soft to-accent-cyan" style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex gap-1.5 pt-1">
                {current.template.palette.map((c) => (
                  <span key={c} className="h-6 w-6 rounded-md border border-white/10" style={{ background: c }} />
                ))}
              </div>
              <div className="space-y-1.5 pt-2">
                {["Intro", "Build Up", "Drop", "Break", "Outro"].map((n, i) => (
                  <div key={n} className={i === 2 ? "rounded-md bg-accent/15 px-2 py-1.5 text-[10px] font-medium text-ink" : "px-2 py-1 text-[10px] text-subtle"}>
                    {i + 1} · {n}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating chips */}
        <FloatingChip className="-left-2 top-[30%] hidden lg:flex" delay={0}>
          <AudioLines className="h-3.5 w-3.5 text-accent-cyan" /> Bass Pulse <span className="text-success">ON</span>
        </FloatingChip>
        <FloatingChip className="-right-3 top-[18%] hidden lg:flex" delay={1.2}>
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-live" /> Scene 3 · Drop
        </FloatingChip>
        <FloatingChip className="-right-6 bottom-[22%] hidden lg:flex" delay={2.1}>
          <span className="font-mono">{current.template.bpm}</span> BPM · Tap tempo
        </FloatingChip>
      </motion.div>
    </section>
  );
}

function FloatingChip({ children, className, delay }: { children: React.ReactNode; className?: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
      transition={{ opacity: { delay: 0.9 + delay * 0.2 }, scale: { delay: 0.9 + delay * 0.2 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay } }}
      className={`absolute z-10 items-center gap-2 rounded-xl border border-line-strong bg-[#14141c]/90 px-3 py-2 text-xs font-medium text-ink shadow-pop backdrop-blur-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}
