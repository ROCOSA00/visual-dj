"use client";

import { motion } from "framer-motion";
import { Check, Film, ImageIcon, MonitorPlay, Sparkles, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/controls";
import { Badge } from "@/components/ui/misc";
import { Modal } from "@/components/ui/Modal";
import { loopLength } from "@/engine/render/renderScene";
import { downloadBlob, slugify } from "@/lib/utils";
import { exportFormats, exportImage, exportWebM, type ExportFormat } from "@/services/export/exporters";
import { editorClock, useEditorStore } from "@/store/editor";
import { resolutionSize, useSettingsStore, type Resolution } from "@/store/settings";
import { toast } from "@/store/toasts";
import { cn } from "@/lib/utils";
import { useActiveProject, useActiveScene } from "./hooks";

const ICONS: Record<ExportFormat, React.ReactNode> = {
  show: <MonitorPlay className="h-5 w-5" />,
  webm: <Video className="h-5 w-5" />,
  png: <ImageIcon className="h-5 w-5" />,
  mp4: <Film className="h-5 w-5" />,
  gif: <Sparkles className="h-5 w-5" />,
};

export function ExportModal() {
  const open = useEditorStore((s) => s.modal === "export");
  const setModal = useEditorStore((s) => s.setModal);
  const project = useActiveProject();
  const scene = useActiveScene();
  const router = useRouter();
  const defaultResolution = useSettingsStore((s) => s.defaultResolution);
  const [format, setFormat] = useState<ExportFormat>("show");
  const [resolution, setResolution] = useState<Resolution>(defaultResolution);
  const [progress, setProgress] = useState<{ p: number; s: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const formats = useMemo(() => (open ? exportFormats() : []), [open]);
  const selected = formats.find((f) => f.id === format);

  if (!project || !scene) return null;
  const loop = loopLength(scene, project.bpm);
  const baseName = `${slugify(project.artistName)}-${slugify(scene.name)}`;

  const close = () => {
    if (busy) abort.current?.abort();
    setModal(null);
  };

  const run = async () => {
    if (format === "show") {
      setModal(null);
      router.push(`/show/${project.id}`);
      return;
    }
    const { width, height } = resolutionSize(resolution);
    setBusy(true);
    try {
      if (format === "png") {
        const blob = await exportImage({ project, scene, width, height, time: editorClock.time() });
        downloadBlob(blob, `${baseName}.png`);
        toast({ title: "Image exported", description: `${width}×${height} PNG`, tone: "success" });
      } else if (format === "webm") {
        abort.current = new AbortController();
        const blob = await exportWebM({
          project,
          scene,
          width,
          height,
          signal: abort.current.signal,
          onProgress: (p, s, total) => setProgress({ p, s, total }),
        });
        downloadBlob(blob, `${baseName}-loop.webm`);
        toast({ title: "Loop exported", description: `${scene.loopBars} bars · seamless WebM`, tone: "success" });
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") toast({ title: "Export failed", description: "Try a lower resolution.", tone: "error" });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Export & perform" description={`Scene “${scene.name}” · ${project.name}`} size="lg">
      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-2" role="radiogroup" aria-label="Export format">
          {formats.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={format === f.id}
              disabled={!f.available || busy}
              onClick={() => setFormat(f.id)}
              className={cn(
                "group relative flex w-full items-center gap-3.5 rounded-xl border p-3 text-left transition-all",
                format === f.id ? "border-accent/60 bg-accent/10 shadow-glow-sm" : "border-line hover:border-white/20 hover:bg-white/[0.03]",
                !f.available && "cursor-not-allowed opacity-50 hover:border-line hover:bg-transparent",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  format === f.id ? "bg-brand-strong text-white" : "bg-white/[0.05] text-muted",
                )}
              >
                {ICONS[f.id]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  {f.label}
                  {f.id === "show" && <Badge tone="live">Live</Badge>}
                  {!f.available && <Badge tone="soon">Coming soon</Badge>}
                </span>
                <span className="mt-0.5 block text-xs text-muted">{f.description}</span>
              </span>
              {format === f.id && <Check className="h-4 w-4 text-accent-soft" />}
            </button>
          ))}
        </div>

        <div className="flex flex-col rounded-2xl border border-line bg-white/[0.02] p-4">
          {format === "show" ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-ink">Perform live from your browser</p>
              <ul className="space-y-2 text-xs text-muted">
                {[
                  `${project.scenes.length} scenes ready, switch with keys 1–${Math.min(9, project.scenes.length)}`,
                  "Crossfade, cut or flash transitions",
                  "Blackout, strobe and tap tempo",
                  "Connect the laptop to the LED wall or projector and go fullscreen",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted">Resolution</p>
                <Segmented
                  value={resolution}
                  onChange={setResolution}
                  options={[
                    { value: "1280x720", label: "720p" },
                    { value: "1920x1080", label: "1080p" },
                    ...(format === "png" ? [{ value: "3840x2160" as Resolution, label: "4K" }] : []),
                  ]}
                  ariaLabel="Resolution"
                />
              </div>
              {format === "webm" && (
                <p className="text-xs leading-relaxed text-muted">
                  Records one seamless {scene.loopBars}-bar loop ({loop.toFixed(1)} s at {project.bpm} BPM) in real time. Drop
                  it into Resolume, OBS or a media server and it will loop perfectly.
                </p>
              )}
              {format === "png" && <p className="text-xs leading-relaxed text-muted">Captures the frame at the current playhead position.</p>}
            </div>
          )}

          <div className="mt-auto pt-6">
            {progress && (
              <div className="mb-3 space-y-1.5">
                <div className="flex justify-between text-2xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-live" /> Recording loop…
                  </span>
                  <span className="font-mono">
                    {progress.s.toFixed(1)} / {progress.total.toFixed(1)} s
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <motion.div className="h-full rounded-full bg-brand" style={{ width: `${progress.p * 100}%` }} />
                </div>
              </div>
            )}
            <div className="flex gap-2">
              {busy && format === "webm" && (
                <Button variant="ghost" onClick={() => abort.current?.abort()}>
                  Cancel
                </Button>
              )}
              <Button variant="primary" className="flex-1" loading={busy} disabled={!selected?.available || busy} onClick={run}>
                {format === "show" ? "Launch Show Mode" : busy ? "Exporting…" : selected?.label}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
