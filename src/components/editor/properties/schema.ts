import type { SegmentOption } from "@/components/ui/controls";
import type { ReactNode } from "react";
import type { Layer } from "@/domain/types";

interface Base<L> {
  when?: (layer: L) => boolean;
}

export type Field<L extends Layer = Layer> =
  | (Base<L> & {
      type: "slider";
      path: string;
      label: string | ((layer: L) => string);
      min: number;
      max: number;
      step?: number;
      unit?: string;
      displayScale?: number;
      decimals?: number;
      hint?: string;
      default?: number;
    })
  | (Base<L> & { type: "color"; path: string; label: string | ((layer: L) => string); hint?: string })
  | (Base<L> & { type: "colors"; path: string; label: string; min?: number; max?: number; hint?: string })
  | (Base<L> & {
      type: "segmented";
      path: string;
      label: string;
      options: SegmentOption<string | number | boolean>[] | ((layer: L) => SegmentOption<string | number | boolean>[]);
      hint?: string;
    })
  | (Base<L> & {
      type: "select";
      path: string;
      label: string;
      options: Array<{ value: string | number; label: string; description?: string }>;
      hint?: string;
    })
  | (Base<L> & { type: "toggle"; path: string; label: string; description?: string })
  | (Base<L> & { type: "text"; path: string; label: string; multiline?: boolean; placeholder?: string })
  | (Base<L> & { type: "font"; path: string; label: string })
  | (Base<L> & { type: "artistName" })
  | (Base<L> & { type: "position"; alignText?: boolean })
  | (Base<L> & { type: "media"; path: string; label: string; accept: "image" | "video" })
  | (Base<L> & { type: "note"; text: string; tone?: "info" | "warning" })
  | (Base<L> & { type: "custom"; render: (layer: L, update: (patch: Partial<L>, key?: string) => void) => ReactNode });

export interface SectionDef<L extends Layer = Layer> {
  id: string;
  title: string;
  defaultOpen?: boolean;
  fields: Field<L>[];
}
