"use client";

import { AlertTriangle, ImagePlus, Info, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ColorField, ColorListField } from "@/components/ui/ColorField";
import { FieldLabel, Segmented, Select, Slider, TextInput, Toggle } from "@/components/ui/controls";
import { FONTS } from "@/domain/fonts";
import type { Layer, MediaRef, PositionedLayer, TextLayer } from "@/domain/types";
import { getPath, patchForPath } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_VIDEO_TYPES } from "@/services/media/mediaStore";
import { fontFamilies } from "@/styles/fonts";
import { editorActions } from "@/store/editorActions";
import { uploadMedia, useMediaUrl } from "../sidebar/useMedia";
import { useActiveProject } from "../hooks";
import type { Field } from "./schema";
import { cn } from "@/lib/utils";

interface FieldProps {
  field: Field;
  layer: Layer;
  update: (patch: Partial<Layer>, key?: string) => void;
}

export function FieldRenderer({ field, layer, update }: FieldProps) {
  const project = useActiveProject();
  const palette = project?.palette;
  if (field.when && !field.when(layer)) return null;

  const set = (path: string, value: unknown) => update(patchForPath(layer, path, value) as Partial<Layer>, `${layer.id}:${path}`);
  const get = (path: string) => getPath(layer, path);

  switch (field.type) {
    case "slider":
      return (
        <Slider
          label={field.label}
          value={Number(get(field.path) ?? 0)}
          min={field.min}
          max={field.max}
          step={field.step}
          unit={field.unit}
          hint={field.hint}
          displayScale={field.displayScale}
          decimals={field.decimals}
          defaultValue={field.default}
          onChange={(v) => set(field.path, v)}
        />
      );
    case "color":
      return (
        <ColorField
          label={typeof field.label === "function" ? field.label(layer) : field.label}
          hint={field.hint}
          value={String(get(field.path) ?? "#ffffff")}
          extraSwatches={palette}
          onChange={(v) => set(field.path, v)}
        />
      );
    case "colors":
      return (
        <ColorListField
          label={field.label}
          hint={field.hint}
          colors={(get(field.path) as string[]) ?? []}
          min={field.min}
          max={field.max}
          extraSwatches={palette}
          onChange={(v) => set(field.path, v)}
        />
      );
    case "segmented": {
      const options = typeof field.options === "function" ? field.options(layer) : field.options;
      return (
        <div className="space-y-1.5">
          <FieldLabel label={field.label} hint={field.hint} />
          <Segmented value={get(field.path) as string} options={options as never} onChange={(v) => set(field.path, v)} ariaLabel={field.label} />
        </div>
      );
    }
    case "select":
      return (
        <div className="space-y-1.5">
          <FieldLabel label={field.label} hint={field.hint} />
          <Select value={get(field.path) as string} options={field.options as never} onChange={(v) => set(field.path, v)} ariaLabel={field.label} />
        </div>
      );
    case "toggle":
      return <Toggle label={field.label} description={field.description} checked={!!get(field.path)} onChange={(v) => set(field.path, v)} />;
    case "text":
      return <TextContentField label={field.label} value={String(get(field.path) ?? "")} multiline={field.multiline} placeholder={field.placeholder} onChange={(v) => set(field.path, v)} />;
    case "font":
      return <FontField value={get(field.path) as TextLayer["font"]} label={field.label} onChange={(v) => set(field.path, v)} />;
    case "artistName":
      return (
        <div className="space-y-1.5">
          <FieldLabel label="Artist name" hint="Shared by every scene in this show" />
          <TextInput value={project?.artistName ?? ""} onChange={(v) => editorActions.setArtistName(v)} placeholder="Your artist name" maxLength={40} ariaLabel="Artist name" />
          <p className="text-2xs text-subtle">Changes apply to every scene instantly.</p>
        </div>
      );
    case "position":
      return <PositionField layer={layer as PositionedLayer} alignText={field.alignText} update={update} />;
    case "media":
      return <MediaField label={field.label} accept={field.accept} value={(get(field.path) as MediaRef | null) ?? null} onChange={(v) => set(field.path, v)} />;
    case "note":
      return (
        <p className={cn("flex gap-2 rounded-lg p-2.5 text-2xs leading-relaxed", field.tone === "warning" ? "bg-warning/10 text-warning" : "bg-white/[0.03] text-subtle")}>
          {field.tone === "warning" ? <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> : <Info className="mt-0.5 h-3 w-3 shrink-0" />}
          {field.text}
        </p>
      );
    case "custom":
      return <>{field.render(layer, update)}</>;
  }
}

function TextContentField({
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const focus = () => {
      const el = wrapper.current?.querySelector("textarea, input") as HTMLTextAreaElement | null;
      el?.focus();
      el?.select();
    };
    window.addEventListener("vd:edit-text", focus);
    return () => window.removeEventListener("vd:edit-text", focus);
  }, []);
  return (
    <div className="space-y-1.5" ref={wrapper}>
      <FieldLabel label={label} hint="Double-click text on the canvas to jump here" />
      <TextInput value={value} onChange={onChange} multiline={multiline} placeholder={placeholder} ariaLabel={label} maxLength={200} />
    </div>
  );
}

function FontField({ value, label, onChange }: { value: TextLayer["font"]; label: string; onChange: (v: TextLayer["font"]) => void }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel label={label} />
      <Select
        value={value}
        onChange={onChange}
        ariaLabel={label}
        maxHeight={340}
        options={FONTS.map((f) => ({
          value: f.id,
          label: f.label,
          description: f.vibe,
          style: { fontFamily: fontFamilies[f.id], fontSize: 14 },
        }))}
        renderValue={(o) => <span style={{ fontFamily: o ? fontFamilies[o.value] : undefined, fontSize: 13 }}>{o?.label}</span>}
      />
    </div>
  );
}

const GRID = [0.12, 0.5, 0.88];
const GRID_Y = [0.16, 0.5, 0.84];

function PositionField({
  layer,
  update,
  alignText,
}: {
  layer: PositionedLayer;
  update: (patch: Partial<Layer>, key?: string) => void;
  alignText?: boolean;
}) {
  const t = layer.transform;
  const setT = (patch: Partial<PositionedLayer["transform"]>, key: string) =>
    update({ transform: { ...t, ...patch } } as Partial<Layer>, `${layer.id}:transform:${key}`);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-black/30 p-1.5" role="group" aria-label="Quick position">
          {GRID_Y.map((y, row) =>
            GRID.map((gx, col) => {
              const x = alignText ? [0.07, 0.5, 0.93][col]! : gx;
              const active = Math.abs(t.x - x) < 0.02 && Math.abs(t.y - y) < 0.02;
              return (
                <button
                  key={`${row}${col}`}
                  type="button"
                  aria-label={`Place ${["top", "middle", "bottom"][row]} ${["left", "centre", "right"][col]}`}
                  onClick={() => {
                    const patch: Partial<Layer> = { transform: { ...t, x, y } } as Partial<Layer>;
                    if (alignText && layer.kind === "text") (patch as Partial<TextLayer>).align = (["left", "center", "right"] as const)[col]!;
                    update(patch, `${layer.id}:grid:${Date.now()}`);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-white/[0.08]"
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full transition-all", active ? "scale-150 bg-accent-soft shadow-[0_0_8px_rgb(167_139_250)]" : "bg-white/30")} />
                </button>
              );
            }),
          )}
        </div>
        <p className="text-2xs leading-relaxed text-subtle">Quick placement. Or drag the element directly on the canvas.</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        <Slider label="X" value={t.x} min={0} max={1} step={0.001} displayScale={100} unit="%" defaultValue={0.5} onChange={(v) => setT({ x: v }, "x")} />
        <Slider label="Y" value={t.y} min={0} max={1} step={0.001} displayScale={100} unit="%" defaultValue={0.5} onChange={(v) => setT({ y: v }, "y")} />
        <Slider label="Scale" value={t.scale} min={0.1} max={4} step={0.01} displayScale={100} unit="%" defaultValue={1} onChange={(v) => setT({ scale: v }, "scale")} />
        <Slider label="Rotation" value={t.rotation} min={-180} max={180} step={1} unit="°" defaultValue={0} onChange={(v) => setT({ rotation: v }, "rotation")} />
      </div>
    </div>
  );
}

function MediaField({
  label,
  accept,
  value,
  onChange,
}: {
  label: string;
  accept: "image" | "video";
  value: MediaRef | null;
  onChange: (v: MediaRef | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const url = useMediaUrl(value);
  return (
    <div className="space-y-1.5">
      <FieldLabel label={label} />
      <div className="flex items-center gap-3 rounded-xl border border-line bg-black/30 p-2">
        <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.04]">
          {url ? (
            accept === "video" ? (
              <video src={url} muted autoPlay loop playsInline className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-contain" />
            )
          ) : (
            <ImagePlus className="h-4 w-4 text-subtle" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-ink">{value?.name ?? (accept === "video" ? "No video yet" : "No image yet")}</p>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="flex items-center gap-1 text-2xs font-semibold text-accent-soft hover:underline"
            >
              {busy ? "Uploading…" : value ? <><RefreshCw className="h-3 w-3" /> Replace</> : "Upload"}
            </button>
            {value && (
              <button type="button" onClick={() => onChange(null)} className="flex items-center gap-1 text-2xs text-subtle hover:text-danger">
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept={accept === "video" ? ACCEPTED_VIDEO_TYPES : ACCEPTED_IMAGE_TYPES}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          const ref = await uploadMedia(file, accept);
          setBusy(false);
          if (ref) onChange(ref);
        }}
      />
    </div>
  );
}
