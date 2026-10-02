"use client";

import { Film, ImageIcon, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { createBackground, createImage, createLogo, createScene, createVideo } from "@/domain/factories";
import type { MediaRef, MonogramStyle } from "@/domain/types";
import { MARKS } from "@/engine/marks";
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_VIDEO_TYPES } from "@/services/media/mediaStore";
import { editorActions } from "@/store/editorActions";
import { useActiveProject } from "../hooks";
import { PanelSection, PreviewTile, UploadDropzone } from "./common";
import { uploadMedia, useMediaLibrary, useMediaUrl } from "./useMedia";

const MONOGRAMS: Array<{ style: MonogramStyle; label: string }> = [
  { style: "circle", label: "Circle" },
  { style: "hexagon", label: "Hexagon" },
  { style: "square", label: "Square" },
  { style: "diamond", label: "Diamond" },
  { style: "plain", label: "Initials" },
];

const tileBg = () => createBackground({ mode: "solid", color: "#06060a", gradient: { type: "radial", colors: ["#1b1430", "#06060a"], angle: 0, animate: false } });

export function LogoPanel() {
  const project = useActiveProject();
  const [busy, setBusy] = useState(false);
  const palette = project?.palette ?? [];
  const accent = palette[0] ?? "#a78bfa";

  const monogramScenes = useMemo(
    () =>
      MONOGRAMS.map((m) =>
        createScene(m.label, [tileBg(), createLogo({ monogramStyle: m.style, size: 560, glowColor: accent, transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 } })]),
      ),
    [accent],
  );
  const markScenes = useMemo(
    () =>
      MARKS.map((mark) =>
        createScene(mark.label, [tileBg(), createLogo({ source: "mark", mark: mark.id, size: 560, glowColor: accent, transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0 } })]),
      ),
    [accent],
  );

  const onUpload = async (files: File[]) => {
    setBusy(true);
    const ref = await uploadMedia(files[0]!, "image");
    setBusy(false);
    if (ref) editorActions.addLayer(createLogo({ name: "Logo", source: "upload", media: ref, size: 420, glow: 0.2, glowColor: accent, animation: "none" }));
  };

  return (
    <div className="space-y-6">
      <UploadDropzone
        accept={ACCEPTED_IMAGE_TYPES}
        title="Upload your logo"
        hint="Transparent PNG or SVG works best"
        onFiles={onUpload}
        busy={busy}
      />
      <PanelSection title="No logo yet? Use your initials">
        <div className="grid grid-cols-2 gap-1">
          {MONOGRAMS.map((m, i) => (
            <PreviewTile
              key={m.style}
              scene={monogramScenes[i]!}
              label={m.label}
              artistName={project?.artistName ?? "VD"}
              onClick={() => editorActions.addLayer(createLogo({ name: "Monogram", monogramStyle: m.style, glowColor: accent }))}
            />
          ))}
        </div>
      </PanelSection>
      <PanelSection title="Marks">
        <div className="grid grid-cols-2 gap-1">
          {MARKS.map((mark, i) => (
            <PreviewTile
              key={mark.id}
              scene={markScenes[i]!}
              label={mark.label}
              onClick={() => editorActions.addLayer(createLogo({ name: `${mark.label} mark`, source: "mark", mark: mark.id, glowColor: accent }))}
            />
          ))}
        </div>
      </PanelSection>
    </div>
  );
}

export function ImagePanel() {
  const [busy, setBusy] = useState(false);
  const { assets, remove } = useMediaLibrary("image");
  const add = (ref: MediaRef) => editorActions.addLayer(createImage({ name: ref.name.replace(/\.[^.]+$/, ""), media: ref }));
  return (
    <div className="space-y-6">
      <UploadDropzone
        accept={ACCEPTED_IMAGE_TYPES}
        title="Upload images"
        hint="PNG, JPG, WebP, GIF or SVG · or drop them on the canvas"
        busy={busy}
        onFiles={async (files) => {
          setBusy(true);
          for (const f of files) {
            const ref = await uploadMedia(f, "image");
            if (ref) add(ref);
          }
          setBusy(false);
        }}
      />
      <PanelSection title="Your uploads">
        <MediaGrid assets={assets} type="image" onPick={add} onRemove={remove} />
      </PanelSection>
    </div>
  );
}

export function VideoPanel() {
  const [busy, setBusy] = useState(false);
  const { assets, remove } = useMediaLibrary("video");
  const add = (ref: MediaRef) => editorActions.addLayer(createVideo({ name: ref.name.replace(/\.[^.]+$/, ""), media: ref }));
  return (
    <div className="space-y-6">
      <UploadDropzone
        accept={ACCEPTED_VIDEO_TYPES}
        title="Upload a video loop"
        hint="MP4 or WebM · short seamless loops (5–30 s) work best"
        busy={busy}
        onFiles={async (files) => {
          setBusy(true);
          const ref = await uploadMedia(files[0]!, "video");
          if (ref) add(ref);
          setBusy(false);
        }}
      />
      <PanelSection title="Your loops">
        <MediaGrid assets={assets} type="video" onPick={add} onRemove={remove} />
      </PanelSection>
      <p className="rounded-xl border border-line bg-white/[0.02] p-3 text-2xs leading-relaxed text-subtle">
        Tip: set a video&apos;s blend mode to <span className="text-muted">Screen</span> in the properties panel to blend
        black-background loops with your effects.
      </p>
    </div>
  );
}

function MediaGrid({
  assets,
  type,
  onPick,
  onRemove,
}: {
  assets: ReturnType<typeof useMediaLibrary>["assets"];
  type: "image" | "video";
  onPick: (ref: MediaRef) => void;
  onRemove: (id: string) => void;
}) {
  if (assets === null) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="aspect-video" />
        <Skeleton className="aspect-video" />
      </div>
    );
  }
  if (assets.length === 0) {
    return (
      <EmptyState
        compact
        icon={type === "image" ? <ImageIcon /> : <Film />}
        title={type === "image" ? "No images yet" : "No loops yet"}
        description="Uploads stay in this browser and can be reused in any project."
      />
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {assets.map((a) => (
        <MediaThumb key={a.ref.assetId} media={a.ref} onPick={() => onPick(a.ref)} onRemove={() => onRemove(a.ref.assetId)} />
      ))}
    </div>
  );
}

function MediaThumb({ media, onPick, onRemove }: { media: MediaRef; onPick: () => void; onRemove: () => void }) {
  const url = useMediaUrl(media);
  return (
    <div className="group/thumb relative">
      <button
        type="button"
        onClick={onPick}
        className="block aspect-video w-full overflow-hidden rounded-lg border border-line bg-black transition-all hover:border-white/30"
        title={`Add ${media.name}`}
      >
        {url &&
          (media.type === "video" ? (
            <video src={url} muted loop autoPlay playsInline className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={media.name} className="h-full w-full object-contain" />
          ))}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Delete ${media.name}`}
        className="absolute right-1 top-1 hidden rounded-md bg-black/70 p-1 text-white/80 hover:text-danger group-hover/thumb:block"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
