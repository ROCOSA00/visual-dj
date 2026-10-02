"use client";

import { AlertTriangle, Mic, Music2, Pause, Play, Sparkles } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Segmented } from "@/components/ui/controls";
import { audioEngine, type AudioSourceKind } from "@/engine/audio";
import type { PlaybackClock } from "@/engine/clock";
import { ticker } from "@/engine/ticker";
import { cn } from "@/lib/utils";

export function useAudioState() {
  return useSyncExternalStore(audioEngine.subscribe, audioEngine.getState, audioEngine.getState);
}

/** Live bass / mid / high meters. Updates via the ticker, not React state. */
export function LevelMeters({ clock, bpm, className }: { clock: PlaybackClock; bpm: number; className?: string }) {
  const bars = useRef<Array<HTMLDivElement | null>>([]);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  useEffect(
    () =>
      ticker.add(() => {
        const f = audioEngine.frame(clock.time(), bpmRef.current);
        [f.bass, f.mid, f.high].forEach((v, i) => {
          const el = bars.current[i];
          if (el) el.style.transform = `scaleX(${Math.max(0.04, v)})`;
        });
      }, 30),
    [clock],
  );
  return (
    <div className={cn("space-y-1.5", className)}>
      {["Bass", "Mid", "High"].map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span className="w-8 text-2xs text-subtle">{label}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              ref={(el) => {
                bars.current[i] = el;
              }}
              className="h-full origin-left rounded-full bg-gradient-to-r from-accent-soft to-accent-cyan transition-transform duration-75"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AudioSourceControl({ clock, bpm }: { clock: PlaybackClock; bpm: number }) {
  const state = useAudioState();
  const fileInput = useRef<HTMLInputElement>(null);

  const setSource = (source: AudioSourceKind) => {
    if (source === "simulated") audioEngine.useSimulated();
    else if (source === "mic") void audioEngine.useMic();
    else fileInput.current?.click();
  };

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-white/[0.02] p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink">Audio source</p>
        <span className="flex items-center gap-1.5 text-2xs text-muted">
          <span className={cn("h-1.5 w-1.5 rounded-full", state.source === "simulated" ? "bg-accent-soft" : "animate-pulse-dot bg-live")} />
          {state.source === "simulated" ? `Simulated · ${Math.round(bpm)} BPM` : state.source === "mic" ? "Listening" : "Track"}
        </span>
      </div>
      <Segmented
        size="sm"
        value={state.source}
        onChange={setSource}
        options={[
          { value: "simulated", label: "Demo beat", icon: <Sparkles className="h-3 w-3" />, tooltip: "A built-in groove at your project BPM" },
          { value: "file", label: "Track", icon: <Music2 className="h-3 w-3" />, tooltip: "Load a song from your computer" },
          { value: "mic", label: "Live", icon: <Mic className="h-3 w-3" />, tooltip: "Listen to the room or your mixer's line-in" },
        ]}
      />
      <input
        ref={fileInput}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void audioEngine.loadTrack(file);
          e.target.value = "";
        }}
      />
      {state.source === "file" && state.trackName && (
        <div className="flex items-center gap-2 rounded-lg bg-black/30 p-2">
          <button
            type="button"
            onClick={() => audioEngine.toggleTrack()}
            aria-label={state.trackPlaying ? "Pause track" : "Play track"}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black"
          >
            {state.trackPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
          </button>
          <span className="min-w-0 flex-1 truncate text-xs text-ink">{state.trackName}</span>
          <button type="button" onClick={() => fileInput.current?.click()} className="text-2xs text-accent-soft hover:underline">
            Change
          </button>
        </div>
      )}
      {state.error && (
        <p className="flex gap-1.5 text-2xs leading-relaxed text-warning">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {state.error}
        </p>
      )}
      <LevelMeters clock={clock} bpm={bpm} />
    </div>
  );
}
