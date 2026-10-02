"use client";

import { Plus, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { VisualCanvas } from "@/components/visual/VisualCanvas";
import type { Scene } from "@/domain/types";
import { editorClock } from "@/store/editor";
import { cn } from "@/lib/utils";

export function PanelSection({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="label">{title}</p>
        {aside}
      </div>
      {children}
    </div>
  );
}

/** Library tile with a live mini preview of what will be added. */
export function PreviewTile({
  scene,
  label,
  onClick,
  artistName = "Aa",
  bpm = 124,
  active,
  badge,
}: {
  scene: Scene;
  label: string;
  onClick: () => void;
  artistName?: string;
  bpm?: number;
  active?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/tile relative flex flex-col gap-1.5 rounded-xl p-1 text-left transition-all hover:bg-white/[0.04]",
        active && "bg-accent/10",
      )}
    >
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-lg border border-line bg-black transition-all duration-200 group-hover/tile:border-white/25 group-hover/tile:shadow-[0_8px_24px_-10px_rgb(139_92_246/0.6)]",
          active && "border-accent/60 shadow-glow-sm",
        )}
      >
        <VisualCanvas scene={scene} artistName={artistName} bpm={bpm} clock={editorClock} fps={24} maxWidth={260} thumbnail quality={0.6} />
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 scale-75 items-center justify-center rounded-md bg-white text-black opacity-0 shadow transition-all group-hover/tile:scale-100 group-hover/tile:opacity-100">
          <Plus className="h-3.5 w-3.5" />
        </span>
        {badge && <span className="absolute left-1.5 top-1.5">{badge}</span>}
      </div>
      <span className="truncate px-0.5 text-[11px] font-medium text-muted group-hover/tile:text-ink">{label}</span>
    </button>
  );
}

export function UploadDropzone({
  accept,
  title,
  hint,
  onFiles,
  busy,
}: {
  accept: string;
  title: string;
  hint: string;
  onFiles: (files: File[]) => void;
  busy?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-all",
        over ? "border-accent bg-accent/10" : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]",
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-soft">
        {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : <UploadCloud className="h-5 w-5" />}
      </div>
      <div>
        <p className="text-[13px] font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-2xs text-subtle">{hint}</p>
      </div>
      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
