"use client";

import { Maximize, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Select } from "@/components/ui/controls";
import { IconButton } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/Tooltip";
import { loopLength } from "@/engine/render/renderScene";
import { ticker } from "@/engine/ticker";
import { editorClock, useEditorStore, type ZoomLevel } from "@/store/editor";
import { editorActions } from "@/store/editorActions";
import { useTapTempo } from "@/hooks/useTapTempo";
import { useActiveProject, useActiveScene } from "../hooks";
import { stageFullscreen } from "./CanvasStage";
import { cn } from "@/lib/utils";

const LOOP_OPTIONS = [2, 4, 8, 16, 32].map((b) => ({ value: b, label: `${b} bars` }));
const ZOOM_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "fit", label: "Fit" },
  { value: "0.5", label: "50%" },
  { value: "0.75", label: "75%" },
  { value: "1", label: "100%" },
];

export function PlaybackBar() {
  const project = useActiveProject();
  const scene = useActiveScene();
  const playing = useEditorStore((s) => s.playing);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const playhead = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const position = useRef<HTMLSpanElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);
  const bar = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const bpm = project?.bpm ?? 124;
  const bars = scene?.loopBars ?? 8;
  const loopLen = scene ? loopLength(scene, bpm) : 16;
  const loopRef = useRef({ loopLen, bars, bpm });
  loopRef.current = { loopLen, bars, bpm };
  const tap = useTapTempo((next) => {
    editorActions.setBpm(next);
    editorClock.alignBeat(next);
  });

  useEffect(
    () =>
      ticker.add(() => {
        const { loopLen: L, bars: B, bpm: tempo } = loopRef.current;
        const t = editorClock.time() % L;
        const f = t / L;
        if (playhead.current) playhead.current.style.left = `${f * 100}%`;
        if (progress.current) progress.current.style.width = `${f * 100}%`;
        if (position.current) {
          const beat = (t * tempo) / 60;
          const bar = Math.floor(beat / 4) + 1;
          const b = Math.floor(beat % 4) + 1;
          position.current.textContent = `${String(bar).padStart(2, "0")}.${b} / ${B}`;
        }
      }, 30),
    [],
  );

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCompact(el.clientWidth < 760));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const seekFromEvent = (e: React.PointerEvent) => {
    const rect = track.current!.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const { loopLen: L } = loopRef.current;
    const base = Math.floor(editorClock.time() / L) * L;
    editorClock.seek(base + f * L);
  };

  if (!project || !scene) return null;

  return (
    <div ref={bar} className="flex h-14 shrink-0 items-center gap-3 border-t border-line bg-surface-1 px-4" data-tour="playback">
      <div className="flex items-center gap-1">
        <IconButton label="Restart loop" onClick={() => editorClock.restart()}>
          <RotateCcw />
        </IconButton>
        <Tooltip content={playing ? "Pause" : "Play"} shortcut="Space">
          <button
            type="button"
            onClick={() => editorClock.toggle()}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-[0_0_20px_-4px_rgb(255_255_255/0.5)] transition-transform hover:scale-105 active:scale-95"
          >
            {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="ml-0.5 h-4 w-4" fill="currentColor" />}
          </button>
        </Tooltip>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          ref={track}
          role="slider"
          aria-label="Timeline"
          aria-valuemin={0}
          aria-valuemax={bars}
          aria-valuenow={0}
          aria-valuetext="Loop position"
          tabIndex={0}
          onPointerDown={(e) => {
            scrubbing.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            seekFromEvent(e);
          }}
          onPointerMove={(e) => scrubbing.current && seekFromEvent(e)}
          onPointerUp={() => (scrubbing.current = false)}
          className="group relative h-8 min-w-[120px] flex-1 cursor-pointer"
        >
          <div className="absolute inset-x-0 top-1/2 flex h-2 -translate-y-1/2 gap-[3px]">
            {Array.from({ length: bars }, (_, i) => (
              <div key={i} className="relative flex-1 overflow-hidden rounded-sm bg-white/[0.07]">
                {bars <= 16 &&
                  [1, 2, 3].map((q) => <span key={q} className="absolute top-0 h-full w-px bg-black/50" style={{ left: `${q * 25}%` }} />)}
              </div>
            ))}
          </div>
          <div
            ref={progress}
            className="pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-sm bg-gradient-to-r from-accent-soft/50 to-accent-cyan/70 mix-blend-screen"
          />
          <div ref={playhead} className="pointer-events-none absolute inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_white]" />
        </div>
        <Tooltip content="Bar.beat / loop length">
          <span ref={position} className={cn("w-[70px] shrink-0 text-right font-mono text-[11px] tabular-nums text-muted", compact && "hidden")}>
            01.1 / {bars}
          </span>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex h-8 shrink-0 items-center rounded-lg border border-line bg-black/30">
          <Tooltip content="Project tempo. Drives the beat, loops and demo audio.">
            <label className="flex shrink-0 items-center gap-1 whitespace-nowrap pl-2.5 text-2xs text-subtle">
              {!compact && "BPM"}
              <input
                type="number"
                min={60}
                max={200}
                value={bpm}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!Number.isNaN(v)) editorActions.setBpm(v);
                }}
                className="w-11 bg-transparent font-mono text-xs text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="BPM"
              />
            </label>
          </Tooltip>
          <Tooltip content="Tap along to the beat to set the tempo">
            <button
              type="button"
              onClick={tap}
              className={cn("h-full rounded-r-lg border-l border-line px-2.5 text-2xs font-semibold text-muted transition-colors hover:bg-white/[0.06] hover:text-ink active:bg-accent/30")}
            >
              TAP
            </button>
          </Tooltip>
        </div>
        <Tooltip content="Length of the seamless loop">
          <div className="w-[92px] shrink-0">
            <Select value={bars} options={LOOP_OPTIONS} onChange={(v) => editorActions.setLoopBars(v)} ariaLabel="Loop length" />
          </div>
        </Tooltip>
        <div className={cn("w-[72px]", compact && "hidden")}>
          <Select
            value={String(zoom)}
            options={ZOOM_OPTIONS}
            onChange={(v) => setZoom((v === "fit" ? "fit" : Number(v)) as ZoomLevel)}
            ariaLabel="Zoom"
          />
        </div>
        <IconButton label="Fullscreen preview" shortcut="F" onClick={() => stageFullscreen.toggle()}>
          <Maximize />
        </IconButton>
      </div>
    </div>
  );
}
