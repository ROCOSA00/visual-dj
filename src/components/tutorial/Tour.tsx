"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clapperboard, Layers, MousePointerClick, Play, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

export interface TourStep {
  title: string;
  body: string;
  /** CSS selector of the element to highlight. Omit for a centred card. */
  target?: string;
  placement?: "right" | "left" | "top" | "bottom";
  icon?: React.ReactNode;
  /** Runs before the step is shown (e.g. open a panel). */
  prepare?: () => void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PAD = 8;
const CARD_W = 340;

export function Tour({
  open,
  step,
  steps,
  onStep,
  onClose,
}: {
  open: boolean;
  step: number;
  steps: TourStep[];
  onStep: (step: number) => void;
  onClose: (completed: boolean) => void;
}) {
  const current = steps[step];
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 1440, h: 900 });

  const measure = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    if (!current?.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(current.target);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 });
  }, [current]);

  useLayoutEffect(() => {
    if (!open) return;
    current?.prepare?.();
    measure();
    // Panels may animate into place; re-measure a few times.
    const timers = [80, 260, 520].map((ms) => setTimeout(measure, ms));
    window.addEventListener("resize", measure);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", measure);
    };
  }, [open, step, measure, current]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (step < steps.length - 1) onStep(step + 1);
        else onClose(true);
      }
      if (e.key === "ArrowLeft" && step > 0) onStep(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, steps.length, onStep, onClose]);

  if (typeof document === "undefined" || !current) return null;

  const last = step === steps.length - 1;
  const cardPos = (() => {
    if (!rect) return { left: viewport.w / 2 - CARD_W / 2, top: viewport.h / 2 - 170 };
    const gap = 18;
    const p = current.placement ?? "right";
    let left = p === "right" ? rect.x + rect.w + gap : p === "left" ? rect.x - CARD_W - gap : rect.x + rect.w / 2 - CARD_W / 2;
    let top = p === "top" ? rect.y - 230 - gap : p === "bottom" ? rect.y + rect.h + gap : rect.y + Math.min(rect.h / 2 - 110, 80);
    left = Math.max(16, Math.min(viewport.w - CARD_W - 16, left));
    top = Math.max(16, Math.min(viewport.h - 260, top));
    return { left, top };
  })();

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[400]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Dimmed backdrop with a spotlight cut-out. */}
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <mask id="vd-tour-mask">
                <rect width="100%" height="100%" fill="white" />
                {rect && (
                  <motion.rect
                    initial={false}
                    animate={{ x: rect.x, y: rect.y, width: rect.w, height: rect.h }}
                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    rx="14"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(3,3,6,0.74)" mask="url(#vd-tour-mask)" />
          </svg>
          {rect && (
            <motion.div
              className="pointer-events-none absolute rounded-[14px] border-2 border-accent-soft shadow-[0_0_0_4px_rgb(139_92_246/0.25),0_0_40px_rgb(139_92_246/0.55)]"
              initial={false}
              animate={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            />
          )}

          <motion.div
            key={step}
            role="dialog"
            aria-label={current.title}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            style={{ left: cardPos.left, top: cardPos.top, width: CARD_W }}
            className="absolute overflow-hidden rounded-2xl border border-line-strong bg-[#121219] shadow-pop"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-soft to-transparent" />
            {!current.target ? (
              <div className="relative flex h-28 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_120%,rgb(139_92_246/0.55),transparent_60%),radial-gradient(circle_at_20%_0%,rgb(34_211_238/0.25),transparent_50%)]">
                <div className="absolute inset-0 noise-bg opacity-60" />
                <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
                  <LogoMark className="h-14 w-14 rounded-2xl" />
                </motion.div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-5 pt-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent-soft [&>svg]:h-4 [&>svg]:w-4">{current.icon}</span>
                <span className="text-2xs font-semibold uppercase tracking-[0.16em] text-subtle">
                  Step {step + 1} of {steps.length}
                </span>
              </div>
            )}
            <div className="space-y-2 px-5 pb-4 pt-4">
              <h3 className="font-display text-lg font-semibold leading-snug text-ink">{current.title}</h3>
              <p className="text-[13px] leading-relaxed text-muted">{current.body}</p>
            </div>
            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <div className="flex items-center gap-1.5" aria-hidden>
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={cn("h-1.5 rounded-full transition-all duration-300", i === step ? "w-5 bg-accent-soft" : i < step ? "w-1.5 bg-accent-soft/50" : "w-1.5 bg-white/15")}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                {step > 0 && (
                  <Button size="sm" variant="ghost" icon={<ArrowLeft className="h-3.5 w-3.5" />} onClick={() => onStep(step - 1)}>
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  iconRight={!last ? <ArrowRight className="h-3.5 w-3.5" /> : undefined}
                  onClick={() => (last ? onClose(true) : onStep(step + 1))}
                >
                  {last ? "Start creating" : step === 0 ? "Show me around" : "Next"}
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onClose(false)}
              className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-black/30 px-2 py-1 text-2xs text-muted backdrop-blur transition-colors hover:text-ink"
            >
              Skip tutorial <X className="h-3 w-3" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export const EDITOR_TOUR_ICONS = {
  library: <Layers />,
  canvas: <MousePointerClick />,
  properties: <SlidersHorizontal />,
  scenes: <Clapperboard />,
  show: <Play />,
};

export const WELCOME_COPY = {
  title: "Welcome to your visual studio",
  body: `This is where your show comes to life. We've loaded a ready-to-play set so you never start from a blank screen. Let's take 30 seconds to show you around ${brand.name}.`,
};
