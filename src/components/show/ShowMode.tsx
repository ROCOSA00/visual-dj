"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Keyboard,
  Maximize,
  Minimize,
  MonitorPlay,
  Pause,
  Play,
  Power,
  Scan,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioState } from "@/components/audio/AudioSourceControl";
import { ShortcutList } from "@/components/shortcuts/ShortcutList";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Kbd } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/Tooltip";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import { SHOW_SHORTCUTS } from "@/data/shortcuts";
import type { Project } from "@/domain/types";
import { useTapTempo } from "@/hooks/useTapTempo";
import { cn, isTypingTarget } from "@/lib/utils";
import { editorClock } from "@/store/editor";
import { useProjectsStore } from "@/store/projects";
import { useSettingsStore, type ShowTransition } from "@/store/settings";
import { useShowRenderer, type ShowRuntime } from "./useShowRenderer";

export function ShowMode({ project }: { project: Project }) {
  const router = useRouter();
  const settings = useSettingsStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const runtime = useRef<ShowRuntime>({
    sceneIndex: 0,
    previousIndex: 0,
    transitionStart: 0,
    transition: settings.showTransition,
    transitionDuration: settings.showTransitionDuration,
    blackout: false,
    blackoutLevel: 0,
    strobe: false,
  });
  const [sceneIndex, setSceneIndex] = useState(0);
  const [transition, setTransition] = useState<ShowTransition>(settings.showTransition);
  const [blackout, setBlackout] = useState(false);
  const [strobe, setStrobe] = useState(false);
  const [frozen, setFrozen] = useState(!editorClock.playing);
  const [fullscreen, setFullscreen] = useState(false);
  const [fit, setFit] = useState<"fit" | "fill">("fit");
  const [controlsVisible, setControlsVisible] = useState(true);
  const [pinnedHidden, setPinnedHidden] = useState(false);
  const [intro, setIntro] = useState(true);
  const [label, setLabel] = useState<string | null>(null);
  const [exitArmed, setExitArmed] = useState(false);
  const [help, setHelp] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audio = useAudioState();

  useShowRenderer({ canvasRef, project, clock: editorClock, runtime });

  useEffect(() => {
    runtime.current.transition = transition;
    runtime.current.transitionDuration = settings.showTransitionDuration;
  }, [transition, settings.showTransitionDuration]);

  /* ------------------------------ scene control ----------------------------- */

  const goTo = useCallback(
    (index: number) => {
      const count = project.scenes.length;
      if (count === 0) return;
      const next = ((index % count) + count) % count;
      const rt = runtime.current;
      if (next === rt.sceneIndex) return;
      rt.previousIndex = rt.sceneIndex;
      rt.sceneIndex = next;
      rt.transitionStart = performance.now();
      setSceneIndex(next);
      if (settings.showSceneLabel) {
        setLabel(`${next + 1} · ${project.scenes[next]!.name}`);
        if (labelTimer.current) clearTimeout(labelTimer.current);
        labelTimer.current = setTimeout(() => setLabel(null), 1400);
      }
    },
    [project.scenes, settings.showSceneLabel],
  );

  const toggleBlackout = useCallback(() => {
    setBlackout((b) => {
      runtime.current.blackout = !b;
      return !b;
    });
  }, []);

  const setStrobeOn = useCallback((on: boolean) => {
    runtime.current.strobe = on;
    setStrobe(on);
  }, []);

  const toggleFreeze = useCallback(() => {
    editorClock.toggle();
    setFrozen(!editorClock.playing);
  }, []);

  const tap = useTapTempo((bpm) => {
    useProjectsStore.getState().updateProject(project.id, (p) => ({ ...p, bpm }));
    editorClock.alignBeat(bpm);
  });

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.().catch(() => undefined);
  }, []);

  const exit = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    router.push(`/editor/${project.id}`);
  }, [project.id, router]);

  /* ---------------------------- controls visibility ------------------------- */

  const poke = useCallback(() => {
    if (pinnedHidden) return;
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), settings.showAutoHideDelay * 1000);
  }, [pinnedHidden, settings.showAutoHideDelay]);

  useEffect(() => {
    poke();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [poke]);

  useEffect(() => {
    const onFs = () => {
      setFullscreen(!!document.fullscreenElement);
      if (document.fullscreenElement) setIntro(false);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Keep the screen awake during a performance.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        lock = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        lock = null;
      }
    };
    void request();
    const onVisible = () => document.visibilityState === "visible" && void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => undefined);
    };
  }, []);

  /* -------------------------------- keyboard -------------------------------- */

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (help && key !== "escape") return;
      setIntro(false);
      if (/^[1-9]$/.test(e.key)) goTo(Number(e.key) - 1);
      else if (key === "arrowright" || key === "pagedown") goTo(runtime.current.sceneIndex + 1);
      else if (key === "arrowleft" || key === "pageup") goTo(runtime.current.sceneIndex - 1);
      else if (key === "f") toggleFullscreen();
      else if (key === "b") toggleBlackout();
      else if (key === "s" && !e.repeat) setStrobeOn(true);
      else if (key === "t") tap();
      else if (key === "h") {
        setPinnedHidden((h) => {
          setControlsVisible(h);
          return !h;
        });
      } else if (e.code === "Space") {
        e.preventDefault();
        toggleFreeze();
      } else if (key === "?") setHelp(true);
      else if (key === "escape") {
        if (help) return;
        if (exitArmed) exit();
        else {
          setExitArmed(true);
          setTimeout(() => setExitArmed(false), 2200);
        }
        return;
      } else return;
      poke();
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "s") setStrobeOn(false);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [goTo, toggleFullscreen, toggleBlackout, setStrobeOn, tap, toggleFreeze, exit, exitArmed, help, poke]);

  const showUi = controlsVisible && !pinnedHidden;
  const current = project.scenes[sceneIndex];

  return (
    <div
      ref={rootRef}
      className={cn("fixed inset-0 overflow-hidden bg-black select-none", !showUi && "cursor-none")}
      onMouseMove={poke}
      onPointerDown={(e) => {
        if (e.pointerType === "touch") {
          setControlsVisible((v) => !v);
          return;
        }
        poke();
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          aria-label={`Live visual: ${current?.name ?? ""}`}
          className={cn(
            "block aspect-video",
            fit === "fit" ? "max-h-full w-full max-w-[calc(100dvh*16/9)]" : "min-h-full min-w-full w-[max(100vw,calc(100dvh*16/9))]",
          )}
        />
      </div>

      {/* Scene label */}
      <AnimatePresence>
        {label && showUi && (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6 }}
            className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/60 px-4 py-1.5 font-display text-sm font-semibold text-white backdrop-blur-md"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status chips that stay visible even with hidden controls */}
      <div className="pointer-events-none absolute right-4 top-4 flex gap-2">
        {blackout && <StatusChip tone="live">Blackout</StatusChip>}
        {frozen && <StatusChip>Frozen</StatusChip>}
        {strobe && <StatusChip tone="live">Strobe</StatusChip>}
      </div>

      <AnimatePresence>
        {exitArmed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-black/80 px-5 py-3 text-sm text-white backdrop-blur-md"
          >
            Press <Kbd>Esc</Kbd> again to leave Show Mode
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <AnimatePresence>
        {showUi && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 pb-10 pt-4"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" icon={<X className="h-3.5 w-3.5" />} onClick={exit} className="bg-black/50 backdrop-blur">
                Exit
              </Button>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white">{project.name}</p>
                <p className="flex items-center gap-1.5 text-2xs text-white/60">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-live" /> LIVE · {project.artistName} · {Math.round(project.bpm)} BPM
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Tooltip content="Shortcuts" shortcut="?" side="bottom">
                <button type="button" onClick={() => setHelp(true)} className="show-icon-btn" aria-label="Keyboard shortcuts">
                  <Keyboard className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip content={fit === "fit" ? "Fill the screen (crop edges)" : "Fit inside screen"} side="bottom">
                <button type="button" onClick={() => setFit((f) => (f === "fit" ? "fill" : "fit"))} className="show-icon-btn" aria-label="Toggle fit">
                  <Scan className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip content="Hide controls" shortcut="H" side="bottom">
                <button
                  type="button"
                  onClick={() => {
                    setPinnedHidden(true);
                    setControlsVisible(false);
                  }}
                  className="show-icon-btn"
                  aria-label="Hide controls"
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              </Tooltip>
              <Button
                variant="primary"
                size="sm"
                icon={fullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                onClick={toggleFullscreen}
              >
                {fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom dock */}
      <AnimatePresence>
        {showUi && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-4 pt-16"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex max-w-full flex-col gap-3 rounded-2xl border border-white/10 bg-black/60 p-3 shadow-pop backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <DockButton label="Previous scene" shortcut="←" onClick={() => goTo(sceneIndex - 1)}>
                  <ChevronLeft className="h-5 w-5" />
                </DockButton>
                <div className="no-scrollbar -my-1 flex max-w-[min(860px,calc(100vw-140px))] gap-2 overflow-x-auto px-1 py-1">
                  {project.scenes.map((scene, i) => (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => goTo(i)}
                      className={cn(
                        "group relative w-[118px] shrink-0 overflow-hidden rounded-xl border text-left transition-all duration-200",
                        i === sceneIndex
                          ? "border-transparent shadow-[0_0_0_2px_rgb(167_139_250),0_0_26px_-2px_rgb(139_92_246/0.9)]"
                          : "border-white/10 opacity-75 hover:opacity-100",
                      )}
                      aria-current={i === sceneIndex}
                    >
                      <div className="aspect-video bg-black">
                        <VisualCanvas scene={scene} artistName={project.artistName} bpm={project.bpm} clock={editorClock} fps={15} maxWidth={240} thumbnail quality={0.4} />
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/70 px-2 py-1">
                        <span className={cn("font-mono text-[10px] font-bold", i === sceneIndex ? "text-accent-soft" : "text-white/50")}>{i + 1}</span>
                        <span className="truncate text-[11px] font-medium text-white">{scene.name}</span>
                      </div>
                      {i === sceneIndex && <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse-dot rounded-full bg-live shadow-[0_0_8px_rgb(255_59_92)]" />}
                    </button>
                  ))}
                </div>
                <DockButton label="Next scene" shortcut="→" onClick={() => goTo(sceneIndex + 1)}>
                  <ChevronRight className="h-5 w-5" />
                </DockButton>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                <div className="flex items-center gap-1 rounded-lg bg-white/[0.06] p-0.5" role="radiogroup" aria-label="Transition">
                  {(["cut", "fade", "flash"] as ShowTransition[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={transition === t}
                      onClick={() => setTransition(t)}
                      className={cn(
                        "h-7 rounded-md px-2.5 text-[11px] font-semibold capitalize transition-colors",
                        transition === t ? "bg-white text-black" : "text-white/60 hover:text-white",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <Tooltip content="Freeze / resume motion" shortcut="Space">
                    <button type="button" onClick={toggleFreeze} className={cn("show-pill", frozen && "show-pill-active")}>
                      {frozen ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                      {frozen ? "Resume" : "Freeze"}
                    </button>
                  </Tooltip>
                  <Tooltip content="Hold to strobe" shortcut="S">
                    <button
                      type="button"
                      onPointerDown={() => setStrobeOn(true)}
                      onPointerUp={() => setStrobeOn(false)}
                      onPointerLeave={() => setStrobeOn(false)}
                      className={cn("show-pill", strobe && "show-pill-active")}
                    >
                      <Zap className="h-3.5 w-3.5" /> Strobe
                    </button>
                  </Tooltip>
                  <Tooltip content="Fade to black" shortcut="B">
                    <button type="button" onClick={toggleBlackout} className={cn("show-pill", blackout && "show-pill-live")}>
                      <Power className="h-3.5 w-3.5" /> Blackout
                    </button>
                  </Tooltip>
                  <Tooltip content="Tap along to set the tempo" shortcut="T">
                    <button type="button" onClick={tap} className="show-pill font-mono">
                      {Math.round(project.bpm)} BPM · TAP
                    </button>
                  </Tooltip>
                  <span className="hidden items-center gap-1.5 px-2 text-2xs text-white/50 md:flex">
                    <span className={cn("h-1.5 w-1.5 rounded-full", audio.source === "simulated" ? "bg-accent-soft" : "bg-live")} />
                    {audio.source === "simulated" ? "Demo beat" : audio.source === "mic" ? "Live input" : audio.trackName ?? "Track"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {pinnedHidden && (
        <button
          type="button"
          onClick={() => {
            setPinnedHidden(false);
            setControlsVisible(true);
          }}
          className="absolute bottom-3 right-3 rounded-md px-2 py-1 text-[10px] text-white/0 transition-colors hover:bg-black/60 hover:text-white/70"
        >
          Press H to show controls
        </button>
      )}

      {/* Pre-show intro */}
      <AnimatePresence>
        {intro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
            onPointerDown={(e) => {
              e.stopPropagation();
              setIntro(false);
            }}
          >
            <motion.div
              initial={{ y: 16, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0e0e15]/95 text-center shadow-pop"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="relative bg-[radial-gradient(circle_at_50%_130%,rgb(255_59_92/0.45),transparent_60%)] px-8 pb-6 pt-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-live text-white shadow-[0_0_40px_rgb(255_59_92/0.7)]">
                  <MonitorPlay className="h-6 w-6" />
                </div>
                <h1 className="font-display text-2xl font-semibold text-white">You&apos;re live</h1>
                <p className="mt-2 text-sm text-white/65">
                  {project.scenes.length} scenes loaded. Plug into the LED wall or projector, go fullscreen and run your set from the keyboard.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 px-6 pb-2 text-left">
                {[
                  ["1–9", "Scenes"],
                  ["← →", "Prev / next"],
                  ["B", "Blackout"],
                  ["S", "Strobe"],
                  ["T", "Tap tempo"],
                  ["H", "Hide UI"],
                ].map(([k, l]) => (
                  <div key={k} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 py-2">
                    <Kbd>{k}</Kbd>
                    <span className="text-[11px] text-white/70">{l}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 p-6">
                <Button variant="primary" size="lg" icon={<Maximize className="h-4 w-4" />} onClick={toggleFullscreen}>
                  Enter Fullscreen
                </Button>
                <button type="button" onClick={() => setIntro(false)} className="text-xs text-white/50 hover:text-white">
                  Stay in window
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={help} onClose={() => setHelp(false)} title="Show Mode shortcuts" size="md">
        <ShortcutList groups={SHOW_SHORTCUTS} />
      </Modal>
    </div>
  );
}

function DockButton({ label, shortcut, onClick, children }: { label: string; shortcut: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip content={label} shortcut={shortcut}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="flex h-[92px] w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white"
      >
        {children}
      </button>
    </Tooltip>
  );
}

function StatusChip({ children, tone }: { children: React.ReactNode; tone?: "live" }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur",
        tone === "live" ? "border-live/40 bg-live/20 text-white" : "border-white/20 bg-black/50 text-white/80",
      )}
    >
      {children}
    </span>
  );
}
