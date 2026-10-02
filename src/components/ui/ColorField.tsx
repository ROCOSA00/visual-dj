"use client";

import { Pipette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SWATCHES } from "@/data/palettes";
import { cn } from "@/lib/utils";
import { FieldLabel } from "./controls";
import { Popover } from "./Popover";

const HEX = /^#?[0-9a-f]{6}$/i;

export function ColorSwatchButton({
  color,
  onChange,
  extraSwatches,
  size = "md",
  ariaLabel,
}: {
  color: string;
  onChange: (color: string) => void;
  extraSwatches?: string[];
  size?: "sm" | "md";
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(color);
  const anchor = useRef<HTMLButtonElement>(null);
  useEffect(() => setDraft(color), [color]);

  const commit = (value: string) => {
    const v = value.startsWith("#") ? value : `#${value}`;
    if (HEX.test(v)) onChange(v.toLowerCase());
  };

  return (
    <>
      <button
        ref={anchor}
        type="button"
        aria-label={ariaLabel ?? `Colour ${color}`}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative shrink-0 rounded-md border border-white/15 shadow-[0_0_0_1px_rgb(0_0_0/0.4)] transition-transform hover:scale-105",
          size === "sm" ? "h-6 w-6" : "h-7 w-7",
          open && "ring-2 ring-accent/60",
        )}
        style={{ background: color }}
      />
      <Popover open={open} onClose={() => setOpen(false)} anchor={anchor} width={232} align="end">
        <div className="space-y-3 p-1.5">
          <label className="relative block h-28 cursor-pointer overflow-hidden rounded-lg border border-line" style={{ background: color }}>
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Pick a custom colour"
            />
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-1 text-2xs text-white backdrop-blur">
              <Pipette className="h-3 w-3" /> Custom
            </span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-2xs text-subtle">HEX</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commit(draft)}
              onKeyDown={(e) => e.key === "Enter" && commit(draft)}
              className="h-8 flex-1 rounded-md border border-line bg-black/40 px-2 font-mono text-xs uppercase text-ink outline-none focus:border-accent/60"
              aria-label="Hex colour"
            />
          </div>
          {extraSwatches && extraSwatches.length > 0 && (
            <div>
              <p className="label mb-1.5">Project palette</p>
              <SwatchGrid colors={extraSwatches} value={color} onPick={onChange} />
            </div>
          )}
          <div>
            <p className="label mb-1.5">Swatches</p>
            <SwatchGrid colors={SWATCHES} value={color} onPick={onChange} />
          </div>
        </div>
      </Popover>
    </>
  );
}

function SwatchGrid({ colors, value, onPick }: { colors: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-1.5">
      {colors.map((c, i) => (
        <button
          key={`${c}${i}`}
          type="button"
          aria-label={`Use ${c}`}
          onClick={() => onPick(c)}
          className={cn(
            "aspect-square rounded-md border border-white/10 transition-transform hover:scale-110",
            c.toLowerCase() === value.toLowerCase() && "ring-2 ring-white/80 ring-offset-1 ring-offset-[#14141c]",
          )}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  extraSwatches,
  hint,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  extraSwatches?: string[];
  hint?: string;
}) {
  return (
    <FieldLabel label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] uppercase text-subtle">{value}</span>
        <ColorSwatchButton color={value} onChange={onChange} extraSwatches={extraSwatches} ariaLabel={label} />
      </div>
    </FieldLabel>
  );
}

/** A row of 1-4 colour stops (gradients, effect colours). */
export function ColorListField({
  label,
  colors,
  onChange,
  min = 1,
  max = 4,
  extraSwatches,
  hint,
}: {
  label: string;
  colors: string[];
  onChange: (colors: string[]) => void;
  min?: number;
  max?: number;
  extraSwatches?: string[];
  hint?: string;
}) {
  return (
    <FieldLabel label={label} hint={hint}>
      <div className="flex items-center gap-1.5">
        {colors.map((c, i) => (
          <div key={i} className="group/sw relative">
            <ColorSwatchButton
              color={c}
              size="sm"
              extraSwatches={extraSwatches}
              onChange={(next) => onChange(colors.map((x, j) => (j === i ? next : x)))}
              ariaLabel={`${label} ${i + 1}`}
            />
            {colors.length > min && (
              <button
                type="button"
                aria-label="Remove colour"
                onClick={() => onChange(colors.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-black text-[9px] leading-none text-white ring-1 ring-white/20 group-hover/sw:flex"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {colors.length < max && (
          <button
            type="button"
            aria-label="Add colour"
            onClick={() => onChange([...colors, colors[colors.length - 1] ?? "#ffffff"])}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-white/20 text-sm text-subtle hover:border-white/40 hover:text-ink"
          >
            +
          </button>
        )}
      </div>
    </FieldLabel>
  );
}
